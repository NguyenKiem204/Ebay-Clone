namespace ebay.DTOs.Responses
{
    public class SavedItemResponseDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public string ProductSlug { get; set; } = null!;
        public string? ProductImage { get; set; }
        public decimal Price { get; set; }
        public decimal ShippingFee { get; set; }
        public string? SellerName { get; set; }
        public DateTime? SavedAt { get; set; }
        public bool IsAuction { get; set; }
        public decimal? CurrentPrice { get; set; }
        public int BidCount { get; set; }
        public DateTime? AuctionEndTime { get; set; }
        public string? AuctionStatus { get; set; }
        public string UserBidStatus { get; set; } = "NONE";
    }
}
