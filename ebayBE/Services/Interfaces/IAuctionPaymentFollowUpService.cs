namespace ebay.Services.Interfaces
{
    public interface IAuctionPaymentFollowUpService
    {
        Task<int> SendAuctionPaymentRemindersAsync(int batchSize = 50, CancellationToken cancellationToken = default);
        Task<int> CancelOverdueAuctionOrdersAsync(int batchSize = 50, CancellationToken cancellationToken = default);
    }
}
