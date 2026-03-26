using ebay.Models;
using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class CaseSlaService : ICaseSlaService
    {
        private const string ReturnStatusPending = "pending";
        private const string ReturnStatusApproved = "approved";
        private const string ReturnStatusRejected = "rejected";
        private const string ReturnStatusCompleted = "completed";

        private const string DisputeStatusOpen = "open";
        private const string DisputeStatusInProgress = "in_progress";
        private const string DisputeStatusResolved = "resolved";
        private const string DisputeStatusClosed = "closed";

        private static readonly TimeSpan ReturnPendingResponseWindow = TimeSpan.FromDays(3);
        private static readonly TimeSpan ReturnApprovedCompletionWindow = TimeSpan.FromDays(7);
        private static readonly TimeSpan DisputeOpenResponseWindow = TimeSpan.FromDays(2);
        private static readonly TimeSpan DisputeInProgressResolutionWindow = TimeSpan.FromDays(5);
        private static readonly TimeSpan DisputeResolvedClosureWindow = TimeSpan.FromDays(3);
        private static readonly TimeSpan ReminderLeadWindow = TimeSpan.FromHours(24);

        public CaseSlaSnapshot EvaluateReturn(ReturnRequest returnRequest, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var createdAt = ResolveCreatedAt(returnRequest.CreatedAt, returnRequest.UpdatedAt, now);
            var lastActivityAt = ResolveLastActivityAt(returnRequest.UpdatedAt, returnRequest.CreatedAt, createdAt);
            var ageHours = ComputeAgeHours(createdAt, now);

            return Normalize(returnRequest.Status) switch
            {
                ReturnStatusPending => BuildTrackedSnapshot(
                    "seller_response",
                    "Seller response due",
                    createdAt,
                    lastActivityAt,
                    ReturnPendingResponseWindow,
                    ageHours,
                    now),
                ReturnStatusApproved => BuildTrackedSnapshot(
                    "return_completion",
                    "Return completion due",
                    returnRequest.ApprovedAt ?? lastActivityAt,
                    lastActivityAt,
                    ReturnApprovedCompletionWindow,
                    ageHours,
                    now),
                ReturnStatusRejected or ReturnStatusCompleted => CaseSlaSnapshot.NoActive(ageHours, lastActivityAt),
                _ => BuildTrackedSnapshot(
                    "seller_response",
                    "Seller response due",
                    createdAt,
                    lastActivityAt,
                    ReturnPendingResponseWindow,
                    ageHours,
                    now)
            };
        }

        public CaseSlaSnapshot EvaluateDispute(Dispute dispute, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var createdAt = ResolveCreatedAt(dispute.CreatedAt, dispute.UpdatedAt, now);
            var lastActivityAt = ResolveLastActivityAt(dispute.UpdatedAt, dispute.CreatedAt, createdAt);
            var ageHours = ComputeAgeHours(createdAt, now);

            return Normalize(dispute.Status) switch
            {
                DisputeStatusOpen => BuildTrackedSnapshot(
                    "first_response",
                    "First response due",
                    createdAt,
                    lastActivityAt,
                    DisputeOpenResponseWindow,
                    ageHours,
                    now),
                DisputeStatusInProgress => BuildTrackedSnapshot(
                    "resolution",
                    "Resolution due",
                    lastActivityAt,
                    lastActivityAt,
                    DisputeInProgressResolutionWindow,
                    ageHours,
                    now),
                DisputeStatusResolved => BuildTrackedSnapshot(
                    "closure",
                    "Closure due",
                    dispute.ResolvedAt ?? lastActivityAt,
                    lastActivityAt,
                    DisputeResolvedClosureWindow,
                    ageHours,
                    now),
                DisputeStatusClosed => CaseSlaSnapshot.NoActive(ageHours, lastActivityAt),
                _ => BuildTrackedSnapshot(
                    "first_response",
                    "First response due",
                    createdAt,
                    lastActivityAt,
                    DisputeOpenResponseWindow,
                    ageHours,
                    now)
            };
        }

        private static CaseSlaSnapshot BuildTrackedSnapshot(
            DateTime baseTimestampUtc,
            DateTime lastActivityAtUtc,
            TimeSpan window,
            int ageHours,
            DateTime nowUtc)
        {
            return BuildTrackedSnapshot(
                string.Empty,
                string.Empty,
                baseTimestampUtc,
                lastActivityAtUtc,
                window,
                ageHours,
                nowUtc);
        }

        private static CaseSlaSnapshot BuildTrackedSnapshot(
            string stage,
            string stageLabel,
            DateTime baseTimestampUtc,
            DateTime lastActivityAtUtc,
            TimeSpan window,
            int ageHours,
            DateTime nowUtc)
        {
            var dueByUtc = baseTimestampUtc.Add(window);
            var remaining = dueByUtc - nowUtc;
            var isOverdue = remaining < TimeSpan.Zero;
            int? hoursUntilDue = isOverdue
                ? null
                : Math.Max(0, (int)Math.Ceiling(remaining.TotalHours));
            int? hoursOverdue = isOverdue
                ? Math.Max(1, (int)Math.Ceiling(Math.Abs(remaining.TotalHours)))
                : null;
            var reminderSuggested = isOverdue || remaining <= ReminderLeadWindow;

            return CaseSlaSnapshot.Tracked(
                stage,
                stageLabel,
                lastActivityAtUtc,
                dueByUtc,
                isOverdue,
                reminderSuggested,
                ageHours,
                hoursUntilDue,
                hoursOverdue);
        }

        private static DateTime ResolveCreatedAt(DateTime? createdAtUtc, DateTime? updatedAtUtc, DateTime nowUtc)
        {
            return createdAtUtc ?? updatedAtUtc ?? nowUtc;
        }

        private static DateTime ResolveLastActivityAt(DateTime? updatedAtUtc, DateTime? createdAtUtc, DateTime fallbackUtc)
        {
            return updatedAtUtc ?? createdAtUtc ?? fallbackUtc;
        }

        private static int ComputeAgeHours(DateTime createdAtUtc, DateTime nowUtc)
        {
            if (nowUtc <= createdAtUtc)
            {
                return 0;
            }

            return Math.Max(0, (int)Math.Floor((nowUtc - createdAtUtc).TotalHours));
        }

        private static string Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }
    }
}
