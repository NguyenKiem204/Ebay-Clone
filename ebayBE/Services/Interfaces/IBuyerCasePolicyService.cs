using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface IBuyerCasePolicyService
    {
        BuyerCasePolicyDecision CanOpenReturn(Order order, DateTime? nowUtc = null);

        BuyerCasePolicyDecision CanOpenGuestReturn(Order order, DateTime? nowUtc = null);

        BuyerCasePolicyDecision CanOpenInr(Order order, DateTime? nowUtc = null);

        BuyerCasePolicyDecision CanOpenGuestInr(Order order, DateTime? nowUtc = null);

        BuyerCasePolicyDecision CanOpenSnad(Order order, DateTime? nowUtc = null);

        BuyerCasePolicyDecision CanOpenGuestSnad(Order order, DateTime? nowUtc = null);

        BuyerCasePolicyDecision CanEscalate(
            Order order,
            BuyerCaseType sourceCaseType,
            string? sourceStatus,
            DateTime? sourceCreatedAt,
            DateTime? nowUtc = null);

        BuyerCasePolicyDecision CanTransitionReturnStatus(string currentStatus, string nextStatus);

        BuyerCasePolicyDecision CanTransitionDisputeStatus(string currentStatus, string nextStatus);
    }
}
