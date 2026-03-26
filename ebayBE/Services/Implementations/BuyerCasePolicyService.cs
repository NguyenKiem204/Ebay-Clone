using ebay.Models;
using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class BuyerCasePolicyService : IBuyerCasePolicyService
    {
        private const string CustomerTypeMember = "member";
        private const string CustomerTypeGuest = "guest";

        private const string OrderStatusPending = "pending";
        private const string OrderStatusConfirmed = "confirmed";
        private const string OrderStatusProcessing = "processing";
        private const string OrderStatusShipped = "shipped";
        private const string OrderStatusDelivered = "delivered";
        private const string OrderStatusCancelled = "cancelled";
        private const string OrderStatusRefunded = "refunded";

        private const string PaymentStatusPending = "pending";
        private const string PaymentStatusCompleted = "completed";
        private const string PaymentStatusFailed = "failed";
        private const string PaymentStatusRefunded = "refunded";

        private const string ShippingStatusPending = "pending";
        private const string ShippingStatusInTransit = "in_transit";
        private const string ShippingStatusOutForDelivery = "out_for_delivery";
        private const string ShippingStatusDelivered = "delivered";
        private const string ShippingStatusFailed = "failed";

        private const string ReturnStatusPending = "pending";
        private const string ReturnStatusApproved = "approved";
        private const string ReturnStatusRejected = "rejected";
        private const string ReturnStatusCompleted = "completed";

        private const string DisputeStatusOpen = "open";
        private const string DisputeStatusInProgress = "in_progress";
        private const string DisputeStatusResolved = "resolved";
        private const string DisputeStatusClosed = "closed";

        private static readonly TimeSpan ReturnWindow = TimeSpan.FromDays(30);
        private static readonly TimeSpan SnadWindow = TimeSpan.FromDays(30);
        private static readonly TimeSpan InrEstimatedArrivalGrace = TimeSpan.FromDays(2);
        private static readonly TimeSpan InrShippedFallback = TimeSpan.FromDays(10);
        private static readonly TimeSpan EscalationResponseWindow = TimeSpan.FromDays(3);

        public BuyerCasePolicyDecision CanOpenReturn(Order order, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var commonDecision = ValidateCommonMemberCaseEligibility(order);
            if (!commonDecision.Allowed)
            {
                return commonDecision;
            }

            return EvaluateReturnEligibility(order, now);
        }

        public BuyerCasePolicyDecision CanOpenGuestReturn(Order order, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var commonDecision = ValidateCommonGuestCaseEligibility(order);
            if (!commonDecision.Allowed)
            {
                return commonDecision;
            }

            return EvaluateReturnEligibility(order, now);
        }

        public BuyerCasePolicyDecision CanOpenInr(Order order, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var commonDecision = ValidateCommonMemberCaseEligibility(order);
            if (!commonDecision.Allowed)
            {
                return commonDecision;
            }

            return EvaluateInrEligibility(order, now);
        }

        public BuyerCasePolicyDecision CanOpenGuestInr(Order order, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var commonDecision = ValidateCommonGuestCaseEligibility(order);
            if (!commonDecision.Allowed)
            {
                return commonDecision;
            }

            return EvaluateInrEligibility(order, now);
        }

        private BuyerCasePolicyDecision EvaluateInrEligibility(Order order, DateTime now)
        {
            if (HasBlockingAfterSalesCase(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "active_after_sales_case_exists",
                    "The order already has an active after-sales case.");
            }

            if (IsDelivered(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "order_already_delivered",
                    "INR cannot be opened after the order is marked as delivered.");
            }

            var eligibleFrom = GetInrEligibleFrom(order);
            if (!eligibleFrom.HasValue)
            {
                return BuyerCasePolicyDecision.Deny(
                    "inr_too_early",
                    "INR is not available yet because the shipment is still within the normal delivery window.");
            }

            if (now < eligibleFrom.Value)
            {
                return BuyerCasePolicyDecision.Deny(
                    "inr_too_early",
                    "INR is not available yet because the shipment is still within the normal delivery window.",
                    retryAfterUtc: eligibleFrom);
            }

            return BuyerCasePolicyDecision.Allow(
                "inr_allowed",
                "The order is eligible for an INR claim.");
        }

        public BuyerCasePolicyDecision CanOpenSnad(Order order, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var commonDecision = ValidateCommonMemberCaseEligibility(order);
            if (!commonDecision.Allowed)
            {
                return commonDecision;
            }

            return EvaluateSnadEligibility(order, now);
        }

        public BuyerCasePolicyDecision CanOpenGuestSnad(Order order, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var commonDecision = ValidateCommonGuestCaseEligibility(order);
            if (!commonDecision.Allowed)
            {
                return commonDecision;
            }

            return EvaluateSnadEligibility(order, now);
        }

        public BuyerCasePolicyDecision CanEscalate(
            Order order,
            BuyerCaseType sourceCaseType,
            string? sourceStatus,
            DateTime? sourceCreatedAt,
            DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var commonDecision = ValidateCommonMemberCaseEligibility(order);
            if (!commonDecision.Allowed)
            {
                return commonDecision;
            }

            if (HasActiveDispute(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "active_dispute_exists",
                    "The order already has an active dispute.");
            }

            var normalizedSourceStatus = Normalize(sourceStatus);
            if (string.IsNullOrWhiteSpace(normalizedSourceStatus))
            {
                return BuyerCasePolicyDecision.Deny(
                    "source_status_required",
                    "The source case status is required to evaluate escalation.");
            }

            if (normalizedSourceStatus == ReturnStatusRejected)
            {
                return BuyerCasePolicyDecision.Allow(
                    "escalation_allowed",
                    "The case can be escalated after a rejection.",
                    currentStatus: normalizedSourceStatus);
            }

            if (normalizedSourceStatus is not (ReturnStatusPending or DisputeStatusInProgress or DisputeStatusOpen))
            {
                return BuyerCasePolicyDecision.Deny(
                    "source_case_not_escalatable",
                    "The source case is not in a state that can be escalated.",
                    currentStatus: normalizedSourceStatus);
            }

            if (!sourceCreatedAt.HasValue)
            {
                return BuyerCasePolicyDecision.Deny(
                    "source_case_created_at_required",
                    "The source case timestamp is required to evaluate escalation.",
                    currentStatus: normalizedSourceStatus);
            }

            var retryAfter = sourceCreatedAt.Value.Add(EscalationResponseWindow);
            if (now < retryAfter)
            {
                return BuyerCasePolicyDecision.Deny(
                    "escalation_too_early",
                    $"The {DescribeCaseType(sourceCaseType)} case should wait for the response window before escalation.",
                    retryAfterUtc: retryAfter,
                    currentStatus: normalizedSourceStatus);
            }

            return BuyerCasePolicyDecision.Allow(
                "escalation_allowed",
                "The case is eligible for escalation.",
                currentStatus: normalizedSourceStatus);
        }

        private BuyerCasePolicyDecision EvaluateReturnEligibility(Order order, DateTime now)
        {
            if (HasAnyReturnRequest(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "return_request_already_exists",
                    "A return request already exists for this order.");
            }

            if (HasActiveDispute(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "active_dispute_exists",
                    "The order already has an active dispute.");
            }

            if (!IsDelivered(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "order_not_delivered",
                    "Returns can only be opened after the order is delivered.");
            }

            var deliveredAt = GetDeliveredAt(order);
            var windowEndsAt = deliveredAt?.Add(ReturnWindow);
            if (windowEndsAt.HasValue && now > windowEndsAt.Value)
            {
                return BuyerCasePolicyDecision.Deny(
                    "return_window_expired",
                    "The return window has expired for this order.",
                    windowEndsAtUtc: windowEndsAt);
            }

            return BuyerCasePolicyDecision.Allow(
                "return_allowed",
                "The order is eligible for a return request.",
                windowEndsAtUtc: windowEndsAt);
        }

        private BuyerCasePolicyDecision EvaluateSnadEligibility(Order order, DateTime now)
        {
            if (HasBlockingAfterSalesCase(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "active_after_sales_case_exists",
                    "The order already has an active after-sales case.");
            }

            if (!IsDelivered(order))
            {
                return BuyerCasePolicyDecision.Deny(
                    "order_not_delivered",
                    "SNAD claims can only be opened after the order is delivered.");
            }

            var deliveredAt = GetDeliveredAt(order);
            var windowEndsAt = deliveredAt?.Add(SnadWindow);
            if (windowEndsAt.HasValue && now > windowEndsAt.Value)
            {
                return BuyerCasePolicyDecision.Deny(
                    "snad_window_expired",
                    "The SNAD claim window has expired for this order.",
                    windowEndsAtUtc: windowEndsAt);
            }

            return BuyerCasePolicyDecision.Allow(
                "snad_allowed",
                "The order is eligible for a SNAD or damaged-item claim.",
                windowEndsAtUtc: windowEndsAt);
        }

        public BuyerCasePolicyDecision CanTransitionReturnStatus(string currentStatus, string nextStatus)
        {
            var normalizedCurrentStatus = Normalize(currentStatus);
            var normalizedNextStatus = Normalize(nextStatus);

            if (normalizedCurrentStatus == normalizedNextStatus)
            {
                return BuyerCasePolicyDecision.Deny(
                    "status_unchanged",
                    "The return request is already in the requested status.",
                    currentStatus: normalizedCurrentStatus,
                    nextStatus: normalizedNextStatus);
            }

            var allowed = normalizedCurrentStatus switch
            {
                ReturnStatusPending => normalizedNextStatus is ReturnStatusApproved or ReturnStatusRejected,
                ReturnStatusApproved => normalizedNextStatus == ReturnStatusCompleted,
                _ => false
            };

            if (!allowed)
            {
                return BuyerCasePolicyDecision.Deny(
                    "return_transition_not_allowed",
                    "The return request transition is not allowed.",
                    currentStatus: normalizedCurrentStatus,
                    nextStatus: normalizedNextStatus);
            }

            return BuyerCasePolicyDecision.Allow(
                "return_transition_allowed",
                "The return request transition is allowed.",
                currentStatus: normalizedCurrentStatus,
                nextStatus: normalizedNextStatus);
        }

        public BuyerCasePolicyDecision CanTransitionDisputeStatus(string currentStatus, string nextStatus)
        {
            var normalizedCurrentStatus = Normalize(currentStatus);
            var normalizedNextStatus = Normalize(nextStatus);

            if (normalizedCurrentStatus == normalizedNextStatus)
            {
                return BuyerCasePolicyDecision.Deny(
                    "status_unchanged",
                    "The dispute is already in the requested status.",
                    currentStatus: normalizedCurrentStatus,
                    nextStatus: normalizedNextStatus);
            }

            var allowed = normalizedCurrentStatus switch
            {
                DisputeStatusOpen => normalizedNextStatus is DisputeStatusInProgress or DisputeStatusResolved or DisputeStatusClosed,
                DisputeStatusInProgress => normalizedNextStatus is DisputeStatusResolved or DisputeStatusClosed,
                DisputeStatusResolved => normalizedNextStatus == DisputeStatusClosed,
                _ => false
            };

            if (!allowed)
            {
                return BuyerCasePolicyDecision.Deny(
                    "dispute_transition_not_allowed",
                    "The dispute transition is not allowed.",
                    currentStatus: normalizedCurrentStatus,
                    nextStatus: normalizedNextStatus);
            }

            return BuyerCasePolicyDecision.Allow(
                "dispute_transition_allowed",
                "The dispute transition is allowed.",
                currentStatus: normalizedCurrentStatus,
                nextStatus: normalizedNextStatus);
        }

        private static BuyerCasePolicyDecision ValidateCommonMemberCaseEligibility(Order order)
        {
            if (!string.Equals(order.CustomerType, CustomerTypeMember, StringComparison.OrdinalIgnoreCase) || !order.BuyerId.HasValue)
            {
                return BuyerCasePolicyDecision.Deny(
                    "guest_after_sales_not_supported",
                    "Buyer protection cases are currently supported for member orders only.");
            }

            var orderStatus = Normalize(order.Status);
            if (orderStatus == OrderStatusCancelled)
            {
                return BuyerCasePolicyDecision.Deny(
                    "order_cancelled",
                    "After-sales cases cannot be opened for cancelled orders.",
                    currentStatus: orderStatus);
            }

            if (orderStatus == OrderStatusRefunded)
            {
                return BuyerCasePolicyDecision.Deny(
                    "order_refunded",
                    "After-sales cases cannot be opened for refunded orders.",
                    currentStatus: orderStatus);
            }

            var paymentStatus = GetLatestPaymentStatus(order);
            if (paymentStatus == PaymentStatusFailed)
            {
                return BuyerCasePolicyDecision.Deny(
                    "payment_failed",
                    "After-sales cases cannot be opened for orders with failed payment.",
                    currentStatus: paymentStatus);
            }

            if (paymentStatus == PaymentStatusRefunded)
            {
                return BuyerCasePolicyDecision.Deny(
                    "payment_refunded",
                    "After-sales cases cannot be opened for orders that have already been refunded.",
                    currentStatus: paymentStatus);
            }

            return BuyerCasePolicyDecision.Allow(
                "buyer_case_allowed",
                "The order passed the common buyer-case eligibility checks.",
                currentStatus: orderStatus);
        }

        private static BuyerCasePolicyDecision ValidateCommonGuestCaseEligibility(Order order)
        {
            if (!string.Equals(order.CustomerType, CustomerTypeGuest, StringComparison.OrdinalIgnoreCase))
            {
                return BuyerCasePolicyDecision.Deny(
                    "guest_order_required",
                    "Guest after-sales access is only available for guest orders.");
            }

            if (string.IsNullOrWhiteSpace(order.GuestEmail))
            {
                return BuyerCasePolicyDecision.Deny(
                    "guest_email_missing",
                    "Guest after-sales access is not available because the order identity is incomplete.");
            }

            var orderStatus = Normalize(order.Status);
            if (orderStatus == OrderStatusCancelled)
            {
                return BuyerCasePolicyDecision.Deny(
                    "order_cancelled",
                    "After-sales cases cannot be opened for cancelled orders.",
                    currentStatus: orderStatus);
            }

            if (orderStatus == OrderStatusRefunded)
            {
                return BuyerCasePolicyDecision.Deny(
                    "order_refunded",
                    "After-sales cases cannot be opened for refunded orders.",
                    currentStatus: orderStatus);
            }

            var paymentStatus = GetLatestPaymentStatus(order);
            if (paymentStatus == PaymentStatusFailed)
            {
                return BuyerCasePolicyDecision.Deny(
                    "payment_failed",
                    "After-sales cases cannot be opened for orders with failed payment.",
                    currentStatus: paymentStatus);
            }

            if (paymentStatus == PaymentStatusRefunded)
            {
                return BuyerCasePolicyDecision.Deny(
                    "payment_refunded",
                    "After-sales cases cannot be opened for orders that have already been refunded.",
                    currentStatus: paymentStatus);
            }

            return BuyerCasePolicyDecision.Allow(
                "guest_case_allowed",
                "The order passed the common guest after-sales eligibility checks.",
                currentStatus: orderStatus);
        }

        private static bool HasBlockingAfterSalesCase(Order order)
        {
            return HasAnyReturnRequest(order) || HasActiveDispute(order);
        }

        private static bool HasAnyReturnRequest(Order order)
        {
            return order.ReturnRequests.Any();
        }

        private static bool HasActiveDispute(Order order)
        {
            return order.Disputes.Any(dispute =>
            {
                var status = Normalize(dispute.Status);
                return status is DisputeStatusOpen or DisputeStatusInProgress;
            });
        }

        private static bool IsDelivered(Order order)
        {
            var orderStatus = Normalize(order.Status);
            if (orderStatus == OrderStatusDelivered)
            {
                return true;
            }

            var shippingStatus = Normalize(order.ShippingInfo?.Status);
            if (shippingStatus == ShippingStatusDelivered)
            {
                return true;
            }

            return order.ShippingInfo?.DeliveredAt.HasValue == true;
        }

        private static DateTime? GetDeliveredAt(Order order)
        {
            if (order.ShippingInfo?.DeliveredAt.HasValue == true)
            {
                return order.ShippingInfo.DeliveredAt.Value;
            }

            if (Normalize(order.Status) == OrderStatusDelivered)
            {
                return order.UpdatedAt ?? order.CreatedAt ?? order.OrderDate;
            }

            return null;
        }

        private static DateTime? GetInrEligibleFrom(Order order)
        {
            var shippingStatus = Normalize(order.ShippingInfo?.Status);

            if (shippingStatus == ShippingStatusFailed)
            {
                return order.ShippingInfo?.UpdatedAt
                    ?? order.ShippingInfo?.CreatedAt
                    ?? order.UpdatedAt
                    ?? order.CreatedAt
                    ?? order.OrderDate;
            }

            if (order.ShippingInfo?.EstimatedArrival.HasValue == true)
            {
                return order.ShippingInfo.EstimatedArrival.Value.Add(InrEstimatedArrivalGrace);
            }

            if (order.ShippingInfo?.ShippedAt.HasValue == true)
            {
                return order.ShippingInfo.ShippedAt.Value.Add(InrShippedFallback);
            }

            var orderStatus = Normalize(order.Status);
            if (orderStatus is OrderStatusShipped or OrderStatusProcessing)
            {
                return (order.UpdatedAt ?? order.CreatedAt ?? order.OrderDate)?.Add(InrShippedFallback);
            }

            return null;
        }

        private static string GetLatestPaymentStatus(Order order)
        {
            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            return Normalize(latestPayment?.Status) ?? PaymentStatusPending;
        }

        private static string DescribeCaseType(BuyerCaseType caseType)
        {
            return caseType switch
            {
                BuyerCaseType.Return => "return",
                BuyerCaseType.Inr => "INR",
                BuyerCaseType.Snad => "SNAD",
                BuyerCaseType.DisputeEscalation => "dispute escalation",
                _ => "buyer protection"
            };
        }

        private static string? Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim().ToLowerInvariant();
        }
    }
}
