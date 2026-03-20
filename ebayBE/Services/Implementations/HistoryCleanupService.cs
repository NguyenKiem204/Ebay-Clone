using ebay.Models;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    /// <summary>
    /// Background service that runs daily at 03:00 UTC to remove expired view history rows.
    /// Respects TTL: 30 days for guests, 90 days for logged-in users.
    /// </summary>
    public class HistoryCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<HistoryCleanupService> _logger;

        public HistoryCleanupService(IServiceScopeFactory scopeFactory, ILogger<HistoryCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("HistoryCleanupService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                // Calculate next 03:00 UTC run
                var now = DateTime.UtcNow;
                var next = now.Date.AddHours(3);
                if (now.Hour >= 3) next = next.AddDays(1);
                var delay = next - now;

                _logger.LogInformation("Next history cleanup scheduled at {Next}", next);
                await Task.Delay(delay, stoppingToken);

                try
                {
                    await RunCleanup(stoppingToken);
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Error during history cleanup.");
                }
            }
        }

        private async Task RunCleanup(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<EbayDbContext>();

            var cutoff = DateTime.UtcNow;
            var deleted = await ctx.ProductViewHistories
                .Where(h => h.ExpiresAt < cutoff)
                .ExecuteDeleteAsync(ct);

            _logger.LogInformation("History cleanup: deleted {Count} expired rows.", deleted);
        }
    }
}
