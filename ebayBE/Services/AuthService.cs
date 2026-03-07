using System.Security.Cryptography;
using ebay.Configuration;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Interfaces.Services;
using ebay.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ebay.Services
{
    public class AuthService : IAuthService
    {
        private readonly EbayDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<AuthService> _logger;
        private readonly JwtSettings _jwtSettings;

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
            IOptions<JwtSettings> jwtSettings)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordHasher = passwordHasher;
            _logger = logger;
            _jwtSettings = jwtSettings.Value;
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

            var user = new User
            {
                Username = normalizedUsername,
                Email = normalizedEmail,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = "Customer",
                IsActive = true,
                IsEmailVerified = false,
                EmailVerificationToken = GenerateSecureToken(),
                EmailVerificationExpires = DateTime.UtcNow.AddHours(EMAIL_VERIFICATION_HOURS),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User registered successfully - UserId: {UserId}, Email: {Email}",
                user.Id, normalizedEmail);

            return await GenerateAuthResponseAsync(user, ipAddress);
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

        public async Task RevokeTokenAsync(string token, string ipAddress)
        {
            var hashedToken = _jwtService.HashRefreshToken(token);

            var refreshToken = await _context.RefreshTokens
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

        public async Task SendPasswordResetEmailAsync(string email)
        {
            var normalizedEmail = email.ToLowerInvariant().Trim();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            // Always return success to prevent user enumeration
            if (user == null)
            {
                _logger.LogWarning("Password reset requested for non-existent email - {Email}", normalizedEmail);
                // Don't expose that email doesn't exist
                return;
            }

            // TODO: Add rate limiting here to prevent abuse

            user.PasswordResetToken = GenerateSecureToken();
            user.PasswordResetExpires = DateTime.UtcNow.AddHours(PASSWORD_RESET_HOURS);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Password reset token generated - UserId: {UserId}", user.Id);

            // TODO: Send email using IEmailService
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token &&
                                         u.PasswordResetExpires > DateTime.UtcNow);

            if (user == null)
            {
                _logger.LogWarning("Password reset failed: Invalid or expired token");
                return false;
            }

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetExpires = null;
            user.FailedLoginAttempts = 0; // Reset failed attempts
            user.LockoutEnd = null; // Remove any lockout
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
    }
}