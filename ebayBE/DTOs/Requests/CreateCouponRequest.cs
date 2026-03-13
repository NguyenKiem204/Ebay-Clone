namespace ebay.DTOs.Requests
{
    public class CreateCouponRequest
    {
        public string Code { get; set; } = null!;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = null!; // "percentage" or "fixed"
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public decimal? MaxDiscount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? MaxUsage { get; set; }
        public int? ProductId { get; set; }
        public int? CategoryId { get; set; }
    }
}
