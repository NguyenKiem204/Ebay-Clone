using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<List<CategoryResponseDto>> GetCategoriesAsync();
        Task<List<CategoryResponseDto>> GetCategoryTreeAsync();
        Task<List<NavGroupResponseDto>> GetNavGroupsAsync();
        Task<NavGroupResponseDto?> GetNavGroupBySlugAsync(string slug);
    }
}
