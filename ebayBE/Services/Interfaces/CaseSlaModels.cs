namespace ebay.Services.Interfaces
{
    public sealed class CaseSlaSnapshot
    {
        public string Stage { get; }

        public string StageLabel { get; }

        public DateTime? LastActivityAtUtc { get; }

        public DateTime? DueByUtc { get; }

        public bool IsOverdue { get; }

        public bool ReminderSuggested { get; }

        public int AgeHours { get; }

        public int? HoursUntilDue { get; }

        public int? HoursOverdue { get; }

        private CaseSlaSnapshot(
            string stage,
            string stageLabel,
            DateTime? lastActivityAtUtc,
            DateTime? dueByUtc,
            bool isOverdue,
            bool reminderSuggested,
            int ageHours,
            int? hoursUntilDue,
            int? hoursOverdue)
        {
            Stage = stage;
            StageLabel = stageLabel;
            LastActivityAtUtc = lastActivityAtUtc;
            DueByUtc = dueByUtc;
            IsOverdue = isOverdue;
            ReminderSuggested = reminderSuggested;
            AgeHours = ageHours;
            HoursUntilDue = hoursUntilDue;
            HoursOverdue = hoursOverdue;
        }

        public static CaseSlaSnapshot NoActive(
            int ageHours,
            DateTime? lastActivityAtUtc)
        {
            return new CaseSlaSnapshot(
                string.Empty,
                "No active SLA",
                lastActivityAtUtc,
                null,
                false,
                false,
                ageHours,
                null,
                null);
        }

        public static CaseSlaSnapshot Tracked(
            string stage,
            string stageLabel,
            DateTime? lastActivityAtUtc,
            DateTime dueByUtc,
            bool isOverdue,
            bool reminderSuggested,
            int ageHours,
            int? hoursUntilDue,
            int? hoursOverdue)
        {
            return new CaseSlaSnapshot(
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
    }
}
