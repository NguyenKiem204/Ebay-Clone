using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/auctions")]
    public class AuctionsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IBidService _bidService;

        public AuctionsController(IProductService productService, IBidService bidService)
        {
            _productService = productService;
            _bidService = bidService;
        }

        [AllowAnonymous]
        [HttpGet("active")]
        public async Task<ActionResult<ApiResponse<List<ProductResponseDto>>>> GetActive([FromQuery] int limit = 4)
        {
            var data = await _productService.GetActiveAuctionsAsync(limit);
            return Ok(ApiResponse<List<ProductResponseDto>>.SuccessResponse(data));
        }

        [Authorize]
        [HttpGet("my")]
        public async Task<ActionResult<ApiResponse<PagedResponseDto<MyAuctionItemResponseDto>>>> GetMyAuctions(
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            var bidderId = int.Parse(userIdClaim.Value);
            var data = await _bidService.GetMyAuctionsAsync(bidderId, status, page, pageSize);
            return Ok(ApiResponse<PagedResponseDto<MyAuctionItemResponseDto>>.SuccessResponse(data));
        }
    }
}
