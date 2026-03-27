namespace ebay.DTOs.Responses
{
    public class OrderAfterSalesSummaryResponseDto
    {
        public bool HasOpenRequest { get; set; }

        public List<AfterSalesOptionResponseDto> Options { get; set; } = new();
    }

    public class AfterSalesOptionResponseDto
    {
        public string RequestType { get; set; } = string.Empty;

        public string Label { get; set; } = string.Empty;

        public bool Eligible { get; set; }

        public string Code { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public DateTime? EligibleFrom { get; set; }

        public DateTime? WindowEndsAt { get; set; }
    }

    public class BuyerCaseTrackingResponseDto
    {
        public string Carrier { get; set; } = string.Empty;

        public string TrackingNumber { get; set; } = string.Empty;

        public DateTime? ShippedAt { get; set; }

        public DateTime? ReceivedAt { get; set; }
    }

    public class BuyerCaseRefundSummaryResponseDto
    {
        public decimal Amount { get; set; }

        public string Method { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime? ProcessedAt { get; set; }
    }
}
