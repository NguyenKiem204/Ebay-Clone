using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, string ipAddress);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string ipAddress);
        Task<AuthResponseDto> RefreshTokenAsync(string token, string ipAddress);
        Task RevokeTokenAsync(string token, string ipAddress);
        Task<bool> VerifyEmailAsync(string token);
        Task SendEmailVerificationAsync(string email);
        Task SendPasswordResetEmailAsync(string email);
        Task<bool> ResetPasswordAsync(ResetPasswordRequestDto request);
        Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
        Task LogoutAsync(int userId, string ipAddress);
        Task<object> GetProfileAsync(int userId);
        Task UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
        Task UpgradeToSellerAsync(int userId);
    }
}
