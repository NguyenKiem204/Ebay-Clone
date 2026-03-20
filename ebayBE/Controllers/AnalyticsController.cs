using ebay.DTOs.Responses;
using ebay.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly EbayDbContext _ctx;
        public AnalyticsController(EbayDbContext ctx) => _ctx = ctx;

        // GET /api/analytics/most-viewed?days=7&limit=10
        [HttpGet("most-viewed")]
        public async Task<ActionResult<ApiResponse<List<MostViewedProductDto>>>> MostViewed(
            [FromQuery] int days = 7,
            [FromQuery] int limit = 10)
        {
            var since = DateTime.UtcNow.AddDays(-days);

            var result = await _ctx.ProductViewHistories
                .Where(h => h.ViewedAt >= since)
                .GroupBy(h => h.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    ViewCount = g.Count()
                })
                .OrderByDescending(x => x.ViewCount)
                .Take(limit)
                .Join(_ctx.Products,
                    v => v.ProductId,
                    p => p.Id,
                    (v, p) => new MostViewedProductDto
                    {
                        ProductId    = p.Id,
                        ProductName  = p.Title,
                        ProductImage = p.Images != null && p.Images.Count > 0 ? p.Images[0] : null,
                        Price        = p.Price,
                        ViewCount    = v.ViewCount
                    })
                .ToListAsync();

            return Ok(ApiResponse<List<MostViewedProductDto>>.SuccessResponse(result));
        }

        // GET /api/analytics/conversion-rate?productId=X
        [HttpGet("conversion-rate")]
        public async Task<ActionResult<ApiResponse<ConversionRateDto>>> ConversionRate(
            [FromQuery] int productId)
        {
            var product = await _ctx.Products.FindAsync(productId);
            if (product == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Product not found"));

            var totalViews = await _ctx.ProductViewHistories
                .CountAsync(h => h.ProductId == productId);

            var cartAdds = await _ctx.CartItems
                .Include(ci => ci.Cart)
                .CountAsync(ci => ci.ProductId == productId);

            var rate = totalViews > 0
                ? Math.Round((double)cartAdds / totalViews * 100, 2)
                : 0;

            return Ok(ApiResponse<ConversionRateDto>.SuccessResponse(new ConversionRateDto
            {
                ProductId      = product.Id,
                ProductName    = product.Title,
                TotalViews     = totalViews,
                CartAdds       = cartAdds,
                ConversionRate = rate
            }));
        }
    }
}
