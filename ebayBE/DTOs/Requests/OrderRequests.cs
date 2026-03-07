namespace ebay.DTOs.Requests
{
    public class CreateOrderRequestDto
    {
        public int AddressId { get; set; }
        public string PaymentMethod { get; set; } = "COD"; // COD, PayPal
        public string? CouponCode { get; set; }
        public string? Note { get; set; }
        public List<int>? SelectedCartItemIds { get; set; } // If null, checkout all
    }
}

namespace ebay.DTOs.Responses
{
    public class OrderResponseDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = null!;
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public AddressResponseDto ShippingAddress { get; set; } = null!;
        public List<OrderItemResponseDto> Items { get; set; } = new();
    }

    public class OrderItemResponseDto
    {
        public int ProductId { get; set; }
        public string Title { get; set; } = null!;
        public string? Image { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice => Price * Quantity;
    }
}
