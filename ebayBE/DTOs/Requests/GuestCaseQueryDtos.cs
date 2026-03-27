namespace ebay.DTOs.Requests
{
    public class GuestCaseAccessRequestDto
    {
        public string OrderNumber { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? AccessToken { get; set; }
    }
}
