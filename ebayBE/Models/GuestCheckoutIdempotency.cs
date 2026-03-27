using System;

namespace ebay.Models;

public partial class GuestCheckoutIdempotency
{
    public int Id { get; set; }

    public string IdempotencyKey { get; set; } = null!;

    public string RequestHash { get; set; } = null!;

    public string Status { get; set; } = null!;

    public int? OrderId { get; set; }

    public string? ResponsePayload { get; set; }

    public DateTime ProcessingExpiresAt { get; set; }

    public DateTime ReplayExpiresAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Order? Order { get; set; }
}
