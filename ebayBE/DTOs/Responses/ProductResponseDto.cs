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
        public int SellerId { get; set; }
        public decimal? Rating { get; set; } 
        public int ReviewCount { get; set; }
        public int SavedCount { get; set; }
        public int InCartCount { get; set; }
        public bool IsAuction { get; set; }
        public DateTime? AuctionEndTime { get; set; }
        public decimal? CurrentBid { get; set; }
        public int BidCount { get; set; }
        public int SoldCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class BannerResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string? CtaText { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public string? BgColor { get; set; }
        public string? TextColor { get; set; }
        public string Type { get; set; } = "single";
        public List<BannerItemDto>? Items { get; set; }
    }

    public class BannerItemDto
    {
        public string Title { get; set; } = null!;
        public string Image { get; set; } = null!;
        public string Link { get; set; } = null!;
    }

    public class LandingPageResponseDto
    {
        public List<BannerResponseDto> Banners { get; set; } = new();
        public List<ProductResponseDto> LatestProducts { get; set; } = new();
        public List<ProductResponseDto> BestDeals { get; set; } = new();
        public List<ProductResponseDto> TrendingProducts { get; set; } = new();
    }
}
