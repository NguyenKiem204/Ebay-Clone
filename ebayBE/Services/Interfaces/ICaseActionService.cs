using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface ICaseActionService
    {
        Task<CaseActionDecision> EvaluateReturnAccessAsync(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            CancellationToken cancellationToken = default);

        Task<CaseActionDecision> EvaluateDisputeAccessAsync(
            Dispute dispute,
            CaseActionActorContext actor,
            CancellationToken cancellationToken = default);

        Task<CaseActionDecision> EvaluateReturnStatusTransitionAsync(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            string nextStatus,
            CancellationToken cancellationToken = default);

        Task<CaseActionDecision> EvaluateDisputeStatusTransitionAsync(
            Dispute dispute,
            CaseActionActorContext actor,
            string nextStatus,
            CancellationToken cancellationToken = default);

        CaseEvent BuildReturnStatusTransitionEvent(
            ReturnRequest returnRequest,
            CaseActionDecision decision,
            DateTime? createdAtUtc = null);

        CaseEvent BuildDisputeStatusTransitionEvent(
            Dispute dispute,
            CaseActionDecision decision,
            DateTime? createdAtUtc = null);

        CaseEvent BuildReturnEvidenceAddedEvent(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            CaseAttachment attachment,
            DateTime? createdAtUtc = null);

        CaseEvent BuildDisputeEvidenceAddedEvent(
            Dispute dispute,
            CaseActionActorContext actor,
            CaseAttachment attachment,
            DateTime? createdAtUtc = null);
    }
}
