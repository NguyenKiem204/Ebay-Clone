using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class VwOrderSummary
{
    public int? Id { get; set; }

    public string? OrderNumber { get; set; }

    public int? BuyerId { get; set; }

    public string? BuyerName { get; set; }

    public string? BuyerEmail { get; set; }

    public decimal? TotalPrice { get; set; }

    public string? Status { get; set; }

    public DateTime? OrderDate { get; set; }

    public string? PaymentStatus { get; set; }

    public string? ShippingStatus { get; set; }

    public string? TrackingNumber { get; set; }
}
