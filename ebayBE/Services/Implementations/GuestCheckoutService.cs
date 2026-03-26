using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace ebay.Services.Implementations
{
    public class GuestCheckoutService : IGuestCheckoutService
    {
        private static readonly TimeSpan ProvidedKeyTtl = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan FallbackFingerprintTtl = TimeSpan.FromSeconds(30);
        private static readonly TimeSpan ProcessingLeaseTtl = TimeSpan.FromMinutes(2);
        private const string IdempotencyStatusProcessing = "processing";
        private const string IdempotencyStatusCompleted = "completed";

        private readonly EbayDbContext _context;
        private readonly ICheckoutCoreService _checkoutCoreService;
        private readonly IEmailService _emailService;
        private readonly IOrderNumberGenerator _orderNumberGenerator;
        private readonly ILogger<GuestCheckoutService> _logger;

        public GuestCheckoutService(
            EbayDbContext context,
            ICheckoutCoreService checkoutCoreService,
            IEmailService emailService,
            IOrderNumberGenerator orderNumberGenerator,
            ILogger<GuestCheckoutService> logger)
        {
            _context = context;
            _checkoutCoreService = checkoutCoreService;
            _emailService = emailService;
            _orderNumberGenerator = orderNumberGenerator;
            _logger = logger;
        }

        public async Task<CreateGuestOrderResponseDto> CreateOrderAsync(CreateGuestOrderRequestDto request, CancellationToken cancellationToken = default)
        {
            ValidateGuestRequest(request);

            var idempotencyContext = BuildIdempotencyContext(request);
            await CleanupExpiredIdempotencyEntriesAsync(cancellationToken);
            var reservation = await ReserveIdempotencyAsync(idempotencyContext, cancellationToken);

            if (reservation.CachedResponse != null)
            {
                return reservation.CachedResponse;
            }

            IDbContextTransaction? transaction = null;
            try
            {
                transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                var coreResult = await _checkoutCoreService.PrepareAsync(
                    request.Items.Select(item => new CheckoutCoreItemRequest
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity
                    }),
                    cancellationToken);

                if (!coreResult.GuestPhase1Eligible)
                {
                    var errors = coreResult.Issues
                        .Select(issue => issue.Message)
                        .Distinct()
                        .ToList();

                    throw new BadRequestException("Guest checkout không đủ điều kiện", errors);
                }

                if (!string.Equals(request.PaymentMethod, "COD", StringComparison.OrdinalIgnoreCase))
                {
                    throw new BadRequestException("Guest checkout phase 1 chỉ hỗ trợ COD");
                }

                var productIds = coreResult.NormalizedItems.Select(item => item.ProductId).ToList();
                var products = await _context.Products
                    .Include(product => product.Seller)
                    .Include(product => product.Store)
                    .Where(product => productIds.Contains(product.Id))
                    .ToDictionaryAsync(product => product.Id, cancellationToken);

                foreach (var item in coreResult.NormalizedItems)
                {
                    if (!products.TryGetValue(item.ProductId, out var product))
                    {
                        throw new BadRequestException($"Sản phẩm {item.ProductId} không tồn tại");
                    }

                    if (product.IsActive != true || !string.Equals(product.Status, "active", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new BadRequestException($"Sản phẩm {product.Id} hiện không còn bán");
                    }

                    if (product.IsAuction == true)
                    {
                        throw new BadRequestException($"Sản phẩm {product.Id} là auction item và không đủ điều kiện guest checkout");
                    }

                    if ((product.Stock ?? 0) < item.Quantity)
                    {
                        throw new BadRequestException($"Sản phẩm {product.Id} không đủ số lượng trong kho");
                    }
                }

                var now = DateTime.UtcNow;
                var order = new Order
                {
                    OrderNumber = _orderNumberGenerator.Generate(),
                    CustomerType = "guest",
                    BuyerId = null,
                    AddressId = null,
                    GuestFullName = request.GuestFullName.Trim(),
                    GuestEmail = request.GuestEmail.Trim(),
                    GuestPhone = request.GuestPhone.Trim(),
                    ShipFullName = request.ShippingAddress.FullName.Trim(),
                    ShipPhone = request.ShippingAddress.Phone.Trim(),
                    ShipStreet = request.ShippingAddress.Street.Trim(),
                    ShipCity = request.ShippingAddress.City.Trim(),
                    ShipState = request.ShippingAddress.State.Trim(),
                    ShipPostalCode = request.ShippingAddress.PostalCode.Trim(),
                    ShipCountry = request.ShippingAddress.Country.Trim(),
                    OrderDate = now,
                    Subtotal = coreResult.Subtotal,
                    ShippingFee = coreResult.ShippingFee,
                    Tax = coreResult.Tax,
                    DiscountAmount = coreResult.DiscountAmount,
                    TotalPrice = coreResult.TotalAmount,
                    Status = "pending",
                    CouponId = null,
                    Note = null,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _context.Orders.AddAsync(order, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                var orderItems = new List<OrderItem>();

                foreach (var item in coreResult.NormalizedItems)
                {
                    var product = products[item.ProductId];
                    product.Stock = (product.Stock ?? 0) - item.Quantity;

                    orderItems.Add(new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = product.Id,
                        SellerId = product.SellerId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TotalPrice = item.LineSubtotal,
                        ProductTitleSnapshot = product.Title,
                        ProductImageSnapshot = product.Images != null && product.Images.Any() ? product.Images[0] : null,
                        SellerDisplayNameSnapshot = ResolveSellerDisplayName(product),
                        CreatedAt = now
                    });
                }

                await _context.OrderItems.AddRangeAsync(orderItems, cancellationToken);

                var payment = new Payment
                {
                    OrderId = order.Id,
                    UserId = null,
                    Amount = order.TotalPrice,
                    Method = "cod",
                    Status = "pending",
                    TransactionId = null,
                    PaymentGateway = null,
                    PaidAt = null,
                    CreatedAt = now
                };

                await _context.Payments.AddAsync(payment, cancellationToken);
                var response = BuildResponse(order, payment);

                reservation.Record!.Status = IdempotencyStatusCompleted;
                reservation.Record.OrderId = order.Id;
                reservation.Record.ResponsePayload = SerializeResponse(response);
                reservation.Record.ProcessingExpiresAt = DateTime.UtcNow;
                reservation.Record.ReplayExpiresAt = DateTime.UtcNow.Add(idempotencyContext.ReplayTimeToLive);
                reservation.Record.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                await TrySendGuestConfirmationEmailAsync(order, payment);

                return response;
            }
            catch
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                }

                _context.ChangeTracker.Clear();
                await ReleaseFailedReservationAsync(reservation.Record?.Id, cancellationToken);
                throw;
            }
        }

        private static void ValidateGuestRequest(CreateGuestOrderRequestDto request)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.GuestFullName))
                errors.Add("guestFullName là bắt buộc");

            if (string.IsNullOrWhiteSpace(request.GuestEmail))
                errors.Add("guestEmail là bắt buộc");

            if (string.IsNullOrWhiteSpace(request.GuestPhone))
                errors.Add("guestPhone là bắt buộc");

            if (request.ShippingAddress == null)
            {
                errors.Add("shippingAddress là bắt buộc");
            }
            else
            {
                if (string.IsNullOrWhiteSpace(request.ShippingAddress.FullName))
                    errors.Add("shippingAddress.fullName là bắt buộc");

                if (string.IsNullOrWhiteSpace(request.ShippingAddress.Phone))
                    errors.Add("shippingAddress.phone là bắt buộc");

                if (string.IsNullOrWhiteSpace(request.ShippingAddress.Street))
                    errors.Add("shippingAddress.street là bắt buộc");

                if (string.IsNullOrWhiteSpace(request.ShippingAddress.City))
                    errors.Add("shippingAddress.city là bắt buộc");

                if (string.IsNullOrWhiteSpace(request.ShippingAddress.State))
                    errors.Add("shippingAddress.state là bắt buộc");

                if (string.IsNullOrWhiteSpace(request.ShippingAddress.PostalCode))
                    errors.Add("shippingAddress.postalCode là bắt buộc");

                if (string.IsNullOrWhiteSpace(request.ShippingAddress.Country))
                    errors.Add("shippingAddress.country là bắt buộc");
            }

            if (errors.Count > 0)
                throw new BadRequestException("Dữ liệu guest checkout không hợp lệ", errors);
        }

        private async Task CleanupExpiredIdempotencyEntriesAsync(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            await _context.GuestCheckoutIdempotencies
                .Where(entry => entry.Status == IdempotencyStatusCompleted && entry.ReplayExpiresAt <= now)
                .ExecuteDeleteAsync(cancellationToken);
        }

        private async Task<IdempotencyReservation> ReserveIdempotencyAsync(IdempotencyContext context, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            var existingRecord = await _context.GuestCheckoutIdempotencies
                .FirstOrDefaultAsync(entry => entry.IdempotencyKey == context.CacheKey, cancellationToken);

            if (existingRecord != null)
            {
                return await HandleExistingReservationAsync(existingRecord, context, now, cancellationToken);
            }

            var record = new GuestCheckoutIdempotency
            {
                IdempotencyKey = context.CacheKey,
                RequestHash = context.RequestHash,
                Status = IdempotencyStatusProcessing,
                OrderId = null,
                ResponsePayload = null,
                ProcessingExpiresAt = now.Add(ProcessingLeaseTtl),
                ReplayExpiresAt = now.Add(context.ReplayTimeToLive),
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.GuestCheckoutIdempotencies.Add(record);

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                return new IdempotencyReservation(record, null);
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                _context.Entry(record).State = EntityState.Detached;

                existingRecord = await _context.GuestCheckoutIdempotencies
                    .FirstAsync(entry => entry.IdempotencyKey == context.CacheKey, cancellationToken);

                return await HandleExistingReservationAsync(existingRecord, context, now, cancellationToken);
            }
        }

        private async Task<IdempotencyReservation> HandleExistingReservationAsync(
            GuestCheckoutIdempotency existingRecord,
            IdempotencyContext context,
            DateTime now,
            CancellationToken cancellationToken)
        {
            EnsureMatchingRequestHash(existingRecord, context.RequestHash);

            if (existingRecord.Status == IdempotencyStatusCompleted && existingRecord.ReplayExpiresAt > now)
            {
                var cachedResponse = await TryGetStoredResponseAsync(existingRecord, cancellationToken);
                if (cachedResponse != null)
                {
                    return new IdempotencyReservation(null, cachedResponse);
                }

                throw new CustomException(
                    "A matching guest checkout request was already completed, but its response is not available for replay yet. Please retry shortly.",
                    409);
            }

            if (existingRecord.Status == IdempotencyStatusProcessing && existingRecord.ProcessingExpiresAt > now)
            {
                throw new CustomException(
                    "A guest checkout request with the same idempotency key is already being processed. Please retry shortly.",
                    409);
            }

            existingRecord.Status = IdempotencyStatusProcessing;
            existingRecord.OrderId = null;
            existingRecord.ResponsePayload = null;
            existingRecord.ProcessingExpiresAt = now.Add(ProcessingLeaseTtl);
            existingRecord.ReplayExpiresAt = now.Add(context.ReplayTimeToLive);
            existingRecord.UpdatedAt = now;

            await _context.SaveChangesAsync(cancellationToken);

            return new IdempotencyReservation(existingRecord, null);
        }

        private static IdempotencyContext BuildIdempotencyContext(CreateGuestOrderRequestDto request)
        {
            var requestHash = BuildRequestHash(request);
            var explicitKey = request.IdempotencyKey?.Trim();

            if (!string.IsNullOrWhiteSpace(explicitKey))
            {
                return new IdempotencyContext(
                    CacheKey: $"guest-order:{explicitKey}",
                    RequestHash: requestHash,
                    ReplayTimeToLive: ProvidedKeyTtl);
            }

            return new IdempotencyContext(
                CacheKey: $"guest-order:fallback:{requestHash}",
                RequestHash: requestHash,
                ReplayTimeToLive: FallbackFingerprintTtl);
        }

        private async Task<CreateGuestOrderResponseDto?> TryGetStoredResponseAsync(
            GuestCheckoutIdempotency record,
            CancellationToken cancellationToken)
        {
            if (!string.IsNullOrWhiteSpace(record.ResponsePayload))
            {
                try
                {
                    var response = JsonSerializer.Deserialize<CreateGuestOrderResponseDto>(record.ResponsePayload);
                    if (response != null)
                    {
                        return response;
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize stored guest checkout idempotency response for key {IdempotencyKey}", record.IdempotencyKey);
                }
            }

            if (!record.OrderId.HasValue)
            {
                return null;
            }

            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.Id == record.OrderId.Value, cancellationToken);

            if (order == null)
            {
                return null;
            }

            var payment = order.Payments
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();

            return BuildResponse(order, payment);
        }

        private async Task ReleaseFailedReservationAsync(int? reservationId, CancellationToken cancellationToken)
        {
            if (!reservationId.HasValue)
            {
                return;
            }

            try
            {
                var record = await _context.GuestCheckoutIdempotencies
                    .FirstOrDefaultAsync(entry => entry.Id == reservationId.Value, cancellationToken);

                if (record == null || record.Status != IdempotencyStatusProcessing)
                {
                    return;
                }

                _context.GuestCheckoutIdempotencies.Remove(record);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to release guest checkout idempotency reservation {ReservationId}", reservationId.Value);
            }
        }

        private async Task TrySendGuestConfirmationEmailAsync(Order order, Payment payment)
        {
            if (string.IsNullOrWhiteSpace(order.GuestEmail))
            {
                _logger.LogWarning("Guest confirmation email skipped because GuestEmail is missing for order {OrderNumber}", order.OrderNumber);
                return;
            }

            try
            {
                await _emailService.SendGuestOrderConfirmationAsync(
                    order.GuestEmail,
                    order.GuestFullName ?? "bạn",
                    order.OrderNumber,
                    order.TotalPrice,
                    payment.Method,
                    payment.Status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send guest confirmation email for order {OrderNumber}", order.OrderNumber);
            }
        }

        private static string BuildRequestHash(CreateGuestOrderRequestDto request)
        {
            var normalizedItems = request.Items
                .Where(item => item.ProductId > 0 && item.Quantity > 0)
                .GroupBy(item => item.ProductId)
                .OrderBy(group => group.Key)
                .Select(group => $"{group.Key}:{group.Sum(item => item.Quantity)}");

            var raw = string.Join(
                "|",
                new[]
                {
                    NormalizePart(request.GuestFullName),
                    NormalizePart(request.GuestEmail),
                    NormalizePart(request.GuestPhone),
                    NormalizePart(request.ShippingAddress?.FullName),
                    NormalizePart(request.ShippingAddress?.Phone),
                    NormalizePart(request.ShippingAddress?.Street),
                    NormalizePart(request.ShippingAddress?.City),
                    NormalizePart(request.ShippingAddress?.State),
                    NormalizePart(request.ShippingAddress?.PostalCode),
                    NormalizePart(request.ShippingAddress?.Country),
                    NormalizePart(request.PaymentMethod)
                }.Concat(normalizedItems));

            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(hash);
        }

        private static void EnsureMatchingRequestHash(GuestCheckoutIdempotency record, string requestHash)
        {
            if (string.Equals(record.RequestHash, requestHash, StringComparison.Ordinal))
            {
                return;
            }

            throw new CustomException(
                "The provided idempotency key has already been used with a different guest checkout payload.",
                409);
        }

        private static string NormalizePart(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }

        private static string ResolveSellerDisplayName(Product product)
        {
            if (!string.IsNullOrWhiteSpace(product.Store?.StoreName))
                return product.Store.StoreName;

            return product.Seller.Username;
        }

        private static bool IsUniqueConstraintViolation(DbUpdateException exception)
        {
            return exception.InnerException is PostgresException postgresException
                   && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
        }

        private static string SerializeResponse(CreateGuestOrderResponseDto response)
        {
            return JsonSerializer.Serialize(response);
        }

        private static CreateGuestOrderResponseDto BuildResponse(Order order, Payment? payment)
        {
            return new CreateGuestOrderResponseDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerType = order.CustomerType,
                Status = order.Status,
                PaymentStatus = payment?.Status ?? "pending",
                PaymentMethod = payment?.Method ?? "cod",
                Totals = new GuestCheckoutTotalsResponseDto
                {
                    Subtotal = order.Subtotal,
                    ShippingFee = order.ShippingFee ?? 0m,
                    DiscountAmount = order.DiscountAmount ?? 0m,
                    Tax = order.Tax ?? 0m,
                    TotalAmount = order.TotalPrice
                },
                ShippingAddress = new GuestOrderShippingSummaryResponseDto
                {
                    FullName = order.ShipFullName ?? string.Empty,
                    Phone = order.ShipPhone ?? string.Empty,
                    Street = order.ShipStreet ?? string.Empty,
                    City = order.ShipCity ?? string.Empty,
                    State = order.ShipState ?? string.Empty,
                    PostalCode = order.ShipPostalCode ?? string.Empty,
                    Country = order.ShipCountry ?? string.Empty
                }
            };
        }

        private sealed record IdempotencyContext(string CacheKey, string RequestHash, TimeSpan ReplayTimeToLive);

        private sealed record IdempotencyReservation(GuestCheckoutIdempotency? Record, CreateGuestOrderResponseDto? CachedResponse);
    }
}
