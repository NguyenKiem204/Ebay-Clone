using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class ReturnRequestActionService : IReturnRequestActionService
    {
        private const string ReturnStatusApproved = "approved";
        private const string ReturnStatusRejected = "rejected";
        private const string ReturnStatusCompleted = "completed";

        private readonly EbayDbContext _context;
        private readonly ICaseActionService _caseActionService;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseNotificationService _caseNotificationService;

        public ReturnRequestActionService(
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

        public Task<ReturnRequestResponseDto> ApproveReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            ApproveReturnRequestDto request,
            CancellationToken cancellationToken = default)
        {
            return ExecuteReturnActionAsync(
                actorUserId,
                actorRole,
                returnRequestId,
                ReturnStatusApproved,
                request.Note,
                request.RefundAmount,
                cancellationToken);
        }

        public Task<ReturnRequestResponseDto> RejectReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            RejectReturnRequestDto request,
            CancellationToken cancellationToken = default)
        {
            return ExecuteReturnActionAsync(
                actorUserId,
                actorRole,
                returnRequestId,
                ReturnStatusRejected,
                request.Note,
                null,
                cancellationToken);
        }

        public Task<ReturnRequestResponseDto> CompleteReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            CompleteReturnRequestDto request,
            CancellationToken cancellationToken = default)
        {
            return ExecuteReturnActionAsync(
                actorUserId,
                actorRole,
                returnRequestId,
                ReturnStatusCompleted,
                request.Note,
                request.RefundAmount,
                cancellationToken);
        }

        private async Task<ReturnRequestResponseDto> ExecuteReturnActionAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            string nextStatus,
            string? note,
            decimal? refundAmount,
            CancellationToken cancellationToken)
        {
            ValidateRefundAmount(refundAmount);

            var returnRequest = await LoadReturnRequestAsync(returnRequestId, cancellationToken);
            var actor = new CaseActionActorContext(actorUserId, actorRole);
            var decision = await _caseActionService.EvaluateReturnStatusTransitionAsync(
                returnRequest,
                actor,
                nextStatus,
                cancellationToken);

            EnsureActionAllowed(decision);

            var now = DateTime.UtcNow;
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                ApplyTransition(returnRequest, decision.NextStatus!, note, refundAmount, now);

                var (financialOutcome, financialAmount) = CaseFinancialOutcomeHelper.ResolveReturnFinancialOutcome(
                    returnRequest,
                    decision.NextStatus);
                var financialStatusSyncApplied = CaseFinancialOutcomeHelper.TryApplyFullRefundSync(
                    returnRequest.Order,
                    financialAmount,
                    now);

                var caseEvent = _caseActionService.BuildReturnStatusTransitionEvent(returnRequest, decision, now);
                CaseFinancialOutcomeHelper.AppendFinancialMetadata(
                    caseEvent,
                    financialOutcome,
                    financialAmount,
                    financialStatusSyncApplied);

                await _context.CaseEvents.AddAsync(caseEvent, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                if (returnRequest.UserId.HasValue)
                {
                    await _caseNotificationService.TryCreateReturnLifecycleNotificationAsync(
                        returnRequest.UserId.Value,
                        returnRequest.Id,
                        decision.NextStatus!,
                        returnRequest.Order?.OrderNumber,
                        cancellationToken);
                }
                else if (returnRequest.Order != null
                    && string.Equals(returnRequest.Order.CustomerType, "guest", StringComparison.OrdinalIgnoreCase))
                {
                    await _caseNotificationService.TryCreateGuestReturnLifecycleNotificationAsync(
                        returnRequest.Order,
                        returnRequest.Id,
                        decision.NextStatus!,
                        cancellationToken);
                }

                var timeline = await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken);
                return _buyerCaseProjectionMapper.MapReturnRequest(returnRequest, timeline);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        private async Task<ReturnRequest> LoadReturnRequestAsync(int returnRequestId, CancellationToken cancellationToken)
        {
            var returnRequest = await _context.ReturnRequests
                .Include(r => r.Order)
                    .ThenInclude(o => o.Payments)
                .Include(r => r.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi!.Seller)
                .FirstOrDefaultAsync(r => r.Id == returnRequestId, cancellationToken);

            if (returnRequest == null)
            {
                throw new NotFoundException("Return request not found.");
            }

            return returnRequest;
        }

        private async Task<List<CaseEvent>> LoadReturnTimelineAsync(int returnRequestId, CancellationToken cancellationToken)
        {
            return await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.ReturnRequestId == returnRequestId)
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);
        }

        private static void ApplyTransition(
            ReturnRequest returnRequest,
            string nextStatus,
            string? note,
            decimal? refundAmount,
            DateTime now)
        {
            returnRequest.Status = nextStatus;
            returnRequest.UpdatedAt = now;

            if (!string.IsNullOrWhiteSpace(note))
            {
                returnRequest.AdminNotes = note.Trim();
            }

            if (refundAmount.HasValue)
            {
                returnRequest.RefundAmount = refundAmount.Value;
            }

            switch (nextStatus)
            {
                case ReturnStatusApproved:
                    returnRequest.ApprovedAt = now;
                    break;
                case ReturnStatusRejected:
                    returnRequest.RejectedAt = now;
                    break;
                case ReturnStatusCompleted:
                    returnRequest.ClosedAt = now;
                    break;
            }
        }

        private static void ValidateRefundAmount(decimal? refundAmount)
        {
            if (refundAmount.HasValue && refundAmount.Value < 0)
            {
                throw new BadRequestException(
                    "Refund amount must be zero or greater.",
                    new List<string> { "refund_amount_invalid" });
            }
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
