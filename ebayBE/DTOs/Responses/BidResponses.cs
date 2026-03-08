using System;

namespace ebay.DTOs.Responses
{
    public class BidResponseDto
    {
        public int Id { get; set; }
        public int BidderId { get; set; }
        public string BidderName { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateTime BidTime { get; set; }
        public bool IsWinning { get; set; }
    }
}
