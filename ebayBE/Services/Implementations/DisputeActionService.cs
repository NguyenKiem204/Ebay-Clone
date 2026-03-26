using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class DisputeActionService : IDisputeActionService
    {
        private const string DisputeStatusInProgress = "in_progress";
        private const string DisputeStatusResolved = "resolved";
        private const string DisputeStatusClosed = "closed";

        private readonly EbayDbContext _context;
        private readonly ICaseActionService _caseActionService;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseNotificationService _caseNotificationService;

        public DisputeActionService(
            EbayDbContext context,
            ICaseActionService caseActionService,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper,
            ICaseNotificationService caseNotificationService)
        {
            _context = context;
            _caseActionService = caseActionService;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
            _caseNotificationService = caseNotificationService;
        }

        public Task<DisputeResponseDto> AcknowledgeDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            AcknowledgeDisputeDto request,
            CancellationToken cancellationToken = default)
        {
            return ExecuteDisputeActionAsync(
                actorUserId,
                actorRole,
                disputeId,
                DisputeStatusInProgress,
                resolution: null,
                financialOutcome: null,
                financialAmount: null,
                closedReason: null,
                cancellationToken,
                lifecycleEvent: "acknowledged");
        }

        public Task<DisputeResponseDto> MarkDisputeInProgressAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            MarkDisputeInProgressDto request,
            CancellationToken cancellationToken = default)
        {
            return ExecuteDisputeActionAsync(
                actorUserId,
                actorRole,
                disputeId,
                DisputeStatusInProgress,
                resolution: null,
                financialOutcome: null,
                financialAmount: null,
                closedReason: null,
                cancellationToken,
                lifecycleEvent: DisputeStatusInProgress);
        }

        public Task<DisputeResponseDto> ResolveDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            ResolveDisputeDto request,
            CancellationToken cancellationToken = default)
        {
            return ExecuteDisputeActionAsync(
                actorUserId,
                actorRole,
                disputeId,
                DisputeStatusResolved,
                request.Resolution,
                request.FinancialOutcome,
                request.FinancialAmount,
                closedReason: null,
                cancellationToken,
                lifecycleEvent: DisputeStatusResolved);
        }

        public Task<DisputeResponseDto> CloseDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            CloseDisputeDto request,
            CancellationToken cancellationToken = default)
        {
            return ExecuteDisputeActionAsync(
                actorUserId,
                actorRole,
                disputeId,
                DisputeStatusClosed,
                resolution: null,
                financialOutcome: null,
                financialAmount: null,
                request.ClosedReason,
                cancellationToken,
                lifecycleEvent: DisputeStatusClosed);
        }

        private async Task<DisputeResponseDto> ExecuteDisputeActionAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            string nextStatus,
            string? resolution,
            string? financialOutcome,
            decimal? financialAmount,
            string? closedReason,
            CancellationToken cancellationToken,
            string lifecycleEvent)
        {
            var normalizedResolution = NormalizeOptional(resolution);
            var normalizedClosedReason = NormalizeOptional(closedReason);
            var (normalizedFinancialOutcome, normalizedFinancialAmount) =
                nextStatus == DisputeStatusResolved
                    ? CaseFinancialOutcomeHelper.NormalizeDisputeFinancialOutcome(financialOutcome, financialAmount)
                    : (null, null);

            if (nextStatus == DisputeStatusResolved && string.IsNullOrWhiteSpace(normalizedResolution))
            {
                throw new BadRequestException(
                    "Resolution is required when resolving a dispute.",
                    new List<string> { "resolution_required" });
            }

            if (nextStatus == DisputeStatusClosed && string.IsNullOrWhiteSpace(normalizedClosedReason))
            {
                throw new BadRequestException(
                    "Closed reason is required when closing a dispute.",
                    new List<string> { "closed_reason_required" });
            }

            var dispute = await LoadDisputeAsync(disputeId, cancellationToken);
            var actor = new CaseActionActorContext(actorUserId, actorRole);
            var decision = await _caseActionService.EvaluateDisputeStatusTransitionAsync(
                dispute,
                actor,
                nextStatus,
                cancellationToken);

            EnsureActionAllowed(decision);

            var now = DateTime.UtcNow;
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                ApplyTransition(dispute, decision.NextStatus!, actorUserId, normalizedResolution, normalizedClosedReason, now);
                var financialStatusSyncApplied = CaseFinancialOutcomeHelper.TryApplyFullRefundSync(
                    dispute.Order,
                    normalizedFinancialAmount,
                    now);

                var caseEvent = _caseActionService.BuildDisputeStatusTransitionEvent(dispute, decision, now);
                CaseFinancialOutcomeHelper.AppendFinancialMetadata(
                    caseEvent,
                    normalizedFinancialOutcome,
                    normalizedFinancialAmount,
                    financialStatusSyncApplied);

                await _context.CaseEvents.AddAsync(caseEvent, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                if (dispute.RaisedBy.HasValue)
                {
                    await _caseNotificationService.TryCreateDisputeLifecycleNotificationAsync(
                        dispute.RaisedBy.Value,
                        dispute.Id,
                        dispute.CaseType,
                        lifecycleEvent,
                        dispute.Order?.OrderNumber,
                        cancellationToken);
                }
                else if (dispute.Order != null
                    && string.Equals(dispute.Order.CustomerType, "guest", StringComparison.OrdinalIgnoreCase))
                {
                    await _caseNotificationService.TryCreateGuestDisputeLifecycleNotificationAsync(
                        dispute.Order,
                        dispute.Id,
                        dispute.CaseType,
                        lifecycleEvent,
                        cancellationToken);
                }

                var timeline = await LoadDisputeTimelineAsync(dispute.Id, cancellationToken);
                return _buyerCaseProjectionMapper.MapDispute(dispute, timeline);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        private async Task<Dispute> LoadDisputeAsync(int disputeId, CancellationToken cancellationToken)
        {
            var dispute = await _context.Disputes
                .Include(d => d.Order)
                    .ThenInclude(o => o.Payments)
                .Include(d => d.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(d => d.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Include(d => d.OrderItem)
                    .ThenInclude(oi => oi!.Seller)
                .FirstOrDefaultAsync(d => d.Id == disputeId, cancellationToken);

            if (dispute == null)
            {
                throw new NotFoundException("Dispute not found.");
            }

            return dispute;
        }

        private async Task<List<CaseEvent>> LoadDisputeTimelineAsync(int disputeId, CancellationToken cancellationToken)
        {
            return await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.DisputeId == disputeId)
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);
        }

        private static void ApplyTransition(
            Dispute dispute,
            string nextStatus,
            int actorUserId,
            string? resolution,
            string? closedReason,
            DateTime now)
        {
            dispute.Status = nextStatus;
            dispute.UpdatedAt = now;

            switch (nextStatus)
            {
                case DisputeStatusResolved:
                    dispute.Resolution = resolution;
                    dispute.ResolvedAt = now;
                    dispute.ResolvedBy = actorUserId;
                    break;
                case DisputeStatusClosed:
                    dispute.ClosedAt = now;
                    dispute.ClosedReason = closedReason;
                    break;
            }
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static void EnsureActionAllowed(CaseActionDecision decision)
        {
            if (decision.Allowed)
            {
                return;
            }

            if (IsOwnershipFailure(decision.Code))
            {
                throw new ForbiddenException(decision.Message);
            }

            throw new BadRequestException(
                decision.Message,
                new List<string> { decision.Code });
        }

        private static bool IsOwnershipFailure(string code)
        {
            return code is
                "unsupported_case_actor_role" or
                "actor_user_required" or
                "seller_not_case_owner" or
                "seller_owner_required" or
                "admin_fallback_required";
        }
    }
}
