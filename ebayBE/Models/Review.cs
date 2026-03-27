using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Review
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int ReviewerId { get; set; }

    public int? OrderId { get; set; }

    public int? OrderItemId { get; set; }

    public int Rating { get; set; }

    public string? Title { get; set; }

    public string? Comment { get; set; }

    public List<string>? Images { get; set; }

    public bool? IsVerifiedPurchase { get; set; }

    public int? HelpfulCount { get; set; }

    public string? Status { get; set; }

    public string? SellerReply { get; set; }

    public int? SellerReplyByUserId { get; set; }

    public DateTime? SellerReplyCreatedAt { get; set; }

    public DateTime? SellerReplyUpdatedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual OrderItem? OrderItem { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual ICollection<ReviewHelpfulVote> ReviewHelpfulVotes { get; set; } = new List<ReviewHelpfulVote>();

    public virtual ICollection<ReviewReport> ReviewReports { get; set; } = new List<ReviewReport>();

    public virtual User Reviewer { get; set; } = null!;

    public virtual User? SellerReplyByUser { get; set; }
}
