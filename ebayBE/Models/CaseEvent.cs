using System;

namespace ebay.Models;

public partial class CaseEvent
{
    public int Id { get; set; }

    public int? ReturnRequestId { get; set; }

    public int? DisputeId { get; set; }

    public string EventType { get; set; } = null!;

    public string ActorType { get; set; } = null!;

    public int? ActorUserId { get; set; }

    public string Message { get; set; } = null!;

    public string? MetadataJson { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? ActorUser { get; set; }

    public virtual Dispute? Dispute { get; set; }

    public virtual ReturnRequest? ReturnRequest { get; set; }
}
