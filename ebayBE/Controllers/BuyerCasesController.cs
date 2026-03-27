using System.Security.Claims;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/cases")]
    public class BuyerCasesController : ControllerBase
    {
        private readonly IBuyerCaseQueryService _buyerCaseQueryService;
        private readonly IBuyerCaseCommandService _buyerCaseCommandService;

        public BuyerCasesController(
            IBuyerCaseQueryService buyerCaseQueryService,
            IBuyerCaseCommandService buyerCaseCommandService)
        {
            _buyerCaseQueryService = buyerCaseQueryService;
            _buyerCaseCommandService = buyerCaseCommandService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<BuyerCaseListItemResponseDto>>>> GetMyCases()
        {
            var data = await _buyerCaseQueryService.GetBuyerCasesAsync(GetUserId());
            return Ok(ApiResponse<List<BuyerCaseListItemResponseDto>>.SuccessResponse(data, "Buyer cases retrieved successfully."));
        }

        [HttpGet("returns/{id:int}")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> GetReturnRequest(int id)
        {
            var data = await _buyerCaseQueryService.GetReturnRequestAsync(GetUserId(), id);
            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return request retrieved successfully."));
        }

        [HttpGet("disputes/{id:int}")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> GetDispute(int id)
        {
            var data = await _buyerCaseQueryService.GetDisputeAsync(GetUserId(), id);
            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Dispute retrieved successfully."));
        }

        [HttpPost("returns/{id:int}/cancel")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> CancelReturnRequest(
            int id,
            [FromBody] CancelBuyerCaseRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _buyerCaseCommandService.CancelReturnRequestAsync(
                GetUserId(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return request cancelled successfully."));
        }

        [HttpPost("returns/{id:int}/tracking")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> SubmitReturnTracking(
            int id,
            [FromBody] SubmitReturnTrackingDto request,
            CancellationToken cancellationToken)
        {
            var data = await _buyerCaseCommandService.SubmitReturnTrackingAsync(
                GetUserId(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return tracking submitted successfully."));
        }

        [HttpPost("disputes/{id:int}/cancel")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> CancelInrRequest(
            int id,
            [FromBody] CancelBuyerCaseRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _buyerCaseCommandService.CancelInrClaimAsync(
                GetUserId(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "INR request cancelled successfully."));
        }

        [HttpPost("disputes/{id:int}/escalate")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> EscalateInrRequest(
            int id,
            [FromBody] EscalateInrClaimDto request,
            CancellationToken cancellationToken)
        {
            var data = await _buyerCaseCommandService.EscalateInrClaimAsync(
                GetUserId(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "INR request escalated successfully."));
        }
    }
}
