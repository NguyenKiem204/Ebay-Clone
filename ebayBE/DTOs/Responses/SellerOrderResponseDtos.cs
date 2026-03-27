namespace ebay.DTOs.Responses
{
    public class SellerOrderListItemResponseDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerType { get; set; } = "member";
        public string BuyerDisplayName { get; set; } = string.Empty;
        public string? BuyerEmail { get; set; }
        public DateTime CreatedAt { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? ShippingStatus { get; set; }
        public bool IsAuctionOrder { get; set; }
        public DateTime? PaymentDueAt { get; set; }
        public bool SupportsCancellationRequests { get; set; }
        public bool CanManageCancellationRequest { get; set; }
        public bool CanUpdateTracking { get; set; }
        public bool CanMarkOutForDelivery { get; set; }
        public bool CanMarkDelivered { get; set; }
        public OrderCancellationRequestSummaryDto? CancellationRequest { get; set; }
        public decimal SellerTotalAmount { get; set; }
        public int SellerItemCount { get; set; }
        public int SellerQuantityTotal { get; set; }
        public List<SellerOrderItemSummaryResponseDto> Items { get; set; } = new();
    }

    public class SellerOrderItemSummaryResponseDto
    {
        public int OrderItemId { get; set; }
        public int ProductId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Image { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class SellerOrderDetailResponseDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerType { get; set; } = "member";
        public string BuyerDisplayName { get; set; } = string.Empty;
        public string? BuyerEmail { get; set; }
        public string? BuyerPhone { get; set; }
        public DateTime CreatedAt { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? ShippingStatus { get; set; }
        public bool IsAuctionOrder { get; set; }
        public DateTime? PaymentDueAt { get; set; }
        public bool SupportsCancellationRequests { get; set; }
        public bool CanManageCancellationRequest { get; set; }
        public bool CanUpdateTracking { get; set; }
        public bool CanMarkOutForDelivery { get; set; }
        public bool CanMarkDelivered { get; set; }
        public OrderCancellationRequestSummaryDto? CancellationRequest { get; set; }
        public decimal SellerTotalAmount { get; set; }
        public int SellerItemCount { get; set; }
        public int SellerQuantityTotal { get; set; }
        public bool ContainsOtherSellerItems { get; set; }
        public int OtherSellerItemCount { get; set; }
        public decimal OrderSubtotal { get; set; }
        public decimal OrderShippingFee { get; set; }
        public decimal OrderDiscountAmount { get; set; }
        public decimal OrderTotalAmount { get; set; }
        public string? BuyerNote { get; set; }
        public AddressResponseDto? ShippingAddress { get; set; }
        public ShippingTrackingSummaryResponseDto? ShippingTracking { get; set; }
        public List<SellerOrderItemSummaryResponseDto> Items { get; set; } = new();
    }
}
