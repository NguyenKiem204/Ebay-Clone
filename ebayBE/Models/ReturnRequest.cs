using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class ReturnRequest
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int? OrderItemId { get; set; }

    public int? UserId { get; set; }

    public string RequestType { get; set; } = "return";

    public string? ReasonCode { get; set; }

    public string Reason { get; set; } = null!;

    public string ResolutionType { get; set; } = "refund";

    public string Status { get; set; } = null!;

    public string? AdminNotes { get; set; }

    public decimal? RefundAmount { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime? RejectedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<CaseAttachment> CaseAttachments { get; set; } = new List<CaseAttachment>();

    public virtual Order Order { get; set; } = null!;

    public virtual OrderItem? OrderItem { get; set; }

    public virtual User? User { get; set; }
}
