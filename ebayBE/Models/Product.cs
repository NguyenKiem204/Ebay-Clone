using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Product
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public List<string>? Images { get; set; }

    public int? CategoryId { get; set; }

    public int SellerId { get; set; }

    public int? StoreId { get; set; }

    public bool? IsAuction { get; set; }

    public DateTime? AuctionStartTime { get; set; }

    public DateTime? AuctionEndTime { get; set; }

    public decimal? StartingBid { get; set; }

    public decimal? ReservePrice { get; set; }

    public decimal? BuyItNowPrice { get; set; }

    public decimal? CurrentBidPrice { get; set; }

    public int? WinningBidderId { get; set; }

    public string? AuctionStatus { get; set; }

    public DateTime? EndedAt { get; set; }

    public string? Condition { get; set; }

    public string? Brand { get; set; }

    public decimal? Weight { get; set; }

    public string? Dimensions { get; set; }

    public bool? IsActive { get; set; }

    public string? Status { get; set; }

    public int? Stock { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal? OriginalPrice { get; set; }

    public int? ViewCount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Bid> Bids { get; set; } = new List<Bid>();

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<Coupon> Coupons { get; set; } = new List<Coupon>();

    public virtual Inventory? Inventory { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual User Seller { get; set; } = null!;

    public virtual Store? Store { get; set; }

    public virtual ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();

    public virtual ICollection<WatchlistItem> WatchlistItems { get; set; } = new List<WatchlistItem>();
}
