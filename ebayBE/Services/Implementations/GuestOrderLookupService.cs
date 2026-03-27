using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ebay.Services.Implementations
{
    public class GuestOrderLookupService : IGuestOrderLookupService
    {
        private readonly EbayDbContext _context;
        private readonly IGuestAfterSalesAccessService _guestAfterSalesAccessService;
        private readonly IEmailService _emailService;
        private readonly IOrderProjectionMapper _orderProjectionMapper;
        private readonly ILogger<GuestOrderLookupService> _logger;

        public GuestOrderLookupService(
            EbayDbContext context,
            IGuestAfterSalesAccessService guestAfterSalesAccessService,
            IEmailService emailService,
            IOrderProjectionMapper orderProjectionMapper,
            ILogger<GuestOrderLookupService> logger)
        {
            _context = context;
            _guestAfterSalesAccessService = guestAfterSalesAccessService;
            _emailService = emailService;
            _orderProjectionMapper = orderProjectionMapper;
            _logger = logger;
        }

        public async Task<GuestOrderLookupResponseDto> LookupAsync(GuestOrderLookupRequestDto request, CancellationToken cancellationToken = default)
        {
            var accessDecision = await _guestAfterSalesAccessService.ValidateOrderAccessAsync(
                BuildAccessRequest(request),
                cancellationToken);

            if (!accessDecision.Allowed || !accessDecision.OrderId.HasValue)
            {
                return GuestOrderLookupResponseDto.NotFound();
            }

            var order = await LoadGuestOrderForLookupAsync(accessDecision.OrderId.Value, cancellationToken);
            if (order == null)
            {
                return GuestOrderLookupResponseDto.NotFound();
            }

            var response = _orderProjectionMapper.MapGuestLookup(order);
            if (accessDecision.Grant != null)
            {
                response.AfterSalesAccess = new GuestAfterSalesAccessResponseDto
                {
                    AccessToken = accessDecision.Grant.AccessToken,
                    ExpiresAt = accessDecision.Grant.ExpiresAtUtc,
                    ProofMethod = accessDecision.Grant.ProofMethod
                };
            }

            return response;
        }

        public async Task ResendConfirmationEmailAsync(GuestOrderLookupRequestDto request, CancellationToken cancellationToken = default)
        {
            var accessDecision = await _guestAfterSalesAccessService.ValidateOrderAccessAsync(
                BuildAccessRequest(request),
                cancellationToken);

            if (!accessDecision.Allowed || !accessDecision.OrderId.HasValue)
            {
                return;
            }

            var order = await LoadGuestOrderForLookupAsync(accessDecision.OrderId.Value, cancellationToken);
            if (order == null)
            {
                return;
            }

            var payment = order.Payments
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();

            if (string.IsNullOrWhiteSpace(order.GuestEmail))
            {
                _logger.LogWarning("Guest confirmation resend skipped because GuestEmail is missing for order {OrderNumber}", order.OrderNumber);
                return;
            }

            try
            {
                await _emailService.SendGuestOrderConfirmationAsync(
                    order.GuestEmail,
                    order.GuestFullName ?? "bạn",
                    order.OrderNumber,
                    order.TotalPrice,
                    payment?.Method ?? "cod",
                    payment?.Status ?? "pending");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resend guest confirmation email for order {OrderNumber}", order.OrderNumber);
            }
        }

        private async Task<Order?> LoadGuestOrderForLookupAsync(
            int orderId,
            CancellationToken cancellationToken)
        {
            return await _context.Orders
                .AsNoTracking()
                .Include(o => o.Address)
                .Include(o => o.Payments)
                .Include(o => o.ShippingInfo)
                .Include(o => o.ReturnRequests)
                .Include(o => o.Disputes)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Seller)
                .FirstOrDefaultAsync(
                    o => o.CustomerType == "guest"
                        && o.Id == orderId,
                    cancellationToken);
        }

        private static GuestAfterSalesAccessRequest BuildAccessRequest(GuestOrderLookupRequestDto request)
        {
            return new GuestAfterSalesAccessRequest
            {
                OrderNumber = request.OrderNumber,
                Email = request.Email,
                AccessToken = request.AccessToken
            };
        }
    }
}
