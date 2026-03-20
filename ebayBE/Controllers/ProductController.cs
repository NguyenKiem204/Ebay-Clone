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

        // GET /api/products/recommendations/{id}?excludeIds=1,2,3&limit=6
        // "Because you viewed this..." — same category, similar price
        [HttpGet("{id:int}/recommendations")]
        public async Task<ActionResult<ApiResponse<List<ProductResponseDto>>>> GetRecommendations(
            int id,
            [FromQuery] string? excludeIds = null,
            [FromQuery] int limit = 6)
        {
            var exclude = excludeIds?.Split(',')
                .Select(s => int.TryParse(s.Trim(), out var v) ? v : 0)
                .Where(v => v > 0)
                .ToList() ?? [];
            exclude.Add(id); // always exclude the viewed product itself

            var data = await _productService.GetRecommendationsAsync(id, exclude, limit);
            return Ok(new ApiResponse<List<ProductResponseDto>>(data));
        }
    }
}
