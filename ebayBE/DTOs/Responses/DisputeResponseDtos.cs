namespace ebay.DTOs.Responses
{
    public class DisputeResponseDto
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public int? OrderItemId { get; set; }

        public string CaseType { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string? Resolution { get; set; }

        public int? EscalatedFromReturnRequestId { get; set; }

        public string? ClosedReason { get; set; }

        public DateTime? ResolvedAt { get; set; }

        public DateTime? ClosedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public BuyerCaseOrderSummaryResponseDto? Order { get; set; }

        public BuyerCaseOrderItemSummaryResponseDto? OrderItem { get; set; }

        public BuyerCaseSlaResponseDto? Sla { get; set; }

        public List<BuyerCaseEvidenceResponseDto> Evidence { get; set; } = new();

        public List<BuyerCaseEventResponseDto> Timeline { get; set; } = new();
    }
}
