namespace ebay.Services.Interfaces;

public interface ICheckoutCoreService
{
    Task<CheckoutCoreResult> PrepareAsync(IEnumerable<CheckoutCoreItemRequest> items, CancellationToken cancellationToken = default);
}

public sealed record CheckoutCoreItemRequest
{
    public int ProductId { get; init; }

    public int Quantity { get; init; }
}

public sealed record CheckoutCoreIssue
{
    public int? ProductId { get; init; }

    public string Code { get; init; } = string.Empty;

    public string Message { get; init; } = string.Empty;
}

public sealed record CheckoutCoreNormalizedItem
{
    public int ProductId { get; init; }

    public string Title { get; init; } = string.Empty;

    public int SellerId { get; init; }

    public int Quantity { get; init; }

    public decimal UnitPrice { get; init; }

    public decimal LineSubtotal { get; init; }

    public decimal ShippingFee { get; init; }

    public decimal LineTotal { get; init; }

    public int AvailableStock { get; init; }

    public bool IsAuction { get; init; }
}

public sealed record CheckoutCoreResult
{
    public bool IsValid { get; init; }

    public bool GuestPhase1Eligible { get; init; }

    public IReadOnlyList<CheckoutCoreNormalizedItem> NormalizedItems { get; init; } = Array.Empty<CheckoutCoreNormalizedItem>();

    public IReadOnlyList<CheckoutCoreIssue> Issues { get; init; } = Array.Empty<CheckoutCoreIssue>();

    public decimal Subtotal { get; init; }

    public decimal ShippingFee { get; init; }

    public decimal DiscountAmount { get; init; }

    public decimal Tax { get; init; }

    public decimal TotalAmount { get; init; }
}
