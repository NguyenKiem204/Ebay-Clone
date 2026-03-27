using System.Collections.Generic;
using System.Threading.Tasks;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IBidService
    {
        Task<BidPlacementResponseDto> PlaceBidAsync(int productId, int bidderId, decimal amount);
        Task<List<BidResponseDto>> GetBidsByProductIdAsync(int productId);
        Task<BidResponseDto?> GetWinningBidAsync(int productId);
        Task<AuctionStateResponseDto> GetAuctionStateAsync(int productId, int? currentUserId = null);
        Task<PagedResponseDto<MyAuctionItemResponseDto>> GetMyAuctionsAsync(int bidderId, string? status, int page, int pageSize);
    }
}
