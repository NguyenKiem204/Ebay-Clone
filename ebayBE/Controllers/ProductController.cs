using System.Security.Claims;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // ========== PUBLIC ENDPOINTS ==========

        [HttpGet("landing")]
        public async Task<ActionResult<ApiResponse<LandingPageResponseDto>>> GetLandingPage()
        {
            var data = await _productService.GetLandingPageProductsAsync();
            return Ok(new ApiResponse<LandingPageResponseDto>(data));
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<PagedResponseDto<ProductResponseDto>>>> Search([FromQuery] ProductSearchRequestDto request)
        {
            var data = await _productService.SearchProductsAsync(request);
            return Ok(new ApiResponse<PagedResponseDto<ProductResponseDto>>(data));
        }

        [HttpGet("categories")]
        public async Task<ActionResult<ApiResponse<List<CategoryResponseDto>>>> GetCategories()
        {
            var data = await _productService.GetCategoriesAsync();
            return Ok(new ApiResponse<List<CategoryResponseDto>>(data));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ApiResponse<ProductResponseDto>>> GetById(int id)
        {
            var data = await _productService.GetProductByIdAsync(id);
            return Ok(new ApiResponse<ProductResponseDto>(data));
        }

        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<ApiResponse<ProductResponseDto>>> GetBySlug(string slug)
        {
            var data = await _productService.GetProductBySlugAsync(slug);
            return Ok(new ApiResponse<ProductResponseDto>(data));
        }

        [HttpGet("{id:int}/related")]
        public async Task<ActionResult<ApiResponse<List<ProductResponseDto>>>> GetRelated(int id, [FromQuery] int count = 10)
        {
            var data = await _productService.GetRelatedProductsAsync(id, count);
            return Ok(new ApiResponse<List<ProductResponseDto>>(data));
        }

        // ========== SELLER ENDPOINTS ==========

        [HttpGet("seller/me")]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<PagedResponseDto<ProductResponseDto>>>> GetSellerProducts([FromQuery] SellerProductSearchRequest request)
        {
            var data = await _productService.GetSellerProductsAsync(GetUserId(), request);
            return Ok(ApiResponse<PagedResponseDto<ProductResponseDto>>.SuccessResponse(data));
        }

        [HttpPost]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<ProductResponseDto>>> CreateProduct([FromForm] CreateProductRequest request)
        {
            var data = await _productService.CreateProductAsync(GetUserId(), request);
            return Ok(ApiResponse<ProductResponseDto>.SuccessResponse(data, "Đăng bán sản phẩm thành công"));
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<ProductResponseDto>>> UpdateProduct(int id, [FromForm] UpdateProductRequest request)
        {
            var data = await _productService.UpdateProductAsync(GetUserId(), id, request);
            return Ok(ApiResponse<ProductResponseDto>.SuccessResponse(data, "Cập nhật sản phẩm thành công"));
        }

        [HttpPatch("{id:int}/toggle-visibility")]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<ProductResponseDto>>> ToggleVisibility(int id)
        {
            var data = await _productService.ToggleProductVisibilityAsync(GetUserId(), id);
            var message = data.IsActive ? "Sản phẩm đã được hiển thị" : "Sản phẩm đã được ẩn";
            return Ok(ApiResponse<ProductResponseDto>.SuccessResponse(data, message));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteProduct(int id)
        {
            await _productService.DeleteProductAsync(GetUserId(), id);
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Xoá sản phẩm thành công"));
        }
    }
}
