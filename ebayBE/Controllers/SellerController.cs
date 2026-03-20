using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SellerController : ControllerBase
    {
        private readonly ISellerService _sellerService;

        public SellerController(ISellerService sellerService)
        {
            _sellerService = sellerService;
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ApiResponse<SellerProfileDto>>> GetProfile(int id)
        {
            var data = await _sellerService.GetSellerProfileAsync(id);
            return Ok(new ApiResponse<SellerProfileDto>(data));
        }

        [HttpGet("{id:int}/reviews")]
        public async Task<ActionResult<ApiResponse<PagedResponseDto<SellerReviewDto>>>> GetReviews(
            int id,
            [FromQuery] int? productId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var data = await _sellerService.GetSellerReviewsAsync(id, productId, page, pageSize);
            return Ok(new ApiResponse<PagedResponseDto<SellerReviewDto>>(data));
        }
    }
}
