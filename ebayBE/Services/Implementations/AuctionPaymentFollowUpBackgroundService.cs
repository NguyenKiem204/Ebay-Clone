using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class AuctionPaymentFollowUpBackgroundService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(10);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AuctionPaymentFollowUpBackgroundService> _logger;

        public AuctionPaymentFollowUpBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<AuctionPaymentFollowUpBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AuctionPaymentFollowUpBackgroundService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var followUpService = scope.ServiceProvider.GetRequiredService<IAuctionPaymentFollowUpService>();

                    var reminders = await followUpService.SendAuctionPaymentRemindersAsync(50, stoppingToken);
                    var cancelled = await followUpService.CancelOverdueAuctionOrdersAsync(50, stoppingToken);

                    if (reminders > 0 || cancelled > 0)
                    {
                        _logger.LogInformation(
                            "Auction payment follow-up processed. Reminders={Reminders}, Cancelled={Cancelled}",
                            reminders,
                            cancelled);
                    }
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Auction payment follow-up background job failed.");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }
    }
}
