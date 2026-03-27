namespace ebay.DTOs.Requests
{
    public class CreateGuestInrClaimDto
    {
        public string OrderNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? AccessToken { get; set; }

        public int? OrderItemId { get; set; }

        public string? ReasonCode { get; set; }

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

    public class GuestCaseActionAccessDto
    {
        public string OrderNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? AccessToken { get; set; }
    }

    public class CancelGuestCaseRequestDto : GuestCaseActionAccessDto
    {
        public string? Note { get; set; }
    }

    public class SubmitGuestReturnTrackingDto : GuestCaseActionAccessDto
    {
        public string Carrier { get; set; } = string.Empty;

        public string TrackingNumber { get; set; } = string.Empty;

        public DateTime ShippedAt { get; set; }
    }

    public class EscalateGuestInrClaimDto : GuestCaseActionAccessDto
    {
        public string Description { get; set; } = string.Empty;
    }
}
