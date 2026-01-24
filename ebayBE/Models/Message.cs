using System;
using System.Collections.Generic;

namespace ebay.Models;

public partial class Message
{
    public int Id { get; set; }

    public int SenderId { get; set; }

    public int ReceiverId { get; set; }

    public string? Subject { get; set; }

    public string Content { get; set; } = null!;

    public bool? IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public int? ParentMessageId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Message> InverseParentMessage { get; set; } = new List<Message>();

    public virtual Message? ParentMessage { get; set; }

    public virtual User Receiver { get; set; } = null!;

    public virtual User Sender { get; set; } = null!;
}
