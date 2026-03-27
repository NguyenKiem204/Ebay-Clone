using System.Text.Json;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class ReturnRequestService : IReturnRequestService
    {
        private const string RequestTypeReturn = "return";
        private const string ReturnStatusPending = "pending";
        private const string CaseEventTypeCreated = "created";
        private const string CaseEventActorTypeBuyer = "buyer";

        private static readonly HashSet<string> AllowedResolutionTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "refund",
            "replacement",
            "exchange",
            "refund_only",
            "return_for_refund"
        };

        private readonly EbayDbContext _context;
        private readonly IBuyerCasePolicyService _buyerCasePolicyService;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseNotificationService _caseNotificationService;

        public ReturnRequestService(
            EbayDbContext context,
            IBuyerCasePolicyService buyerCasePolicyService,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper,
            ICaseNotificationService caseNotificationService)
        {
            _context = context;
            _buyerCasePolicyService = buyerCasePolicyService;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
            _caseNotificationService = caseNotificationService;
        }

        public async Task<ReturnRequestResponseDto> CreateReturnRequestAsync(int userId, CreateReturnRequestDto request)
        {
            var normalizedReason = request.Reason?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedReason))
            {
                throw new BadRequestException("Return reason is required.");
            }

            var normalizedDescription = request.Description?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedDescription))
            {
                throw new BadRequestException("Return description is required.");
            }

            var normalizedResolutionType = NormalizeResolutionType(request.ResolutionType);
            if (!AllowedResolutionTypes.Contains(normalizedResolutionType))
            {
                throw new BadRequestException(
                    "Resolution type is not supported.",
                    new List<string> { "resolution_type_invalid" });
            }

            var order = await _context.Orders
                .Include(o => o.Payments)
                .Include(o => o.ShippingInfo)
                .Include(o => o.ReturnRequests)
                .Include(o => o.Disputes)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.BuyerId == userId);

            if (order == null)
            {
                throw new NotFoundException("Order not found.");
            }

            OrderItem? selectedOrderItem = null;
            if (request.OrderItemId.HasValue)
            {
                selectedOrderItem = order.OrderItems.FirstOrDefault(item => item.Id == request.OrderItemId.Value);
                if (selectedOrderItem == null)
                {
                    throw new BadRequestException(
                        "The selected order item does not belong to this order.",
                        new List<string> { "order_item_mismatch" });
                }
            }

            var decision = _buyerCasePolicyService.CanOpenReturn(CloneOrderWithoutCases(order));
            if (!decision.Allowed)
            {
                throw new BadRequestException(
                    decision.Message,
                    new List<string> { decision.Code });
            }

            EnsureNoBlockingCases(order, selectedOrderItem?.Id);

            var now = DateTime.UtcNow;
            var storedResolutionType = MapStoredResolutionType(normalizedResolutionType);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var returnRequest = new ReturnRequest
                {
                    OrderId = order.Id,
                    OrderItemId = selectedOrderItem?.Id,
                    UserId = userId,
                    RequestType = RequestTypeReturn,
                    ReasonCode = NormalizeNullable(request.ReasonCode),
                    Reason = normalizedReason,
                    ResolutionType = storedResolutionType,
                    Status = ReturnStatusPending,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _context.ReturnRequests.AddAsync(returnRequest);
                await _context.SaveChangesAsync();

                var caseEvent = new CaseEvent
                {
                    ReturnRequestId = returnRequest.Id,
                    EventType = CaseEventTypeCreated,
                    ActorType = CaseEventActorTypeBuyer,
                    ActorUserId = userId,
                    Message = BuildCreatedMessage(returnRequest),
                    MetadataJson = JsonSerializer.Serialize(new
                    {
                        returnRequestId = returnRequest.Id,
                        orderId = returnRequest.OrderId,
                        orderItemId = returnRequest.OrderItemId,
                        requestType = returnRequest.RequestType,
                        reasonCode = returnRequest.ReasonCode,
                        resolutionType = returnRequest.ResolutionType,
                        requestedResolution = normalizedResolutionType,
                        description = normalizedDescription
                    }),
                    CreatedAt = now
                };

                await _context.CaseEvents.AddAsync(caseEvent);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _caseNotificationService.TryCreateReturnOpenedNotificationAsync(
                    userId,
                    returnRequest.Id,
                    order.OrderNumber);

                returnRequest.Order = order;
                returnRequest.OrderItem = selectedOrderItem;

                return _buyerCaseProjectionMapper.MapReturnRequest(returnRequest, new[] { caseEvent });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static string NormalizeResolutionType(string? resolutionType)
        {
            return string.IsNullOrWhiteSpace(resolutionType)
                ? "return_for_refund"
                : resolutionType.Trim().ToLowerInvariant();
        }

        private static string MapStoredResolutionType(string normalizedResolutionType)
        {
            return normalizedResolutionType switch
            {
                "refund_only" => "refund",
                "return_for_refund" => "refund",
                _ => normalizedResolutionType
            };
        }

        private static Order CloneOrderWithoutCases(Order order)
        {
            return new Order
            {
                Id = order.Id,
                CustomerType = order.CustomerType,
                BuyerId = order.BuyerId,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                OrderDate = order.OrderDate,
                Payments = order.Payments.ToList(),
                ShippingInfo = order.ShippingInfo,
                OrderItems = order.OrderItems.ToList(),
                ReturnRequests = new List<ReturnRequest>(),
                Disputes = new List<Dispute>()
            };
        }

        private static void EnsureNoBlockingCases(Order order, int? selectedOrderItemId)
        {
            if (order.Disputes.Any(dispute =>
                string.Equals(dispute.CaseType, "inr", StringComparison.OrdinalIgnoreCase)
                && IsOpenDispute(dispute)))
            {
                throw new BadRequestException(
                    "An item-not-received request is already open for this order.",
                    new List<string> { "open_inr_exists" });
            }

            if (order.ReturnRequests.Any(request =>
                string.Equals(request.RequestType, RequestTypeReturn, StringComparison.OrdinalIgnoreCase)
                && IsOpenReturn(request)
                && (!selectedOrderItemId.HasValue
                    || !request.OrderItemId.HasValue
                    || request.OrderItemId == selectedOrderItemId)))
            {
                throw new BadRequestException(
                    "A return / refund request is already open for this order or item.",
                    new List<string> { "open_return_exists" });
            }
        }

        private static bool IsOpenReturn(ReturnRequest request)
        {
            return string.Equals(request.Status, "pending", StringComparison.OrdinalIgnoreCase)
                || string.Equals(request.Status, "approved", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsOpenDispute(Dispute dispute)
        {
            return string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase)
                || string.Equals(dispute.Status, "in_progress", StringComparison.OrdinalIgnoreCase);
        }

        private static string? NormalizeNullable(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
        }

        private static string BuildCreatedMessage(ReturnRequest returnRequest)
        {
            if (returnRequest.OrderItemId.HasValue)
            {
                return $"Buyer opened a return request for order item {returnRequest.OrderItemId.Value}.";
            }

            return "Buyer opened a return request.";
        }
    }
}
