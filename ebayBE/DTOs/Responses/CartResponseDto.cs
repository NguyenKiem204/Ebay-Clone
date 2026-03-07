namespace ebay.DTOs.Responses
{
    public class CartItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public string ProductSlug { get; set; } = null!;
        public string? ProductImage { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public int Stock { get; set; }
        public decimal TotalPrice => UnitPrice * Quantity;
        public decimal ShippingFee { get; set; }
    }

    public class CartResponseDto
    {
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal TotalShipping { get; set; }
        public decimal Total => Subtotal + TotalShipping;
        public int TotalItems { get; set; }
    }
}
