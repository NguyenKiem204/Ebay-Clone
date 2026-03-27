using System.Security.Claims;
using ebay.Attributes;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly IConfiguration _configuration;

        public AuthController(IAuthService authService, ILogger<AuthController> logger, IConfiguration configuration)
        {
            _authService = authService;
            _logger = logger;
            _configuration = configuration;
        }

        private string GetIpAddress()
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            if (HttpContext.Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
            }
            else if (HttpContext.Request.Headers.ContainsKey("X-Real-IP"))
            {
                ipAddress = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            }

            return ipAddress ?? "unknown";
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.LogWarning("Unauthorized access attempt - missing UserId claim");
                throw new UnauthorizedAccessException("Token không chứa UserId claim");
            }
            return int.Parse(userIdClaim);
        }

        private void SetTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Set to true ONLY in production with HTTPS
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddHours(24) // Should match token expiry
            };
            Response.Cookies.Append("accessToken", token, cookieOptions);
        }

        private void ClearTokenCookie()
        {
            Response.Cookies.Delete("accessToken");
        }

        [HttpPost("register")]
        [RateLimit("Register", 100, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register(
            [FromBody] RegisterRequestDto request)
        {
            _logger.LogInformation("Registration attempt for email: {Email}", request.Email);
            var result = await _authService.RegisterAsync(request, GetIpAddress());
            
            if (!string.IsNullOrEmpty(result.AccessToken))
            {
                SetTokenCookie(result.AccessToken);
            }

            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP."));
        }

        [HttpPost("login")]
        [RateLimit("Login", 100, 15, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login(
            [FromBody] LoginRequestDto request)
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);
            var result = await _authService.LoginAsync(request, GetIpAddress());
            SetTokenCookie(result.AccessToken);
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Đăng nhập thành công"));
        }

        [HttpPost("social-login")]
        [RateLimit("SocialLogin", 100, 15, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> SocialLogin(
            [FromBody] SocialLoginRequestDto request)
        {
            _logger.LogInformation("Social login attempt for email: {Email}, provider: {Provider}", 
                request.Email, request.Provider);
            var result = await _authService.SocialLoginAsync(request, GetIpAddress());
            SetTokenCookie(result.AccessToken);
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Đăng nhập thành công"));
        }

        [HttpPost("refresh-token")]
        [RateLimit("RefreshToken", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken(
            [FromBody] RefreshTokenRequestDto request)
        {
            _logger.LogDebug("Refresh token attempt from IP: {IpAddress}", GetIpAddress());
            var result = await _authService.RefreshTokenAsync(request.RefreshToken, GetIpAddress());
            SetTokenCookie(result.AccessToken);
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Refresh token thành công"));
        }

        [HttpPost("revoke-token")]
        [Authorize]
        [RateLimit("RevokeToken", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<object>>> RevokeToken(
            [FromBody] RefreshTokenRequestDto request)
        {
            _logger.LogInformation("Token revocation request from user: {UserId}", GetCurrentUserId());
            await _authService.RevokeTokenAsync(request.RefreshToken, GetIpAddress());
            ClearTokenCookie();
            return Ok(ApiResponse<object>.SuccessResponse(null, "Thu hồi token thành công"));
        }


        [HttpPost("logout")]
        [Authorize]
        [RateLimit("Logout", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<object>>> Logout()
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("User logout: {UserId}", userId);
            await _authService.LogoutAsync(userId, GetIpAddress());
            ClearTokenCookie();
            return Ok(ApiResponse<object>.SuccessResponse(null, "Đăng xuất thành công"));
        }


        [HttpPost("verify-otp")]
        [RateLimit("VerifyOtp", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<object>>> VerifyOtp(
            [FromBody] VerifyOtpRequestDto request)
        {
            _logger.LogInformation("OTP verification attempt for: {Email}", request.Email);
            var result = await _authService.VerifyOtpAsync(request.Email, request.Otp);

            if (!result)
            {
                _logger.LogWarning("OTP verification failed for: {Email}", request.Email);
                return BadRequest(ApiResponse<object>.ErrorResponse("Mã OTP không hợp lệ hoặc đã hết hạn"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Xác thực email thành công"));
        }

        [HttpPost("resend-otp")]
        [RateLimit("ResendOtp", 5, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<object>>> ResendOtp(
            [FromBody] ResendOtpRequestDto request)
        {
            _logger.LogInformation("Resend OTP request for: {Email}", request.Email);
            var result = await _authService.ResendOtpAsync(request.Email);

            if (!result)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Không thể gửi lại mã OTP. Tài khoản có thể đã được xác thực."));
            }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Mã OTP mới đã được gửi"));
        }

        [HttpGet("verify-email")]
        [RateLimit("VerifyEmail", 10, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<object>>> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Token không được để trống"));
            }

            _logger.LogInformation("Email verification attempt with token");
            var result = await _authService.VerifyEmailAsync(token);

            if (!result)
            {
                _logger.LogWarning("Email verification failed - invalid or expired token");
                return BadRequest(ApiResponse<object>.ErrorResponse("Token không hợp lệ hoặc đã hết hạn"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Xác thực email thành công"));
        }


        [HttpPost("send-verification-email")]
        [RateLimit("ResendVerification", 5, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<object>>> SendVerificationEmail(
            [FromBody] ForgotPasswordRequestDto request)
        {
            _logger.LogInformation("Email verification resend request for: {Email}", request.Email);
            await _authService.SendEmailVerificationAsync(request.Email);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Email xác thực đã được gửi"));
        }


        [HttpPost("forgot-password")]
        [RateLimit("ForgotPassword", 5, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<object>>> ForgotPassword(
            [FromBody] ForgotPasswordRequestDto request)
        {
            _logger.LogInformation("Password reset request for email: {Email}", request.Email);
            var result = await _authService.ForgotPasswordAsync(request.Email);
            
            // Always return success to prevent user enumeration
            return Ok(ApiResponse<object>.SuccessResponse(null, "Nếu tài khoản tồn tại, mã OTP đã được gửi về email"));
        }


        [HttpPost("verify-reset-otp")]
        [RateLimit("VerifyResetOtp", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<object>>> VerifyResetOtp(
            [FromBody] VerifyOtpRequestDto request)
        {
            _logger.LogInformation("Password reset OTP verification attempt for: {Email}", request.Email);
            var result = await _authService.VerifyResetOtpAsync(request.Email, request.Otp);

            if (!result)
            {
                _logger.LogWarning("Password reset OTP verification failed for: {Email}", request.Email);
                return BadRequest(ApiResponse<object>.ErrorResponse("Mã OTP không hợp lệ hoặc đã hết hạn"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Xác thực mã OTP thành công, bạn có thể đặt lại mật khẩu"));
        }


        [HttpPost("reset-password")]
        [RateLimit("ResetPassword", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<object>>> ResetPassword(
            [FromBody] ResetPasswordRequestDto request)
        {
            _logger.LogInformation("Password reset attempt for email: {Email}", request.Email);
            var result = await _authService.ResetPasswordAsync(request.Email, request.Otp, request.NewPassword);

            if (!result)
            {
                _logger.LogWarning("Password reset failed for: {Email}", request.Email);
                return BadRequest(ApiResponse<object>.ErrorResponse("Mã OTP không hợp lệ hoặc đã hết hạn"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Đặt lại mật khẩu thành công"));
        }


        [HttpPost("change-password")]
        [Authorize]
        [RateLimit("ChangePassword", 5, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<object>>> ChangePassword(
            [FromBody] ChangePasswordRequestDto request)
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Password change request from user: {UserId}", userId);
            await _authService.ChangePasswordAsync(userId, request);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Đổi mật khẩu thành công"));
        }


        [HttpGet("me")]
        [Authorize]
        [RateLimit("GetCurrentUser", 100, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<object>>> GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            _logger.LogDebug("Current user info retrieved for: {UserId}", userId);
            
            var profile = await _authService.GetProfileAsync(userId);
            return Ok(ApiResponse<object>.SuccessResponse(profile, "Lấy thông tin user thành công"));
        }

        [HttpPost("verify-captcha")]
        [AllowAnonymous]
        [RateLimit("VerifyCaptcha", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<object>>> VerifyCaptcha([FromBody] CaptchaRequestDto request)
        {
            string secret = _configuration["HCaptchaSecret:Secret"];
            if (string.IsNullOrEmpty(secret))
            {
                _logger.LogError("HCaptchaSecret missing in appsettings.json.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse("Lỗi cấu hình server."));
            }

            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Token hCaptcha bị trống."));
            }

            using var client = new HttpClient();
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("secret", secret),
                new KeyValuePair<string, string>("response", request.Token)
            });

            try
            {
                var hcaptchaResponse = await client.PostAsync("https://hcaptcha.com/siteverify", content);
                var jsonString = await hcaptchaResponse.Content.ReadAsStringAsync();
                
                using var jsonDocument = System.Text.Json.JsonDocument.Parse(jsonString);
                var success = jsonDocument.RootElement.TryGetProperty("success", out var successProp) && successProp.GetBoolean();

                if (success)
                {
                    _logger.LogInformation("hCaptcha verified successfully for IP: {IP}", GetIpAddress());
                    Response.Cookies.Append("hcaptcha_verified", "true", new CookieOptions
                    {
                        HttpOnly = true,
                        SameSite = SameSiteMode.Lax,
                        IsEssential = true,
                        Expires = DateTimeOffset.UtcNow.AddMinutes(30)
                    });
                    return Ok(ApiResponse<object>.SuccessResponse(null, "Xác minh captcha thành công."));
                }
                
                _logger.LogWarning("hCaptcha verification failed. Response: {Response}", jsonString);
                return BadRequest(ApiResponse<object>.ErrorResponse("Xác minh thất bại. Vui lòng thử lại."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while verifying hCaptcha.");
                return StatusCode(500, ApiResponse<object>.ErrorResponse("Lỗi kết nối tới máy chủ xác minh."));
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            var userId = GetCurrentUserId();
            await _authService.UpdateProfileAsync(userId, request);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Cập nhật hồ sơ thành công"));
        }


        [HttpPost("upgrade-seller")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> UpgradeSeller()
        {
            var userId = GetCurrentUserId();
            await _authService.UpgradeToSellerAsync(userId);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Nâng cấp lên tài khoản người bán thành công. Bây giờ bạn có thể tạo cửa hàng!"));
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }
    }
}

