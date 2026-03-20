namespace ebay.DTOs.Requests
{
    public class SellerProductSearchRequest
    {
        public string? Keyword { get; set; }
        /// <summary>
        /// Filter by status: "active", "hidden", or null for all
        /// </summary>
        public string? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
