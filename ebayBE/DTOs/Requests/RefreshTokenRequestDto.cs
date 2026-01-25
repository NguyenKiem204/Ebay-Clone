using System.ComponentModel.DataAnnotations;

namespace ebay.DTOs.Requests
{
    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = null!;
    }
}
