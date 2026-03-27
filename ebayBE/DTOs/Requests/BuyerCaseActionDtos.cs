namespace ebay.DTOs.Requests
{
    public class CancelBuyerCaseRequestDto
    {
        public string? Note { get; set; }
    }

    public class SubmitReturnTrackingDto
    {
        public string Carrier { get; set; } = string.Empty;

        public string TrackingNumber { get; set; } = string.Empty;

        public DateTime ShippedAt { get; set; }
    }
}
