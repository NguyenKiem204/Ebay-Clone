using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Store
{
    public int Id { get; set; }

    public int SellerId { get; set; }

    public string StoreName { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Description { get; set; }

    public string? BannerImageUrl { get; set; }

    public string? LogoUrl { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<Coupon> Coupons { get; set; } = new List<Coupon>();

    public virtual User Seller { get; set; } = null!;
}
