using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class OrderCancellationService : IOrderCancellationService
    {
        private readonly EbayDbContext _context;
        private readonly IOrderNotificationService _orderNotificationService;

        public OrderCancellationService(
            EbayDbContext context,
            IOrderNotificationService orderNotificationService)
        {
            _context = context;
            _orderNotificationService = orderNotificationService;
        }

        public async Task<OrderCancellationRequestSummaryDto> RequestCancellationAsync(
            int buyerUserId,
            int orderId,
            string? reason,
            CancellationToken cancellationToken = default)
        {
            var order = await _context.Orders
                .Include(currentOrder => currentOrder.OrderCancellationRequests)
                .Include(currentOrder => currentOrder.OrderItems)
                .Include(currentOrder => currentOrder.ShippingInfo)
                .FirstOrDefaultAsync(
                    currentOrder => currentOrder.Id == orderId && currentOrder.BuyerId == buyerUserId,
                    cancellationToken);

            if (order == null)
            {
                throw new NotFoundException("Đơn hàng không tồn tại");
            }

            EnsureBuyerCanRequestCancellation(order);

            var now = DateTime.UtcNow;
            var cancellationRequest = new OrderCancellationRequest
            {
                OrderId = order.Id,
                RequestedByUserId = buyerUserId,
                Status = "pending",
                Reason = NormalizeNullable(reason),
                CreatedAt = now,
                UpdatedAt = now
            };

            await _context.OrderCancellationRequests.AddAsync(cancellationRequest, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            var sellerId = order.OrderItems.Select(orderItem => orderItem.SellerId).Distinct().Single();
            await _orderNotificationService.TryCreateSellerCancellationRequestNotificationAsync(
                sellerId,
                order.Id,
                order.OrderNumber,
                cancellationToken);

            return MapSummary(cancellationRequest);
        }

        public Task<OrderCancellationRequestSummaryDto> ApproveCancellationRequestAsync(
            int actorUserId,
            string actorRole,
            int cancellationRequestId,
            string? sellerResponse,
            CancellationToken cancellationToken = default)
        {
            return ResolveCancellationRequestAsync(
                actorUserId,
                actorRole,
                cancellationRequestId,
                approve: true,
                sellerResponse,
                cancellationToken);
        }

        public Task<OrderCancellationRequestSummaryDto> RejectCancellationRequestAsync(
            int actorUserId,
            string actorRole,
            int cancellationRequestId,
            string? sellerResponse,
            CancellationToken cancellationToken = default)
        {
            return ResolveCancellationRequestAsync(
                actorUserId,
                actorRole,
                cancellationRequestId,
                approve: false,
                sellerResponse,
                cancellationToken);
        }

        private async Task<OrderCancellationRequestSummaryDto> ResolveCancellationRequestAsync(
            int actorUserId,
            string actorRole,
            int cancellationRequestId,
            bool approve,
            string? sellerResponse,
            CancellationToken cancellationToken)
        {
            var cancellationRequest = await _context.OrderCancellationRequests
                .Include(request => request.Order)
                    .ThenInclude(order => order.OrderCancellationRequests)
                .Include(request => request.Order)
                    .ThenInclude(order => order.OrderItems)
                        .ThenInclude(orderItem => orderItem.Product)
                .Include(request => request.Order)
                    .ThenInclude(order => order.Payments)
                .Include(request => request.Order)
                    .ThenInclude(order => order.ShippingInfo)
                .FirstOrDefaultAsync(request => request.Id == cancellationRequestId, cancellationToken);

            if (cancellationRequest == null)
            {
                throw new NotFoundException("Yêu cầu hủy đơn hàng không tồn tại");
            }

            EnsureActorCanResolveCancellation(cancellationRequest, actorUserId, actorRole);

            if (!string.Equals(cancellationRequest.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Yêu cầu hủy đơn hàng này đã được xử lý");
            }

            var now = DateTime.UtcNow;
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                cancellationRequest.Status = approve ? "approved" : "rejected";
                cancellationRequest.SellerResponse = NormalizeNullable(sellerResponse);
                cancellationRequest.RespondedAt = now;
                cancellationRequest.ResolvedByUserId = actorUserId;
                cancellationRequest.UpdatedAt = now;

                if (approve)
                {
                    ApplyApprovedCancellationToOrder(cancellationRequest.Order, now);
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }

            if (cancellationRequest.Order.BuyerId.HasValue)
            {
                await _orderNotificationService.TryCreateBuyerCancellationResolutionNotificationAsync(
                    cancellationRequest.Order.BuyerId.Value,
                    cancellationRequest.OrderId,
                    cancellationRequest.Order.OrderNumber,
                    approve,
                    cancellationToken);
            }

            return MapSummary(cancellationRequest);
        }

        private static void EnsureBuyerCanRequestCancellation(Order order)
        {
            if (!OrderCancellationPolicyHelper.SupportsCancellationRequests(order))
            {
                throw new BadRequestException(
                    "Đơn hàng này hiện không hỗ trợ yêu cầu hủy theo nghiệp vụ hiện tại",
                    ["cancellation_request_not_supported"]);
            }

            var latestRequest = OrderCancellationPolicyHelper.GetLatestRequest(order);
            if (latestRequest != null && string.Equals(latestRequest.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException(
                    "Đơn hàng này đang có một yêu cầu hủy chờ seller xử lý",
                    ["cancellation_request_already_pending"]);
            }

            if (!OrderCancellationPolicyHelper.CanBuyerRequestCancellation(order))
            {
                throw new BadRequestException(
                    "Đơn hàng này hiện không thể gửi thêm yêu cầu hủy",
                    ["cancellation_request_not_allowed"]);
            }
        }

        private static void EnsureActorCanResolveCancellation(
            OrderCancellationRequest cancellationRequest,
            int actorUserId,
            string actorRole)
        {
            var isAdmin = string.Equals(actorRole, "admin", StringComparison.OrdinalIgnoreCase);
            if (isAdmin)
            {
                return;
            }

            if (!OrderCancellationPolicyHelper.CanSellerManageCancellationRequest(cancellationRequest.Order, actorUserId))
            {
                throw new ForbiddenException("Bạn không có quyền xử lý yêu cầu hủy đơn hàng này");
            }
        }

        private static void ApplyApprovedCancellationToOrder(Order order, DateTime now)
        {
            if (!OrderCancellationPolicyHelper.SupportsCancellationRequests(order))
            {
                throw new BadRequestException(
                    "Đơn hàng này không còn ở trạng thái có thể hủy",
                    ["cancellation_request_state_invalid"]);
            }

            order.Status = "cancelled";
            order.UpdatedAt = now;

            foreach (var orderItem in order.OrderItems)
            {
                if (orderItem.Product != null)
                {
                    orderItem.Product.Stock = (orderItem.Product.Stock ?? 0) + orderItem.Quantity;
                }
            }

            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            if (latestPayment == null)
            {
                return;
            }

            if (string.Equals(latestPayment.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                latestPayment.Status = "refunded";
            }
            else if (string.Equals(latestPayment.Status, "pending", StringComparison.OrdinalIgnoreCase)
                && string.Equals(latestPayment.Method, "paypal", StringComparison.OrdinalIgnoreCase))
            {
                latestPayment.Status = "failed";
            }
        }

        private static OrderCancellationRequestSummaryDto MapSummary(OrderCancellationRequest request)
        {
            return new OrderCancellationRequestSummaryDto
            {
                Id = request.Id,
                Status = request.Status,
                Reason = request.Reason,
                SellerResponse = request.SellerResponse,
                CreatedAt = request.CreatedAt ?? DateTime.UtcNow,
                RespondedAt = request.RespondedAt,
                RequestedByUserId = request.RequestedByUserId,
                ResolvedByUserId = request.ResolvedByUserId
            };
        }

        private static string? NormalizeNullable(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }
    }
}
