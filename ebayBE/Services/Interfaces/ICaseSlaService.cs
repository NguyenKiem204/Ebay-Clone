using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface ICaseSlaService
    {
        CaseSlaSnapshot EvaluateReturn(ReturnRequest returnRequest, DateTime? nowUtc = null);

        CaseSlaSnapshot EvaluateDispute(Dispute dispute, DateTime? nowUtc = null);
    }
}
