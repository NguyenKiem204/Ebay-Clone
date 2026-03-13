using Microsoft.AspNetCore.Http;

namespace ebay.DTOs.Requests
{
    public class CreateProductRequest
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int? CategoryId { get; set; }
        public string? Condition { get; set; } // New, Used - Like New, Used - Good
        public string? Brand { get; set; }
        public int Stock { get; set; } = 1;
        public decimal ShippingFee { get; set; } = 0;
        public decimal? OriginalPrice { get; set; }
        public bool IsAuction { get; set; } = false;
        public decimal? StartingBid { get; set; }
        public int? AuctionDurationDays { get; set; } // 3, 5, 7, 10, 30
        public decimal? Weight { get; set; }
        public string? Dimensions { get; set; }
        public List<IFormFile>? Images { get; set; }
    }
}
