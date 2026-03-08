using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class BidService : IBidService
    {
        private readonly EbayDbContext _context;

        public BidService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<BidResponseDto> PlaceBidAsync(int productId, int bidderId, decimal amount)
        {
            var product = await _context.Products
                .Include(p => p.Bids)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                throw new Exception("Product not found");

            if (product.IsAuction != true)
                throw new Exception("This product is not an auction");

            if (product.AuctionEndTime < DateTime.UtcNow)
                throw new Exception("Auction has already ended");

            var currentMaxBid = product.Bids.Any() ? product.Bids.Max(b => b.Amount) : (product.StartingBid ?? 0);

            if (amount <= currentMaxBid)
                throw new Exception($"Bid must be higher than current max bid ({currentMaxBid})");

            // Reset previous winning bids
            foreach (var b in product.Bids)
            {
                b.IsWinning = false;
            }

            var bid = new Bid
            {
                ProductId = productId,
                BidderId = bidderId,
                Amount = amount,
                BidTime = DateTime.UtcNow,
                IsWinning = true
            };

            _context.Bids.Add(bid);
            await _context.SaveChangesAsync();

            // Fetch with bidder name for response
            var savedBid = await _context.Bids
                .Include(b => b.Bidder)
                .FirstAsync(b => b.Id == bid.Id);

            return MapToResponse(savedBid);
        }

        public async Task<List<BidResponseDto>> GetBidsByProductIdAsync(int productId)
        {
            var bids = await _context.Bids
                .Include(b => b.Bidder)
                .Where(b => b.ProductId == productId)
                .OrderByDescending(b => b.Amount)
                .ToListAsync();

            return bids.Select(MapToResponse).ToList();
        }

        public async Task<BidResponseDto?> GetWinningBidAsync(int productId)
        {
            var winningBid = await _context.Bids
                .Include(b => b.Bidder)
                .Where(b => b.ProductId == productId && b.IsWinning == true)
                .FirstOrDefaultAsync();

            return winningBid != null ? MapToResponse(winningBid) : null;
        }

        private BidResponseDto MapToResponse(Bid bid)
        {
            return new BidResponseDto
            {
                Id = bid.Id,
                BidderId = bid.BidderId,
                BidderName = bid.Bidder.Username,
                Amount = bid.Amount,
                BidTime = bid.BidTime ?? DateTime.UtcNow,
                IsWinning = bid.IsWinning ?? false
            };
        }
    }
}
