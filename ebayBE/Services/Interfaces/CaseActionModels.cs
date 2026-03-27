namespace ebay.Services.Interfaces
{
    public sealed class CaseActionActorContext
    {
        public int? UserId { get; }
        public string Role { get; }

        public CaseActionActorContext(int? userId, string? role)
        {
            UserId = userId;
            Role = string.IsNullOrWhiteSpace(role)
                ? string.Empty
                : role.Trim().ToLowerInvariant();
        }
    }

    public sealed class CaseActionDecision
    {
        public bool Allowed { get; }
        public string Code { get; }
        public string Message { get; }
        public string ActorType { get; }
        public string OwnershipMode { get; }
        public int? ActorUserId { get; }
        public int? OwnerSellerId { get; }
        public string? CurrentStatus { get; }
        public string? NextStatus { get; }
        public string EventType { get; }

        private CaseActionDecision(
            bool allowed,
            string code,
            string message,
            string actorType,
            string ownershipMode,
            int? actorUserId = null,
            int? ownerSellerId = null,
            string? currentStatus = null,
            string? nextStatus = null,
            string? eventType = null)
        {
            Allowed = allowed;
            Code = code;
            Message = message;
            ActorType = actorType;
            OwnershipMode = ownershipMode;
            ActorUserId = actorUserId;
            OwnerSellerId = ownerSellerId;
            CurrentStatus = currentStatus;
            NextStatus = nextStatus;
            EventType = eventType ?? "status_changed";
        }

        public static CaseActionDecision Allow(
            string code,
            string message,
            string actorType,
            string ownershipMode,
            int? actorUserId = null,
            int? ownerSellerId = null,
            string? currentStatus = null,
            string? nextStatus = null,
            string? eventType = null)
        {
            return new CaseActionDecision(
                true,
                code,
                message,
                actorType,
                ownershipMode,
                actorUserId,
                ownerSellerId,
                currentStatus,
                nextStatus,
                eventType);
        }

        public static CaseActionDecision Deny(
            string code,
            string message,
            string actorType,
            string ownershipMode,
            int? actorUserId = null,
            int? ownerSellerId = null,
            string? currentStatus = null,
            string? nextStatus = null,
            string? eventType = null)
        {
            return new CaseActionDecision(
                false,
                code,
                message,
                actorType,
                ownershipMode,
                actorUserId,
                ownerSellerId,
                currentStatus,
                nextStatus,
                eventType);
        }
    }
}
