using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class GuestAfterSalesAccessService : IGuestAfterSalesAccessService
    {
        private const string CustomerTypeGuest = "guest";
        private const string TokenPurpose = "guest-after-sales-access";
        private const string TokenVersion = "v1";
        private const int MaxOrderNumberLength = 64;
        private const int MaxEmailLength = 256;
        private const int MaxTokenLength = 4096;

        private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(30);

        private readonly EbayDbContext _context;
        private readonly IDataProtector _dataProtector;
        private readonly ILogger<GuestAfterSalesAccessService> _logger;

        public GuestAfterSalesAccessService(
            EbayDbContext context,
            IDataProtectionProvider dataProtectionProvider,
            ILogger<GuestAfterSalesAccessService> logger)
        {
            _context = context;
            _dataProtector = dataProtectionProvider.CreateProtector("guest-after-sales-access");
            _logger = logger;
        }

        public async Task<GuestAfterSalesAccessDecision> ValidateOrderAccessAsync(
            GuestAfterSalesAccessRequest request,
            CancellationToken cancellationToken = default)
        {
            var normalizedOrderNumber = NormalizeOrderNumber(request.OrderNumber);
            var normalizedEmail = NormalizeEmail(request.Email);
            var normalizedAccessToken = NormalizeAccessToken(request.AccessToken);

            if (!IsWithinLength(normalizedOrderNumber, MaxOrderNumberLength)
                || !IsWithinLength(normalizedEmail, MaxEmailLength)
                || !IsWithinLength(normalizedAccessToken, MaxTokenLength))
            {
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_input_invalid",
                    "The guest access proof is invalid.");
            }

            if (string.IsNullOrWhiteSpace(normalizedAccessToken))
            {
                return await ValidateByOrderAndEmailAsync(
                    normalizedOrderNumber,
                    normalizedEmail,
                    cancellationToken);
            }

            return await ValidateByTokenAsync(
                normalizedAccessToken,
                normalizedOrderNumber,
                normalizedEmail,
                cancellationToken);
        }

        private async Task<GuestAfterSalesAccessDecision> ValidateByOrderAndEmailAsync(
            string normalizedOrderNumber,
            string normalizedEmail,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(normalizedOrderNumber) || string.IsNullOrWhiteSpace(normalizedEmail))
            {
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_proof_required",
                    "Order number and email are required when no access token is provided.");
            }

            var orderIdentity = await _context.Orders
                .AsNoTracking()
                .Where(order =>
                    order.CustomerType == CustomerTypeGuest
                    && order.OrderNumber == normalizedOrderNumber
                    && order.GuestEmail != null
                    && order.GuestEmail.ToLower() == normalizedEmail)
                .Select(order => new GuestOrderIdentity
                {
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    GuestEmail = order.GuestEmail!
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (orderIdentity == null)
            {
                _logger.LogInformation(
                    "Guest after-sales access denied for order/email proof. OrderNumber: {OrderNumber}",
                    normalizedOrderNumber);

                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_not_found",
                    "No guest order matched the provided proof.");
            }

            var grant = IssueAccessGrant(orderIdentity.OrderId, orderIdentity.OrderNumber, NormalizeEmail(orderIdentity.GuestEmail), "email_lookup");

            return GuestAfterSalesAccessDecision.Allow(
                "guest_access_granted",
                "Guest after-sales access granted.",
                orderIdentity.OrderId,
                orderIdentity.OrderNumber,
                usedAccessToken: false,
                grant);
        }

        private async Task<GuestAfterSalesAccessDecision> ValidateByTokenAsync(
            string accessToken,
            string normalizedOrderNumber,
            string normalizedEmail,
            CancellationToken cancellationToken)
        {
            GuestAfterSalesTokenPayload? payload;
            try
            {
                var rawPayload = _dataProtector.Unprotect(accessToken);
                payload = JsonSerializer.Deserialize<GuestAfterSalesTokenPayload>(rawPayload);
            }
            catch (Exception ex)
            {
                _logger.LogInformation(ex, "Guest after-sales token validation failed during unprotect.");
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_token_invalid",
                    "The guest access token is invalid.");
            }

            if (!IsValidPayload(payload))
            {
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_token_invalid",
                    "The guest access token is invalid.");
            }

            var now = DateTime.UtcNow;
            if (payload!.ExpiresAtUtc <= now)
            {
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_token_expired",
                    "The guest access token has expired.");
            }

            var orderIdentity = await _context.Orders
                .AsNoTracking()
                .Where(order =>
                    order.Id == payload.OrderId
                    && order.CustomerType == CustomerTypeGuest)
                .Select(order => new GuestOrderIdentity
                {
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    GuestEmail = order.GuestEmail ?? string.Empty
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (orderIdentity == null)
            {
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_not_found",
                    "No guest order matched the provided proof.");
            }

            var liveNormalizedEmail = NormalizeEmail(orderIdentity.GuestEmail);
            var liveEmailHash = ComputeEmailHash(liveNormalizedEmail);

            if (!string.Equals(payload.OrderNumber, orderIdentity.OrderNumber, StringComparison.Ordinal)
                || !string.Equals(payload.EmailHash, liveEmailHash, StringComparison.Ordinal))
            {
                _logger.LogWarning(
                    "Guest after-sales token no longer matches current order/email identity. OrderId: {OrderId}",
                    orderIdentity.OrderId);

                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_token_mismatch",
                    "The guest access token no longer matches the order identity.");
            }

            if (!string.IsNullOrWhiteSpace(normalizedOrderNumber)
                && !string.Equals(normalizedOrderNumber, orderIdentity.OrderNumber, StringComparison.Ordinal))
            {
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_order_mismatch",
                    "The provided order number does not match the guest access token.");
            }

            if (!string.IsNullOrWhiteSpace(normalizedEmail)
                && !string.Equals(normalizedEmail, liveNormalizedEmail, StringComparison.Ordinal))
            {
                return GuestAfterSalesAccessDecision.Deny(
                    "guest_access_email_mismatch",
                    "The provided email does not match the guest access token.");
            }

            var refreshedGrant = IssueAccessGrant(
                orderIdentity.OrderId,
                orderIdentity.OrderNumber,
                liveNormalizedEmail,
                "access_token");

            return GuestAfterSalesAccessDecision.Allow(
                "guest_access_granted",
                "Guest after-sales access granted.",
                orderIdentity.OrderId,
                orderIdentity.OrderNumber,
                usedAccessToken: true,
                refreshedGrant);
        }

        private GuestAfterSalesAccessGrant IssueAccessGrant(
            int orderId,
            string orderNumber,
            string normalizedEmail,
            string proofMethod)
        {
            var now = DateTime.UtcNow;
            var expiresAt = now.Add(AccessTokenLifetime);
            var payload = new GuestAfterSalesTokenPayload
            {
                Purpose = TokenPurpose,
                Version = TokenVersion,
                OrderId = orderId,
                OrderNumber = orderNumber,
                EmailHash = ComputeEmailHash(normalizedEmail),
                IssuedAtUtc = now,
                ExpiresAtUtc = expiresAt
            };

            var serialized = JsonSerializer.Serialize(payload);
            var protectedToken = _dataProtector.Protect(serialized);

            return new GuestAfterSalesAccessGrant
            {
                AccessToken = protectedToken,
                ExpiresAtUtc = expiresAt,
                ProofMethod = proofMethod
            };
        }

        private static bool IsValidPayload(GuestAfterSalesTokenPayload? payload)
        {
            return payload != null
                && string.Equals(payload.Purpose, TokenPurpose, StringComparison.Ordinal)
                && string.Equals(payload.Version, TokenVersion, StringComparison.Ordinal)
                && payload.OrderId > 0
                && !string.IsNullOrWhiteSpace(payload.OrderNumber)
                && !string.IsNullOrWhiteSpace(payload.EmailHash);
        }

        private static bool IsWithinLength(string? value, int maxLength)
        {
            return string.IsNullOrEmpty(value) || value.Length <= maxLength;
        }

        private static string NormalizeEmail(string? email)
        {
            return string.IsNullOrWhiteSpace(email)
                ? string.Empty
                : email.Trim().ToLowerInvariant();
        }

        private static string NormalizeOrderNumber(string? orderNumber)
        {
            return string.IsNullOrWhiteSpace(orderNumber)
                ? string.Empty
                : orderNumber.Trim();
        }

        private static string NormalizeAccessToken(string? accessToken)
        {
            return string.IsNullOrWhiteSpace(accessToken)
                ? string.Empty
                : accessToken.Trim();
        }

        private static string ComputeEmailHash(string normalizedEmail)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedEmail));
            return Convert.ToHexString(bytes);
        }

        private sealed class GuestAfterSalesTokenPayload
        {
            public string Purpose { get; set; } = string.Empty;

            public string Version { get; set; } = string.Empty;

            public int OrderId { get; set; }

            public string OrderNumber { get; set; } = string.Empty;

            public string EmailHash { get; set; } = string.Empty;

            public DateTime IssuedAtUtc { get; set; }

            public DateTime ExpiresAtUtc { get; set; }
        }

        private sealed class GuestOrderIdentity
        {
            public int OrderId { get; set; }

            public string OrderNumber { get; set; } = string.Empty;

            public string GuestEmail { get; set; } = string.Empty;
        }
    }
}
