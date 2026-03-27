namespace ebay.DTOs.Responses
{
    public class GuestCheckoutEligibilityResponseDto
    {
        public bool Eligible { get; set; }
        public bool GuestPhase1Eligible { get; set; }
        public List<string> Reasons { get; set; } = new();
        public List<GuestCheckoutIssueResponseDto> Issues { get; set; } = new();
        public List<GuestCheckoutNormalizedItemResponseDto> NormalizedItems { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal TotalAmount { get; set; }
        public List<string> AllowedPaymentMethods { get; set; } = new() { "COD" };
    }

    public class GuestCheckoutIssueResponseDto
    {
        public int? ProductId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class GuestCheckoutNormalizedItemResponseDto
    {
        public int ProductId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int SellerId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineSubtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal LineTotal { get; set; }
        public int AvailableStock { get; set; }
        public bool IsAuction { get; set; }
    }

    public class CreateGuestOrderResponseDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public GuestCheckoutTotalsResponseDto Totals { get; set; } = new();
        public GuestOrderShippingSummaryResponseDto ShippingAddress { get; set; } = new();
    }

    public class GuestCheckoutTotalsResponseDto
    {
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class GuestOrderShippingSummaryResponseDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
    }

    public class GuestOrderLookupResponseDto
    {
        public bool Found { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public GuestCheckoutTotalsResponseDto Totals { get; set; } = new();
        public GuestOrderShippingSummaryResponseDto ShippingAddress { get; set; } = new();
        public List<GuestOrderLookupItemResponseDto> Items { get; set; } = new();
        public OrderAfterSalesSummaryResponseDto? AfterSales { get; set; }
        public GuestAfterSalesAccessResponseDto? AfterSalesAccess { get; set; }

        public static GuestOrderLookupResponseDto NotFound()
        {
            return new GuestOrderLookupResponseDto
            {
                Found = false
            };
        }
    }

    public class GuestAfterSalesAccessResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string ProofMethod { get; set; } = string.Empty;
    }

    public class GuestOrderLookupItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Image { get; set; }
        public string SellerDisplayName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
