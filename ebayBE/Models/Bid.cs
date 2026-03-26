using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Bid
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int BidderId { get; set; }

    public decimal Amount { get; set; }

    public decimal? MaxAmount { get; set; }

    public DateTime? BidTime { get; set; }

    public bool? IsWinning { get; set; }

    public bool? IsRetracted { get; set; }

    public DateTime? RetractedAt { get; set; }

    public virtual User Bidder { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
