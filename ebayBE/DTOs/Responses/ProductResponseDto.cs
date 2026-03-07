using System;
using System.Collections.Generic;

namespace ebay.DTOs.Responses
{
    public class ProductResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public string? Thumbnail { get; set; }
        public string Condition { get; set; } = null!;
        public string Status { get; set; } = null!;
        public int Stock { get; set; }
        public decimal ShippingFee { get; set; }
        public int ViewCount { get; set; }
        public string CategoryName { get; set; } = null!;
        public int CategoryId { get; set; }
        public string SellerName { get; set; } = null!;
        public decimal? Rating { get; set; } // TODO: Implement review rating
        public int ReviewCount { get; set; }
        public bool IsAuction { get; set; }
        public DateTime? AuctionEndTime { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LandingPageResponseDto
    {
        public List<ProductResponseDto> LatestProducts { get; set; } = new();
        public List<ProductResponseDto> BestDeals { get; set; } = new();
        public List<ProductResponseDto> TrendingProducts { get; set; } = new();
    }
}
