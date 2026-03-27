using System.Security.Claims;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewFeedbackService _reviewFeedbackService;

        public ReviewsController(IReviewFeedbackService reviewFeedbackService)
        {
            _reviewFeedbackService = reviewFeedbackService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private int? GetOptionalUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var userId) ? userId : null;
        }

        [HttpGet("product/{productId:int}")]
        public async Task<ActionResult<ApiResponse<ProductReviewFeedResponseDto>>> GetProductReviews(
            int productId,
            [FromQuery] string? sortBy = null,
            [FromQuery] int? rating = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var data = await _reviewFeedbackService.GetProductReviewsAsync(productId, GetOptionalUserId(), sortBy, rating, page, pageSize);
            return Ok(new ApiResponse<ProductReviewFeedResponseDto>(data));
        }

        [HttpGet("seller/received")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<List<SellerReviewQueueItemResponseDto>>>> GetSellerReviewQueue()
        {
            var data = await _reviewFeedbackService.GetSellerReviewQueueAsync(GetUserId());
            return Ok(new ApiResponse<List<SellerReviewQueueItemResponseDto>>(data));
        }

        [HttpGet("order/{orderId:int}/eligibility")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<List<ReviewEligibilityResponseDto>>>> GetOrderEligibility(int orderId)
        {
            var data = await _reviewFeedbackService.GetOrderReviewEligibilityAsync(GetUserId(), orderId);
            return Ok(new ApiResponse<List<ReviewEligibilityResponseDto>>(data));
        }

        [HttpGet("me/dashboard")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<BuyerReviewDashboardResponseDto>>> GetBuyerDashboard()
        {
            var data = await _reviewFeedbackService.GetBuyerReviewDashboardAsync(GetUserId());
            return Ok(new ApiResponse<BuyerReviewDashboardResponseDto>(data));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProductReviewItemResponseDto>>> CreateProductReview([FromBody] CreateProductReviewRequestDto request)
        {
            var data = await _reviewFeedbackService.CreateProductReviewAsync(GetUserId(), request);
            return Ok(ApiResponse<ProductReviewItemResponseDto>.SuccessResponse(data, "Review submitted successfully."));
        }

        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProductReviewItemResponseDto>>> UpdateProductReview(int id, [FromBody] UpdateProductReviewRequestDto request)
        {
            var data = await _reviewFeedbackService.UpdateProductReviewAsync(GetUserId(), id, request);
            return Ok(ApiResponse<ProductReviewItemResponseDto>.SuccessResponse(data, "Review updated successfully."));
        }

        [HttpPost("{id:int}/media")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProductReviewItemResponseDto>>> UploadReviewMedia(int id, [FromForm] List<IFormFile> files)
        {
            var data = await _reviewFeedbackService.UploadReviewMediaAsync(GetUserId(), id, files);
            return Ok(ApiResponse<ProductReviewItemResponseDto>.SuccessResponse(data, "Review media uploaded successfully."));
        }

        [HttpDelete("{id:int}/media")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProductReviewItemResponseDto>>> RemoveReviewMedia(int id, [FromQuery] string mediaUrl)
        {
            var data = await _reviewFeedbackService.RemoveReviewMediaAsync(GetUserId(), id, mediaUrl);
            return Ok(ApiResponse<ProductReviewItemResponseDto>.SuccessResponse(data, "Review media removed successfully."));
        }

        [HttpPost("{id:int}/helpful")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProductReviewItemResponseDto>>> MarkHelpful(int id)
        {
            var data = await _reviewFeedbackService.MarkReviewHelpfulAsync(GetUserId(), id);
            return Ok(ApiResponse<ProductReviewItemResponseDto>.SuccessResponse(data, "Review marked as helpful."));
        }

        [HttpDelete("{id:int}/helpful")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProductReviewItemResponseDto>>> UnmarkHelpful(int id)
        {
            var data = await _reviewFeedbackService.UnmarkReviewHelpfulAsync(GetUserId(), id);
            return Ok(ApiResponse<ProductReviewItemResponseDto>.SuccessResponse(data, "Helpful vote removed."));
        }

        [HttpPost("{id:int}/report")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> ReportReview(int id, [FromBody] ReportReviewRequestDto request)
        {
            await _reviewFeedbackService.ReportReviewAsync(GetUserId(), id, request);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Review report submitted successfully."));
        }

        [HttpPost("{id:int}/seller-reply")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProductReviewItemResponseDto>>> ReplyToReview(int id, [FromBody] SellerReplyRequestDto request)
        {
            var data = await _reviewFeedbackService.ReplyToReviewAsync(GetUserId(), id, request);
            return Ok(ApiResponse<ProductReviewItemResponseDto>.SuccessResponse(data, "Seller reply saved successfully."));
        }
    }
}
