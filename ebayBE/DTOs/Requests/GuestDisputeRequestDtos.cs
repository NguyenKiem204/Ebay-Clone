namespace ebay.DTOs.Requests
{
    public class CreateGuestInrClaimDto
    {
        public string OrderNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? AccessToken { get; set; }

        public int? OrderItemId { get; set; }

        public string Description { get; set; } = string.Empty;
    }

    public class CreateGuestQualityIssueClaimDto
    {
        public string OrderNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? AccessToken { get; set; }

        public int? OrderItemId { get; set; }

        public string CaseType { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}
