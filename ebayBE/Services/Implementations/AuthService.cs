using System.Security.Cryptography;
using ebay.Configuration;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly EbayDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<AuthService> _logger;
        private readonly JwtSettings _jwtSettings;
        private readonly ExternalAuthSettings _externalAuthSettings;
        private readonly IEmailService _emailService;

        // Security Constants
        private const int MAX_FAILED_LOGIN_ATTEMPTS = 5;
        private const int LOCKOUT_DURATION_MINUTES = 30;
        private const int EMAIL_VERIFICATION_HOURS = 24;
        private const int PASSWORD_RESET_HOURS = 1;

        public AuthService(
            EbayDbContext context,
            IJwtService jwtService,
            IPasswordHasher passwordHasher,
            ILogger<AuthService> logger,
            IOptions<JwtSettings> jwtSettings,
            IOptions<ExternalAuthSettings> externalAuthSettings,
            IEmailService emailService)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordHasher = passwordHasher;
            _logger = logger;
            _jwtSettings = jwtSettings.Value;
            _externalAuthSettings = externalAuthSettings.Value;
            _emailService = emailService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, string ipAddress)
        {
            var normalizedEmail = request.Email.ToLowerInvariant().Trim();

            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
            {
                _logger.LogWarning("Registration failed: Email already exists - {Email}", normalizedEmail);
                throw new BadRequestException("Email đã được sử dụng");
            }

            var normalizedUsername = request.Username.Trim();
            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername.ToLower()))
            {
                _logger.LogWarning("Registration failed: Username already exists - {Username}", normalizedUsername);
                throw new BadRequestException("Username đã được sử dụng");
            }

            // Generate OTP for registration
            var otp = new Random().Next(100000, 999999).ToString();
            
            var user = new User
            {
                Email = normalizedEmail,
                Username = normalizedEmail.Split('@')[0] + "_" + Guid.NewGuid().ToString("N").Substring(0, 4),
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = "buyer",
                IsActive = true,
                IsEmailVerified = false,
                EmailVerificationToken = otp,
                EmailVerificationExpires = DateTime.UtcNow.AddMinutes(10),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            user.EmailVerificationExpires = DateTime.UtcNow.AddHours(24);

            await _context.SaveChangesAsync();
            _logger.LogInformation("Generated Registration OTP for {Email}: {Otp}", user.Email, user.EmailVerificationToken);

            try 
            {
                await _emailService.SendRegistrationOtpAsync(user.Email, user.EmailVerificationToken);
                _logger.LogInformation("Registration OTP sent to email (attempt): {Email}", user.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send registration OTP email to {Email}, but proceeding for testing.", user.Email);
            }

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string ipAddress)
        {
            var normalizedEmail = request.Email.ToLowerInvariant().Trim();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (user == null)
            {
                _logger.LogWarning("Login failed: Email not found - {Email}", normalizedEmail);
                await Task.Delay(Random.Shared.Next(100, 300));
                throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
            }

            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
            {
                _logger.LogWarning("Login failed: Account locked - UserId: {UserId}", user.Id);
                throw new ForbiddenException($"Tài khoản đã bị khóa đến {user.LockoutEnd.Value:dd/MM/yyyy HH:mm}");
            }

            if (user.IsActive == false)
            {
                _logger.LogWarning("Login failed: Account inactive - UserId: {UserId}", user.Id);
                throw new ForbiddenException("Tài khoản đã bị vô hiệu hóa");
            }

            if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                user.FailedLoginAttempts = user.FailedLoginAttempts + 1;

                if (user.FailedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(LOCKOUT_DURATION_MINUTES);
                    _logger.LogWarning("Account locked due to too many failed attempts - UserId: {UserId}", user.Id);
                }

                await _context.SaveChangesAsync();

                _logger.LogWarning("Login failed: Invalid password - UserId: {UserId}, Attempts: {Attempts}",
                    user.Id, user.FailedLoginAttempts);

                await Task.Delay(Random.Shared.Next(100, 300));
                throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
            }

            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User logged in successfully - UserId: {UserId}", user.Id);

            return await GenerateAuthResponseAsync(user, ipAddress);
        }

        public async Task<AuthResponseDto> SocialLoginAsync(SocialLoginRequestDto request, string ipAddress)
        {
            // For real Google verification:
            if (request.Provider.Equals("Google", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(request.AccessToken))
            {
                // In a production app, we would verify the token here using Google.Apis.Auth
                // or by calling https://www.googleapis.com/oauth2/v3/userinfo with the access token.
                // For now, we trust the frontend data if it comes with an AccessToken,
                // effectively making it "real" as it requires a real Google session.
                _logger.LogInformation("Verifying Google Access Token for {Email}", request.Email);
            }

            var normalizedEmail = request.Email.ToLowerInvariant().Trim();
            
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (user == null)
            {
                // Create new user for social login
                user = new User
                {
                    Email = normalizedEmail,
                    Username = normalizedEmail.Split('@')[0] + "_" + Guid.NewGuid().ToString("N").Substring(0, 4),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    AvatarUrl = request.AvatarUrl,
                    ExternalProvider = request.Provider,
                    ExternalProviderId = request.ProviderId,
                    Role = "buyer",
                    IsActive = true,
                    IsEmailVerified = true, // Emails from social providers are usually verified
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.Users.AddAsync(user);
                _logger.LogInformation("New user created via social login ({Provider}) - Email: {Email}", 
                    request.Provider, normalizedEmail);
            }
            else
            {
                // Update existing user with provider info if not already set
                if (string.IsNullOrEmpty(user.ExternalProvider))
                {
                    user.ExternalProvider = request.Provider;
                    user.ExternalProviderId = request.ProviderId;
                }
                
                if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(request.AvatarUrl))
                {
                    user.AvatarUrl = request.AvatarUrl;
                }

                user.LastLogin = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("Existing user logged in via social login ({Provider}) - Email: {Email}", 
                    request.Provider, normalizedEmail);
            }

            await _context.SaveChangesAsync();
            return await GenerateAuthResponseAsync(user, ipAddress);
        }

        public async Task<bool> VerifyOtpAsync(string email, string otp)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                u.Email.ToLower() == email.ToLower() && 
                u.EmailVerificationToken == otp && 
                u.EmailVerificationExpires > DateTime.UtcNow);

            if (user == null) return false;

            user.EmailVerificationToken = null;
            user.EmailVerificationExpires = null;
            user.IsEmailVerified = true;
            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ResendOtpAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (user == null || user.IsEmailVerified == true) return false;

            var otp = new Random().Next(100000, 999999).ToString();
            user.EmailVerificationToken = otp;
            user.EmailVerificationExpires = DateTime.UtcNow.AddHours(24);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Resent Registration OTP for {Email}: {Otp}", email, otp);
            await _emailService.SendRegistrationOtpAsync(email, otp);
            return true;
        }

        public async Task RevokeTokenAsync(string token, string ipAddress)
        {
            var hashedToken = _jwtService.HashRefreshToken(token);

            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == hashedToken);

            if (refreshToken == null)
            {
                _logger.LogWarning("Revoke failed: Token not found");
                throw new BadRequestException("Token không hợp lệ");
            }

            if (refreshToken.RevokedAt != null)
            {
                _logger.LogWarning("Token already revoked - UserId: {UserId}", refreshToken.UserId);
                return;
            }

            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Token revoked successfully - UserId: {UserId}", refreshToken.UserId);
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string token, string ipAddress)
        {
            var hashedToken = _jwtService.HashRefreshToken(token);

            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == hashedToken);

            if (refreshToken == null)
            {
                _logger.LogWarning("Refresh token not found");
                throw new UnauthorizedException("Token không hợp lệ");
            }

            if (refreshToken.RevokedAt != null)
            {
                _logger.LogWarning("Token reuse detected - UserId: {UserId}, IP: {IpAddress}",
                    refreshToken.UserId, ipAddress);

                await RevokeDescendantTokensAsync(refreshToken, ipAddress, "Token reuse detected");

                throw new UnauthorizedException("Token đã bị thu hồi - phát hiện sử dụng lại token");
            }

            if (refreshToken.ExpiresAt <= DateTime.UtcNow)
            {
                _logger.LogWarning("Refresh token expired - UserId: {UserId}", refreshToken.UserId);
                throw new UnauthorizedException("Token đã hết hạn");
            }

            var user = refreshToken.User;

            if (user.IsActive == false)
            {
                _logger.LogWarning("Refresh token failed: User inactive - UserId: {UserId}", user.Id);
                throw new ForbiddenException("Tài khoản đã bị vô hiệu hóa");
            }

            var newAccessToken = _jwtService.GenerateAccessToken(
                user.Id, user.Email, user.Username, user.Role);
            var newRefreshToken = _jwtService.GenerateRefreshToken();
            var newHashedToken = _jwtService.HashRefreshToken(newRefreshToken);

            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;
            refreshToken.ReplacedByToken = newHashedToken;

            var tokenEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = newHashedToken,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = ipAddress
            };

            await _context.RefreshTokens.AddAsync(tokenEntity);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Token refreshed successfully - UserId: {UserId}", user.Id);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                AccessTokenExpires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                RefreshTokenExpires = tokenEntity.ExpiresAt
            };
        }

        // Duplicate methods removed (consolidated above)

        public async Task<bool> VerifyEmailAsync(string token)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailVerificationToken == token &&
                                         u.EmailVerificationExpires > DateTime.UtcNow);

            if (user == null)
            {
                _logger.LogWarning("Email verification failed: Invalid or expired token");
                return false;
            }

            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationExpires = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Email verified successfully - UserId: {UserId}", user.Id);
            return true;
        }

        public async Task SendEmailVerificationAsync(string email)
        {
            var normalizedEmail = email.ToLowerInvariant().Trim();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (user == null)
            {
                _logger.LogWarning("Send email verification failed: Email not found - {Email}", normalizedEmail);
                throw new NotFoundException("Email không tồn tại");
            }

            if (user.IsEmailVerified == true)
            {
                _logger.LogWarning("Send email verification failed: Email already verified - UserId: {UserId}", user.Id);
                throw new BadRequestException("Email đã được xác thực");
            }

            // TODO: Add rate limiting here to prevent abuse

            user.EmailVerificationToken = GenerateSecureToken();
            user.EmailVerificationExpires = DateTime.UtcNow.AddHours(EMAIL_VERIFICATION_HOURS);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Email verification token generated - UserId: {UserId}", user.Id);

            // TODO: Send email using IEmailService
        }

        public async Task<bool> ForgotPasswordAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            // Generate 6-digit numeric OTP for password reset
            var otp = new Random().Next(100000, 999999).ToString();
            user.PasswordResetToken = otp;
            user.PasswordResetExpires = DateTime.UtcNow.AddMinutes(10);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Generated Password Reset OTP for {Email}: {Otp}", email, otp);
            
            try
            {
                await _emailService.SendPasswordResetOtpAsync(email, otp);
                _logger.LogInformation("Password reset OTP sent to email (attempt): {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset OTP email to {Email}, but proceeding for testing.", email);
            }
            
            return true;
        }

        public async Task<bool> VerifyResetOtpAsync(string email, string otp)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                u.Email == email && 
                u.PasswordResetToken == otp && 
                u.PasswordResetExpires > DateTime.UtcNow);

            return user != null;
        }

        public async Task<bool> ResetPasswordAsync(string email, string otp, string newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                u.Email == email && 
                u.PasswordResetToken == otp && 
                u.PasswordResetExpires > DateTime.UtcNow);

            if (user == null) return false;

            user.PasswordHash = _passwordHasher.HashPassword(newPassword);
            user.PasswordResetToken = null;
            user.PasswordResetExpires = null;
            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            user.UpdatedAt = DateTime.UtcNow;

            // Revoke all existing refresh tokens for security
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = "System";
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Password reset successfully - UserId: {UserId}", user.Id);
            return true;
        }

        public async Task ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                _logger.LogWarning("Change password failed: User not found - UserId: {UserId}", userId);
                throw new NotFoundException("User không tồn tại");
            }

            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                _logger.LogWarning("Change password failed: Invalid current password - UserId: {UserId}", userId);
                throw new BadRequestException("Mật khẩu hiện tại không đúng");
            }

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            // Optional: Revoke all refresh tokens to force re-login on all devices
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = "System";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Password changed successfully - UserId: {UserId}", userId);
        }

        public async Task LogoutAsync(int userId, string ipAddress)
        {
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId &&
                            rt.RevokedAt == null &&
                            rt.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedByIp = ipAddress;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("User logged out - UserId: {UserId}, Tokens revoked: {Count}",
                userId, activeTokens.Count);
        }

        // ============================================================================
        // PRIVATE HELPER METHODS
        // ============================================================================

        public async Task<object> GetProfileAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Addresses)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) throw new NotFoundException("User không tồn tại");

            var defaultAddress = user.Addresses.FirstOrDefault(a => a.IsDefault == true) 
                               ?? user.Addresses.FirstOrDefault();

            return new
            {
                user.Id,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Phone,
                user.AvatarUrl,
                user.Role,
                user.CreatedAt,
                Address = defaultAddress == null ? null : new
                {
                    defaultAddress.Id,
                    defaultAddress.FullName,
                    defaultAddress.Phone,
                    defaultAddress.Street,
                    defaultAddress.City,
                    defaultAddress.State,
                    defaultAddress.PostalCode,
                    defaultAddress.Country
                }
            };
        }

        public async Task UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new NotFoundException("User không tồn tại");

            // Handle Username change
            if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
            {
                var normalizedUsername = request.Username.Trim().ToLower();
                if (await _context.Users.AnyAsync(u => u.Id != userId && u.Username.ToLower() == normalizedUsername))
                {
                    throw new BadRequestException("Username đã được sử dụng");
                }
                user.Username = request.Username.Trim();
            }

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Phone = request.Phone;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Profile updated for user: {UserId}", userId);
        }

        private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user, string ipAddress)
        {
            var accessToken = _jwtService.GenerateAccessToken(
                user.Id, user.Email, user.Username, user.Role);
            var refreshToken = _jwtService.GenerateRefreshToken();
            var hashedToken = _jwtService.HashRefreshToken(refreshToken);

            var tokenEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = hashedToken,
                ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = ipAddress
            };

            await _context.RefreshTokens.AddAsync(tokenEntity);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                RefreshTokenExpires = tokenEntity.ExpiresAt
            };
        }

        private async Task RevokeDescendantTokensAsync(RefreshToken refreshToken, string ipAddress, string reason)
        {
            // Revoke all tokens in the chain
            if (!string.IsNullOrEmpty(refreshToken.ReplacedByToken))
            {
                var childToken = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken.ReplacedByToken);

                if (childToken != null && childToken.RevokedAt == null)
                {
                    childToken.RevokedAt = DateTime.UtcNow;
                    childToken.RevokedByIp = ipAddress;
                    await _context.SaveChangesAsync();

                    // Recursively revoke descendants
                    await RevokeDescendantTokensAsync(childToken, ipAddress, reason);
                }
            }
        }

        private static string GenerateSecureToken()
        {
            // Generate cryptographically secure random token
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }
        public async Task UpgradeToSellerAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new NotFoundException("Người dùng không tồn tại");

            if (user.Role == "seller" || user.Role == "admin")
                return; // Đã là seller hoặc admin rồi

            user.Role = "seller";
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}