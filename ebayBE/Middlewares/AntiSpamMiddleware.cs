using Microsoft.Extensions.Caching.Memory;
using System.Net;

namespace ebay.Middlewares
{
    public class AntiSpamMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<AntiSpamMiddleware> _logger;

        // Limit completely anonymous IPs to 300 requests per minute overall to prevent bot scraping/DDoS
        private const int MaxRequestsPerMinute = 300; 

        public AntiSpamMiddleware(RequestDelegate next, IMemoryCache cache, ILogger<AntiSpamMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            if (ipAddress == "127.0.0.1" || ipAddress == "::ffff:127.0.0.1" || ipAddress == "::1")
            {
                await _next(context);
                return;
            }

            var cacheKey = $"GlobalSpam_{ipAddress}";

            var requestCount = _cache.GetOrCreate(cacheKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
                return 0;
            });

            if (requestCount >= MaxRequestsPerMinute)
            {
                _logger.LogWarning("⚠️ BOT/SPAM DETECTED: IP {IP} hit the hard limit of {Limit} req/min.", ipAddress, MaxRequestsPerMinute);
                
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "TooManyRequests",
                    message = "Hệ thống phát hiện dấu hiệu spam/bot. Vui lòng thử lại sau vài phút.",
                    spamDetected = true
                });
                return;
            }

            _cache.Set(cacheKey, requestCount + 1, TimeSpan.FromMinutes(1));

            await _next(context);
        }
    }
}
