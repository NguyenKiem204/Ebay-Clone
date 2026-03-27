namespace ebay.DTOs.Responses
{
    public class ReviewEligibilityResponseDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int OrderItemId { get; set; }
        public int ProductId { get; set; }
        public string ProductTitle { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public bool CanReviewProduct { get; set; }
        public string ReviewReason { get; set; } = string.Empty;
        public int? ExistingReviewId { get; set; }
        public bool CanLeaveSellerFeedback { get; set; }
        public string SellerFeedbackReason { get; set; } = string.Empty;
        public int? ExistingSellerFeedbackId { get; set; }
        public DateTime? DeliveredAt { get; set; }
    }

    public class ProductReviewSummaryResponseDto
    {
        public decimal AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, int> RatingBreakdown { get; set; } = new();
    }

    public class ProductReviewItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int OrderId { get; set; }
        public int? OrderItemId { get; set; }
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
        public string ReviewerDisplayName { get; set; } = string.Empty;
        public bool IsVerifiedPurchase { get; set; }
        public int HelpfulCount { get; set; }
        public string Status { get; set; } = "published";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsEdited { get; set; }
        public List<string> MediaUrls { get; set; } = new();
        public List<ReviewMediaItemResponseDto> MediaItems { get; set; } = new();
        public bool HasMarkedHelpful { get; set; }
        public SellerReplyResponseDto? SellerReply { get; set; }
    }

    public class ProductReviewFeedResponseDto
    {
        public ProductReviewSummaryResponseDto Summary { get; set; } = new();
        public List<ProductReviewItemResponseDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class BuyerProductReviewResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductTitle { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int OrderId { get; set; }
        public int? OrderItemId { get; set; }
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Status { get; set; } = "published";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool CanEdit { get; set; }
        public List<string> MediaUrls { get; set; } = new();
        public List<ReviewMediaItemResponseDto> MediaItems { get; set; } = new();
        public SellerReplyResponseDto? SellerReply { get; set; }
    }

    public class BuyerSellerFeedbackResponseDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int OrderItemId { get; set; }
        public int ProductId { get; set; }
        public string ProductTitle { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string Sentiment { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public string Status { get; set; } = "published";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool CanEdit { get; set; }
    }

    public class BuyerReviewDashboardResponseDto
    {
        public List<ReviewEligibilityResponseDto> PendingItems { get; set; } = new();
        public List<BuyerProductReviewResponseDto> ProductReviews { get; set; } = new();
        public List<BuyerSellerFeedbackResponseDto> SellerFeedback { get; set; } = new();
    }

    public class ReviewMediaItemResponseDto
    {
        public string Url { get; set; } = string.Empty;
        public string MediaType { get; set; } = "image";
    }

    public class SellerReplyResponseDto
    {
        public string Reply { get; set; } = string.Empty;
        public string SellerDisplayName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsEdited { get; set; }
    }

    public class SellerReviewQueueItemResponseDto
    {
        public int ReviewId { get; set; }
        public int ProductId { get; set; }
        public string ProductTitle { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public string ReviewerDisplayName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsVerifiedPurchase { get; set; }
        public int HelpfulCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ReviewMediaItemResponseDto> MediaItems { get; set; } = new();
        public SellerReplyResponseDto? SellerReply { get; set; }
        public bool CanReply { get; set; }
    }
}
