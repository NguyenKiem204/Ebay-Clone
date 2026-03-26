namespace ebay.DTOs.Requests
{
    public class CreateOrderRequestDto
    {
        public int AddressId { get; set; }
        public string PaymentMethod { get; set; } = "COD"; // COD, PayPal
        public string? CouponCode { get; set; }
        public string? Note { get; set; }
        public List<int>? SelectedCartItemIds { get; set; } // If null, checkout all

        // Buy It Now direct properties
        public int? BuyItNowProductId { get; set; }
        public int? BuyItNowQuantity { get; set; }
    }
}

namespace ebay.DTOs.Responses
{
    public class MemberCheckoutReviewResponseDto
    {
        public int AddressId { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public AddressResponseDto ShippingAddress { get; set; } = null!;
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal TotalAmount { get; set; }
        public List<MemberCheckoutReviewItemResponseDto> Items { get; set; } = new();
    }

    public class MemberCheckoutReviewItemResponseDto
    {
        public int ProductId { get; set; }
        public string Title { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineSubtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal LineTotal { get; set; }
    }

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
        public bool IsAuctionOrder { get; set; }
        public DateTime? PaymentDueAt { get; set; }
        public bool IsPaymentOverdue { get; set; }
        public bool CanRequestCancellation { get; set; }
        public OrderCancellationRequestSummaryDto? CancellationRequest { get; set; }
        public DateTime CreatedAt { get; set; }
        public AddressResponseDto ShippingAddress { get; set; } = null!;
        public ShippingTrackingSummaryResponseDto? ShippingTracking { get; set; }
        public List<OrderItemResponseDto> Items { get; set; } = new();
    }

    public class ShippingTrackingSummaryResponseDto
    {
        public string? Status { get; set; }
        public string? Carrier { get; set; }
        public string? TrackingNumber { get; set; }
        public DateTime? ShippedAt { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public DateTime? DeliveredAt { get; set; }
    }

    public class OrderItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Title { get; set; } = null!;
        public string? Image { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice => Price * Quantity;
    }
}
