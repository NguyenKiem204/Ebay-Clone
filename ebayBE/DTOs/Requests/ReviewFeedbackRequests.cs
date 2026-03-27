namespace ebay.DTOs.Requests
{
    public class CreateProductReviewRequestDto
    {
        public int OrderItemId { get; set; }
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class UpdateProductReviewRequestDto
    {
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class ReportReviewRequestDto
    {
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
    }

    public class SellerReplyRequestDto
    {
        public string Reply { get; set; } = string.Empty;
    }

    public class CreateSellerFeedbackRequestDto
    {
        public int OrderItemId { get; set; }
        public string Sentiment { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
    }

    public class UpdateSellerFeedbackRequestDto
    {
        public string Sentiment { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
    }
}
