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
    [Route("api/[controller]")]
    public class DisputesController : ControllerBase
    {
        private readonly IDisputeService _disputeService;
        private readonly IDisputeActionService _disputeActionService;

        public DisputesController(
            IDisputeService disputeService,
            IDisputeActionService disputeActionService)
        {
            _disputeService = disputeService;
            _disputeActionService = disputeActionService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        [HttpPost("inr")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> CreateInr(CreateInrClaimDto request)
        {
            var data = await _disputeService.CreateInrClaimAsync(GetUserId(), request);
            return StatusCode(
                201,
                ApiResponse<DisputeResponseDto>.SuccessResponse(data, "INR claim created successfully."));
        }

        [HttpPost("quality-issue")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> CreateQualityIssue(CreateQualityIssueClaimDto request)
        {
            var data = await _disputeService.CreateQualityIssueClaimAsync(GetUserId(), request);
            return StatusCode(
                201,
                ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Quality issue claim created successfully."));
        }

        [HttpPost("escalate/returns/{returnRequestId:int}")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> EscalateReturn(int returnRequestId, EscalateReturnRequestDto request)
        {
            var data = await _disputeService.EscalateReturnRequestAsync(GetUserId(), returnRequestId, request);
            return StatusCode(
                201,
                ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Return request escalated successfully."));
        }

        [Authorize(Roles = "seller,admin")]
        [HttpPost("{id:int}/acknowledge")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> Acknowledge(int id, AcknowledgeDisputeDto request, CancellationToken cancellationToken)
        {
            var data = await _disputeActionService.AcknowledgeDisputeAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Dispute acknowledged successfully."));
        }

        [Authorize(Roles = "seller,admin")]
        [HttpPost("{id:int}/in-progress")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> MarkInProgress(int id, MarkDisputeInProgressDto request, CancellationToken cancellationToken)
        {
            var data = await _disputeActionService.MarkDisputeInProgressAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Dispute moved to in-progress successfully."));
        }

        [Authorize(Roles = "seller,admin")]
        [HttpPost("{id:int}/resolve")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> Resolve(int id, ResolveDisputeDto request, CancellationToken cancellationToken)
        {
            var data = await _disputeActionService.ResolveDisputeAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Dispute resolved successfully."));
        }

        [Authorize(Roles = "seller,admin")]
        [HttpPost("{id:int}/close")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> Close(int id, CloseDisputeDto request, CancellationToken cancellationToken)
        {
            var data = await _disputeActionService.CloseDisputeAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Dispute closed successfully."));
        }
    }
}
