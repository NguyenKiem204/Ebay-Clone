using System.Collections.Generic;
using System.Threading.Tasks;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IBidService
    {
        Task<BidResponseDto> PlaceBidAsync(int productId, int bidderId, decimal amount);
        Task<List<BidResponseDto>> GetBidsByProductIdAsync(int productId);
        Task<BidResponseDto?> GetWinningBidAsync(int productId);
    }
}
