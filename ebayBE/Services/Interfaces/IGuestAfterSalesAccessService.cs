namespace ebay.Services.Interfaces
{
    public interface IGuestAfterSalesAccessService
    {
        Task<GuestAfterSalesAccessDecision> ValidateOrderAccessAsync(
            GuestAfterSalesAccessRequest request,
            CancellationToken cancellationToken = default);
    }
}
