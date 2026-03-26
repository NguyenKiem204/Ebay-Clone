using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class AuctionSettlementBackgroundService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AuctionSettlementBackgroundService> _logger;

        public AuctionSettlementBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<AuctionSettlementBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AuctionSettlementBackgroundService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var settlementService = scope.ServiceProvider.GetRequiredService<IAuctionSettlementService>();
                    var settledCount = await settlementService.FinalizeDueAuctionsAsync(50, stoppingToken);

                    if (settledCount > 0)
                    {
                        _logger.LogInformation("Auction settlement job finalized {Count} auctions.", settledCount);
                    }
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Auction settlement background job failed.");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }
    }
}
