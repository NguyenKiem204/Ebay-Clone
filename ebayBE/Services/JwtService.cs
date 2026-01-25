using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ebay.Configuration;
using ebay.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ebay.Services
{
    public class JwtService : IJwtService
    {
        private readonly JwtSettings _settings;
        private readonly ILogger<JwtService> _logger;
        private readonly SymmetricSecurityKey _signingKey;
        private readonly JwtSecurityTokenHandler _tokenHandler;

        public JwtService(IOptions<JwtSettings> settings, ILogger<JwtService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
            _tokenHandler = new JwtSecurityTokenHandler();

            // Validate and set signing key - NO PADDING!
            ValidateSecretKey(_settings.SecretKey);
            _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        }

        private void ValidateSecretKey(string secretKey)
        {
            if (string.IsNullOrWhiteSpace(secretKey))
            {
                _logger.LogCritical("JWT SecretKey is null or empty - CRITICAL SECURITY ISSUE");
                throw new ArgumentException("JWT SecretKey cannot be null or empty", nameof(secretKey));
            }

            var keyBytes = Encoding.UTF8.GetBytes(secretKey);

            // STRICT: Must be at least 256-bit (32 bytes) - NO PADDING ALLOWED
            if (keyBytes.Length < 32)
            {
                _logger.LogCritical(
                    "JWT SecretKey is INSUFFICIENT. Current: {CurrentLength} bytes. Required: 32+ bytes (256-bit minimum)",
                    keyBytes.Length);
                throw new ArgumentException(
                    $"JWT SecretKey must be at least 256-bit (32 bytes). Current length: {keyBytes.Length} bytes. " +
                    "Generate a strong key using: openssl rand -base64 32",
                    nameof(secretKey));
            }

            // Recommend 512-bit for better security
            if (keyBytes.Length < 64)
            {
                _logger.LogWarning(
                    "JWT SecretKey is valid but recommended to use 512-bit (64 bytes). Current: {Length} bytes",
                    keyBytes.Length);
            }

            _logger.LogInformation("JWT SecretKey validated successfully. Length: {Length} bytes", keyBytes.Length);
        }

        public string GenerateAccessToken(int userId, string email, string username, string role)
        {
            try
            {
                var now = DateTime.UtcNow;
                var expires = now.AddMinutes(_settings.AccessTokenExpirationMinutes);

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Name, username),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.Role, role),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim(JwtRegisteredClaimNames.Iat,
                        new DateTimeOffset(now).ToUnixTimeSeconds().ToString(),
                        ClaimValueTypes.Integer64)
                };

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = expires,
                    Issuer = _settings.Issuer,
                    Audience = _settings.Audience,
                    SigningCredentials = new SigningCredentials(
                        _signingKey,
                        SecurityAlgorithms.HmacSha256Signature)
                };

                var token = _tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = _tokenHandler.WriteToken(token);

                _logger.LogDebug("Access token generated for user {UserId}", userId);
                return tokenString;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating access token for user {UserId}", userId);
                throw;
            }
        }

        public string GenerateRefreshToken()
        {
            try
            {
                // Use 32 bytes for refresh token (256-bit)
                var randomBytes = new byte[32];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(randomBytes);
                }

                // URL-safe base64 encoding
                var token = Convert.ToBase64String(randomBytes)
                    .TrimEnd('=')
                    .Replace('+', '-')
                    .Replace('/', '_');

                _logger.LogDebug("Refresh token generated");
                return token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating refresh token");
                throw;
            }
        }

        public string HashRefreshToken(string refreshToken)
        {
            try
            {
                using (var sha256 = SHA256.Create())
                {
                    var bytes = Encoding.UTF8.GetBytes(refreshToken);
                    var hash = sha256.ComputeHash(bytes);
                    return Convert.ToBase64String(hash);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hashing refresh token");
                throw;
            }
        }

        public bool VerifyRefreshToken(string refreshToken, string hashedToken)
        {
            try
            {
                var hash = HashRefreshToken(refreshToken);
                // Use constant-time comparison to prevent timing attacks
                return CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(hash),
                    Encoding.UTF8.GetBytes(hashedToken)
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying refresh token");
                return false;
            }
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = _signingKey,
                    ValidateIssuer = true,
                    ValidIssuer = _settings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _settings.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero, // No clock skew
                    RequireExpirationTime = true,
                    RequireSignedTokens = true
                };

                var principal = _tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

                // Validate JTI to prevent replay attacks
                var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                if (string.IsNullOrEmpty(jti))
                {
                    _logger.LogWarning("Token missing jti claim - potential replay attack");
                    return null;
                }

                _logger.LogDebug("Token validated successfully");
                return principal;
            }
            catch (SecurityTokenExpiredException ex)
            {
                _logger.LogWarning("Token has expired");
                return null;
            }
            catch (SecurityTokenInvalidSignatureException ex)
            {
                _logger.LogWarning("Token signature is invalid");
                return null;
            }
            catch (SecurityTokenValidationException ex)
            {
                _logger.LogWarning(ex, "Token validation failed");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error validating token");
                return null;
            }
        }

        public int? GetUserIdFromToken(string token)
        {
            try
            {
                var principal = ValidateToken(token);
                if (principal == null)
                    return null;

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    _logger.LogWarning("Token missing NameIdentifier claim");
                    return null;
                }

                if (int.TryParse(userIdClaim, out var userId))
                {
                    return userId;
                }

                _logger.LogWarning("Invalid userId format in token");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting userId from token");
                return null;
            }
        }
    }
}
