using ebay.Attributes;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/guest/cases")]
    public class GuestCasesController : ControllerBase
    {
        private readonly IGuestCaseQueryService _guestCaseQueryService;

        public GuestCasesController(IGuestCaseQueryService guestCaseQueryService)
        {
            _guestCaseQueryService = guestCaseQueryService;
        }

        [AllowAnonymous]
        [RateLimit("GuestCaseList", 10, 1, RateLimitPeriod.Minute)]
        [HttpPost]
        public async Task<ActionResult<ApiResponse<GuestCaseListResponseDto>>> GetCases(
            [FromBody] GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCaseQueryService.GetGuestCasesAsync(request, cancellationToken);
            return Ok(ApiResponse<GuestCaseListResponseDto>.SuccessResponse(data, "Guest cases retrieved successfully."));
        }

        [AllowAnonymous]
        [RateLimit("GuestCaseDetail", 15, 1, RateLimitPeriod.Minute)]
        [HttpPost("returns/{id:int}")]
        public async Task<ActionResult<ApiResponse<GuestReturnCaseDetailResponseDto>>> GetReturnRequest(
            int id,
            [FromBody] GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCaseQueryService.GetGuestReturnRequestAsync(id, request, cancellationToken);
            return Ok(ApiResponse<GuestReturnCaseDetailResponseDto>.SuccessResponse(data, "Guest return request retrieved successfully."));
        }

        [AllowAnonymous]
        [RateLimit("GuestCaseDetail", 15, 1, RateLimitPeriod.Minute)]
        [HttpPost("disputes/{id:int}")]
        public async Task<ActionResult<ApiResponse<GuestDisputeCaseDetailResponseDto>>> GetDispute(
            int id,
            [FromBody] GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCaseQueryService.GetGuestDisputeAsync(id, request, cancellationToken);
            return Ok(ApiResponse<GuestDisputeCaseDetailResponseDto>.SuccessResponse(data, "Guest dispute retrieved successfully."));
        }
    }
}
