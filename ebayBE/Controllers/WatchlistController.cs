using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WatchlistController : ControllerBase
    {
        private readonly EbayDbContext _context;
        public WatchlistController(EbayDbContext context) => _context = context;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/watchlist — return all watchlist items for the current user
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<SavedItemResponseDto>>>> GetWatchlist()
        {
            var userId = GetUserId();
            var items = await _context.WatchlistItems
                .Where(w => w.UserId == userId)
                .Include(w => w.Product)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new SavedItemResponseDto
                {
                    ProductId    = w.ProductId,
                    ProductName  = w.Product.Title,
                    ProductSlug  = w.Product.Slug ?? "",
                    ProductImage = w.Product.Images != null && w.Product.Images.Count > 0 ? w.Product.Images[0] : null,
                    Price        = w.Product.Price,
                    ShippingFee  = w.Product.ShippingFee ?? 0,
                    SellerName   = w.Product.Seller != null ? w.Product.Seller.Username : null,
                    SavedAt      = w.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<List<SavedItemResponseDto>>.SuccessResponse(items));
        }

        // POST /api/watchlist/{productId} — toggle watch/unwatch
        [HttpPost("{productId}")]
        public async Task<ActionResult<ApiResponse<object>>> Toggle(int productId)
        {
            var userId = GetUserId();
            var existing = await _context.WatchlistItems
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

            if (existing != null)
            {
                _context.WatchlistItems.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<object>.SuccessResponse(new { watching = false }, "Đã bỏ theo dõi sản phẩm"));
            }
            else
            {
                var product = await _context.Products.FindAsync(productId);
                if (product == null)
                    return NotFound(ApiResponse<object>.ErrorResponse("Sản phẩm không tồn tại"));

                await _context.WatchlistItems.AddAsync(new WatchlistItem
                {
                    UserId    = userId,
                    ProductId = productId,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<object>.SuccessResponse(new { watching = true }, "Đã thêm vào watchlist"));
            }
        }
    }
}
