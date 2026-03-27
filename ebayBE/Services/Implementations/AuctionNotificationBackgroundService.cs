using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class AuctionNotificationBackgroundService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AuctionNotificationBackgroundService> _logger;

        public AuctionNotificationBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<AuctionNotificationBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AuctionNotificationBackgroundService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var notificationService = scope.ServiceProvider.GetRequiredService<IAuctionNotificationService>();
                    var created = await notificationService.SendEndingSoonWatchlistNotificationsAsync(50, stoppingToken);

                    if (created > 0)
                    {
                        _logger.LogInformation("Auction notification job created {Count} ending-soon reminders.", created);
                    }
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Auction notification background job failed.");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }
    }
}
