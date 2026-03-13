using Microsoft.AspNetCore.Http;

namespace ebay.Services.Interfaces
{
    public interface IFileService
    {
        /// <summary>
        /// Lưu file vào thư mục wwwroot/uploads/subFolder
        /// </summary>
        /// <returns>Đường dẫn tương đối của file (ví dụ: /uploads/stores/filename.jpg)</returns>
        Task<string> SaveFileAsync(IFormFile file, string subFolder);
        
        /// <summary>
        /// Xóa file khỏi hệ thống
        /// </summary>
        void DeleteFile(string relativePath);
    }
}
