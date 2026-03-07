using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Order
{
    public int Id { get; set; }

    public string OrderNumber { get; set; } = null!;

    public int BuyerId { get; set; }

    public int AddressId { get; set; }

    public DateTime? OrderDate { get; set; }

    public decimal Subtotal { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal? Tax { get; set; }

    public decimal TotalPrice { get; set; }

    public string Status { get; set; } = null!;

    public int? CouponId { get; set; }

    public decimal? DiscountAmount { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Address Address { get; set; } = null!;

    public virtual User Buyer { get; set; } = null!;

    public virtual Coupon? Coupon { get; set; }

    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();

    public virtual ICollection<Dispute> Disputes { get; set; } = new List<Dispute>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ICollection<ReturnRequest> ReturnRequests { get; set; } = new List<ReturnRequest>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ShippingInfo? ShippingInfo { get; set; }
}
