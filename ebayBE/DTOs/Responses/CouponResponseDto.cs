using System;

namespace ebay.DTOs.Responses
{
    public class CouponResponseDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = null!;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = null!;
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public decimal? MaxDiscount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? MaxUsage { get; set; }
        public int MaxUsagePerUser { get; set; }
        public string CouponType { get; set; } = null!;
        public int? UsedCount { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? CategoryId { get; set; }
        public int? ProductId { get; set; }
        public int? StoreId { get; set; }
        public string? StoreName { get; set; }
        public string? CategoryName { get; set; }
        public string? ApplicableTo { get; set; }
        public List<int>? SelectedProductIds { get; set; }
        public List<string>? SelectedProductTitles { get; set; }
        public List<ProductResponseDto>? Products { get; set; }

        // Formatted properties for UI
        public string Status => GetStatus();
        public string DisplayDiscount => DiscountType == "percentage" ? $"{DiscountValue}%" : $"{DiscountValue:N0}đ";

        private string GetStatus()
        {
            if (IsActive == false) return "Inactive";
            if (DateTime.UtcNow < StartDate) return "Scheduled";
            if (DateTime.UtcNow > EndDate) return "Expired";
            return "Active";
        }
    }
}
