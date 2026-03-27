using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Order
{
    public int Id { get; set; }

    public string OrderNumber { get; set; } = null!;

    public int? BuyerId { get; set; }

    public int? AddressId { get; set; }

    public string CustomerType { get; set; } = "member";

    public string? GuestFullName { get; set; }

    public string? GuestEmail { get; set; }

    public string? GuestPhone { get; set; }

    public string? ShipFullName { get; set; }

    public string? ShipPhone { get; set; }

    public string? ShipStreet { get; set; }

    public string? ShipCity { get; set; }

    public string? ShipState { get; set; }

    public string? ShipPostalCode { get; set; }

    public string? ShipCountry { get; set; }

    public DateTime? OrderDate { get; set; }

    public decimal Subtotal { get; set; }

    public decimal? ShippingFee { get; set; }

    public decimal? Tax { get; set; }

    public decimal TotalPrice { get; set; }

    public string Status { get; set; } = null!;

    public int? CouponId { get; set; }

    public decimal? DiscountAmount { get; set; }

    public string? Note { get; set; }

    public bool? IsAuctionOrder { get; set; }

    public DateTime? PaymentDueAt { get; set; }

    public DateTime? PaymentReminderSentAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Address? Address { get; set; }

    public virtual User? Buyer { get; set; }

    public virtual Coupon? Coupon { get; set; }

    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();

    public virtual ICollection<Dispute> Disputes { get; set; } = new List<Dispute>();

    public virtual ICollection<OrderCancellationRequest> OrderCancellationRequests { get; set; } = new List<OrderCancellationRequest>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ICollection<ReturnRequest> ReturnRequests { get; set; } = new List<ReturnRequest>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<SellerTransactionFeedback> SellerTransactionFeedbacks { get; set; } = new List<SellerTransactionFeedback>();

    public virtual ShippingInfo? ShippingInfo { get; set; }
}
