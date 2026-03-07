using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ebay.Services.Implementations
{
    public interface IPaypalService
    {
        Task<string> CreateOrderAsync(int userId, int orderId);
        Task<bool> CaptureOrderAsync(string paypalOrderId);
    }

    public class PaypalService : IPaypalService
    {
        private readonly EbayDbContext _context;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public PaypalService(EbayDbContext context, IConfiguration config, HttpClient httpClient)
        {
            _context = context;
            _config = config;
            _httpClient = httpClient;
        }

        private async Task<string> GetAccessTokenAsync()
        {
            var clientId = _config["PayPal:ClientId"];
            var secret = _config["PayPal:ClientSecret"];
            var mode = _config["PayPal:Mode"] ?? "sandbox";
            var url = mode == "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

            var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{secret}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);

            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials")
            });

            var response = await _httpClient.PostAsync($"{url}/v1/oauth2/token", content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("access_token").GetString()!;
        }

        public async Task<string> CreateOrderAsync(int userId, int orderId)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == userId);
            if (order == null) throw new NotFoundException("Đơn hàng không tồn tại");

            var accessToken = await GetAccessTokenAsync();
            var mode = _config["PayPal:Mode"] ?? "sandbox";
            var url = mode == "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var body = new
            {
                intent = "CAPTURE",
                purchase_units = new[]
                {
                    new
                    {
                        reference_id = order.OrderNumber,
                        amount = new
                        {
                            currency_code = "USD", // PayPal standard
                            value = (order.TotalPrice / 25000).ToString("F2") // Convert to USD roughly
                        }
                    }
                },
                application_context = new
                {
                    return_url = _config["PayPal:ReturnUrl"],
                    cancel_url = _config["PayPal:CancelUrl"]
                }
            };

            var response = await _httpClient.PostAsync($"{url}/v2/checkout/orders", 
                new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
            
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var paypalOrderId = doc.RootElement.GetProperty("id").GetString()!;

            // Save Paypal Order ID to Payment record
            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment != null)
            {
                payment.TransactionId = paypalOrderId;
                payment.PaymentGateway = "paypal";
                await _context.SaveChangesAsync();
            }

            return paypalOrderId;
        }

        public async Task<bool> CaptureOrderAsync(string paypalOrderId)
        {
            var accessToken = await GetAccessTokenAsync();
            var mode = _config["PayPal:Mode"] ?? "sandbox";
            var url = mode == "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.PostAsync($"{url}/v2/checkout/orders/{paypalOrderId}/capture", 
                new StringContent("", Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode) return false;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var status = doc.RootElement.GetProperty("status").GetString();

            if (status == "COMPLETED")
            {
                var payment = await _context.Payments.Include(p => p.Order).FirstOrDefaultAsync(p => p.TransactionId == paypalOrderId);
                if (payment != null)
                {
                    payment.Status = "completed";
                    payment.PaidAt = DateTime.UtcNow;
                    payment.Order.Status = "confirmed";
                    payment.Order.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                return true;
            }

            return false;
        }
    }
}
