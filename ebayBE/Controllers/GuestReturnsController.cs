using ebay.Attributes;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/guest/returns")]
    public class GuestReturnsController : ControllerBase
    {
        private readonly IGuestReturnRequestService _guestReturnRequestService;

        public GuestReturnsController(IGuestReturnRequestService guestReturnRequestService)
        {
            _guestReturnRequestService = guestReturnRequestService;
        }

        [AllowAnonymous]
        [RateLimit("GuestReturnCreate", 5, 15, RateLimitPeriod.Minute)]
        [HttpPost]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> Create(
            [FromBody] CreateGuestReturnRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestReturnRequestService.CreateGuestReturnRequestAsync(request, cancellationToken);
            return StatusCode(
                201,
                ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Guest return request created successfully."));
        }
    }
}
