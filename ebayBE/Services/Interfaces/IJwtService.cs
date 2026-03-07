using System.Security.Claims;

namespace ebay.Services.Interfaces
{
    public interface IJwtService
    {
        string GenerateAccessToken(int userId, string email, string username, string role);
        string GenerateRefreshToken();
        string HashRefreshToken(string refreshToken);
        bool VerifyRefreshToken(string refreshToken, string hashedToken);
        ClaimsPrincipal? ValidateToken(string token);
        int? GetUserIdFromToken(string token);
    }
}
