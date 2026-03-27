namespace ebay.DTOs.Responses
{
    public class GuestCaseListResponseDto
    {
        public List<BuyerCaseListItemResponseDto> Cases { get; set; } = new();

        public GuestAfterSalesAccessResponseDto? AfterSalesAccess { get; set; }
    }

    public class GuestReturnCaseDetailResponseDto
    {
        public ReturnRequestResponseDto Case { get; set; } = new();

        public GuestAfterSalesAccessResponseDto? AfterSalesAccess { get; set; }
    }

    public class GuestDisputeCaseDetailResponseDto
    {
        public DisputeResponseDto Case { get; set; } = new();

        public GuestAfterSalesAccessResponseDto? AfterSalesAccess { get; set; }
    }
}
