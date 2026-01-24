using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class SellerFeedback
{
    public int Id { get; set; }

    public int SellerId { get; set; }

    public decimal? AverageRating { get; set; }

    public int? TotalReviews { get; set; }

    public int? PositiveCount { get; set; }

    public int? NeutralCount { get; set; }

    public int? NegativeCount { get; set; }

    public DateTime? LastUpdated { get; set; }

    public virtual User Seller { get; set; } = null!;
}
