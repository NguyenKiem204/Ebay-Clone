using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface ICaseNotificationService
    {
        Task TryCreateReturnOpenedNotificationAsync(
            int userId,
            int returnRequestId,
            string? orderNumber,
            CancellationToken cancellationToken = default);

        Task TryCreateReturnLifecycleNotificationAsync(
            int userId,
            int returnRequestId,
            string lifecycleEvent,
            string? orderNumber,
            CancellationToken cancellationToken = default);

        Task TryCreateDisputeOpenedNotificationAsync(
            int userId,
            int disputeId,
            string caseType,
            string? orderNumber,
            CancellationToken cancellationToken = default);

        Task TryCreateDisputeLifecycleNotificationAsync(
            int userId,
            int disputeId,
            string caseType,
            string lifecycleEvent,
            string? orderNumber,
            CancellationToken cancellationToken = default);

        Task TryCreateGuestReturnOpenedNotificationAsync(
            Order order,
            int returnRequestId,
            CancellationToken cancellationToken = default);

        Task TryCreateGuestReturnLifecycleNotificationAsync(
            Order order,
            int returnRequestId,
            string lifecycleEvent,
            CancellationToken cancellationToken = default);

        Task TryCreateGuestDisputeOpenedNotificationAsync(
            Order order,
            int disputeId,
            string caseType,
            CancellationToken cancellationToken = default);

        Task TryCreateGuestDisputeLifecycleNotificationAsync(
            Order order,
            int disputeId,
            string caseType,
            string lifecycleEvent,
            CancellationToken cancellationToken = default);
    }
}
