using System.Security.Cryptography;
using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class OrderNumberGenerator : IOrderNumberGenerator
    {
        public string Generate()
        {
            Span<byte> randomBytes = stackalloc byte[4];
            RandomNumberGenerator.Fill(randomBytes);

            var randomSuffix = Convert.ToHexString(randomBytes);
            return $"EBAY-{DateTime.UtcNow:yyyyMMddHHmmss}-{randomSuffix}";
        }
    }
}
