using System;

namespace ebay.Models;

public partial class ReviewReport
{
    public int Id { get; set; }

    public int ReviewId { get; set; }

    public int ReporterId { get; set; }

    public string Reason { get; set; } = null!;

    public string? Details { get; set; }

    public string Status { get; set; } = "open";

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Review Review { get; set; } = null!;

    public virtual User Reporter { get; set; } = null!;
}
