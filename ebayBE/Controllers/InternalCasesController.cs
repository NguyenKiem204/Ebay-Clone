using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [Authorize(Roles = "seller,admin")]
    [ApiController]
    [Route("api/internal/cases")]
    public class InternalCasesController : ControllerBase
    {
        private readonly IInternalCaseQueryService _internalCaseQueryService;

        public InternalCasesController(IInternalCaseQueryService internalCaseQueryService)
        {
            _internalCaseQueryService = internalCaseQueryService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<BuyerCaseListItemResponseDto>>>> GetQueue(CancellationToken cancellationToken)
        {
            var data = await _internalCaseQueryService.GetQueueCasesAsync(
                GetUserId(),
                GetUserRole(),
                cancellationToken);

            return Ok(ApiResponse<List<BuyerCaseListItemResponseDto>>.SuccessResponse(data, "Internal cases queue retrieved successfully."));
        }

        [HttpGet("returns/{id:int}")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> GetReturnRequest(int id, CancellationToken cancellationToken)
        {
            var data = await _internalCaseQueryService.GetReturnRequestAsync(
                GetUserId(),
                GetUserRole(),
                id,
                cancellationToken);

            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return request retrieved successfully."));
        }

        [HttpGet("disputes/{id:int}")]
        public async Task<ActionResult<ApiResponse<DisputeResponseDto>>> GetDispute(int id, CancellationToken cancellationToken)
        {
            var data = await _internalCaseQueryService.GetDisputeAsync(
                GetUserId(),
                GetUserRole(),
                id,
                cancellationToken);

            return Ok(ApiResponse<DisputeResponseDto>.SuccessResponse(data, "Dispute retrieved successfully."));
        }
    }
}
