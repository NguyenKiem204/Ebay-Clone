namespace ebay.DTOs.Requests
{
    public class ProductSearchRequestDto
    {
        public string? Keyword { get; set; }
        public int? CategoryId { get; set; }
        public List<string>? CategorySlugs { get; set; }
        public string? Condition { get; set; } // new, used, refurbished
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool? IsAuction { get; set; }
        public bool? EndingSoon { get; set; }
        public string? SortBy { get; set; } // relevance, newest, price_asc, price_desc, popular, ending_soonest, most_bids
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
