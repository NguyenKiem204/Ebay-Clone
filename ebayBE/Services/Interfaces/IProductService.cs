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
        Task<List<ProductResponseDto>> GetRelatedProductsAsync(int productId, int count = 10);
        Task<List<CategoryResponseDto>> GetCategoriesAsync();

        // Seller product management
        Task<PagedResponseDto<ProductResponseDto>> GetSellerProductsAsync(int sellerId, SellerProductSearchRequest request);
        Task<ProductResponseDto> CreateProductAsync(int sellerId, CreateProductRequest request);
        Task<ProductResponseDto> UpdateProductAsync(int sellerId, int productId, UpdateProductRequest request);
        Task<ProductResponseDto> ToggleProductVisibilityAsync(int sellerId, int productId);
        Task<bool> DeleteProductAsync(int sellerId, int productId);
        Task<bool> BulkDeleteProductsAsync(int sellerId, List<int> productIds);
        Task<bool> BulkUpdateStatusAsync(int sellerId, List<int> productIds, string status);
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
