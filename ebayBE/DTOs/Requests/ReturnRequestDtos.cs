namespace ebay.DTOs.Requests
{
    public class CreateReturnRequestDto
    {
        public int OrderId { get; set; }

        public int? OrderItemId { get; set; }

        public string? ReasonCode { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string ResolutionType { get; set; } = "refund";
    }
}
