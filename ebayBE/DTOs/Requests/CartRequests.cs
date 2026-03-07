namespace ebay.DTOs.Requests
{
    public class AddToCartRequestDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemRequestDto
    {
        public int Quantity { get; set; }
    }
}
