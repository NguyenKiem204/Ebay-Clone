using Microsoft.AspNetCore.Http;

namespace ebay.DTOs.Requests
{
    public class UpdateStoreRequest
    {
        public string StoreName { get; set; } = null!;
        public string? Description { get; set; }
        public IFormFile? BannerFile { get; set; }
        public IFormFile? LogoFile { get; set; }
    }
}
