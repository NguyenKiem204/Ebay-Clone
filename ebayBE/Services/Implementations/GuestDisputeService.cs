using System.Text.Json;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class GuestDisputeService : IGuestDisputeService
    {
        private const string DisputeCaseTypeInr = "inr";
        private const string DisputeCaseTypeSnad = "snad";
        private const string DisputeCaseTypeDamaged = "damaged";
        private const string DisputeStatusOpen = "open";
        private const string CaseEventTypeCreated = "created";
        private const string CaseEventActorTypeBuyer = "buyer";

        private readonly EbayDbContext _context;
        private readonly IGuestAfterSalesAccessService _guestAfterSalesAccessService;
        private readonly IBuyerCasePolicyService _buyerCasePolicyService;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseNotificationService _caseNotificationService;

        public GuestDisputeService(
            EbayDbContext context,
            IGuestAfterSalesAccessService guestAfterSalesAccessService,
            IBuyerCasePolicyService buyerCasePolicyService,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper,
            ICaseNotificationService caseNotificationService)
        {
            _context = context;
            _guestAfterSalesAccessService = guestAfterSalesAccessService;
            _buyerCasePolicyService = buyerCasePolicyService;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
            _caseNotificationService = caseNotificationService;
        }

        public async Task<DisputeResponseDto> CreateGuestInrClaimAsync(
            CreateGuestInrClaimDto request,
            CancellationToken cancellationToken = default)
        {
            var normalizedDescription = request.Description?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedDescription))
            {
                throw new BadRequestException("INR claim description is required.");
            }

            var guestContext = await ResolveGuestContextAsync(
                request.OrderNumber,
                request.Email,
                request.AccessToken,
                request.OrderItemId,
                cancellationToken);

            var decision = _buyerCasePolicyService.CanOpenGuestInr(CloneOrderWithoutCases(guestContext.Order));
            if (!decision.Allowed)
            {
                throw new BadRequestException(
                    decision.Message,
                    new List<string> { decision.Code });
            }

            EnsureNoBlockingCasesForInr(guestContext.Order, guestContext.SelectedOrderItem?.Id);

            return await CreateGuestDisputeAsync(
                guestContext,
                normalizedDescription,
                DisputeCaseTypeInr,
                BuildCreatedMessage(DisputeCaseTypeInr, guestContext.SelectedOrderItem?.Id),
                request.ReasonCode,
                cancellationToken);
        }

        public async Task<DisputeResponseDto> CreateGuestQualityIssueClaimAsync(
            CreateGuestQualityIssueClaimDto request,
            CancellationToken cancellationToken = default)
        {
            var normalizedDescription = request.Description?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedDescription))
            {
                throw new BadRequestException("Quality issue description is required.");
            }

            var normalizedCaseType = NormalizeQualityIssueCaseType(request.CaseType);
            var guestContext = await ResolveGuestContextAsync(
                request.OrderNumber,
                request.Email,
                request.AccessToken,
                request.OrderItemId,
                cancellationToken);

            var decision = _buyerCasePolicyService.CanOpenGuestSnad(CloneOrderWithoutCases(guestContext.Order));
            if (!decision.Allowed)
            {
                throw new BadRequestException(
                    decision.Message,
                    new List<string> { decision.Code });
            }

            return await CreateGuestDisputeAsync(
                guestContext,
                normalizedDescription,
                normalizedCaseType,
                BuildCreatedMessage(normalizedCaseType, guestContext.SelectedOrderItem?.Id),
                reasonCode: null,
                cancellationToken);
        }

        private async Task<GuestDisputeContext> ResolveGuestContextAsync(
            string orderNumber,
            string email,
            string? accessToken,
            int? orderItemId,
            CancellationToken cancellationToken)
        {
            var accessDecision = await _guestAfterSalesAccessService.ValidateOrderAccessAsync(
                new GuestAfterSalesAccessRequest
                {
                    OrderNumber = orderNumber,
                    Email = email,
                    AccessToken = accessToken
                },
                cancellationToken);

            if (!accessDecision.Allowed || !accessDecision.OrderId.HasValue)
            {
                throw new BadRequestException(
                    "Guest order access could not be verified.",
                    new List<string> { "guest_access_denied" });
            }

            var order = await _context.Orders
                .Include(o => o.Payments)
                .Include(o => o.ShippingInfo)
                .Include(o => o.ReturnRequests)
                .Include(o => o.Disputes)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(
                    o => o.Id == accessDecision.OrderId.Value && o.CustomerType == "guest",
                    cancellationToken);

            if (order == null)
            {
                throw new BadRequestException(
                    "Guest order access could not be verified.",
                    new List<string> { "guest_access_denied" });
            }

            OrderItem? selectedOrderItem = null;
            if (orderItemId.HasValue)
            {
                selectedOrderItem = order.OrderItems.FirstOrDefault(item => item.Id == orderItemId.Value);
                if (selectedOrderItem == null)
                {
                    throw new BadRequestException(
                        "The selected order item does not belong to this order.",
                        new List<string> { "order_item_mismatch" });
                }
            }

            return new GuestDisputeContext
            {
                AccessDecision = accessDecision,
                Order = order,
                SelectedOrderItem = selectedOrderItem
            };
        }

        private async Task<DisputeResponseDto> CreateGuestDisputeAsync(
            GuestDisputeContext guestContext,
            string normalizedDescription,
            string caseType,
            string createdMessage,
            string? reasonCode,
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var dispute = new Dispute
                {
                    OrderId = guestContext.Order.Id,
                    OrderItemId = guestContext.SelectedOrderItem?.Id,
                    RaisedBy = null,
                    CaseType = caseType,
                    Description = normalizedDescription,
                    Status = DisputeStatusOpen,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _context.Disputes.AddAsync(dispute, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                var caseEvent = new CaseEvent
                {
                    DisputeId = dispute.Id,
                    EventType = CaseEventTypeCreated,
                    ActorType = CaseEventActorTypeBuyer,
                    ActorUserId = null,
                    Message = createdMessage,
                    MetadataJson = JsonSerializer.Serialize(new
                    {
                        disputeId = dispute.Id,
                        orderId = dispute.OrderId,
                        orderNumber = guestContext.Order.OrderNumber,
                        orderItemId = dispute.OrderItemId,
                        caseType = dispute.CaseType,
                        status = dispute.Status,
                        reasonCode = NormalizeNullable(reasonCode),
                        guestAccess = true,
                        proofMethod = guestContext.AccessDecision.Grant?.ProofMethod
                            ?? (guestContext.AccessDecision.UsedAccessToken ? "access_token" : "email_lookup")
                    }),
                    CreatedAt = now
                };

                await _context.CaseEvents.AddAsync(caseEvent, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                await _caseNotificationService.TryCreateGuestDisputeOpenedNotificationAsync(
                    guestContext.Order,
                    dispute.Id,
                    dispute.CaseType,
                    cancellationToken);

                dispute.Order = guestContext.Order;
                dispute.OrderItem = guestContext.SelectedOrderItem;

                return _buyerCaseProjectionMapper.MapDispute(dispute, new[] { caseEvent });
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
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
                _ => "INR claim"
            };

            if (orderItemId.HasValue)
            {
                return $"Guest opened a {claimLabel} for order item {orderItemId.Value}.";
            }

            return $"Guest opened a {claimLabel}.";
        }

        private static string? NormalizeNullable(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
        }

        private static Order CloneOrderWithoutCases(Order order)
        {
            return new Order
            {
                Id = order.Id,
                CustomerType = order.CustomerType,
                GuestEmail = order.GuestEmail,
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

        private static void EnsureNoBlockingCasesForInr(Order order, int? selectedOrderItemId)
        {
            if (order.ReturnRequests.Any(request =>
                string.Equals(request.RequestType, "return", StringComparison.OrdinalIgnoreCase)
                && IsOpenReturn(request)))
            {
                throw new BadRequestException(
                    "A return / refund request is already open for this order.",
                    new List<string> { "open_return_exists" });
            }

            if (order.Disputes.Any(dispute =>
                string.Equals(dispute.CaseType, DisputeCaseTypeInr, StringComparison.OrdinalIgnoreCase)
                && IsOpenDispute(dispute)
                && (!selectedOrderItemId.HasValue
                    || !dispute.OrderItemId.HasValue
                    || dispute.OrderItemId == selectedOrderItemId)))
            {
                throw new BadRequestException(
                    "An item-not-received request is already open for this order or item.",
                    new List<string> { "open_inr_exists" });
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

        private sealed class GuestDisputeContext
        {
            public GuestAfterSalesAccessDecision AccessDecision { get; set; } = null!;

            public Order Order { get; set; } = null!;

            public OrderItem? SelectedOrderItem { get; set; }
        }
    }
}
