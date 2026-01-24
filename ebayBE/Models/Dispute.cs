using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Dispute
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int RaisedBy { get; set; }

    public string Description { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? Resolution { get; set; }

    public int? ResolvedBy { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual User RaisedByNavigation { get; set; } = null!;

    public virtual User? ResolvedByNavigation { get; set; }
}
