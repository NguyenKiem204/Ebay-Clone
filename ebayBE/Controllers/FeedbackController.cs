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
    [Authorize]
    public class FeedbackController : ControllerBase
    {
        private readonly IReviewFeedbackService _reviewFeedbackService;

        public FeedbackController(IReviewFeedbackService reviewFeedbackService)
        {
            _reviewFeedbackService = reviewFeedbackService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<ActionResult<ApiResponse<BuyerSellerFeedbackResponseDto>>> CreateFeedback([FromBody] CreateSellerFeedbackRequestDto request)
        {
            var data = await _reviewFeedbackService.CreateSellerFeedbackAsync(GetUserId(), request);
            return Ok(ApiResponse<BuyerSellerFeedbackResponseDto>.SuccessResponse(data, "Seller feedback submitted successfully."));
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ApiResponse<BuyerSellerFeedbackResponseDto>>> UpdateFeedback(int id, [FromBody] UpdateSellerFeedbackRequestDto request)
        {
            var data = await _reviewFeedbackService.UpdateSellerFeedbackAsync(GetUserId(), id, request);
            return Ok(ApiResponse<BuyerSellerFeedbackResponseDto>.SuccessResponse(data, "Seller feedback updated successfully."));
        }
    }
}
