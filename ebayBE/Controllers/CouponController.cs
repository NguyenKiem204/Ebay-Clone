using System.Security.Claims;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using ebay.Services.Implementations;
using ebay.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CouponController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("validate")]
        public async Task<ActionResult<ApiResponse<CouponValidationResponseDto>>> Validate([FromBody] ValidateCouponRequest request)
        {
            var data = await _couponService.ValidateCouponAsync(request.Code, request.OrderAmount, GetUserId());
            return Ok(ApiResponse<CouponValidationResponseDto>.SuccessResponse(data));
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<CouponResponseDto>>>> GetAll()
        {
            var coupons = await _couponService.GetAllCouponsAsync();
            var data = coupons.Select(MapToResponseDto);
            return Ok(ApiResponse<IEnumerable<CouponResponseDto>>.SuccessResponse(data));
        }

        [HttpGet("seller")]
        public async Task<ActionResult<ApiResponse<IEnumerable<CouponResponseDto>>>> GetMyCoupons()
        {
            var coupons = await _couponService.GetSellerCouponsAsync(GetUserId());
            var data = coupons.Select(MapToResponseDto);
            return Ok(ApiResponse<IEnumerable<CouponResponseDto>>.SuccessResponse(data));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<CouponResponseDto>>> GetById(int id)
        {
            var coupon = await _couponService.GetCouponByIdAsync(id);
            if (coupon == null) return NotFound(ApiResponse<object>.ErrorResponse("Không tìm thấy mã giảm giá"));
            return Ok(ApiResponse<CouponResponseDto>.SuccessResponse(MapToResponseDto(coupon)));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<CouponResponseDto>>> Create([FromBody] CreateCouponRequest request)
        {
            try
            {
                var couponResponse = await _couponService.CreateCouponAsync(request);
                return Ok(ApiResponse<CouponResponseDto>.SuccessResponse(couponResponse, "Tạo mã giảm giá thành công"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<CouponResponseDto>>> Update(int id, [FromBody] UpdateCouponRequest request)
        {
            try
            {
                var couponResponse = await _couponService.UpdateCouponAsync(GetUserId(), id, request);
                return Ok(ApiResponse<CouponResponseDto>.SuccessResponse(couponResponse, "Cập nhật mã giảm giá thành công"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(ex.Message));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
            }
            catch (ForbiddenException ex)
            {
                return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        {
            var result = await _couponService.DeleteCouponAsync(GetUserId(), id);
            if (!result) return NotFound(ApiResponse<object>.ErrorResponse("Không tìm thấy mã giảm giá hoặc bạn không có quyền xóa"));
            return Ok(ApiResponse<object>.SuccessResponse(null, "Xóa mã giảm giá thành công"));
        }

        [HttpGet("{id:int}/products")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<List<ProductResponseDto>>>> GetCouponProducts(int id)
        {
            var data = await _couponService.GetCouponProductsAsync(id);
            return Ok(ApiResponse<List<ProductResponseDto>>.SuccessResponse(data));
        }

        [HttpPatch("{id}/end")]
        public async Task<ActionResult<ApiResponse<object>>> EndEarly(int id)
        {
            var result = await _couponService.EndCouponEarlyAsync(id);
            if (!result) return NotFound(ApiResponse<object>.ErrorResponse("Không tìm thấy mã giảm giá"));
            return Ok(ApiResponse<object>.SuccessResponse(null, "Đã kết thúc mã giảm giá sớm"));
        }

        private static CouponResponseDto MapToResponseDto(Coupon coupon)
        {
            return new CouponResponseDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                Description = coupon.Description,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                MinOrderAmount = coupon.MinOrderAmount,
                MaxDiscount = coupon.MaxDiscount,
                StartDate = coupon.StartDate,
                EndDate = coupon.EndDate,
                MaxUsage = coupon.MaxUsage,
                MaxUsagePerUser = coupon.MaxUsagePerUser,
                CouponType = coupon.CouponType,
                UsedCount = coupon.UsedCount,
                IsActive = coupon.IsActive,
                CreatedAt = coupon.CreatedAt,
                CategoryId = coupon.CategoryId,
                ProductId = coupon.ProductId,
                StoreId = coupon.StoreId,
                StoreName = coupon.Store?.StoreName?.Trim(),
                CategoryName = coupon.Category?.Name?.Trim(),
                ApplicableTo = coupon.ApplicableTo,
                SelectedProductIds = coupon.Products?.Select(p => p.Id).ToList(),
                SelectedProductTitles = coupon.Products?.Select(p => p.Title).ToList(),
                Products = coupon.Products?.Select(p => ProductService.MapToDto(p)).ToList()
            };
        }
    }

    public class ValidateCouponRequest
    {
        public string Code { get; set; } = null!;
        public decimal OrderAmount { get; set; }
    }
}
