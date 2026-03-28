using System.Threading.Tasks;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegionController : ControllerBase
    {
        private readonly IGeoService _geoService;

        public RegionController(IGeoService geoService)
        {
            _geoService = geoService;
        }

        [HttpGet("detect")]
        public async Task<IActionResult> DetectRegion()
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            // X-Forwarded-For is common behind proxies
            if (Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                ip = Request.Headers["X-Forwarded-For"];
            }

            var countryCode = await _geoService.GetCountryCodeAsync(ip);
            
            return Ok(new 
            { 
                ip, 
                countryCode, 
                isVietnamese = countryCode == "VN" 
            });
        }
    }
}
