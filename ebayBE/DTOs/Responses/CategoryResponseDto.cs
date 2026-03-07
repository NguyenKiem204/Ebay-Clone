namespace ebay.DTOs.Responses
{
    public class CategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? IconUrl { get; set; }
        public string? ImageUrl { get; set; }
        public int DisplayOrder { get; set; }
        public int? ParentId { get; set; }
        public List<CategoryResponseDto> SubCategories { get; set; } = new();
    }
}
