using System;
using System.Collections.Generic;

namespace ebay.DTOs.Responses
{
    public class SellerProfileDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public decimal PositivePercent { get; set; }
        public int TotalReviews { get; set; }
        public int ItemsSold { get; set; }
        public string JoinedDate { get; set; } = null!;
        public string? StoreName { get; set; }
        public string? StoreSlug { get; set; }
        public SellerDetailedRatingsDto DetailedRatings { get; set; } = new();
    }

    public class SellerDetailedRatingsDto
    {
        public decimal AccurateDescription { get; set; }
        public decimal ReasonableShippingCost { get; set; }
        public decimal ShippingSpeed { get; set; }
        public decimal Communication { get; set; }
    }

    public class SellerReviewDto
    {
        public int Id { get; set; }
        public string ReviewerName { get; set; } = null!;
        public int ReviewerTotalReviews { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? Title { get; set; }
        public string TimeAgo { get; set; } = null!;
        public bool IsVerifiedPurchase { get; set; }
        public string? ProductTitle { get; set; }
        public int ProductId { get; set; }
    }
}
