namespace ebay.Services.Interfaces
{
    public enum BuyerCaseType
    {
        Return,
        Inr,
        Snad,
        DisputeEscalation
    }

    public sealed class BuyerCasePolicyDecision
    {
        public bool Allowed { get; }
        public string Code { get; }
        public string Message { get; }
        public DateTime? WindowEndsAtUtc { get; }
        public DateTime? RetryAfterUtc { get; }
        public string? CurrentStatus { get; }
        public string? NextStatus { get; }

        private BuyerCasePolicyDecision(
            bool allowed,
            string code,
            string message,
            DateTime? windowEndsAtUtc = null,
            DateTime? retryAfterUtc = null,
            string? currentStatus = null,
            string? nextStatus = null)
        {
            Allowed = allowed;
            Code = code;
            Message = message;
            WindowEndsAtUtc = windowEndsAtUtc;
            RetryAfterUtc = retryAfterUtc;
            CurrentStatus = currentStatus;
            NextStatus = nextStatus;
        }

        public static BuyerCasePolicyDecision Allow(
            string code,
            string message,
            DateTime? windowEndsAtUtc = null,
            DateTime? retryAfterUtc = null,
            string? currentStatus = null,
            string? nextStatus = null)
        {
            return new BuyerCasePolicyDecision(
                true,
                code,
                message,
                windowEndsAtUtc,
                retryAfterUtc,
                currentStatus,
                nextStatus);
        }

        public static BuyerCasePolicyDecision Deny(
            string code,
            string message,
            DateTime? windowEndsAtUtc = null,
            DateTime? retryAfterUtc = null,
            string? currentStatus = null,
            string? nextStatus = null)
        {
            return new BuyerCasePolicyDecision(
                false,
                code,
                message,
                windowEndsAtUtc,
                retryAfterUtc,
                currentStatus,
                nextStatus);
        }
    }
}
