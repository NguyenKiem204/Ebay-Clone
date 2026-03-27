using System;

namespace ebay.Models;

public partial class OrderCancellationRequest
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int RequestedByUserId { get; set; }

    public int? ResolvedByUserId { get; set; }

    public string Status { get; set; } = null!;

    public string? Reason { get; set; }

    public string? SellerResponse { get; set; }

    public DateTime? RespondedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Order Order { get; set; } = null!;
}
