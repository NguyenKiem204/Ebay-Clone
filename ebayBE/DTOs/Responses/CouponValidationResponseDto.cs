namespace ebay.DTOs.Responses
{
    public class CouponValidationResponseDto
    {
        public bool Valid { get; set; }
        public string? Message { get; set; }
        public int? CouponId { get; set; }
        public string? Code { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? Description { get; set; }
    }
}
