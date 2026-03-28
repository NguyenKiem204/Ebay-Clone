using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ebay.Services.Implementations
{
    public class CaseNotificationService : ICaseNotificationService
    {
        private const string NotificationTypeOrder = "order";
        private const string CustomerTypeGuest = "guest";
        private const string DisputeCaseTypeInr = "inr";
        private const string DisputeCaseTypeSnad = "snad";
        private const string DisputeCaseTypeDamaged = "damaged";
        private const string DisputeCaseTypeReturnEscalation = "return_escalation";
        private const string ReturnLifecycleApproved = "approved";
        private const string ReturnLifecycleRejected = "rejected";
        private const string ReturnLifecycleCompleted = "completed";
        private const string DisputeLifecycleAcknowledged = "acknowledged";
        private const string DisputeLifecycleInProgress = "in_progress";
        private const string DisputeLifecycleResolved = "resolved";
        private const string DisputeLifecycleClosed = "closed";

        private readonly EbayDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<CaseNotificationService> _logger;

        public CaseNotificationService(
            EbayDbContext context,
            IEmailService emailService,
            ILogger<CaseNotificationService> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task TryCreateReturnOpenedNotificationAsync(
            int userId,
            int returnRequestId,
            string? orderNumber,
            CancellationToken cancellationToken = default)
        {
            try
            {
                await CreateNotificationAsync(
                    userId,
                    "Return request received",
                    $"Your return request for {FormatOrderReference(orderNumber)} has been opened.",
                    $"/cases/return/{returnRequestId}",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create return notification for return request {ReturnRequestId} and user {UserId}",
                    returnRequestId,
                    userId);
            }
        }

        public async Task TryCreateReturnLifecycleNotificationAsync(
            int userId,
            int returnRequestId,
            string lifecycleEvent,
            string? orderNumber,
            CancellationToken cancellationToken = default)
        {
            var (title, body) = BuildReturnLifecycleNotificationContent(lifecycleEvent, orderNumber);

            try
            {
                await CreateNotificationAsync(
                    userId,
                    title,
                    body,
                    $"/cases/return/{returnRequestId}",
                    cancellationToken);

                await TrySendMemberCaseEmailAsync(
                    userId,
                    orderNumber,
                    $"Return request #{returnRequestId}",
                    $"{title} - {orderNumber ?? "order"}",
                    title,
                    body,
                    $"/cases/return/{returnRequestId}",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create return lifecycle notification for return request {ReturnRequestId}, event {LifecycleEvent}, and user {UserId}",
                    returnRequestId,
                    lifecycleEvent,
                    userId);
            }
        }

        public async Task TryCreateDisputeOpenedNotificationAsync(
            int userId,
            int disputeId,
            string caseType,
            string? orderNumber,
            CancellationToken cancellationToken = default)
        {
            var (title, body) = BuildDisputeNotificationContent(caseType, orderNumber);

            try
            {
                await CreateNotificationAsync(
                    userId,
                    title,
                    body,
                    $"/cases/dispute/{disputeId}",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create dispute notification for dispute {DisputeId}, case type {CaseType}, and user {UserId}",
                    disputeId,
                    caseType,
                    userId);
            }
        }

        public async Task TryCreateDisputeLifecycleNotificationAsync(
            int userId,
            int disputeId,
            string caseType,
            string lifecycleEvent,
            string? orderNumber,
            CancellationToken cancellationToken = default)
        {
            var (title, body) = BuildDisputeLifecycleNotificationContent(caseType, lifecycleEvent, orderNumber);

            try
            {
                await CreateNotificationAsync(
                    userId,
                    title,
                    body,
                    $"/cases/dispute/{disputeId}",
                    cancellationToken);

                await TrySendMemberCaseEmailAsync(
                    userId,
                    orderNumber,
                    $"{DescribeDisputeCase(caseType)} #{disputeId}",
                    $"{title} - {orderNumber ?? "order"}",
                    title,
                    body,
                    $"/cases/dispute/{disputeId}",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create dispute lifecycle notification for dispute {DisputeId}, case type {CaseType}, event {LifecycleEvent}, and user {UserId}",
                    disputeId,
                    caseType,
                    lifecycleEvent,
                    userId);
            }
        }

        public async Task TryCreateGuestReturnOpenedNotificationAsync(
            Order order,
            int returnRequestId,
            CancellationToken cancellationToken = default)
        {
            var (title, body) = (
                "Guest return request received",
                $"Your guest return request for {FormatOrderReference(order.OrderNumber)} has been opened.");

            await TrySendGuestCaseEmailAsync(
                order,
                title,
                title,
                body,
                $"Guest return request #{returnRequestId}");
        }

        public async Task TryCreateGuestReturnLifecycleNotificationAsync(
            Order order,
            int returnRequestId,
            string lifecycleEvent,
            CancellationToken cancellationToken = default)
        {
            var (title, body) = BuildReturnLifecycleNotificationContent(lifecycleEvent, order.OrderNumber);
            await TrySendGuestCaseEmailAsync(
                order,
                title,
                title,
                body,
                $"Guest return request #{returnRequestId}");
        }

        public async Task TryCreateGuestDisputeOpenedNotificationAsync(
            Order order,
            int disputeId,
            string caseType,
            CancellationToken cancellationToken = default)
        {
            var (title, body) = BuildDisputeNotificationContent(caseType, order.OrderNumber);
            await TrySendGuestCaseEmailAsync(
                order,
                title,
                title,
                body,
                $"{DescribeDisputeCase(caseType)} #{disputeId}");
        }

        public async Task TryCreateGuestDisputeLifecycleNotificationAsync(
            Order order,
            int disputeId,
            string caseType,
            string lifecycleEvent,
            CancellationToken cancellationToken = default)
        {
            var (title, body) = BuildDisputeLifecycleNotificationContent(caseType, lifecycleEvent, order.OrderNumber);
            await TrySendGuestCaseEmailAsync(
                order,
                title,
                title,
                body,
                $"{DescribeDisputeCase(caseType)} #{disputeId}");
        }

        private async Task CreateNotificationAsync(
            int userId,
            string title,
            string body,
            string link,
            CancellationToken cancellationToken)
        {
            await _context.Notifications.AddAsync(new Notification
            {
                UserId = userId,
                Type = NotificationTypeOrder,
                Title = title,
                Body = body,
                IsRead = false,
                Link = link,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task TrySendGuestCaseEmailAsync(
            Order order,
            string subject,
            string heading,
            string summary,
            string caseReference)
        {
            if (!IsGuestOrder(order) || string.IsNullOrWhiteSpace(order.GuestEmail))
            {
                _logger.LogInformation(
                    "Guest case email skipped for order {OrderNumber} because guest identity is not available.",
                    order.OrderNumber);
                return;
            }

            try
            {
                await _emailService.SendGuestCaseUpdateEmailAsync(
                    order.GuestEmail,
                    order.GuestFullName ?? "bạn",
                    order.OrderNumber,
                    caseReference,
                    $"{subject} - {order.OrderNumber}",
                    heading,
                    summary,
                    "Use guest order lookup with the same order number and checkout email to review your guest cases, case updates, and any evidence without signing in.");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send guest case email for order {OrderNumber} and case reference {CaseReference}",
                    order.OrderNumber,
                    caseReference);
            }
        }

        private async Task TrySendMemberCaseEmailAsync(
            int userId,
            string? orderNumber,
            string caseReference,
            string subject,
            string heading,
            string summary,
            string actionPath,
            CancellationToken cancellationToken)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, cancellationToken);

            if (user == null || string.IsNullOrWhiteSpace(user.Email))
            {
                _logger.LogInformation(
                    "Member case email skipped because user {UserId} has no reachable email for case {CaseReference}.",
                    userId,
                    caseReference);
                return;
            }

            try
            {
                await _emailService.SendMemberCaseUpdateEmailAsync(
                    user.Email,
                    ResolveMemberDisplayName(user),
                    orderNumber ?? "Unknown order",
                    caseReference,
                    subject,
                    heading,
                    summary,
                    actionPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send member case email for user {UserId} and case {CaseReference}",
                    userId,
                    caseReference);
            }
        }

        private static string FormatOrderReference(string? orderNumber)
        {
            return string.IsNullOrWhiteSpace(orderNumber)
                ? "your order"
                : $"order {orderNumber}";
        }

        private static bool IsGuestOrder(Order order)
        {
            return string.Equals(order.CustomerType, CustomerTypeGuest, StringComparison.OrdinalIgnoreCase);
        }

        private static string ResolveMemberDisplayName(User user)
        {
            var fullName = $"{user.FirstName} {user.LastName}".Trim();
            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }

            if (!string.IsNullOrWhiteSpace(user.Username))
            {
                return user.Username;
            }

            return "there";
        }

        private static (string Title, string Body) BuildReturnLifecycleNotificationContent(string lifecycleEvent, string? orderNumber)
        {
            var orderReference = FormatOrderReference(orderNumber);
            return Normalize(lifecycleEvent) switch
            {
                ReturnLifecycleApproved => (
                    "Return approved",
                    $"Your return request for {orderReference} has been approved."),
                ReturnLifecycleRejected => (
                    "Return rejected",
                    $"Your return request for {orderReference} has been rejected."),
                ReturnLifecycleCompleted => (
                    "Return completed",
                    $"Your return request for {orderReference} has been completed."),
                _ => (
                    "Return updated",
                    $"Your return request for {orderReference} has been updated.")
            };
        }

        private static (string Title, string Body) BuildDisputeNotificationContent(string caseType, string? orderNumber)
        {
            var orderReference = FormatOrderReference(orderNumber);

            return caseType switch
            {
                DisputeCaseTypeInr => (
                    "INR claim opened",
                    $"Your item-not-received claim for {orderReference} has been opened."),
                DisputeCaseTypeSnad => (
                    "SNAD claim opened",
                    $"Your not-as-described claim for {orderReference} has been opened."),
                DisputeCaseTypeDamaged => (
                    "Damaged item claim opened",
                    $"Your damaged-item claim for {orderReference} has been opened."),
                DisputeCaseTypeReturnEscalation => (
                    "Return escalated",
                    $"Your return for {orderReference} has been escalated into a dispute."),
                _ => (
                    "Buyer protection case opened",
                    $"Your buyer protection case for {orderReference} has been opened.")
            };
        }

        private static (string Title, string Body) BuildDisputeLifecycleNotificationContent(
            string caseType,
            string lifecycleEvent,
            string? orderNumber)
        {
            var orderReference = FormatOrderReference(orderNumber);
            var caseLabel = DescribeDisputeCase(caseType);

            return Normalize(lifecycleEvent) switch
            {
                DisputeLifecycleAcknowledged => (
                    $"{caseLabel} acknowledged",
                    $"Your {caseLabel.ToLowerInvariant()} for {orderReference} has been acknowledged."),
                DisputeLifecycleInProgress => (
                    $"{caseLabel} in progress",
                    $"Your {caseLabel.ToLowerInvariant()} for {orderReference} is now in progress."),
                DisputeLifecycleResolved => (
                    $"{caseLabel} resolved",
                    $"Your {caseLabel.ToLowerInvariant()} for {orderReference} has been resolved."),
                DisputeLifecycleClosed => (
                    $"{caseLabel} closed",
                    $"Your {caseLabel.ToLowerInvariant()} for {orderReference} has been closed."),
                _ => (
                    $"{caseLabel} updated",
                    $"Your {caseLabel.ToLowerInvariant()} for {orderReference} has been updated.")
            };
        }

        private static string DescribeDisputeCase(string caseType)
        {
            return Normalize(caseType) switch
            {
                DisputeCaseTypeInr => "INR claim",
                DisputeCaseTypeSnad => "SNAD claim",
                DisputeCaseTypeDamaged => "Damaged item claim",
                DisputeCaseTypeReturnEscalation => "Escalated return dispute",
                _ => "Buyer protection case"
            };
        }

        private static string? Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim().ToLowerInvariant();
        }
    }
}
