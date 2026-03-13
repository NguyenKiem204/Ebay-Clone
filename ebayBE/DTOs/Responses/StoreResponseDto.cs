namespace ebay.DTOs.Responses
{
    public class StoreResponseDto
    {
        public int Id { get; set; }
        public string StoreName { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? LogoUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
