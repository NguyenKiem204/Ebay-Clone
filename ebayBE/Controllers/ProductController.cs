using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
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
    }
}
