namespace ebay.DTOs.Requests
{
    public class ApproveReturnRequestDto
    {
        public string? Note { get; set; }

        public decimal? RefundAmount { get; set; }
    }

    public class RejectReturnRequestDto
    {
        public string? Note { get; set; }
    }

    public class CompleteReturnRequestDto
    {
        public string? Note { get; set; }

        public decimal? RefundAmount { get; set; }
    }
}
