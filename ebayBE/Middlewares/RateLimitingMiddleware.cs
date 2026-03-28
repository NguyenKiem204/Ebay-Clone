using System.Net;
using ebay.Attributes;
using Microsoft.Extensions.Caching.Memory;

namespace ebay.Middlewares
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RateLimitingMiddleware> _logger;

        public RateLimitingMiddleware(
            RequestDelegate next,
            IMemoryCache cache,
            ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim() 
                          ?? context.Request.Headers["X-Real-IP"].FirstOrDefault() 
                          ?? context.Connection.RemoteIpAddress?.ToString() 
                          ?? "Unknown";

            // Whitelist localhost
            if (ipAddress == "127.0.0.1" || ipAddress == "::1" || ipAddress == "::ffff:127.0.0.1" || ipAddress == "Unknown")
            {
                await _next(context);
                return;
            }

            // Hardblock specific spamming IP (Crawler/Bot)
            if (ipAddress == "58.186.68.138")
            {
                _logger.LogWarning("RATE LIMIT HARD BLOCK: Blocked known spammer {IP}.", ipAddress);
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                return;
            }

            if (HttpMethods.IsOptions(context.Request.Method))
            {
                await _next(context);
                return;
            }

            var endpoint = context.GetEndpoint();
            var rateLimitAttribute = endpoint?.Metadata.GetMetadata<RateLimitAttribute>();

            var isAuthenticated = context.User?.Identity?.IsAuthenticated == true;
            
            // Apply Sensible Default Policy if no specific attribute is found
            if (rateLimitAttribute == null)
            {
                int defaultLimit = isAuthenticated ? 180 : 60;
                rateLimitAttribute = new RateLimitAttribute("Default", defaultLimit, 60);
            }

            if (rateLimitAttribute != null)
            {
                var clientId = GetClientIdentifier(context);
                var key = $"RateLimit_{rateLimitAttribute.Name}_{clientId}";
                var hasCaptchaVerification = string.Equals(context.Request.Cookies["hcaptcha_verified"], "true", StringComparison.Ordinal);
                var effectiveLimit = hasCaptchaVerification
                    ? rateLimitAttribute.Limit * 20
                    : isAuthenticated
                        ? rateLimitAttribute.Limit * 5
                        : rateLimitAttribute.Limit;

                var requestCount = _cache.GetOrCreate(key, entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = rateLimitAttribute.Period;
                    return 0;
                });

                if (requestCount >= effectiveLimit)
                {
                    _logger.LogWarning(
                        "Rate limit exceeded for {Endpoint} by {ClientId}. Limit: {Limit}, Period: {Period}",
                        rateLimitAttribute.Name, clientId, effectiveLimit, rateLimitAttribute.Period);

                    context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                    context.Response.ContentType = "application/json";

                    var cacheEntry = _cache.Get<CacheItem>(key + "_meta");
                    var retryAfter = cacheEntry?.ExpiresAt != null
                        ? (int)(cacheEntry.ExpiresAt.Value - DateTimeOffset.UtcNow).TotalSeconds
                        : (int)rateLimitAttribute.Period.TotalSeconds;

                    if (retryAfter < 0)
                    {
                        retryAfter = 0;
                    }

                    context.Response.Headers["Retry-After"] = retryAfter.ToString();
                    context.Response.Headers["X-RateLimit-Limit"] = effectiveLimit.ToString();
                    context.Response.Headers["X-RateLimit-Remaining"] = "0";
                    context.Response.Headers["X-RateLimit-Reset"] = DateTimeOffset.UtcNow.AddSeconds(retryAfter).ToUnixTimeSeconds().ToString();

                    if (!isAuthenticated && !hasCaptchaVerification)
                    {
                        await context.Response.WriteAsJsonAsync(new
                        {
                            error = "TooManyRequests",
                            message = "Please complete hCaptcha to continue.",
                            retryAfter,
                            captchaRequired = true
                        });
                        return;
                    }

                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "TooManyRequests",
                        message = $"You exceeded the limit of {effectiveLimit} requests in {FormatPeriod(rateLimitAttribute.Period)}. Please retry in {retryAfter} seconds.",
                        retryAfter
                    });
                    return;
                }

                var expiresAt = DateTimeOffset.UtcNow.Add(rateLimitAttribute.Period);
                _cache.Set(key, requestCount + 1, rateLimitAttribute.Period);
                _cache.Set(key + "_meta", new CacheItem { ExpiresAt = expiresAt }, rateLimitAttribute.Period);

                context.Response.OnStarting(() =>
                {
                    context.Response.Headers["X-RateLimit-Limit"] = effectiveLimit.ToString();
                    context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, effectiveLimit - requestCount - 1).ToString();
                    context.Response.Headers["X-RateLimit-Reset"] = expiresAt.ToUnixTimeSeconds().ToString();
                    return Task.CompletedTask;
                });
            }

            await _next(context);
        }

        private string GetClientIdentifier(HttpContext context)
        {
            var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                return $"User_{userId}";
            }

            var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim() 
                          ?? context.Request.Headers["X-Real-IP"].FirstOrDefault() 
                          ?? context.Connection.RemoteIpAddress?.ToString() 
                          ?? "Unknown";

            return $"IP_{ipAddress}";
        }

        private string FormatPeriod(TimeSpan period)
        {
            if (period.TotalDays >= 1)
            {
                return $"{(int)period.TotalDays} day(s)";
            }

            if (period.TotalHours >= 1)
            {
                return $"{(int)period.TotalHours} hour(s)";
            }

            if (period.TotalMinutes >= 1)
            {
                return $"{(int)period.TotalMinutes} minute(s)";
            }

            return $"{(int)period.TotalSeconds} second(s)";
        }

        private class CacheItem
        {
            public DateTimeOffset? ExpiresAt { get; set; }
        }
    }
}
