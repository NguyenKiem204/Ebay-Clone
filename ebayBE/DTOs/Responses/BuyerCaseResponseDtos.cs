namespace ebay.DTOs.Responses
{
    public class BuyerCaseOrderSummaryResponseDto
    {
        public int Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string PaymentStatus { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = string.Empty;

        public string? ShippingStatus { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? DeliveredAt { get; set; }
    }

    public class BuyerCaseOrderItemSummaryResponseDto
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Image { get; set; }

        public string SellerDisplayName { get; set; } = string.Empty;

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal TotalPrice { get; set; }
    }

    public class BuyerCaseEventResponseDto
    {
        public int Id { get; set; }

        public string EventType { get; set; } = string.Empty;

        public string ActorType { get; set; } = string.Empty;

        public int? ActorUserId { get; set; }

        public string? ActorDisplayName { get; set; }

        public string Message { get; set; } = string.Empty;

        public string? MetadataJson { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class BuyerCaseEvidenceResponseDto
    {
        public int Id { get; set; }

        public string FilePath { get; set; } = string.Empty;

        public string OriginalFileName { get; set; } = string.Empty;

        public string? ContentType { get; set; }

        public long FileSizeBytes { get; set; }

        public string? Label { get; set; }

        public string? EvidenceType { get; set; }

        public int? UploadedByUserId { get; set; }

        public string? UploadedByDisplayName { get; set; }

        public DateTime UploadedAt { get; set; }
    }

    public class BuyerCaseSlaResponseDto
    {
        public string Stage { get; set; } = string.Empty;

        public string StageLabel { get; set; } = string.Empty;

        public DateTime? LastActivityAt { get; set; }

        public DateTime? DueBy { get; set; }

        public bool IsOverdue { get; set; }

        public bool ReminderSuggested { get; set; }

        public int AgeHours { get; set; }

        public int? HoursUntilDue { get; set; }

        public int? HoursOverdue { get; set; }
    }
}
