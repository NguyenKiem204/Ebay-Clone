using System.Text.Json.Nodes;
using ebay.Exceptions;
using ebay.Models;

namespace ebay.Services.Implementations
{
    internal static class CaseFinancialOutcomeHelper
    {
        private const string FinancialOutcomeRefund = "refund";
        private const string FinancialOutcomeReimbursement = "reimbursement";
        private const string OrderStatusRefunded = "refunded";
        private const string PaymentStatusCompleted = "completed";
        private const string PaymentStatusRefunded = "refunded";
        private const string ReturnResolutionTypeRefund = "refund";

        public static (string? FinancialOutcome, decimal? FinancialAmount) ResolveReturnFinancialOutcome(
            ReturnRequest returnRequest,
            string? nextStatus)
        {
            if (!string.Equals(Normalize(nextStatus), "completed", StringComparison.Ordinal))
            {
                return (null, null);
            }

            if (!string.Equals(Normalize(returnRequest.ResolutionType), ReturnResolutionTypeRefund, StringComparison.Ordinal))
            {
                return (null, null);
            }

            if (!returnRequest.RefundAmount.HasValue || returnRequest.RefundAmount.Value <= 0)
            {
                return (null, null);
            }

            return (FinancialOutcomeRefund, returnRequest.RefundAmount.Value);
        }

        public static (string? FinancialOutcome, decimal? FinancialAmount) NormalizeDisputeFinancialOutcome(
            string? financialOutcome,
            decimal? financialAmount)
        {
            var normalizedOutcome = Normalize(financialOutcome);

            if (normalizedOutcome == null && !financialAmount.HasValue)
            {
                return (null, null);
            }

            if (normalizedOutcome is not (FinancialOutcomeRefund or FinancialOutcomeReimbursement))
            {
                throw new BadRequestException(
                    "Financial outcome must be refund or reimbursement when provided.",
                    new List<string> { "financial_outcome_invalid" });
            }

            if (!financialAmount.HasValue || financialAmount.Value <= 0)
            {
                throw new BadRequestException(
                    "Financial amount must be greater than zero when a financial outcome is provided.",
                    new List<string> { "financial_amount_required" });
            }

            return (normalizedOutcome, financialAmount.Value);
        }

        public static bool TryApplyFullRefundSync(Order? order, decimal? financialAmount, DateTime now)
        {
            if (order == null || !financialAmount.HasValue || financialAmount.Value <= 0 || order.TotalPrice <= 0)
            {
                return false;
            }

            if (financialAmount.Value < order.TotalPrice)
            {
                return false;
            }

            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            var latestPaymentStatus = Normalize(latestPayment?.Status);
            if (latestPayment == null || latestPaymentStatus is not (PaymentStatusCompleted or PaymentStatusRefunded))
            {
                return false;
            }

            var applied = false;

            if (!string.Equals(Normalize(order.Status), OrderStatusRefunded, StringComparison.Ordinal))
            {
                order.Status = OrderStatusRefunded;
                order.UpdatedAt = now;
                applied = true;
            }

            if (!string.Equals(latestPaymentStatus, PaymentStatusRefunded, StringComparison.Ordinal))
            {
                latestPayment.Status = PaymentStatusRefunded;
                applied = true;
            }

            return applied;
        }

        public static void AppendFinancialMetadata(
            CaseEvent caseEvent,
            string? financialOutcome,
            decimal? financialAmount,
            bool financialStatusSyncApplied)
        {
            if (financialOutcome == null && !financialAmount.HasValue && !financialStatusSyncApplied)
            {
                return;
            }

            var metadata = string.IsNullOrWhiteSpace(caseEvent.MetadataJson)
                ? new JsonObject()
                : JsonNode.Parse(caseEvent.MetadataJson)?.AsObject() ?? new JsonObject();

            if (!string.IsNullOrWhiteSpace(financialOutcome))
            {
                metadata["financialOutcome"] = financialOutcome;
            }

            if (financialAmount.HasValue)
            {
                metadata["financialAmount"] = financialAmount.Value;
            }

            if (financialStatusSyncApplied)
            {
                metadata["orderStatus"] = OrderStatusRefunded;
                metadata["paymentStatus"] = PaymentStatusRefunded;
            }

            metadata["financialStatusSyncApplied"] = financialStatusSyncApplied;
            caseEvent.MetadataJson = metadata.ToJsonString();
        }

        private static string? Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim().ToLowerInvariant();
        }
    }
}
