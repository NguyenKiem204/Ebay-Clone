using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using Microsoft.AspNetCore.Http;

namespace ebay.Services.Interfaces
{
    public interface IReviewFeedbackService
    {
        Task<List<ReviewEligibilityResponseDto>> GetOrderReviewEligibilityAsync(int userId, int orderId);
        Task<ProductReviewItemResponseDto> CreateProductReviewAsync(int userId, CreateProductReviewRequestDto request);
        Task<ProductReviewItemResponseDto> UpdateProductReviewAsync(int userId, int reviewId, UpdateProductReviewRequestDto request);
        Task<ProductReviewFeedResponseDto> GetProductReviewsAsync(int productId, int? currentUserId, string? sortBy, int? ratingFilter, int page, int pageSize);
        Task<BuyerReviewDashboardResponseDto> GetBuyerReviewDashboardAsync(int userId);
        Task<BuyerSellerFeedbackResponseDto> CreateSellerFeedbackAsync(int userId, CreateSellerFeedbackRequestDto request);
        Task<BuyerSellerFeedbackResponseDto> UpdateSellerFeedbackAsync(int userId, int feedbackId, UpdateSellerFeedbackRequestDto request);
        Task<ProductReviewItemResponseDto> UploadReviewMediaAsync(int userId, int reviewId, IReadOnlyCollection<IFormFile> files);
        Task<ProductReviewItemResponseDto> RemoveReviewMediaAsync(int userId, int reviewId, string mediaUrl);
        Task<ProductReviewItemResponseDto> MarkReviewHelpfulAsync(int userId, int reviewId);
        Task<ProductReviewItemResponseDto> UnmarkReviewHelpfulAsync(int userId, int reviewId);
        Task ReportReviewAsync(int userId, int reviewId, ReportReviewRequestDto request);
        Task<List<SellerReviewQueueItemResponseDto>> GetSellerReviewQueueAsync(int sellerId);
        Task<ProductReviewItemResponseDto> ReplyToReviewAsync(int sellerId, int reviewId, SellerReplyRequestDto request);
    }
}
