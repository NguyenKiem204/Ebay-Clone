using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Review
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int ReviewerId { get; set; }

    public int? OrderId { get; set; }

    public int Rating { get; set; }

    public string? Title { get; set; }

    public string? Comment { get; set; }

    public List<string>? Images { get; set; }

    public bool? IsVerifiedPurchase { get; set; }

    public int? HelpfulCount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual User Reviewer { get; set; } = null!;
}
