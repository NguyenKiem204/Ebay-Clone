namespace ebay.Services.Interfaces
{
    public interface IAuctionSettlementService
    {
        Task<bool> FinalizeAuctionIfDueAsync(int productId, CancellationToken cancellationToken = default);
        Task<int> FinalizeDueAuctionsAsync(int batchSize = 50, CancellationToken cancellationToken = default);
    }
}
