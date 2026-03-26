using System;

namespace ebay.Models;

public partial class CaseAttachment
{
    public int Id { get; set; }

    public int? ReturnRequestId { get; set; }

    public int? DisputeId { get; set; }

    public string FilePath { get; set; } = null!;

    public string OriginalFileName { get; set; } = null!;

    public string? ContentType { get; set; }

    public long FileSizeBytes { get; set; }

    public string? Label { get; set; }

    public string? EvidenceType { get; set; }

    public int? UploadedByUserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Dispute? Dispute { get; set; }

    public virtual ReturnRequest? ReturnRequest { get; set; }

    public virtual User? UploadedByUser { get; set; }
}
