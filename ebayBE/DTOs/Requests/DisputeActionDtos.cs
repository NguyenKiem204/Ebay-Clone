namespace ebay.DTOs.Requests
{
    public class AcknowledgeDisputeDto
    {
    }

    public class MarkDisputeInProgressDto
    {
    }

    public class ResolveDisputeDto
    {
        public string Resolution { get; set; } = string.Empty;

        public string? FinancialOutcome { get; set; }

        public decimal? FinancialAmount { get; set; }
    }

    public class CloseDisputeDto
    {
        public string ClosedReason { get; set; } = string.Empty;
    }
}
