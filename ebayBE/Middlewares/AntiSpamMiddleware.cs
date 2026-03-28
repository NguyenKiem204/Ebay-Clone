using Microsoft.Extensions.Caching.Memory;
using System.Net;

namespace ebay.Middlewares
{
    public class AntiSpamMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<AntiSpamMiddleware> _logger;

        private const int AnonymousLimitPerMinute = 100;
        private const int VerifiedLimitPerMinute = 300;

        public AntiSpamMiddleware(RequestDelegate next, IMemoryCache cache, ILogger<AntiSpamMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (HttpMethods.IsOptions(context.Request.Method))
            {
                await _next(context);
                return;
            }

            var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim() 
                          ?? context.Connection.RemoteIpAddress?.ToString() 
                          ?? "unknown";

            // Whitelist localhost (including health checks)
            if (ipAddress == "127.0.0.1" || ipAddress == "::1" || ipAddress == "::ffff:127.0.0.1")
            {
                await _next(context);
                return;
            }

            // Hardblock specific spamming IP (Crawler/Bot)
            if (ipAddress == "58.186.68.138")
            {
                _logger.LogWarning("BOT/SPAM HARD BLOCKED: IP {IP}.", ipAddress);
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                return;
            }

            var isAuthenticated = context.User?.Identity?.IsAuthenticated == true;
            var hasCaptchaVerification = string.Equals(context.Request.Cookies["hcaptcha_verified"], "true", StringComparison.Ordinal);
            var requestLimit = (isAuthenticated || hasCaptchaVerification) ? VerifiedLimitPerMinute : AnonymousLimitPerMinute;

            var cacheKey = $"GlobalSpam_{ipAddress}";

            var requestCount = _cache.GetOrCreate(cacheKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
                return 0;
            });

            if (requestCount >= requestLimit)
            {
                _logger.LogWarning("BOT/SPAM DETECTED: IP {IP} hit the hard limit of {Limit} req/min.", ipAddress, requestLimit);

                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";

                if (!isAuthenticated && !hasCaptchaVerification)
                {
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "TooManyRequests",
                        message = "Too many requests detected. Please complete hCaptcha to continue.",
                        spamDetected = true,
                        captchaRequired = true
                    });
                    return;
                }

                await context.Response.WriteAsJsonAsync(new
                {
                    error = "TooManyRequests",
                    message = "Too many requests detected. Please wait a moment before retrying.",
                    spamDetected = true
                });
                return;
            }

            _cache.Set(cacheKey, requestCount + 1, TimeSpan.FromMinutes(1));
            await _next(context);
        }
    }
}
