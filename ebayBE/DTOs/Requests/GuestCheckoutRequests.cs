namespace ebay.DTOs.Requests
{
    public class GuestCheckoutEligibilityRequestDto
    {
        public List<GuestCheckoutItemRequestDto> Items { get; set; } = new();
    }

    public class CreateGuestOrderRequestDto
    {
        public string? IdempotencyKey { get; set; }
        public string GuestFullName { get; set; } = string.Empty;
        public string GuestEmail { get; set; } = string.Empty;
        public string GuestPhone { get; set; } = string.Empty;
        public GuestShippingAddressRequestDto ShippingAddress { get; set; } = new();
        public List<GuestCheckoutItemRequestDto> Items { get; set; } = new();
        public string PaymentMethod { get; set; } = "COD";
    }

    public class GuestShippingAddressRequestDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
    }

    public class GuestCheckoutItemRequestDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class GuestOrderLookupRequestDto
    {
        public string OrderNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? AccessToken { get; set; }
    }
}
