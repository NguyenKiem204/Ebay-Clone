using ebay.Configuration;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ebay.Services.Implementations
{
    public class CategoryService : ICategoryService
    {
        private readonly EbayDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CATEGORY_TREE_CACHE_KEY = "CategoryTree";

        public CategoryService(EbayDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<List<CategoryResponseDto>> GetCategoriesAsync()
        {
            return await GetCategoryTreeAsync();
        }

        public async Task<List<CategoryResponseDto>> GetCategoryTreeAsync()
        {
            if (!_cache.TryGetValue(CATEGORY_TREE_CACHE_KEY, out List<CategoryResponseDto>? categoryTree) || categoryTree == null)
            {
                var allCategories = await _context.Categories
                    .Where(c => c.IsActive == true)
                    .OrderBy(c => c.DisplayOrder)
                    .ToListAsync();

                // Build full hierarchy
                categoryTree = allCategories
                    .Where(c => c.ParentId == null)
                    .Select(c => MapCategoryToDto(c, allCategories))
                    .ToList();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromHours(1));

                _cache.Set(CATEGORY_TREE_CACHE_KEY, categoryTree, cacheEntryOptions);
            }

            return categoryTree;
        }

        public async Task<List<NavGroupResponseDto>> GetNavGroupsAsync()
        {
            var tree = await GetCategoryTreeAsync();
            var allFlattened = FlattenCategoryTree(tree);
            var result = new List<NavGroupResponseDto>();

            foreach (var kvp in NavCategoryConfig.NavGroups)
            {
                var groupSlug = kvp.Key;
                var categorySlugs = kvp.Value;
                
                var groupCategories = allFlattened
                    .Where(c => categorySlugs.Contains(c.Slug))
                    .ToList();

                result.Add(new NavGroupResponseDto
                {
                    Slug = groupSlug,
                    Name = NavCategoryConfig.NavGroupNames.ContainsKey(groupSlug) ? NavCategoryConfig.NavGroupNames[groupSlug] : groupSlug,
                    Categories = groupCategories
                });
            }

            return result;
        }

        public async Task<NavGroupResponseDto?> GetNavGroupBySlugAsync(string slug)
        {
            if (!NavCategoryConfig.NavGroups.ContainsKey(slug))
            {
                return null;
            }

            var tree = await GetCategoryTreeAsync();
            var allFlattened = FlattenCategoryTree(tree);
            
            var categorySlugs = NavCategoryConfig.NavGroups[slug];
            var groupCategories = allFlattened
                .Where(c => categorySlugs.Contains(c.Slug))
                .ToList();

            return new NavGroupResponseDto
            {
                Slug = slug,
                Name = NavCategoryConfig.NavGroupNames.ContainsKey(slug) ? NavCategoryConfig.NavGroupNames[slug] : slug,
                Categories = groupCategories
            };
        }

        private List<CategoryResponseDto> FlattenCategoryTree(List<CategoryResponseDto> tree)
        {
            var result = new List<CategoryResponseDto>();
            foreach (var node in tree)
            {
                result.Add(node);
                if (node.SubCategories != null && node.SubCategories.Any())
                {
                    result.AddRange(FlattenCategoryTree(node.SubCategories));
                }
            }
            return result;
        }

        private static CategoryResponseDto MapCategoryToDto(Category c, List<Category> all) => new CategoryResponseDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            IconUrl = c.IconUrl,
            ImageUrl = c.ImageUrl,
            DisplayOrder = c.DisplayOrder ?? 0,
            ParentId = c.ParentId,
            SubCategories = all
                .Where(sub => sub.ParentId == c.Id)
                .Select(sub => MapCategoryToDto(sub, all))
                .ToList()
        };
    }
}
