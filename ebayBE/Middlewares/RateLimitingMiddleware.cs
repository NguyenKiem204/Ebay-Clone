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
                var endpoint = context.GetEndpoint();
                var rateLimitAttribute = endpoint?.Metadata.GetMetadata<RateLimitAttribute>();

                if (rateLimitAttribute != null)
                {
                    var clientId = GetClientIdentifier(context);
                    var key = $"RateLimit_{rateLimitAttribute.Name}_{clientId}";

                    var requestCount = _cache.GetOrCreate(key, entry =>
                    {
                        entry.AbsoluteExpirationRelativeToNow = rateLimitAttribute.Period;
                        return 0;
                    });

                    if (requestCount >= rateLimitAttribute.Limit)
                    {
                        _logger.LogWarning(
                            "Rate limit exceeded for {Endpoint} by {ClientId}. Limit: {Limit}, Period: {Period}",
                            rateLimitAttribute.Name, clientId, rateLimitAttribute.Limit, rateLimitAttribute.Period);

                        context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                        context.Response.ContentType = "application/json";

                        var cacheEntry = _cache.Get<CacheItem>(key + "_meta");
                        var retryAfter = cacheEntry?.ExpiresAt != null
                            ? (int)(cacheEntry.ExpiresAt.Value - DateTimeOffset.UtcNow).TotalSeconds
                            : (int)rateLimitAttribute.Period.TotalSeconds;

                        if (retryAfter < 0) retryAfter = 0;

                        context.Response.Headers["Retry-After"] = retryAfter.ToString();
                        context.Response.Headers["X-RateLimit-Limit"] = rateLimitAttribute.Limit.ToString();
                        context.Response.Headers["X-RateLimit-Remaining"] = "0";
                        context.Response.Headers["X-RateLimit-Reset"] = DateTimeOffset.UtcNow.AddSeconds(retryAfter).ToUnixTimeSeconds().ToString();

                        await context.Response.WriteAsJsonAsync(new
                        {
                            error = "TooManyRequests",
                            message = $"Bạn đã vượt quá giới hạn {rateLimitAttribute.Limit} requests trong {FormatPeriod(rateLimitAttribute.Period)}. Vui lòng thử lại sau {retryAfter} giây.",
                            retryAfter = retryAfter
                        });
                        return;
                    }

                    var expiresAt = DateTimeOffset.UtcNow.Add(rateLimitAttribute.Period);
                    _cache.Set(key, requestCount + 1, rateLimitAttribute.Period);
                    _cache.Set(key + "_meta", new CacheItem { ExpiresAt = expiresAt }, rateLimitAttribute.Period);

                    // Add rate limit headers to response
                    context.Response.OnStarting(() =>
                    {
                        context.Response.Headers["X-RateLimit-Limit"] = rateLimitAttribute.Limit.ToString();
                        context.Response.Headers["X-RateLimit-Remaining"] = (rateLimitAttribute.Limit - requestCount - 1).ToString();
                        context.Response.Headers["X-RateLimit-Reset"] = expiresAt.ToUnixTimeSeconds().ToString();
                        return Task.CompletedTask;
                    });
                }

                await _next(context);
            }

            private string GetClientIdentifier(HttpContext context)
            {
                // Priority: User ID > IP Address
                var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(userId))
                    return $"User_{userId}";

                var ipAddress = context.Connection.RemoteIpAddress?.ToString();

                if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
                {
                    ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
                }
                else if (context.Request.Headers.ContainsKey("X-Real-IP"))
                {
                    ipAddress = context.Request.Headers["X-Real-IP"].FirstOrDefault();
                }

                return $"IP_{ipAddress ?? "Unknown"}";
            }

            private string FormatPeriod(TimeSpan period)
            {
                if (period.TotalDays >= 1)
                    return $"{(int)period.TotalDays} ngày";
                if (period.TotalHours >= 1)
                    return $"{(int)period.TotalHours} giờ";
                if (period.TotalMinutes >= 1)
                    return $"{(int)period.TotalMinutes} phút";
                return $"{(int)period.TotalSeconds} giây";
            }

            private class CacheItem
            {
                public DateTimeOffset? ExpiresAt { get; set; }
            }
        }
}
