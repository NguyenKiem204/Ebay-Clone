namespace ebay.DTOs.Responses
{
    public class OrderCancellationRequestSummaryDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public string? SellerResponse { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public int? RequestedByUserId { get; set; }
        public int? ResolvedByUserId { get; set; }
    }
}
