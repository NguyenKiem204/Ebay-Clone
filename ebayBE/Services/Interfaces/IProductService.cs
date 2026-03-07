using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IProductService
    {
        Task<LandingPageResponseDto> GetLandingPageProductsAsync();
        Task<PagedResponseDto<ProductResponseDto>> SearchProductsAsync(ProductSearchRequestDto request);
        Task<ProductResponseDto> GetProductByIdAsync(int id);
        Task<ProductResponseDto> GetProductBySlugAsync(string slug);
        Task<List<CategoryResponseDto>> GetCategoriesAsync();
    }

    public class PagedResponseDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
    }
}
