namespace ebay.Models;

public partial class ProductViewHistory
{
    public int Id { get; set; }

    /// <summary>NULL for guest rows (identified by CookieId instead)</summary>
    public int? UserId { get; set; }

    /// <summary>UUID cookie for anonymous visitors</summary>
    public string? CookieId { get; set; }

    public int ProductId { get; set; }

    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Auto-set TTL: 30 days for guests, 90 days for users</summary>
    public DateTime ExpiresAt { get; set; }

    public virtual Product Product { get; set; } = null!;
    public virtual User? User { get; set; }
}
