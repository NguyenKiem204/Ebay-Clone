using ebay.Attributes;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/guest/disputes")]
    public class GuestDisputesController : ControllerBase
    {
        private readonly IGuestDisputeService _guestDisputeService;

        public GuestDisputesController(IGuestDisputeService guestDisputeService)
        {
            _guestDisputeService = guestDisputeService;
        }

        [AllowAnonymous]
        [RateLimit("GuestInrCreate", 5, 15, RateLimitPeriod.Minute)]
        [HttpPost("inr")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> CreateInr(
            [FromBody] CreateGuestInrClaimDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestDisputeService.CreateGuestInrClaimAsync(request, cancellationToken);
            return StatusCode(
                201,
                ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Guest INR claim created successfully."));
        }

        [AllowAnonymous]
        [RateLimit("GuestQualityIssueCreate", 5, 15, RateLimitPeriod.Minute)]
        [HttpPost("quality-issue")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> CreateQualityIssue(
            [FromBody] CreateGuestQualityIssueClaimDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestDisputeService.CreateGuestQualityIssueClaimAsync(request, cancellationToken);
            return StatusCode(
                201,
                ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Guest quality issue claim created successfully."));
        }
    }
}
