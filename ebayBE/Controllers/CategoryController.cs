using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<CategoryResponseDto>>>> GetCategories()
        {
            var data = await _categoryService.GetCategoriesAsync();
            return Ok(new ApiResponse<List<CategoryResponseDto>>(data));
        }

        [HttpGet("nav")]
        public async Task<ActionResult<ApiResponse<List<NavGroupResponseDto>>>> GetNavGroups()
        {
            var data = await _categoryService.GetNavGroupsAsync();
            return Ok(new ApiResponse<List<NavGroupResponseDto>>(data));
        }

        [HttpGet("nav/{slug}")]
        public async Task<ActionResult<ApiResponse<NavGroupResponseDto>>> GetNavGroupBySlug(string slug)
        {
            var data = await _categoryService.GetNavGroupBySlugAsync(slug);
            if (data == null)
            {
                return NotFound(ApiResponse<NavGroupResponseDto>.ErrorResponse("Nav group not found", new List<string> { "NAV_GROUP_NOT_FOUND" }));
            }
            return Ok(new ApiResponse<NavGroupResponseDto>(data));
        }
    }
}
