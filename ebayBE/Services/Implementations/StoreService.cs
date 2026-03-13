using ebay.Models;
using Microsoft.EntityFrameworkCore;
using ebay.Services.Interfaces;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;

namespace ebay.Services.Implementations
{
    public class StoreService : IStoreService
    {
        private readonly EbayDbContext _context;
        private readonly IFileService _fileService;

        public StoreService(EbayDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<StoreResponseDto> GetStoreBySellerIdAsync(int sellerId)
        {
            var store = await _context.Stores
                .FirstOrDefaultAsync(s => s.SellerId == sellerId);

            return store == null ? null : MapToDto(store);
        }

        public async Task<StoreResponseDto> CreateStoreAsync(int userId, CreateStoreRequest request)
        {
            // Kiểm tra xem đã có store chưa
            var existingStore = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (existingStore != null)
                throw new BadRequestException("Bạn đã có một cửa hàng rồi.");

            // Kiểm tra tên store có trùng không
            var nameExists = await _context.Stores.AnyAsync(s => s.StoreName.ToLower() == request.StoreName.ToLower());
            if (nameExists)
                throw new BadRequestException("Tên cửa hàng này đã được sử dụng.");

            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new NotFoundException("Người dùng không tồn tại");

            string formattedName = ToTitleCase(request.StoreName);

            // Lưu ảnh nếu có, nếu không thì lấy ảnh mặc định
            string logoUrl = request.LogoFile != null 
                ? await _fileService.SaveFileAsync(request.LogoFile, "stores") 
                : "/uploads/stores/default-avatar.jpg";
                
            string bannerUrl = request.BannerFile != null 
                ? await _fileService.SaveFileAsync(request.BannerFile, "stores") 
                : "/uploads/stores/default-banner.jpg";

            var store = new Store
            {
                SellerId = userId,
                StoreName = formattedName,
                Slug = GenerateSlug(formattedName),
                Description = request.Description,
                LogoUrl = logoUrl,
                BannerImageUrl = bannerUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Stores.AddAsync(store);
            await _context.SaveChangesAsync();

            return MapToDto(store);
        }

        public async Task<StoreResponseDto> UpdateStoreAsync(int sellerId, UpdateStoreRequest request)
        {
            var store = await _context.Stores
                .FirstOrDefaultAsync(s => s.SellerId == sellerId);

            if (store == null)
                throw new NotFoundException("Cửa hàng không tồn tại");

            string formattedName = ToTitleCase(request.StoreName);

            // Nếu đổi tên (kể cả chỉ đổi hoa/thường), cần xử lý
            if (store.StoreName != formattedName)
            {
                // Nếu đổi sang một tên khác hoàn toàn (không chỉ là đổi hoa/thường của tên cũ)
                // thì mới cần check trùng tên với các shop khác
                if (!string.Equals(store.StoreName, formattedName, StringComparison.OrdinalIgnoreCase))
                {
                    var nameExists = await _context.Stores.AnyAsync(s => s.StoreName.ToLower() == formattedName.ToLower() && s.Id != store.Id);
                    if (nameExists)
                        throw new BadRequestException("Tên cửa hàng này đã được sử dụng.");
                    
                    store.Slug = GenerateSlug(formattedName);
                }
                
                store.StoreName = formattedName;
            }

            // Xử lý upload ảnh Logo mới
            if (request.LogoFile != null && request.LogoFile.Length > 0)
            {
                var newLogoPath = await _fileService.SaveFileAsync(request.LogoFile, "stores");
                if (!string.IsNullOrEmpty(newLogoPath))
                {
                    // Xóa ảnh cũ nếu có (không xóa nếu là ảnh mặc định)
                    if (!string.IsNullOrEmpty(store.LogoUrl) && !store.LogoUrl.Contains("default-")) 
                    {
                        _fileService.DeleteFile(store.LogoUrl);
                    }
                    store.LogoUrl = newLogoPath;
                }
            }

            // Xử lý upload ảnh Banner mới
            if (request.BannerFile != null && request.BannerFile.Length > 0)
            {
                var newBannerPath = await _fileService.SaveFileAsync(request.BannerFile, "stores");
                if (!string.IsNullOrEmpty(newBannerPath))
                {
                    // Xóa ảnh cũ nếu có (không xóa nếu là ảnh mặc định)
                    if (!string.IsNullOrEmpty(store.BannerImageUrl) && !store.BannerImageUrl.Contains("default-"))
                    {
                        _fileService.DeleteFile(store.BannerImageUrl);
                    }
                    store.BannerImageUrl = newBannerPath;
                }
            }

            store.Description = request.Description;
            store.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(store);
        }

        public async Task<bool> DeactivateStoreAsync(int sellerId)
        {
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == sellerId);
            if (store == null) throw new NotFoundException("Cửa hàng không tồn tại");

            store.IsActive = false;
            store.UpdatedAt = DateTime.UtcNow;
            
            return await _context.SaveChangesAsync() > 0;
        }

        private string GenerateSlug(string phrase)
        {
            string str = phrase.ToLower();
            // Loại bỏ ký tự đặc biệt
            str = System.Text.RegularExpressions.Regex.Replace(str, @"[^a-z0-9\s-]", "");
            // Thay thế khoảng trắng bằng dấu gạch ngang
            str = System.Text.RegularExpressions.Regex.Replace(str, @"\s+", " ").Trim();
            str = str.Replace(" ", "-");
            
            // Đảm bảo Slug là duy nhất bằng cách thêm suffix nếu cần (trong thực tế nên check DB)
            return str;
        }

        private string ToTitleCase(string phrase)
        {
            if (string.IsNullOrWhiteSpace(phrase)) return phrase;
            
            var textInfo = new System.Globalization.CultureInfo("en-US", false).TextInfo;
            return textInfo.ToTitleCase(phrase.ToLower());
        }

        private static StoreResponseDto MapToDto(Store store)
        {
            return new StoreResponseDto
            {
                Id = store.Id,
                StoreName = store.StoreName,
                Slug = store.Slug,
                Description = store.Description,
                BannerImageUrl = store.BannerImageUrl,
                LogoUrl = store.LogoUrl,
                IsActive = store.IsActive ?? false,
                CreatedAt = store.CreatedAt,
                UpdatedAt = store.UpdatedAt
            };
        }
    }
}
