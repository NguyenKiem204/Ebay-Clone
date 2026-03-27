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
    public class ReturnsController : ControllerBase
    {
        private readonly IReturnRequestService _returnRequestService;
        private readonly IReturnRequestActionService _returnRequestActionService;

        public ReturnsController(
            IReturnRequestService returnRequestService,
            IReturnRequestActionService returnRequestActionService)
        {
            _returnRequestService = returnRequestService;
            _returnRequestActionService = returnRequestActionService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        [HttpPost]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> Create(CreateReturnRequestDto request)
        {
            var data = await _returnRequestService.CreateReturnRequestAsync(GetUserId(), request);
            return StatusCode(
                201,
                ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return request created successfully."));
        }

        [Authorize(Roles = "seller,admin")]
        [HttpPost("{id:int}/approve")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> Approve(int id, ApproveReturnRequestDto request, CancellationToken cancellationToken)
        {
            var data = await _returnRequestActionService.ApproveReturnRequestAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return request approved successfully."));
        }

        [Authorize(Roles = "seller,admin")]
        [HttpPost("{id:int}/reject")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> Reject(int id, RejectReturnRequestDto request, CancellationToken cancellationToken)
        {
            var data = await _returnRequestActionService.RejectReturnRequestAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return request rejected successfully."));
        }

        [Authorize(Roles = "seller,admin")]
        [HttpPost("{id:int}/complete")]
        public async Task<ActionResult<ApiResponse<ReturnRequestResponseDto>>> Complete(int id, CompleteReturnRequestDto request, CancellationToken cancellationToken)
        {
            var data = await _returnRequestActionService.CompleteReturnRequestAsync(
                GetUserId(),
                GetUserRole(),
                id,
                request,
                cancellationToken);

            return Ok(ApiResponse<ReturnRequestResponseDto>.SuccessResponse(data, "Return request completed successfully."));
        }
    }
}
