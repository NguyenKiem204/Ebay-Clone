using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Coupon
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string? Description { get; set; }

    public string DiscountType { get; set; } = null!;

    public decimal DiscountValue { get; set; }

    public decimal? MinOrderAmount { get; set; }

    public decimal? MaxDiscount { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int? MaxUsage { get; set; }

    public int MaxUsagePerUser { get; set; }

    public string CouponType { get; set; } = null!;

    public int? UsedCount { get; set; }

    public bool? IsActive { get; set; }

    public string? ApplicableTo { get; set; }

    public int? CategoryId { get; set; }

    public int? ProductId { get; set; }

    public int? StoreId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Category? Category { get; set; }

    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual Store? Store { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
