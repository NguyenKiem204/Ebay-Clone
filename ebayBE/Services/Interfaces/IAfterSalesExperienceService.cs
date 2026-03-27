using ebay.DTOs.Responses;
using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface IAfterSalesExperienceService
    {
        OrderAfterSalesSummaryResponseDto BuildOrderAfterSalesSummary(Order order, bool isGuest);
    }
}
