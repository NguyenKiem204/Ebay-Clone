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
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<ActionResult<ApiResponse<CartResponseDto>>> GetCart()
        {
            var data = await _cartService.GetCartAsync(GetUserId());
            return Ok(ApiResponse<CartResponseDto>.SuccessResponse(data));
        }

        [HttpPost("items")]
        public async Task<ActionResult<ApiResponse<object>>> AddItem(AddToCartRequestDto request)
        {
            await _cartService.AddToCartAsync(GetUserId(), request);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Đã thêm vào giỏ hàng"));
        }

        [HttpPut("items/{productId}")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateQuantity(int productId, UpdateCartItemRequestDto request)
        {
            await _cartService.UpdateQuantityAsync(GetUserId(), productId, request.Quantity);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Đã cập nhật số lượng"));
        }

        [HttpDelete("items/{productId}")]
        public async Task<ActionResult<ApiResponse<object>>> RemoveItem(int productId)
        {
            await _cartService.RemoveItemAsync(GetUserId(), productId);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Đã xóa khỏi giỏ hàng"));
        }

        [HttpPost("merge")]
        public async Task<ActionResult<ApiResponse<object>>> MergeCart(List<AddToCartRequestDto> guestItems)
        {
            await _cartService.MergeCartAsync(GetUserId(), guestItems);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Đã hợp nhất giỏ hàng"));
        }

        [HttpDelete]
        public async Task<ActionResult<ApiResponse<object>>> ClearCart()
        {
            await _cartService.ClearCartAsync(GetUserId());
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Đã làm trống giỏ hàng"));
        }
    }
}
