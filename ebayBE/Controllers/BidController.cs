using System.Security.Claims;
using System.Threading.Tasks;
using ebay.Attributes;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BidController : ControllerBase
    {
        private readonly IBidService _bidService;

        public BidController(IBidService bidService)
        {
            _bidService = bidService;
        }

        [Authorize]
        [RateLimit("PlaceBid", 20, 1, RateLimitPeriod.Minute)]
        [HttpPost("{productId}")]
        public async Task<ActionResult<ApiResponse<BidPlacementResponseDto>>> PlaceBid(int productId, [FromBody] PlaceBidRequestDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            int bidderId = int.Parse(userIdClaim.Value);
            var result = await _bidService.PlaceBidAsync(productId, bidderId, request.Amount);
            return Ok(ApiResponse<BidPlacementResponseDto>.SuccessResponse(result, "Đặt bid thành công"));
        }

        [HttpGet("{productId}")]
        public async Task<ActionResult<ApiResponse<List<BidResponseDto>>>> GetBids(int productId)
        {
            var bids = await _bidService.GetBidsByProductIdAsync(productId);
            return Ok(ApiResponse<List<BidResponseDto>>.SuccessResponse(bids));
        }

        [HttpGet("{productId}/winning")]
        public async Task<ActionResult<ApiResponse<BidResponseDto?>>> GetWinningBid(int productId)
        {
            var bid = await _bidService.GetWinningBidAsync(productId);
            if (bid == null) return Ok(ApiResponse<BidResponseDto?>.SuccessResponse(null, "Chưa có bid thắng"));
            return Ok(ApiResponse<BidResponseDto?>.SuccessResponse(bid));
        }

        [AllowAnonymous]
        [HttpGet("{productId}/state")]
        public async Task<ActionResult<ApiResponse<AuctionStateResponseDto>>> GetAuctionState(int productId)
        {
            int? currentUserId = null;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsedUserId))
            {
                currentUserId = parsedUserId;
            }

            var data = await _bidService.GetAuctionStateAsync(productId, currentUserId);
            return Ok(ApiResponse<AuctionStateResponseDto>.SuccessResponse(data));
        }
    }
}
