using System;

namespace ebay.Models;

public partial class SellerTransactionFeedback
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int OrderItemId { get; set; }

    public int SellerId { get; set; }

    public int BuyerId { get; set; }

    public string Sentiment { get; set; } = null!;

    public string? Comment { get; set; }

    public string Status { get; set; } = "published";

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual OrderItem OrderItem { get; set; } = null!;

    public virtual User Seller { get; set; } = null!;

    public virtual User Buyer { get; set; } = null!;
}
