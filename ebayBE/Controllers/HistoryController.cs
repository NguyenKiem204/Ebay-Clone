using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private readonly EbayDbContext _ctx;
        private readonly ILogger<HistoryController> _logger;
        private const int MaxHistory = 10;
        private const string CookieName = "ebay_guest_id";

        public HistoryController(EbayDbContext ctx, ILogger<HistoryController> logger)
        {
            _ctx = ctx;
            _logger = logger;
        }

        private int? GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return claim is null ? null : int.Parse(claim);
        }

        private string GetOrCreateCookieId()
        {
            if (Request.Cookies.TryGetValue(CookieName, out var existing))
                return existing;

            var newId = Guid.NewGuid().ToString();
            Response.Cookies.Append(CookieName, newId, new CookieOptions
            {
                HttpOnly = false, // FE needs to read it for sync
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Secure = Request.IsHttps,
                IsEssential = true,
                Path = "/"           // ← accessible from ALL routes, not just /api/History
            });
            return newId;
        }

        // POST /api/history/{productId}
        // Upserts a view for the current user (or guest via cookie)
        [HttpPost("{productId:int}")]
        public async Task<IActionResult> TrackView(int productId)
        {
            var product = await _ctx.Products.FindAsync(productId);
            if (product == null) return NotFound();

            var userId  = GetUserId();
            var cookieId = GetOrCreateCookieId();
            var now = DateTime.UtcNow;

            Console.WriteLine($"Track: user={userId}, cookie={cookieId}, product={productId}");

            var existing = await _ctx.ProductViewHistories
                .FirstOrDefaultAsync(h => 
                    (userId != null && h.UserId == userId && h.ProductId == productId) ||
                    (userId == null && h.CookieId == cookieId && h.ProductId == productId)
                );

            if (existing != null)
            {
                existing.ViewedAt = now;
                existing.ExpiresAt = userId.HasValue ? now.AddDays(90) : now.AddDays(30);
            }
            else
            {
                // Remove oldest if over limit
                var countQuery = userId.HasValue 
                    ? _ctx.ProductViewHistories.Where(h => h.UserId == userId)
                    : _ctx.ProductViewHistories.Where(h => h.CookieId == cookieId);

                var count = await countQuery.CountAsync();
                if (count >= MaxHistory)
                {
                    var oldest = await countQuery.OrderBy(h => h.ViewedAt).FirstOrDefaultAsync();
                    if (oldest != null) _ctx.ProductViewHistories.Remove(oldest);
                }

                await _ctx.ProductViewHistories.AddAsync(new ProductViewHistory
                {
                    UserId    = userId,
                    CookieId  = userId == null ? cookieId : null,
                    ProductId = productId,
                    ViewedAt  = now,
                    ExpiresAt = userId.HasValue ? now.AddDays(90) : now.AddDays(30)
                });
            }

            try
            {
                await _ctx.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Guard against duplicate inserts when FE triggers rapid duplicate requests
                // (e.g. React StrictMode effect replay in development).
                var duplicated = await _ctx.ProductViewHistories
                    .FirstOrDefaultAsync(h =>
                        (userId != null && h.UserId == userId && h.ProductId == productId) ||
                        (userId == null && h.CookieId == cookieId && h.ProductId == productId)
                    );

                if (duplicated != null)
                {
                    duplicated.ViewedAt = now;
                    duplicated.ExpiresAt = userId.HasValue ? now.AddDays(90) : now.AddDays(30);
                    await _ctx.SaveChangesAsync();
                }
            }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Tracked"));
        }

        // GET /api/history
        // Returns last 10 viewed products for the current user or guest
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<HistoryItemResponseDto>>>> GetHistory()
        {
            var userId   = GetUserId();
            var cookieId = GetOrCreateCookieId();

            IQueryable<ProductViewHistory> query = userId.HasValue
                ? _ctx.ProductViewHistories.Where(h => h.UserId == userId)
                : _ctx.ProductViewHistories.Where(h => h.CookieId == cookieId);

            var items = await query
                .Include(h => h.Product).ThenInclude(p => p.Seller)
                .OrderByDescending(h => h.ViewedAt)
                .Take(MaxHistory)
                .Select(h => new HistoryItemResponseDto
                {
                    ProductId    = h.ProductId,
                    ProductName  = h.Product.Title,
                    ProductImage = h.Product.Images != null && h.Product.Images.Count > 0
                        ? h.Product.Images[0]
                        : null,
                    Price       = h.Product.Price,
                    ShippingFee = h.Product.ShippingFee ?? 0,
                    SellerName  = h.Product.Seller != null ? h.Product.Seller.Username : null,
                    ViewedAt    = h.ViewedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<List<HistoryItemResponseDto>>.SuccessResponse(items));
        }

        // POST /api/history/sync
        // Merges guest cookie history into the logged-in user's account
        [Authorize]
        [HttpPost("sync")]
        public async Task<IActionResult> SyncGuestHistory()
        {
            // Read cookie directly from request — don't rely on FE sending it
            if (!Request.Cookies.TryGetValue(CookieName, out var cookieId)
                || string.IsNullOrWhiteSpace(cookieId))
            {
                return Ok(ApiResponse<object>.SuccessResponse(null, "No guest cookie found"));
            }

            var userId = GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse("Unauthorized"));
            }

            var now = DateTime.UtcNow;

            var guestRows = await _ctx.ProductViewHistories
                .Where(h => h.CookieId == cookieId)
                .OrderByDescending(h => h.ViewedAt)
                .ToListAsync();

            if (guestRows.Count == 0)
            {
                return Ok(ApiResponse<object>.SuccessResponse(null, "No guest history found"));
            }

            // Defensive aggregation: keep latest row per product before merging into user history.
            var mergedGuestRows = guestRows
                .GroupBy(h => h.ProductId)
                .Select(g => g.OrderByDescending(x => x.ViewedAt).First())
                .ToList();

            var guestProductIds = mergedGuestRows.Select(r => r.ProductId).ToList();

            var existingUserRows = await _ctx.ProductViewHistories
                .Where(h => h.UserId == userId.Value && guestProductIds.Contains(h.ProductId))
                .ToDictionaryAsync(h => h.ProductId);

            foreach (var guest in mergedGuestRows)
            {
                if (existingUserRows.TryGetValue(guest.ProductId, out var existing))
                {
                    if (guest.ViewedAt > existing.ViewedAt)
                    {
                        existing.ViewedAt = guest.ViewedAt;
                    }

                    existing.ExpiresAt = now.AddDays(90);
                    continue;
                }

                await _ctx.ProductViewHistories.AddAsync(new ProductViewHistory
                {
                    UserId = userId.Value,
                    ProductId = guest.ProductId,
                    ViewedAt = guest.ViewedAt,
                    ExpiresAt = now.AddDays(90)
                });
            }

            _ctx.ProductViewHistories.RemoveRange(guestRows);

            try
            {
                await _ctx.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // StrictMode / duplicate mount may call sync concurrently.
                // If another request already merged, treat this as idempotent and continue.
                _logger.LogWarning(ex, "History sync conflict for cookie {CookieId} and user {UserId}", cookieId, userId.Value);

                _ctx.ChangeTracker.Clear();

                var remainingGuestRows = await _ctx.ProductViewHistories
                    .Where(h => h.CookieId == cookieId)
                    .ToListAsync();

                if (remainingGuestRows.Count > 0)
                {
                    _ctx.ProductViewHistories.RemoveRange(remainingGuestRows);

                    try
                    {
                        await _ctx.SaveChangesAsync();
                    }
                    catch (Exception cleanupEx)
                    {
                        _logger.LogWarning(cleanupEx, "History sync cleanup failed for cookie {CookieId}", cookieId);
                    }
                }
            }

            // Enforce max history after merge to keep list bounded and deterministic.
            var allUserRows = await _ctx.ProductViewHistories
                .Where(h => h.UserId == userId.Value)
                .OrderByDescending(h => h.ViewedAt)
                .ToListAsync();

            if (allUserRows.Count > MaxHistory)
            {
                _ctx.ProductViewHistories.RemoveRange(allUserRows.Skip(MaxHistory));
                await _ctx.SaveChangesAsync();
            }

            // Delete guest cookie so next logout creates a fresh identity
            Response.Cookies.Delete(CookieName, new CookieOptions { Path = "/" });

            return Ok(ApiResponse<object>.SuccessResponse(null, "Synced"));
        }
    }
}
