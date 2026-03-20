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
    public class SavedController : ControllerBase
    {
        private readonly EbayDbContext _context;
        public SavedController(EbayDbContext context) => _context = context;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/saved — return all saved product IDs for the current user
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<SavedItemResponseDto>>>> GetSaved()
        {
            var userId = GetUserId();
            var items = await _context.Wishlists
                .Where(w => w.UserId == userId)
                .Include(w => w.Product)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new SavedItemResponseDto
                {
                    ProductId   = w.ProductId,
                    ProductName = w.Product.Title,
                    ProductSlug = w.Product.Slug ?? "",
                    ProductImage = w.Product.Images != null && w.Product.Images.Count > 0 ? w.Product.Images[0] : null,
                    Price        = w.Product.Price,
                    ShippingFee  = w.Product.ShippingFee ?? 0,
                    SellerName   = w.Product.Seller != null ? w.Product.Seller.Username : null,
                    SavedAt      = w.CreatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<List<SavedItemResponseDto>>.SuccessResponse(items));
        }

        // POST /api/saved/{productId} — toggle save/unsave
        [HttpPost("{productId}")]
        public async Task<ActionResult<ApiResponse<object>>> Toggle(int productId)
        {
            var userId = GetUserId();
            var existing = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

            if (existing != null)
            {
                _context.Wishlists.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<object>.SuccessResponse(new { saved = false }, "Đã bỏ lưu sản phẩm"));
            }
            else
            {
                var product = await _context.Products.FindAsync(productId);
                if (product == null)
                    return NotFound(ApiResponse<object>.ErrorResponse("Sản phẩm không tồn tại"));

                await _context.Wishlists.AddAsync(new Wishlist
                {
                    UserId    = userId,
                    ProductId = productId,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<object>.SuccessResponse(new { saved = true }, "Đã lưu sản phẩm"));
            }
        }
    }
}
