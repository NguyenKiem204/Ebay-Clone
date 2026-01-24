using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class VwProductListing
{
    public int? Id { get; set; }

    public string? Title { get; set; }

    public string? Slug { get; set; }

    public string? Description { get; set; }

    public decimal? Price { get; set; }

    public List<string>? Images { get; set; }

    public bool? IsAuction { get; set; }

    public DateTime? AuctionEndTime { get; set; }

    public string? Condition { get; set; }

    public string? Brand { get; set; }

    public int? ViewCount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? CategoryName { get; set; }

    public string? CategorySlug { get; set; }

    public string? SellerName { get; set; }

    public string? StoreName { get; set; }

    public int? StockQuantity { get; set; }

    public decimal? AvgRating { get; set; }

    public long? ReviewCount { get; set; }
}
