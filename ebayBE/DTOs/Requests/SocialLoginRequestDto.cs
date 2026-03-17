namespace ebay.DTOs.Requests
{
    public class SocialLoginRequestDto
    {
        public string Email { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string Provider { get; set; } = null!; // google, facebook, apple
        public string ProviderId { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? IdToken { get; set; }
        public string? AccessToken { get; set; }
    }
}
