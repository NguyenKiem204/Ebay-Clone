using Microsoft.AspNetCore.Http;

namespace ebay.DTOs.Requests
{
    public class UpdateProductRequest
    {
        public string? Status { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public int? CategoryId { get; set; }
        public string? Condition { get; set; }
        public string? Brand { get; set; }
        public int? Stock { get; set; }
        public decimal? ShippingFee { get; set; }
        public decimal? OriginalPrice { get; set; }
        public bool? IsAuction { get; set; }
        public decimal? StartingBid { get; set; }
        public decimal? ReservePrice { get; set; }
        public decimal? BuyItNowPrice { get; set; }
        public int? AuctionDurationDays { get; set; }
        public int? AuctionDurationMinutes { get; set; }
        public decimal? Weight { get; set; }
        public string? Dimensions { get; set; }
        /// <summary>
        /// Danh sách URL ảnh cũ cần giữ lại (những ảnh không có trong list này sẽ bị xoá)
        /// </summary>
        public List<string>? ExistingImages { get; set; }
        /// <summary>
        /// Ảnh mới upload thêm
        /// </summary>
        public List<IFormFile>? NewImages { get; set; }
    }
}
