using System;

namespace ebay.DTOs.Responses
{
    public class BidResponseDto
    {
        public int Id { get; set; }
        public int BidderId { get; set; }
        public string BidderName { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal? MaxAmount { get; set; }
        public DateTime BidTime { get; set; }
        public bool IsWinning { get; set; }
        public bool IsRetracted { get; set; }
    }

    public class AuctionStateResponseDto
    {
        public int ProductId { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal MinimumNextBid { get; set; }
        public decimal? ReservePrice { get; set; }
        public bool ReserveMet { get; set; }
        public bool BuyItNowAvailable { get; set; }
        public decimal? BuyItNowPrice { get; set; }
        public int BidCount { get; set; }
        public int? WinningBidderId { get; set; }
        public DateTime? AuctionEndTime { get; set; }
        public string AuctionStatus { get; set; } = "live";
        public bool IsCurrentUserWinning { get; set; }
    }

    public class BidPlacementResponseDto
    {
        public AuctionStateResponseDto AuctionState { get; set; } = new();
        public BidResponseDto Bid { get; set; } = new();
    }
}
