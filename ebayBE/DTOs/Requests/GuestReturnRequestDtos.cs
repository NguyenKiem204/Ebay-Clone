namespace ebay.DTOs.Requests
{
    public class CreateGuestReturnRequestDto
    {
        public string OrderNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? AccessToken { get; set; }

        public int? OrderItemId { get; set; }

        public string? ReasonCode { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string ResolutionType { get; set; } = "refund";
    }
}
