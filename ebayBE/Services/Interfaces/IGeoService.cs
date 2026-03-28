using System.Threading.Tasks;

namespace ebay.Services.Interfaces
{
    public interface IGeoService
    {
        Task<string> GetCountryCodeAsync(string ipAddress);
    }
}
