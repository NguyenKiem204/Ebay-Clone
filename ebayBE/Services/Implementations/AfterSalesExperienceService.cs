using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class AfterSalesExperienceService : IAfterSalesExperienceService
    {
        private readonly IBuyerCasePolicyService _buyerCasePolicyService;

        public AfterSalesExperienceService(IBuyerCasePolicyService buyerCasePolicyService)
        {
            _buyerCasePolicyService = buyerCasePolicyService;
        }

        public OrderAfterSalesSummaryResponseDto BuildOrderAfterSalesSummary(Order order, bool isGuest)
        {
            var returnDecision = EvaluateReturnDecision(order, isGuest);
            var inrDecision = EvaluateInrDecision(order, isGuest);

            return new OrderAfterSalesSummaryResponseDto
            {
                HasOpenRequest = HasOpenReturn(order) || HasOpenInr(order),
                Options =
                [
                    MapOption("return", "Return / Refund", returnDecision),
                    MapOption("inr", "Item not received", inrDecision)
                ]
            };
        }

        private BuyerCasePolicyDecision EvaluateReturnDecision(Order order, bool isGuest)
        {
            var sanitizedOrder = CloneOrderWithoutCases(order);
            var baseDecision = isGuest
                ? _buyerCasePolicyService.CanOpenGuestReturn(sanitizedOrder)
                : _buyerCasePolicyService.CanOpenReturn(sanitizedOrder);

            if (!baseDecision.Allowed)
            {
                return baseDecision;
            }

            if (HasOpenInr(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "open_inr_exists",
                    "You need to resolve the open item-not-received request before opening a return.");
            }

            if (HasOpenReturn(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "open_return_exists",
                    "There is already an open return / refund request for this order.");
            }

            return baseDecision;
        }

        private BuyerCasePolicyDecision EvaluateInrDecision(Order order, bool isGuest)
        {
            var sanitizedOrder = CloneOrderWithoutCases(order);
            var baseDecision = isGuest
                ? _buyerCasePolicyService.CanOpenGuestInr(sanitizedOrder)
                : _buyerCasePolicyService.CanOpenInr(sanitizedOrder);

            if (!baseDecision.Allowed)
            {
                return baseDecision;
            }

            if (HasOpenReturn(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "open_return_exists",
                    "You need to resolve the open return / refund request before opening an INR request.");
            }

            if (HasOpenInr(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "open_inr_exists",
                    "There is already an open item-not-received request for this order.");
            }

            return baseDecision;
        }

        private static AfterSalesOptionResponseDto MapOption(
            string requestType,
            string label,
            BuyerCasePolicyDecision decision)
        {
            return new AfterSalesOptionResponseDto
            {
                RequestType = requestType,
                Label = label,
                Eligible = decision.Allowed,
                Code = decision.Code,
                Message = decision.Message,
                EligibleFrom = decision.RetryAfterUtc,
                WindowEndsAt = decision.WindowEndsAtUtc
            };
        }

        private static Order CloneOrderWithoutCases(Order order)
        {
            return new Order
            {
                Id = order.Id,
                CustomerType = order.CustomerType,
                BuyerId = order.BuyerId,
                GuestEmail = order.GuestEmail,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                OrderDate = order.OrderDate,
                Payments = order.Payments?.ToList() ?? new List<Payment>(),
                ShippingInfo = order.ShippingInfo,
                OrderItems = order.OrderItems?.ToList() ?? new List<OrderItem>(),
                ReturnRequests = new List<ReturnRequest>(),
                Disputes = new List<Dispute>()
            };
        }

        private static bool HasOpenReturn(Order order)
        {
            return order.ReturnRequests.Any(request =>
                string.Equals(request.RequestType, "return", StringComparison.OrdinalIgnoreCase)
                && (string.Equals(request.Status, "pending", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(request.Status, "approved", StringComparison.OrdinalIgnoreCase)));
        }

        private static bool HasOpenInr(Order order)
        {
            return order.Disputes.Any(dispute =>
                string.Equals(dispute.CaseType, "inr", StringComparison.OrdinalIgnoreCase)
                && (string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(dispute.Status, "in_progress", StringComparison.OrdinalIgnoreCase)));
        }
    }
}
