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
            "exchange"
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

            var decision = _buyerCasePolicyService.CanOpenReturn(order);
            if (!decision.Allowed)
            {
                throw new BadRequestException(
                    decision.Message,
                    new List<string> { decision.Code });
            }

            var now = DateTime.UtcNow;

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
                    ResolutionType = normalizedResolutionType,
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
                        resolutionType = returnRequest.ResolutionType
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
                ? "refund"
                : resolutionType.Trim().ToLowerInvariant();
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
