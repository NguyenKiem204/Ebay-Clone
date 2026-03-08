using System.Security.Claims;
using System.Threading.Tasks;
using ebay.DTOs.Requests;
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
        [HttpPost("{productId}")]
        public async Task<IActionResult> PlaceBid(int productId, [FromBody] PlaceBidRequestDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            int bidderId = int.Parse(userIdClaim.Value);

            try
            {
                var bid = await _bidService.PlaceBidAsync(productId, bidderId, request.Amount);
                return Ok(bid);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetBids(int productId)
        {
            var bids = await _bidService.GetBidsByProductIdAsync(productId);
            return Ok(bids);
        }

        [HttpGet("{productId}/winning")]
        public async Task<IActionResult> GetWinningBid(int productId)
        {
            var bid = await _bidService.GetWinningBidAsync(productId);
            if (bid == null) return NotFound("No bids yet");
            return Ok(bid);
        }
    }
}
