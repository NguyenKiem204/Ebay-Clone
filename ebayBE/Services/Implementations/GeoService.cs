using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using ebay.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ebay.Services.Implementations
{
    public class GeoService : IGeoService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly ILogger<GeoService> _logger;

        public GeoService(IHttpClientFactory httpClientFactory, IMemoryCache cache, ILogger<GeoService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
            _logger = logger;
        }

        public async Task<string> GetCountryCodeAsync(string ipAddress)
        {
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1" || ipAddress == "127.0.0.1" || 
                ipAddress.StartsWith("172.") || 
                ipAddress.StartsWith("192.168.") || 
                ipAddress.StartsWith("10.") ||
                ipAddress.Contains("::ffff:172.") || 
                ipAddress.Contains("::ffff:192.168.") || 
                ipAddress.Contains("::ffff:10."))
            {
                return "VN"; // Default for local development/Docker
            }

            if (_cache.TryGetValue(ipAddress, out string cachedCountryCode))
            {
                return cachedCountryCode;
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                // Use ip-api.com (free, 45 requests/min)
                var response = await client.GetFromJsonAsync<IpApiResponse>($"http://ip-api.com/json/{ipAddress}");

                if (response?.Status == "success")
                {
                    var countryCode = response.CountryCode;
                    _cache.Set(ipAddress, countryCode, TimeSpan.FromHours(24));
                    return countryCode;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to detect region for IP: {IpAddress}", ipAddress);
            }

            return "US"; // Global fallback
        }

        private class IpApiResponse
        {
            public string Status { get; set; } = string.Empty;
            public string CountryCode { get; set; } = string.Empty;
        }
    }
}
