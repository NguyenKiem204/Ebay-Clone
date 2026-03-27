using ebay.Attributes;
using ebay.DTOs.Requests;
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
        private readonly IGuestCaseCommandService _guestCaseCommandService;

        public GuestCasesController(
            IGuestCaseQueryService guestCaseQueryService,
            IGuestCaseCommandService guestCaseCommandService)
        {
            _guestCaseQueryService = guestCaseQueryService;
            _guestCaseCommandService = guestCaseCommandService;
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

        [HttpPost("returns/{id:int}/cancel")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> CancelReturnRequest(
            int id,
            [FromBody] CancelGuestCaseRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCaseCommandService.CancelReturnRequestAsync(id, request, cancellationToken);
            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Guest return request cancelled successfully."));
        }

        [HttpPost("returns/{id:int}/tracking")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> SubmitReturnTracking(
            int id,
            [FromBody] SubmitGuestReturnTrackingDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCaseCommandService.SubmitReturnTrackingAsync(id, request, cancellationToken);
            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Guest return tracking submitted successfully."));
        }

        [HttpPost("disputes/{id:int}/cancel")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> CancelInrRequest(
            int id,
            [FromBody] CancelGuestCaseRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCaseCommandService.CancelInrClaimAsync(id, request, cancellationToken);
            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Guest INR request cancelled successfully."));
        }

        [HttpPost("disputes/{id:int}/escalate")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> EscalateInrRequest(
            int id,
            [FromBody] EscalateGuestInrClaimDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCaseCommandService.EscalateInrClaimAsync(id, request, cancellationToken);
            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Guest INR request escalated successfully."));
        }
    }
}
