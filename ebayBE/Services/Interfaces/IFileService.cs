using Microsoft.AspNetCore.Http;

namespace ebay.Services.Interfaces
{
    public interface IFileService
    {
        Task<string> SaveFileAsync(
            IFormFile file,
            string subFolder,
            string[]? allowedExtensions = null,
            long? maxFileSizeBytes = null);

        void DeleteFile(string relativePath);
    }
}
