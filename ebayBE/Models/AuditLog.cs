using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class AuditLog
{
    public int Id { get; set;  }

    public string TableName { get; set; } = null!;

    public int RecordId { get; set; }

    public string Action { get; set; } = null!;

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public int? ChangedBy { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? ChangedByNavigation { get; set; }
}
