using System.Text.Json.Serialization;

namespace ebay.DTOs.Responses
{
    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;

        [JsonIgnore]
        public string AccessToken { get; set; } = null!;

        public string RefreshToken { get; set; } = null!;

        [JsonIgnore]
        public DateTime AccessTokenExpires { get; set; }

        public DateTime RefreshTokenExpires { get; set; }
    }
}
