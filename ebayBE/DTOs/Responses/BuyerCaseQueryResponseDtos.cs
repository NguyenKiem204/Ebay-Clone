namespace ebay.DTOs.Responses
{
    public class BuyerCaseListItemResponseDto
    {
        public string CaseKind { get; set; } = string.Empty;

        public int CaseId { get; set; }

        public string Type { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime? ClosedAt { get; set; }

        public BuyerCaseOrderSummaryResponseDto? Order { get; set; }

        public BuyerCaseOrderItemSummaryResponseDto? OrderItem { get; set; }

        public BuyerCaseSlaResponseDto? Sla { get; set; }

        public BuyerCaseEventResponseDto? LatestEvent { get; set; }
    }
}
