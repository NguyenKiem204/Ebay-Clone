using System.Security.Claims;
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

        public BuyerCasesController(IBuyerCaseQueryService buyerCaseQueryService)
        {
            _buyerCaseQueryService = buyerCaseQueryService;
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
    }
}
