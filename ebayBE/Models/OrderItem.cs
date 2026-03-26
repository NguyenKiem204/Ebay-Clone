using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int SellerId { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }

    public string? ProductTitleSnapshot { get; set; }

    public string? ProductImageSnapshot { get; set; }

    public string? SellerDisplayNameSnapshot { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;

    public virtual User Seller { get; set; } = null!;
}
