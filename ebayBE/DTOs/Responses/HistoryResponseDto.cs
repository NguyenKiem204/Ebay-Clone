namespace ebay.DTOs.Responses;

public class HistoryItemResponseDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string? ProductImage { get; set; }
    public decimal Price { get; set; }
    public decimal ShippingFee { get; set; }
    public string? SellerName { get; set; }
    public DateTime ViewedAt { get; set; }
}

public class MostViewedProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string? ProductImage { get; set; }
    public decimal Price { get; set; }
    public int ViewCount { get; set; }
}

public class ConversionRateDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public int TotalViews { get; set; }
    public int CartAdds { get; set; }
    public double ConversionRate { get; set; }
}
