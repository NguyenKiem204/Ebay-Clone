using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Dispute
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int? OrderItemId { get; set; }

    public int? RaisedBy { get; set; }

    public string CaseType { get; set; } = "other";

    public string Description { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? Resolution { get; set; }

    public int? EscalatedFromReturnRequestId { get; set; }

    public string? ClosedReason { get; set; }

    public int? ResolvedBy { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<CaseAttachment> CaseAttachments { get; set; } = new List<CaseAttachment>();

    public virtual Order Order { get; set; } = null!;

    public virtual ReturnRequest? EscalatedFromReturnRequest { get; set; }

    public virtual OrderItem? OrderItem { get; set; }

    public virtual User? RaisedByNavigation { get; set; }

    public virtual User? ResolvedByNavigation { get; set; }
}
