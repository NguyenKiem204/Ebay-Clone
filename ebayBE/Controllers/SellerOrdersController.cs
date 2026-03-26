using System.Security.Claims;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [Authorize(Roles = "seller,admin")]
    [ApiController]
    [Route("api/seller/orders")]
    public class SellerOrdersController : ControllerBase
    {
        private readonly ISellerOrderQueryService _sellerOrderQueryService;
        private readonly IOrderCancellationService _orderCancellationService;
        private readonly ISellerOrderFulfillmentService _sellerOrderFulfillmentService;

        public SellerOrdersController(
            ISellerOrderQueryService sellerOrderQueryService,
            IOrderCancellationService orderCancellationService,
            ISellerOrderFulfillmentService sellerOrderFulfillmentService)
        {
            _sellerOrderQueryService = sellerOrderQueryService;
            _orderCancellationService = orderCancellationService;
            _sellerOrderFulfillmentService = sellerOrderFulfillmentService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<SellerOrderListItemResponseDto>>>> GetMyOrders(CancellationToken cancellationToken)
        {
            var data = await _sellerOrderQueryService.GetSellerOrdersAsync(
                GetUserId(),
                cancellationToken);

            return Ok(ApiResponse<List<SellerOrderListItemResponseDto>>.SuccessResponse(
                data,
                "Seller orders retrieved successfully."));
        }

        [HttpGet("{orderId:int}")]
        public async Task<ActionResult<ApiResponse<SellerOrderDetailResponseDto>>> GetOrderById(
            int orderId,
            CancellationToken cancellationToken)
        {
            var data = await _sellerOrderQueryService.GetSellerOrderByIdAsync(
                GetUserId(),
                orderId,
                cancellationToken);

            return Ok(ApiResponse<SellerOrderDetailResponseDto>.SuccessResponse(
                data,
                "Seller order detail retrieved successfully."));
        }

        [HttpPut("{orderId:int}/tracking")]
        public async Task<ActionResult<ApiResponse<SellerOrderDetailResponseDto>>> UpsertTracking(
            int orderId,
            [FromBody] UpsertSellerOrderTrackingDto request,
            CancellationToken cancellationToken)
        {
            var data = await _sellerOrderFulfillmentService.UpsertTrackingAsync(
                GetUserId(),
                orderId,
                request,
                cancellationToken);

            return Ok(ApiResponse<SellerOrderDetailResponseDto>.SuccessResponse(
                data,
                "Đã cập nhật tracking cho đơn hàng"));
        }

        [HttpPut("{orderId:int}/shipment-status")]
        public async Task<ActionResult<ApiResponse<SellerOrderDetailResponseDto>>> UpdateShipmentStatus(
            int orderId,
            [FromBody] UpdateSellerOrderShipmentStatusDto request,
            CancellationToken cancellationToken)
        {
            var data = await _sellerOrderFulfillmentService.UpdateShipmentStatusAsync(
                GetUserId(),
                orderId,
                request,
                cancellationToken);

            return Ok(ApiResponse<SellerOrderDetailResponseDto>.SuccessResponse(
                data,
                "Đã cập nhật tiến trình giao hàng"));
        }

        [HttpPut("cancellation-requests/{requestId:int}/approve")]
        public async Task<ActionResult<ApiResponse<OrderCancellationRequestSummaryDto>>> ApproveCancellationRequest(
            int requestId,
            [FromBody] RespondOrderCancellationRequestDto? request,
            CancellationToken cancellationToken)
        {
            var data = await _orderCancellationService.ApproveCancellationRequestAsync(
                GetUserId(),
                GetUserRole(),
                requestId,
                request?.SellerResponse,
                cancellationToken);

            return Ok(ApiResponse<OrderCancellationRequestSummaryDto>.SuccessResponse(
                data,
                "Đã chấp nhận yêu cầu hủy đơn hàng"));
        }

        [HttpPut("cancellation-requests/{requestId:int}/reject")]
        public async Task<ActionResult<ApiResponse<OrderCancellationRequestSummaryDto>>> RejectCancellationRequest(
            int requestId,
            [FromBody] RespondOrderCancellationRequestDto? request,
            CancellationToken cancellationToken)
        {
            var data = await _orderCancellationService.RejectCancellationRequestAsync(
                GetUserId(),
                GetUserRole(),
                requestId,
                request?.SellerResponse,
                cancellationToken);

            return Ok(ApiResponse<OrderCancellationRequestSummaryDto>.SuccessResponse(
                data,
                "Đã từ chối yêu cầu hủy đơn hàng"));
        }
    }
}
