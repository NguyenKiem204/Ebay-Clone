namespace ebay.DTOs.Responses
{
    public class ReturnRequestResponseDto
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public int? OrderItemId { get; set; }

        public string RequestType { get; set; } = string.Empty;

        public string? ReasonCode { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string ResolutionType { get; set; } = string.Empty;

        public string? RequestedResolution { get; set; }

        public string Status { get; set; } = string.Empty;

        public string DisplayStatus { get; set; } = string.Empty;

        public string? NextAction { get; set; }

        public bool CanCancel { get; set; }

        public bool CanSubmitTracking { get; set; }

        public decimal? RefundAmount { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public DateTime? RejectedAt { get; set; }

        public DateTime? ClosedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public BuyerCaseOrderSummaryResponseDto? Order { get; set; }

        public BuyerCaseOrderItemSummaryResponseDto? OrderItem { get; set; }

        public BuyerCaseSlaResponseDto? Sla { get; set; }

        public BuyerCaseTrackingResponseDto? ReturnTracking { get; set; }

        public BuyerCaseRefundSummaryResponseDto? RefundSummary { get; set; }

        public List<BuyerCaseEvidenceResponseDto> Evidence { get; set; } = new();

        public List<BuyerCaseEventResponseDto> Timeline { get; set; } = new();
    }
}
