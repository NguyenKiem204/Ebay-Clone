namespace ebay.Services.Interfaces
{
    public sealed class GuestAfterSalesAccessRequest
    {
        public string OrderNumber { get; init; } = string.Empty;

        public string Email { get; init; } = string.Empty;

        public string? AccessToken { get; init; }
    }

    public sealed class GuestAfterSalesAccessGrant
    {
        public string AccessToken { get; init; } = string.Empty;

        public DateTime ExpiresAtUtc { get; init; }

        public string ProofMethod { get; init; } = string.Empty;
    }

    public sealed class GuestAfterSalesAccessDecision
    {
        public bool Allowed { get; init; }

        public string Code { get; init; } = string.Empty;

        public string Message { get; init; } = string.Empty;

        public int? OrderId { get; init; }

        public string OrderNumber { get; init; } = string.Empty;

        public bool UsedAccessToken { get; init; }

        public GuestAfterSalesAccessGrant? Grant { get; init; }

        public static GuestAfterSalesAccessDecision Allow(
            string code,
            string message,
            int orderId,
            string orderNumber,
            bool usedAccessToken,
            GuestAfterSalesAccessGrant grant)
        {
            return new GuestAfterSalesAccessDecision
            {
                Allowed = true,
                Code = code,
                Message = message,
                OrderId = orderId,
                OrderNumber = orderNumber,
                UsedAccessToken = usedAccessToken,
                Grant = grant
            };
        }

        public static GuestAfterSalesAccessDecision Deny(string code, string message)
        {
            return new GuestAfterSalesAccessDecision
            {
                Allowed = false,
                Code = code,
                Message = message
            };
        }
    }
}
