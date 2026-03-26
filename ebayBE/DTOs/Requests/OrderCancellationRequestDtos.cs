namespace ebay.DTOs.Requests
{
    public class CreateOrderCancellationRequestDto
    {
        public string? Reason { get; set; }
    }

    public class RespondOrderCancellationRequestDto
    {
        public string? SellerResponse { get; set; }
    }
}
