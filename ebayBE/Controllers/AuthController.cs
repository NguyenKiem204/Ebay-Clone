using System.Security.Claims;
using ebay.Attributes;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Interfaces.Services;
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

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
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

        [HttpPost("register")]
        [RateLimit("Register", 3, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register(
            [FromBody] RegisterRequestDto request)
        {
            _logger.LogInformation("Registration attempt for email: {Email}", request.Email);
            var result = await _authService.RegisterAsync(request, GetIpAddress());
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Đăng ký thành công"));
        }

        [HttpPost("login")]
        [RateLimit("Login", 5, 15, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login(
            [FromBody] LoginRequestDto request)
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);
            var result = await _authService.LoginAsync(request, GetIpAddress());
            return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Đăng nhập thành công"));
        }

        [HttpPost("refresh-token")]
        [RateLimit("RefreshToken", 10, 1, RateLimitPeriod.Minute)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken(
            [FromBody] RefreshTokenRequestDto request)
        {
            _logger.LogDebug("Refresh token attempt from IP: {IpAddress}", GetIpAddress());
            var result = await _authService.RefreshTokenAsync(request.RefreshToken, GetIpAddress());
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
            return Ok(ApiResponse<object>.SuccessResponse(null, "Đăng xuất thành công"));
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
        [RateLimit("ForgotPassword", 3, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<object>>> ForgotPassword(
            [FromBody] ForgotPasswordRequestDto request)
        {
            _logger.LogInformation("Password reset request for email: {Email}", request.Email);
            await _authService.SendPasswordResetEmailAsync(request.Email);
            return Ok(ApiResponse<object>.SuccessResponse(null, "Nếu email tồn tại, link reset mật khẩu đã được gửi"));
        }


        [HttpPost("reset-password")]
        [RateLimit("ResetPassword", 5, 1, RateLimitPeriod.Hour)]
        public async Task<ActionResult<ApiResponse<object>>> ResetPassword(
            [FromBody] ResetPasswordRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Token không được để trống"));
            }

            _logger.LogInformation("Password reset attempt with token");
            var result = await _authService.ResetPasswordAsync(request);

            if (!result)
            {
                _logger.LogWarning("Password reset failed - invalid or expired token");
                return BadRequest(ApiResponse<object>.ErrorResponse("Token không hợp lệ hoặc đã hết hạn"));
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
        public ActionResult<ApiResponse<object>> GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            _logger.LogDebug("Current user info retrieved for: {UserId}", userId);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                userId,
                username,
                email,
                role
            }, "Lấy thông tin user thành công"));
        }


        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }
    }
}


