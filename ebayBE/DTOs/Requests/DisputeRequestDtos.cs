namespace ebay.DTOs.Requests
{
    public class CreateInrClaimDto
    {
        public int OrderId { get; set; }

        public int? OrderItemId { get; set; }

        public string? ReasonCode { get; set; }

        public string Description { get; set; } = string.Empty;
    }

    public class CreateQualityIssueClaimDto
    {
        public int OrderId { get; set; }

        public int? OrderItemId { get; set; }

        public string CaseType { get; set; } = "snad";

        public string Description { get; set; } = string.Empty;
    }

    public class EscalateReturnRequestDto
    {
        public string Description { get; set; } = string.Empty;
    }

    public class EscalateInrClaimDto
    {
        public string Description { get; set; } = string.Empty;
    }
}
