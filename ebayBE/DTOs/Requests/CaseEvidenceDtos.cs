using Microsoft.AspNetCore.Http;

namespace ebay.DTOs.Requests
{
    public class UploadCaseEvidenceDto
    {
        public IFormFile File { get; set; } = null!;

        public string? Label { get; set; }

        public string? EvidenceType { get; set; }
    }
}
