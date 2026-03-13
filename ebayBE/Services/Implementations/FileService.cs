using ebay.Exceptions;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace ebay.Services.Implementations
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
        private readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        public FileService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0) return null!;

            // 1. Validation Size
            if (file.Length > MaxFileSize)
                throw new BadRequestException($"File quá lớn (Tối đa 10MB). File của bạn: {file.Length / 1024 / 1024}MB");

            // 2. Validation Extension
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!AllowedExtensions.Contains(extension))
                throw new BadRequestException($"Định dạng file không hỗ trợ. Chỉ chấp nhận: {string.Join(", ", AllowedExtensions)}");

            // 3. Chuẩn bị thư mục lưu trữ
            string wwwRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(wwwRootPath))
            {
                // Trong trường hợp chạy integration test hoặc môi trường không có wwwroot
                wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            string uploadsFolder = Path.Combine(wwwRootPath, "uploads", subFolder);
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // 4. Tạo tên file duy nhất
            string fileName = $"{Guid.NewGuid()}{extension}";
            string filePath = Path.Combine(uploadsFolder, fileName);

            // 5. Lưu file
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // 6. Trả về đường dẫn tương đối để FE có thể truy cập
            return $"/uploads/{subFolder}/{fileName}";
        }

        public void DeleteFile(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return;

            // Chuyển đổi đường dẫn tương đối thành đường dẫn vật lý
            var path = Path.Combine(_environment.WebRootPath, relativePath.TrimStart('/'));
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }
}
