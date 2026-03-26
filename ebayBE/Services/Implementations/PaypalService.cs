using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public interface IPaypalService
    {
        Task<string> CreateOrderAsync(int userId, int orderId);
        Task<bool> CaptureOrderAsync(string paypalOrderId);
        Task<bool> FailOrderAsync(string paypalOrderId);
    }

    public class PaypalService : IPaypalService
    {
        private readonly EbayDbContext _context;

        public PaypalService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<string> CreateOrderAsync(int userId, int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == userId);

            if (order == null) throw new NotFoundException("Đơn hàng không tồn tại");
            if (!string.Equals(order.CustomerType, "member", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Mô phỏng PayPal chỉ áp dụng cho đơn hàng member");
            }

            var payment = order.Payments
                .OrderByDescending(p => p.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            if (payment == null)
            {
                throw new BadRequestException("Đơn hàng chưa có bản ghi thanh toán");
            }

            await EnsureAuctionPaymentDeadlineNotExceededAsync(order, payment);

            if (!string.Equals(payment.Method, "paypal", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Đơn hàng này không dùng PayPal");
            }

            if (!string.IsNullOrWhiteSpace(payment.TransactionId))
            {
                return payment.TransactionId;
            }

            var simulatedPaymentRef = $"SIM-PAYPAL-{order.OrderNumber}-{Guid.NewGuid():N}".ToUpperInvariant();
            payment.TransactionId = simulatedPaymentRef;
            payment.PaymentGateway = "paypal_simulated";
            payment.Status = "pending";

            await _context.SaveChangesAsync();
            return simulatedPaymentRef;
        }

        public async Task<bool> CaptureOrderAsync(string paypalOrderId)
        {
            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.TransactionId == paypalOrderId);

            if (payment == null)
            {
                return false;
            }

            if (string.Equals(payment.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (!string.Equals(payment.Method, "paypal", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Bản ghi thanh toán này không phải PayPal");
            }

            await EnsureAuctionPaymentDeadlineNotExceededAsync(payment.Order, payment);

            payment.Status = "completed";
            payment.PaidAt = DateTime.UtcNow;
            payment.PaymentGateway ??= "paypal_simulated";
            payment.Order.Status = "confirmed";
            payment.Order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> FailOrderAsync(string paypalOrderId)
        {
            var payment = await _context.Payments
                .Include(p => p.Order)
                    .ThenInclude(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(p => p.TransactionId == paypalOrderId);

            if (payment == null)
            {
                return false;
            }

            if (string.Equals(payment.Status, "failed", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.Equals(payment.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Không thể đánh dấu thất bại cho thanh toán đã hoàn tất");
            }

            if (!string.Equals(payment.Method, "paypal", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Bản ghi thanh toán này không phải PayPal");
            }

            payment.Status = "failed";
            payment.PaidAt = null;
            payment.PaymentGateway ??= "paypal_simulated";

            if (payment.Order.IsAuctionOrder != true)
            {
                foreach (var orderItem in payment.Order.OrderItems)
                {
                    if (orderItem.Product != null)
                    {
                        orderItem.Product.Stock = (orderItem.Product.Stock ?? 0) + orderItem.Quantity;
                    }
                }
            }

            payment.Order.Status = "cancelled";
            payment.Order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task EnsureAuctionPaymentDeadlineNotExceededAsync(Order order, Payment payment)
        {
            if (order.IsAuctionOrder != true || !order.PaymentDueAt.HasValue)
            {
                return;
            }

            if (string.Equals(payment.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (order.PaymentDueAt.Value <= DateTime.UtcNow)
            {
                payment.Status = "failed";
                payment.PaidAt = null;
                payment.PaymentGateway ??= "paypal_simulated";
                order.Status = "cancelled";
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                throw new BadRequestException("Đơn thắng đấu giá đã quá hạn thanh toán.");
            }
        }
    }
}
