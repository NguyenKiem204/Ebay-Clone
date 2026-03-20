using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ebay.DTOs.Requests
{
    public class UpdateCouponRequest
    {
        public string? Code { get; set; }
        public string? Description { get; set; }
        [Required]
        public string DiscountType { get; set; } = null!; // "percentage" or "fixed"
        [Range(0.01, double.MaxValue)]
        public decimal DiscountValue { get; set; }
        [Range(0, double.MaxValue, ErrorMessage = "Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 0")]
        public decimal? MinOrderAmount { get; set; }
        public decimal? MaxDiscount { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        public int? MaxUsage { get; set; }
        public int MaxUsagePerUser { get; set; } = 1;
        public string CouponType { get; set; } = "discount";
        [Required]
        public string ApplicableTo { get; set; } = "all";
        public int? ProductId { get; set; }
        public int? CategoryId { get; set; }
        [Required]
        public int? StoreId { get; set; }
        public List<int?>? ProductIds { get; set; }
        public bool IsActive { get; set; }
    }
}
