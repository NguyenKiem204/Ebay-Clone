using System.Text.Json;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class DisputeService : IDisputeService
    {
        private const string DisputeCaseTypeInr = "inr";
        private const string DisputeCaseTypeSnad = "snad";
        private const string DisputeCaseTypeDamaged = "damaged";
        private const string DisputeCaseTypeReturnEscalation = "return_escalation";
        private const string DisputeStatusOpen = "open";
        private const string CaseEventTypeCreated = "created";
        private const string CaseEventTypeEscalated = "escalated";
        private const string CaseEventActorTypeBuyer = "buyer";

        private readonly EbayDbContext _context;
        private readonly IBuyerCasePolicyService _buyerCasePolicyService;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseNotificationService _caseNotificationService;

        public DisputeService(
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

        public async Task<DisputeResponseDto> CreateInrClaimAsync(int userId, CreateInrClaimDto request)
        {
            var normalizedDescription = request.Description?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedDescription))
            {
                throw new BadRequestException("INR claim description is required.");
            }

            var order = await LoadBuyerOrderAsync(userId, request.OrderId);
            var selectedOrderItem = ResolveOrderItem(order, request.OrderItemId);

            var decision = _buyerCasePolicyService.CanOpenInr(order);
            if (!decision.Allowed)
            {
                throw new BadRequestException(
                    decision.Message,
                    new List<string> { decision.Code });
            }

            return await CreateBuyerDisputeAsync(
                userId,
                order,
                selectedOrderItem,
                normalizedDescription,
                DisputeCaseTypeInr,
                BuildCreatedMessage(DisputeCaseTypeInr, selectedOrderItem?.Id));
        }

        public async Task<DisputeResponseDto> CreateQualityIssueClaimAsync(int userId, CreateQualityIssueClaimDto request)
        {
            var normalizedDescription = request.Description?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedDescription))
            {
                throw new BadRequestException("Quality issue description is required.");
            }

            var normalizedCaseType = NormalizeQualityIssueCaseType(request.CaseType);
            var order = await LoadBuyerOrderAsync(userId, request.OrderId);
            var selectedOrderItem = ResolveOrderItem(order, request.OrderItemId);

            var decision = _buyerCasePolicyService.CanOpenSnad(order);
            if (!decision.Allowed)
            {
                throw new BadRequestException(
                    decision.Message,
                    new List<string> { decision.Code });
            }

            return await CreateBuyerDisputeAsync(
                userId,
                order,
                selectedOrderItem,
                normalizedDescription,
                normalizedCaseType,
                BuildCreatedMessage(normalizedCaseType, selectedOrderItem?.Id));
        }

        public async Task<DisputeResponseDto> EscalateReturnRequestAsync(int userId, int returnRequestId, EscalateReturnRequestDto request)
        {
            var normalizedDescription = request.Description?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedDescription))
            {
                throw new BadRequestException("Escalation description is required.");
            }

            var returnRequest = await LoadBuyerReturnRequestAsync(userId, returnRequestId);
            var order = returnRequest.Order;
            var selectedOrderItem = returnRequest.OrderItem ?? ResolveOrderItem(order, returnRequest.OrderItemId);

            var decision = _buyerCasePolicyService.CanEscalate(
                order,
                BuyerCaseType.Return,
                returnRequest.Status,
                returnRequest.RejectedAt ?? returnRequest.CreatedAt);

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
                var dispute = new Dispute
                {
                    OrderId = order.Id,
                    OrderItemId = selectedOrderItem?.Id,
                    RaisedBy = userId,
                    CaseType = DisputeCaseTypeReturnEscalation,
                    Description = normalizedDescription,
                    Status = DisputeStatusOpen,
                    EscalatedFromReturnRequestId = returnRequest.Id,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _context.Disputes.AddAsync(dispute);
                returnRequest.UpdatedAt = now;
                await _context.SaveChangesAsync();

                var sourceReturnEvent = new CaseEvent
                {
                    ReturnRequestId = returnRequest.Id,
                    EventType = CaseEventTypeEscalated,
                    ActorType = CaseEventActorTypeBuyer,
                    ActorUserId = userId,
                    Message = BuildReturnEscalationSourceMessage(dispute.Id),
                    MetadataJson = JsonSerializer.Serialize(new
                    {
                        returnRequestId = returnRequest.Id,
                        disputeId = dispute.Id,
                        caseType = dispute.CaseType,
                        status = dispute.Status
                    }),
                    CreatedAt = now
                };

                var disputeEvent = new CaseEvent
                {
                    DisputeId = dispute.Id,
                    EventType = CaseEventTypeEscalated,
                    ActorType = CaseEventActorTypeBuyer,
                    ActorUserId = userId,
                    Message = BuildEscalatedDisputeMessage(returnRequest.Id, selectedOrderItem?.Id),
                    MetadataJson = JsonSerializer.Serialize(new
                    {
                        disputeId = dispute.Id,
                        orderId = dispute.OrderId,
                        orderItemId = dispute.OrderItemId,
                        caseType = dispute.CaseType,
                        escalatedFromReturnRequestId = dispute.EscalatedFromReturnRequestId,
                        status = dispute.Status
                    }),
                    CreatedAt = now
                };

                await _context.CaseEvents.AddRangeAsync(sourceReturnEvent, disputeEvent);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _caseNotificationService.TryCreateDisputeOpenedNotificationAsync(
                    userId,
                    dispute.Id,
                    dispute.CaseType,
                    order.OrderNumber);

                dispute.Order = order;
                dispute.OrderItem = selectedOrderItem;

                return _buyerCaseProjectionMapper.MapDispute(dispute, new[] { disputeEvent });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task<Order> LoadBuyerOrderAsync(int userId, int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Payments)
                .Include(o => o.ShippingInfo)
                .Include(o => o.ReturnRequests)
                .Include(o => o.Disputes)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == userId);

            if (order == null)
            {
                throw new NotFoundException("Order not found.");
            }

            return order;
        }

        private async Task<ReturnRequest> LoadBuyerReturnRequestAsync(int userId, int returnRequestId)
        {
            var returnRequest = await _context.ReturnRequests
                .Include(r => r.Order)
                    .ThenInclude(o => o.Payments)
                .Include(r => r.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(r => r.Order)
                    .ThenInclude(o => o.ReturnRequests)
                .Include(r => r.Order)
                    .ThenInclude(o => o.Disputes)
                .Include(r => r.Order)
                    .ThenInclude(o => o.OrderItems)
                .Include(r => r.OrderItem)
                .FirstOrDefaultAsync(r => r.Id == returnRequestId && r.UserId == userId);

            if (returnRequest == null)
            {
                throw new NotFoundException("Return request not found.");
            }

            return returnRequest;
        }

        private static OrderItem? ResolveOrderItem(Order order, int? orderItemId)
        {
            if (!orderItemId.HasValue)
            {
                return null;
            }

            var selectedOrderItem = order.OrderItems.FirstOrDefault(item => item.Id == orderItemId.Value);
            if (selectedOrderItem == null)
            {
                throw new BadRequestException(
                    "The selected order item does not belong to this order.",
                    new List<string> { "order_item_mismatch" });
            }

            return selectedOrderItem;
        }

        private async Task<DisputeResponseDto> CreateBuyerDisputeAsync(
            int userId,
            Order order,
            OrderItem? selectedOrderItem,
            string normalizedDescription,
            string caseType,
            string createdMessage)
        {
            var now = DateTime.UtcNow;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var dispute = new Dispute
                {
                    OrderId = order.Id,
                    OrderItemId = selectedOrderItem?.Id,
                    RaisedBy = userId,
                    CaseType = caseType,
                    Description = normalizedDescription,
                    Status = DisputeStatusOpen,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _context.Disputes.AddAsync(dispute);
                await _context.SaveChangesAsync();

                var caseEvent = new CaseEvent
                {
                    DisputeId = dispute.Id,
                    EventType = CaseEventTypeCreated,
                    ActorType = CaseEventActorTypeBuyer,
                    ActorUserId = userId,
                    Message = createdMessage,
                    MetadataJson = JsonSerializer.Serialize(new
                    {
                        disputeId = dispute.Id,
                        orderId = dispute.OrderId,
                        orderItemId = dispute.OrderItemId,
                        caseType = dispute.CaseType,
                        status = dispute.Status
                    }),
                    CreatedAt = now
                };

                await _context.CaseEvents.AddAsync(caseEvent);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _caseNotificationService.TryCreateDisputeOpenedNotificationAsync(
                    userId,
                    dispute.Id,
                    dispute.CaseType,
                    order.OrderNumber);

                dispute.Order = order;
                dispute.OrderItem = selectedOrderItem;

                return _buyerCaseProjectionMapper.MapDispute(dispute, new[] { caseEvent });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static string NormalizeQualityIssueCaseType(string? caseType)
        {
            var normalizedCaseType = caseType?.Trim().ToLowerInvariant();
            if (normalizedCaseType is DisputeCaseTypeSnad or DisputeCaseTypeDamaged)
            {
                return normalizedCaseType;
            }

            throw new BadRequestException(
                "Quality issue type is not supported.",
                new List<string> { "quality_issue_type_invalid" });
        }

        private static string BuildCreatedMessage(string caseType, int? orderItemId)
        {
            var claimLabel = caseType switch
            {
                DisputeCaseTypeDamaged => "damaged-item claim",
                DisputeCaseTypeSnad => "SNAD claim",
                DisputeCaseTypeReturnEscalation => "return escalation dispute",
                _ => "buyer protection claim"
            };

            if (orderItemId.HasValue)
            {
                return $"Buyer opened a {claimLabel} for order item {orderItemId.Value}.";
            }

            return $"Buyer opened a {claimLabel}.";
        }

        private static string BuildReturnEscalationSourceMessage(int disputeId)
        {
            return $"Buyer escalated this return request into dispute {disputeId}.";
        }

        private static string BuildEscalatedDisputeMessage(int returnRequestId, int? orderItemId)
        {
            if (orderItemId.HasValue)
            {
                return $"Buyer escalated return request {returnRequestId} into a dispute for order item {orderItemId.Value}.";
            }

            return $"Buyer escalated return request {returnRequestId} into a dispute.";
        }
    }
}
