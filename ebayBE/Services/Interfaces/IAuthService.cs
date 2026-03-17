using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, string ipAddress);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string ipAddress);
        Task<AuthResponseDto> SocialLoginAsync(SocialLoginRequestDto request, string ipAddress);
        Task<AuthResponseDto> RefreshTokenAsync(string token, string ipAddress);
        Task RevokeTokenAsync(string token, string ipAddress);
        Task<bool> VerifyOtpAsync(string email, string otp);
        Task<bool> ResendOtpAsync(string email);
        Task<bool> ForgotPasswordAsync(string email);
        Task<bool> VerifyResetOtpAsync(string email, string otp);
        Task<bool> ResetPasswordAsync(string email, string otp, string newPassword);
        Task<bool> VerifyEmailAsync(string token);
        Task SendEmailVerificationAsync(string email);
        Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
        Task LogoutAsync(int userId, string ipAddress);
        Task<object> GetProfileAsync(int userId);
        Task UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    }
}
