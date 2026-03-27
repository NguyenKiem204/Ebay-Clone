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
    public class CaseEvidenceController : ControllerBase
    {
        private readonly ICaseEvidenceService _caseEvidenceService;

        public CaseEvidenceController(ICaseEvidenceService caseEvidenceService)
        {
            _caseEvidenceService = caseEvidenceService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        [HttpPost("returns/{id:int}/evidence")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<ActionResult<ApiResponse<BuyerCaseEvidenceResponseDto>>> UploadReturnEvidence(
            int id,
            [FromForm] UploadCaseEvidenceDto request,
            CancellationToken cancellationToken)
        {
            var data = await _caseEvidenceService.UploadReturnEvidenceAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return StatusCode(
                201,
                ApiResponse<BuyerCaseEvidenceResponseDto>.SuccessResponse(data, "Return evidence uploaded successfully."));
        }

        [HttpPost("disputes/{id:int}/evidence")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<ActionResult<ApiResponse<BuyerCaseEvidenceResponseDto>>> UploadDisputeEvidence(
            int id,
            [FromForm] UploadCaseEvidenceDto request,
            CancellationToken cancellationToken)
        {
            var data = await _caseEvidenceService.UploadDisputeEvidenceAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return StatusCode(
                201,
                ApiResponse<BuyerCaseEvidenceResponseDto>.SuccessResponse(data, "Dispute evidence uploaded successfully."));
        }
    }
}
