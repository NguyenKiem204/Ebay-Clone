using System.Text.Json;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class CaseActionService : ICaseActionService
    {
        private const string RoleSeller = "seller";
        private const string RoleBuyer = "buyer";
        private const string RoleAdmin = "admin";
        private const string RoleSystem = "system";

        private const string ActorTypeBuyer = "buyer";
        private const string ActorTypeSeller = "seller";
        private const string ActorTypeAdmin = "admin";
        private const string ActorTypeSystem = "system";

        private const string OwnershipModeSellerPrimary = "seller_primary";
        private const string OwnershipModeAdminFallback = "admin_fallback";

        private const string DisputeCaseTypeReturnEscalation = "return_escalation";

        private const string CaseEventTypeStatusChanged = "status_changed";
        private const string CaseEventTypeResolved = "resolved";
        private const string CaseEventTypeClosed = "closed";
        private const string CaseEventTypeEvidenceAdded = "evidence_added";

        private readonly EbayDbContext _context;
        private readonly IBuyerCasePolicyService _buyerCasePolicyService;

        public CaseActionService(
            EbayDbContext context,
            IBuyerCasePolicyService buyerCasePolicyService)
        {
            _context = context;
            _buyerCasePolicyService = buyerCasePolicyService;
        }

        public async Task<CaseActionDecision> EvaluateReturnStatusTransitionAsync(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            string nextStatus,
            CancellationToken cancellationToken = default)
        {
            var normalizedNextStatus = Normalize(nextStatus);
            if (string.IsNullOrWhiteSpace(normalizedNextStatus))
            {
                return CaseActionDecision.Deny(
                    "next_status_required",
                    "The target return status is required.",
                    ResolveActorType(actor.Role),
                    OwnershipModeAdminFallback,
                    actor.UserId,
                    currentStatus: Normalize(returnRequest.Status),
                    nextStatus: normalizedNextStatus);
            }

            var ownershipDecision = await EvaluateReturnAccessAsync(returnRequest, actor, cancellationToken);
            if (!ownershipDecision.Allowed)
            {
                return ownershipDecision;
            }

            var transitionDecision = _buyerCasePolicyService.CanTransitionReturnStatus(returnRequest.Status, normalizedNextStatus);
            if (!transitionDecision.Allowed)
            {
                return CaseActionDecision.Deny(
                    transitionDecision.Code,
                    transitionDecision.Message,
                    ownershipDecision.ActorType,
                    ownershipDecision.OwnershipMode,
                    ownershipDecision.ActorUserId,
                    ownershipDecision.OwnerSellerId,
                    transitionDecision.CurrentStatus,
                    transitionDecision.NextStatus,
                    ResolveEventType(normalizedNextStatus));
            }

            return CaseActionDecision.Allow(
                transitionDecision.Code,
                transitionDecision.Message,
                ownershipDecision.ActorType,
                ownershipDecision.OwnershipMode,
                ownershipDecision.ActorUserId,
                ownershipDecision.OwnerSellerId,
                transitionDecision.CurrentStatus,
                transitionDecision.NextStatus,
                ResolveEventType(normalizedNextStatus));
        }

        public async Task<CaseActionDecision> EvaluateDisputeStatusTransitionAsync(
            Dispute dispute,
            CaseActionActorContext actor,
            string nextStatus,
            CancellationToken cancellationToken = default)
        {
            var normalizedNextStatus = Normalize(nextStatus);
            if (string.IsNullOrWhiteSpace(normalizedNextStatus))
            {
                return CaseActionDecision.Deny(
                    "next_status_required",
                    "The target dispute status is required.",
                    ResolveActorType(actor.Role),
                    OwnershipModeAdminFallback,
                    actor.UserId,
                    currentStatus: Normalize(dispute.Status),
                    nextStatus: normalizedNextStatus);
            }

            var ownershipDecision = await EvaluateDisputeAccessAsync(dispute, actor, cancellationToken);
            if (!ownershipDecision.Allowed)
            {
                return ownershipDecision;
            }

            var transitionDecision = _buyerCasePolicyService.CanTransitionDisputeStatus(dispute.Status, normalizedNextStatus);
            if (!transitionDecision.Allowed)
            {
                return CaseActionDecision.Deny(
                    transitionDecision.Code,
                    transitionDecision.Message,
                    ownershipDecision.ActorType,
                    ownershipDecision.OwnershipMode,
                    ownershipDecision.ActorUserId,
                    ownershipDecision.OwnerSellerId,
                    transitionDecision.CurrentStatus,
                    transitionDecision.NextStatus,
                    ResolveEventType(normalizedNextStatus));
            }

            return CaseActionDecision.Allow(
                transitionDecision.Code,
                transitionDecision.Message,
                ownershipDecision.ActorType,
                ownershipDecision.OwnershipMode,
                ownershipDecision.ActorUserId,
                ownershipDecision.OwnerSellerId,
                transitionDecision.CurrentStatus,
                transitionDecision.NextStatus,
                ResolveEventType(normalizedNextStatus));
        }

        public Task<CaseActionDecision> EvaluateReturnAccessAsync(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            CancellationToken cancellationToken = default)
        {
            return EvaluateReturnOwnershipAsync(returnRequest, actor, cancellationToken);
        }

        public Task<CaseActionDecision> EvaluateDisputeAccessAsync(
            Dispute dispute,
            CaseActionActorContext actor,
            CancellationToken cancellationToken = default)
        {
            return EvaluateDisputeOwnershipAsync(dispute, actor, cancellationToken);
        }

        public CaseEvent BuildReturnStatusTransitionEvent(
            ReturnRequest returnRequest,
            CaseActionDecision decision,
            DateTime? createdAtUtc = null)
        {
            EnsureDecisionAllowed(decision);

            return new CaseEvent
            {
                ReturnRequestId = returnRequest.Id,
                EventType = decision.EventType,
                ActorType = decision.ActorType,
                ActorUserId = decision.ActorUserId,
                Message = BuildReturnStatusChangeMessage(decision),
                MetadataJson = JsonSerializer.Serialize(new
                {
                    returnRequestId = returnRequest.Id,
                    orderId = returnRequest.OrderId,
                    orderItemId = returnRequest.OrderItemId,
                    ownershipMode = decision.OwnershipMode,
                    ownerSellerId = decision.OwnerSellerId,
                    currentStatus = decision.CurrentStatus,
                    nextStatus = decision.NextStatus,
                    decisionCode = decision.Code
                }),
                CreatedAt = createdAtUtc ?? DateTime.UtcNow
            };
        }

        public CaseEvent BuildDisputeStatusTransitionEvent(
            Dispute dispute,
            CaseActionDecision decision,
            DateTime? createdAtUtc = null)
        {
            EnsureDecisionAllowed(decision);

            return new CaseEvent
            {
                DisputeId = dispute.Id,
                EventType = decision.EventType,
                ActorType = decision.ActorType,
                ActorUserId = decision.ActorUserId,
                Message = BuildDisputeStatusChangeMessage(dispute.CaseType, decision),
                MetadataJson = JsonSerializer.Serialize(new
                {
                    disputeId = dispute.Id,
                    orderId = dispute.OrderId,
                    orderItemId = dispute.OrderItemId,
                    caseType = dispute.CaseType,
                    escalatedFromReturnRequestId = dispute.EscalatedFromReturnRequestId,
                    ownershipMode = decision.OwnershipMode,
                    ownerSellerId = decision.OwnerSellerId,
                    currentStatus = decision.CurrentStatus,
                    nextStatus = decision.NextStatus,
                    decisionCode = decision.Code
                }),
                CreatedAt = createdAtUtc ?? DateTime.UtcNow
            };
        }

        public CaseEvent BuildReturnEvidenceAddedEvent(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            CaseAttachment attachment,
            DateTime? createdAtUtc = null)
        {
            var actorType = ResolveActorType(actor.Role);
            if (string.IsNullOrWhiteSpace(actorType))
            {
                throw new InvalidOperationException("The case evidence actor role is not supported.");
            }

            return new CaseEvent
            {
                ReturnRequestId = returnRequest.Id,
                EventType = CaseEventTypeEvidenceAdded,
                ActorType = actorType,
                ActorUserId = actor.UserId,
                Message = $"{DescribeActor(actorType)} added evidence to this return request.",
                MetadataJson = BuildEvidenceMetadataJson(attachment),
                CreatedAt = createdAtUtc ?? attachment.CreatedAt ?? DateTime.UtcNow
            };
        }

        public CaseEvent BuildDisputeEvidenceAddedEvent(
            Dispute dispute,
            CaseActionActorContext actor,
            CaseAttachment attachment,
            DateTime? createdAtUtc = null)
        {
            var actorType = ResolveActorType(actor.Role);
            if (string.IsNullOrWhiteSpace(actorType))
            {
                throw new InvalidOperationException("The case evidence actor role is not supported.");
            }

            return new CaseEvent
            {
                DisputeId = dispute.Id,
                EventType = CaseEventTypeEvidenceAdded,
                ActorType = actorType,
                ActorUserId = actor.UserId,
                Message = $"{DescribeActor(actorType)} added evidence to this {DescribeDispute(dispute.CaseType)}.",
                MetadataJson = BuildEvidenceMetadataJson(attachment),
                CreatedAt = createdAtUtc ?? attachment.CreatedAt ?? DateTime.UtcNow
            };
        }

        private async Task<CaseActionDecision> EvaluateReturnOwnershipAsync(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            CancellationToken cancellationToken)
        {
            var ownership = await ResolveSellerFirstOwnershipAsync(
                returnRequest.OrderId,
                returnRequest.OrderItemId,
                forceAdminFallback: false,
                returnRequest.Order,
                returnRequest.OrderItem,
                cancellationToken);

            return BuildOwnershipDecision(
                actor,
                ownership,
                Normalize(returnRequest.Status));
        }

        private async Task<CaseActionDecision> EvaluateDisputeOwnershipAsync(
            Dispute dispute,
            CaseActionActorContext actor,
            CancellationToken cancellationToken)
        {
            var forceAdminFallback =
                dispute.EscalatedFromReturnRequestId.HasValue ||
                string.Equals(Normalize(dispute.CaseType), DisputeCaseTypeReturnEscalation, StringComparison.Ordinal);

            var ownership = await ResolveSellerFirstOwnershipAsync(
                dispute.OrderId,
                dispute.OrderItemId,
                forceAdminFallback,
                dispute.Order,
                dispute.OrderItem,
                cancellationToken);

            return BuildOwnershipDecision(
                actor,
                ownership,
                Normalize(dispute.Status));
        }

        private async Task<OwnershipResolution> ResolveSellerFirstOwnershipAsync(
            int orderId,
            int? orderItemId,
            bool forceAdminFallback,
            Order? order,
            OrderItem? orderItem,
            CancellationToken cancellationToken)
        {
            if (forceAdminFallback)
            {
                return OwnershipResolution.AdminFallback("escalated_or_platform_owned_case");
            }

            if (orderItemId.HasValue)
            {
                var sellerId = ResolveSellerIdForOrderItem(orderItem)
                    ?? await ResolveSellerIdForOrderItemAsync(orderItemId.Value, cancellationToken);
                return sellerId.HasValue
                    ? OwnershipResolution.SellerPrimary(sellerId.Value)
                    : OwnershipResolution.AdminFallback("seller_owner_not_resolvable");
            }

            var distinctSellerIds = ResolveDistinctOrderSellerIds(order)
                ?? await ResolveDistinctOrderSellerIdsAsync(orderId, cancellationToken);
            return distinctSellerIds.Count switch
            {
                1 => OwnershipResolution.SellerPrimary(distinctSellerIds[0]),
                _ => OwnershipResolution.AdminFallback("ambiguous_order_level_case")
            };
        }

        private CaseActionDecision BuildOwnershipDecision(
            CaseActionActorContext actor,
            OwnershipResolution ownership,
            string? currentStatus)
        {
            var actorType = ResolveActorType(actor.Role);
            if (string.IsNullOrWhiteSpace(actorType))
            {
                return CaseActionDecision.Deny(
                    "unsupported_case_actor_role",
                    "This actor role is not allowed to perform seller/admin case actions.",
                    string.Empty,
                    ownership.Mode,
                    actor.UserId,
                    ownership.OwnerSellerId,
                    currentStatus);
            }

            if (actorType is ActorTypeSeller or ActorTypeAdmin && !actor.UserId.HasValue)
            {
                return CaseActionDecision.Deny(
                    "actor_user_required",
                    "An authenticated seller or admin user is required for this action.",
                    actorType,
                    ownership.Mode,
                    actor.UserId,
                    ownership.OwnerSellerId,
                    currentStatus);
            }

            if (ownership.Mode == OwnershipModeSellerPrimary)
            {
                if (actorType == ActorTypeSeller && actor.UserId == ownership.OwnerSellerId)
                {
                    return CaseActionDecision.Allow(
                        "seller_action_allowed",
                        "Seller ownership is established for this case.",
                        actorType,
                        ownership.Mode,
                        actor.UserId,
                        ownership.OwnerSellerId,
                        currentStatus);
                }

                if (actorType == ActorTypeSeller)
                {
                    return CaseActionDecision.Deny(
                        "seller_not_case_owner",
                        "This seller does not own the case-linked order item.",
                        actorType,
                        ownership.Mode,
                        actor.UserId,
                        ownership.OwnerSellerId,
                        currentStatus);
                }

                return CaseActionDecision.Deny(
                    "seller_owner_required",
                    "This case has a clear seller owner and should be handled by that seller first.",
                    actorType,
                    ownership.Mode,
                    actor.UserId,
                    ownership.OwnerSellerId,
                    currentStatus);
            }

            if (actorType is ActorTypeAdmin or ActorTypeSystem)
            {
                return CaseActionDecision.Allow(
                    "admin_fallback_action_allowed",
                    "This case requires admin/internal fallback handling.",
                    actorType,
                    ownership.Mode,
                    actor.UserId,
                    ownership.OwnerSellerId,
                    currentStatus);
            }

            return CaseActionDecision.Deny(
                "admin_fallback_required",
                "This case requires admin/internal handling because seller ownership cannot be established safely.",
                actorType,
                ownership.Mode,
                actor.UserId,
                ownership.OwnerSellerId,
                currentStatus);
        }

        private async Task<int?> ResolveSellerIdForOrderItemAsync(int orderItemId, CancellationToken cancellationToken)
        {
            return await _context.OrderItems
                .AsNoTracking()
                .Where(orderItem => orderItem.Id == orderItemId)
                .Select(orderItem => (int?)orderItem.SellerId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private static int? ResolveSellerIdForOrderItem(OrderItem? orderItem)
        {
            return orderItem?.SellerId > 0
                ? orderItem.SellerId
                : null;
        }

        private async Task<List<int>> ResolveDistinctOrderSellerIdsAsync(int orderId, CancellationToken cancellationToken)
        {
            return await _context.OrderItems
                .AsNoTracking()
                .Where(orderItem => orderItem.OrderId == orderId)
                .Select(orderItem => orderItem.SellerId)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        private static List<int>? ResolveDistinctOrderSellerIds(Order? order)
        {
            if (order?.OrderItems == null || order.OrderItems.Count == 0)
            {
                return null;
            }

            return order.OrderItems
                .Select(orderItem => orderItem.SellerId)
                .Distinct()
                .ToList();
        }

        private static string ResolveActorType(string? role)
        {
            return Normalize(role) switch
            {
                RoleBuyer => ActorTypeBuyer,
                RoleSeller => ActorTypeSeller,
                RoleAdmin => ActorTypeAdmin,
                RoleSystem => ActorTypeSystem,
                _ => string.Empty
            };
        }

        private static string ResolveEventType(string? nextStatus)
        {
            return Normalize(nextStatus) switch
            {
                "resolved" => CaseEventTypeResolved,
                "closed" => CaseEventTypeClosed,
                _ => CaseEventTypeStatusChanged
            };
        }

        private static string BuildReturnStatusChangeMessage(CaseActionDecision decision)
        {
            return $"{DescribeActor(decision.ActorType)} updated return request status from {decision.CurrentStatus ?? "unknown"} to {decision.NextStatus ?? "unknown"}.";
        }

        private static string BuildDisputeStatusChangeMessage(string? caseType, CaseActionDecision decision)
        {
            return $"{DescribeActor(decision.ActorType)} updated {DescribeDispute(caseType)} status from {decision.CurrentStatus ?? "unknown"} to {decision.NextStatus ?? "unknown"}.";
        }

        private static string DescribeActor(string actorType)
        {
            return Normalize(actorType) switch
            {
                ActorTypeBuyer => "Buyer",
                ActorTypeSeller => "Seller",
                ActorTypeAdmin => "Admin",
                ActorTypeSystem => "System",
                _ => "Actor"
            };
        }

        private static string BuildEvidenceMetadataJson(CaseAttachment attachment)
        {
            return JsonSerializer.Serialize(new
            {
                attachmentId = attachment.Id,
                returnRequestId = attachment.ReturnRequestId,
                disputeId = attachment.DisputeId,
                filePath = attachment.FilePath,
                originalFileName = attachment.OriginalFileName,
                contentType = attachment.ContentType,
                fileSizeBytes = attachment.FileSizeBytes,
                label = attachment.Label,
                evidenceType = attachment.EvidenceType,
                uploadedByUserId = attachment.UploadedByUserId
            });
        }

        private static string DescribeDispute(string? caseType)
        {
            return Normalize(caseType) switch
            {
                "inr" => "INR claim",
                "snad" => "SNAD claim",
                "damaged" => "damaged-item claim",
                DisputeCaseTypeReturnEscalation => "escalated return dispute",
                _ => "dispute"
            };
        }

        private static void EnsureDecisionAllowed(CaseActionDecision decision)
        {
            if (!decision.Allowed)
            {
                throw new InvalidOperationException("Cannot build a case action timeline event from a denied decision.");
            }
        }

        private static string? Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim().ToLowerInvariant();
        }

        private sealed class OwnershipResolution
        {
            public string Mode { get; }
            public int? OwnerSellerId { get; }
            public string Code { get; }

            private OwnershipResolution(string mode, int? ownerSellerId, string code)
            {
                Mode = mode;
                OwnerSellerId = ownerSellerId;
                Code = code;
            }

            public static OwnershipResolution SellerPrimary(int sellerId)
            {
                return new OwnershipResolution(OwnershipModeSellerPrimary, sellerId, "seller_primary_owner");
            }

            public static OwnershipResolution AdminFallback(string code)
            {
                return new OwnershipResolution(OwnershipModeAdminFallback, null, code);
            }
        }
    }
}
