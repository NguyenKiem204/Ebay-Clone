namespace ebay.DTOs.Requests
{
    public class UpsertSellerOrderTrackingDto
    {
        public string Carrier { get; set; } = string.Empty;
        public string TrackingNumber { get; set; } = string.Empty;
        public DateTime? EstimatedArrival { get; set; }
    }

    public class UpdateSellerOrderShipmentStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
