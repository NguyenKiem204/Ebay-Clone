using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using System.Text.Json;

namespace ebay.Services.Implementations
{
    public class BuyerCaseProjectionMapper : IBuyerCaseProjectionMapper
    {
        private readonly ICaseSlaService _caseSlaService;

        public BuyerCaseProjectionMapper(ICaseSlaService caseSlaService)
        {
            _caseSlaService = caseSlaService;
        }

        public BuyerCaseListItemResponseDto MapReturnListItem(ReturnRequest returnRequest, IEnumerable<CaseEvent>? timeline = null)
        {
            var detail = MapReturnRequest(returnRequest, timeline);
            return new BuyerCaseListItemResponseDto
            {
                CaseKind = "return",
                CaseId = detail.Id,
                Type = detail.RequestType,
                Status = detail.Status,
                DisplayStatus = detail.DisplayStatus,
                NextAction = detail.NextAction,
                CreatedAt = detail.CreatedAt,
                ClosedAt = detail.ClosedAt,
                Order = detail.Order,
                OrderItem = detail.OrderItem,
                Sla = detail.Sla,
                LatestEvent = detail.Timeline
                    .OrderByDescending(evt => evt.CreatedAt)
                    .FirstOrDefault()
            };
        }

        public BuyerCaseListItemResponseDto MapDisputeListItem(Dispute dispute, IEnumerable<CaseEvent>? timeline = null)
        {
            var detail = MapDispute(dispute, timeline);
            return new BuyerCaseListItemResponseDto
            {
                CaseKind = "dispute",
                CaseId = detail.Id,
                Type = detail.CaseType,
                Status = detail.Status,
                DisplayStatus = detail.DisplayStatus,
                NextAction = detail.NextAction,
                CreatedAt = detail.CreatedAt,
                ClosedAt = detail.ClosedAt,
                Order = detail.Order,
                OrderItem = detail.OrderItem,
                Sla = detail.Sla,
                LatestEvent = detail.Timeline
                    .OrderByDescending(evt => evt.CreatedAt)
                    .FirstOrDefault()
            };
        }

        public ReturnRequestResponseDto MapReturnRequest(ReturnRequest returnRequest, IEnumerable<CaseEvent>? timeline = null)
        {
            Order? order = returnRequest.Order;
            var orderItem = ResolveOrderItem(returnRequest.OrderItem, returnRequest.OrderItemId, order);
            var timelineItems = timeline?.ToList() ?? new List<CaseEvent>();
            var requestedResolution = FindCreatedMetadataValue(timelineItems, "requestedResolution")
                ?? InferRequestedResolution(returnRequest.ResolutionType);
            var returnTracking = BuildReturnTracking(timelineItems);
            var refundSummary = BuildReturnRefundSummary(returnRequest, order, timelineItems);
            var isCancelled = HasMetadataFlag(timelineItems, "cancel_return", "buyerDisplayStatus", "cancelled");
            var displayStatus = ResolveReturnDisplayStatus(returnRequest, requestedResolution, refundSummary, returnTracking, isCancelled);
            var nextAction = ResolveReturnNextAction(returnRequest, requestedResolution, refundSummary, returnTracking, isCancelled);

            return new ReturnRequestResponseDto
            {
                Id = returnRequest.Id,
                OrderId = returnRequest.OrderId,
                OrderItemId = returnRequest.OrderItemId,
                RequestType = returnRequest.RequestType,
                ReasonCode = returnRequest.ReasonCode,
                Reason = returnRequest.Reason,
                Description = FindCreatedMetadataValue(timelineItems, "description"),
                ResolutionType = returnRequest.ResolutionType,
                RequestedResolution = requestedResolution,
                Status = returnRequest.Status,
                DisplayStatus = displayStatus,
                NextAction = nextAction,
                CanCancel = string.Equals(returnRequest.Status, "pending", StringComparison.OrdinalIgnoreCase) && !isCancelled,
                CanSubmitTracking =
                    string.Equals(returnRequest.Status, "approved", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(requestedResolution, "refund_only", StringComparison.OrdinalIgnoreCase)
                    && returnTracking?.ShippedAt == null
                    && !isCancelled,
                RefundAmount = returnRequest.RefundAmount,
                ApprovedAt = returnRequest.ApprovedAt,
                RejectedAt = returnRequest.RejectedAt,
                ClosedAt = returnRequest.ClosedAt,
                CreatedAt = returnRequest.CreatedAt ?? DateTime.UtcNow,
                Order = order == null ? null : MapOrderSummary(order),
                OrderItem = orderItem == null ? null : MapOrderItemSummary(orderItem),
                Sla = MapSla(_caseSlaService.EvaluateReturn(returnRequest)),
                ReturnTracking = returnTracking,
                RefundSummary = refundSummary,
                Evidence = MapEvidence(returnRequest.CaseAttachments),
                Timeline = MapTimeline(timeline)
            };
        }

        public DisputeResponseDto MapDispute(Dispute dispute, IEnumerable<CaseEvent>? timeline = null)
        {
            Order? order = dispute.Order;
            var orderItem = ResolveOrderItem(dispute.OrderItem, dispute.OrderItemId, order);
            var timelineItems = timeline?.ToList() ?? new List<CaseEvent>();
            var reasonCode = FindCreatedMetadataValue(timelineItems, "reasonCode");
            var refundSummary = BuildDisputeRefundSummary(dispute, order, timelineItems);
            var isCancelled = HasMetadataFlag(timelineItems, "cancel_inr", "buyerDisplayStatus", "cancelled");
            var isEscalated = HasMetadataFlag(timelineItems, "escalate_inr", "buyerDisplayStatus", "escalated_to_platform");
            var canEscalate =
                string.Equals(dispute.CaseType, "inr", StringComparison.OrdinalIgnoreCase)
                && string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase)
                && !isCancelled
                && !isEscalated
                && (dispute.CreatedAt ?? DateTime.UtcNow).AddDays(3) <= DateTime.UtcNow;
            var displayStatus = ResolveDisputeDisplayStatus(dispute, refundSummary, isCancelled, isEscalated);
            var nextAction = ResolveDisputeNextAction(dispute, isCancelled, isEscalated, canEscalate);

            return new DisputeResponseDto
            {
                Id = dispute.Id,
                OrderId = dispute.OrderId,
                OrderItemId = dispute.OrderItemId,
                CaseType = dispute.CaseType,
                ReasonCode = reasonCode,
                Description = dispute.Description,
                Status = dispute.Status,
                DisplayStatus = displayStatus,
                NextAction = nextAction,
                CanCancel =
                    string.Equals(dispute.CaseType, "inr", StringComparison.OrdinalIgnoreCase)
                    && string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase)
                    && !isCancelled,
                CanEscalate = canEscalate,
                Resolution = dispute.Resolution,
                EscalatedFromReturnRequestId = dispute.EscalatedFromReturnRequestId,
                ClosedReason = dispute.ClosedReason,
                ResolvedAt = dispute.ResolvedAt,
                ClosedAt = dispute.ClosedAt,
                CreatedAt = dispute.CreatedAt ?? DateTime.UtcNow,
                Order = order == null ? null : MapOrderSummary(order),
                OrderItem = orderItem == null ? null : MapOrderItemSummary(orderItem),
                Sla = MapSla(_caseSlaService.EvaluateDispute(dispute)),
                RefundSummary = refundSummary,
                Evidence = MapEvidence(dispute.CaseAttachments),
                Timeline = MapTimeline(timeline)
            };
        }

        public BuyerCaseEventResponseDto MapCaseEvent(CaseEvent caseEvent)
        {
            return new BuyerCaseEventResponseDto
            {
                Id = caseEvent.Id,
                EventType = caseEvent.EventType,
                ActorType = caseEvent.ActorType,
                ActorUserId = caseEvent.ActorUserId,
                ActorDisplayName = ResolveActorDisplayName(caseEvent.ActorUser),
                Message = caseEvent.Message,
                MetadataJson = caseEvent.MetadataJson,
                CreatedAt = caseEvent.CreatedAt ?? DateTime.UtcNow
            };
        }

        public BuyerCaseEvidenceResponseDto MapCaseAttachment(CaseAttachment caseAttachment)
        {
            return new BuyerCaseEvidenceResponseDto
            {
                Id = caseAttachment.Id,
                FilePath = caseAttachment.FilePath,
                OriginalFileName = caseAttachment.OriginalFileName,
                ContentType = caseAttachment.ContentType,
                FileSizeBytes = caseAttachment.FileSizeBytes,
                Label = caseAttachment.Label,
                EvidenceType = caseAttachment.EvidenceType,
                UploadedByUserId = caseAttachment.UploadedByUserId,
                UploadedByDisplayName = ResolveActorDisplayName(caseAttachment.UploadedByUser),
                UploadedAt = caseAttachment.CreatedAt ?? DateTime.UtcNow
            };
        }

        private List<BuyerCaseEventResponseDto> MapTimeline(IEnumerable<CaseEvent>? timeline)
        {
            if (timeline == null)
            {
                return new List<BuyerCaseEventResponseDto>();
            }

            return timeline
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .Select(MapCaseEvent)
                .ToList();
        }

        private List<BuyerCaseEvidenceResponseDto> MapEvidence(IEnumerable<CaseAttachment>? evidence)
        {
            if (evidence == null)
            {
                return new List<BuyerCaseEvidenceResponseDto>();
            }

            return evidence
                .OrderByDescending(item => item.CreatedAt ?? DateTime.MinValue)
                .Select(MapCaseAttachment)
                .ToList();
        }

        private static BuyerCaseSlaResponseDto MapSla(CaseSlaSnapshot snapshot)
        {
            return new BuyerCaseSlaResponseDto
            {
                Stage = snapshot.Stage,
                StageLabel = snapshot.StageLabel,
                LastActivityAt = snapshot.LastActivityAtUtc,
                DueBy = snapshot.DueByUtc,
                IsOverdue = snapshot.IsOverdue,
                ReminderSuggested = snapshot.ReminderSuggested,
                AgeHours = snapshot.AgeHours,
                HoursUntilDue = snapshot.HoursUntilDue,
                HoursOverdue = snapshot.HoursOverdue
            };
        }

        private static BuyerCaseOrderSummaryResponseDto MapOrderSummary(Order order)
        {
            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            return new BuyerCaseOrderSummaryResponseDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status,
                PaymentStatus = latestPayment?.Status ?? "pending",
                PaymentMethod = latestPayment?.Method ?? string.Empty,
                ShippingStatus = order.ShippingInfo?.Status,
                TotalAmount = order.TotalPrice,
                CreatedAt = order.CreatedAt ?? order.OrderDate ?? DateTime.UtcNow,
                DeliveredAt = order.ShippingInfo?.DeliveredAt
            };
        }

        private static BuyerCaseOrderItemSummaryResponseDto MapOrderItemSummary(OrderItem orderItem)
        {
            return new BuyerCaseOrderItemSummaryResponseDto
            {
                Id = orderItem.Id,
                ProductId = orderItem.ProductId,
                Title = ResolveItemTitle(orderItem),
                Image = ResolveItemImage(orderItem),
                SellerDisplayName = ResolveSellerDisplayName(orderItem),
                Quantity = orderItem.Quantity,
                UnitPrice = orderItem.UnitPrice,
                TotalPrice = orderItem.TotalPrice
            };
        }

        private static OrderItem? ResolveOrderItem(OrderItem? orderItem, int? orderItemId, Order? order)
        {
            if (orderItem != null)
            {
                return orderItem;
            }

            if (!orderItemId.HasValue || order?.OrderItems == null)
            {
                return null;
            }

            return order.OrderItems.FirstOrDefault(item => item.Id == orderItemId.Value);
        }

        private static string ResolveItemTitle(OrderItem orderItem)
        {
            return FirstNonEmpty(orderItem.ProductTitleSnapshot, orderItem.Product?.Title);
        }

        private static string? ResolveItemImage(OrderItem orderItem)
        {
            if (!string.IsNullOrWhiteSpace(orderItem.ProductImageSnapshot))
            {
                return orderItem.ProductImageSnapshot;
            }

            if (orderItem.Product?.Images != null && orderItem.Product.Images.Any())
            {
                return orderItem.Product.Images[0];
            }

            return null;
        }

        private static string ResolveSellerDisplayName(OrderItem orderItem)
        {
            return FirstNonEmpty(orderItem.SellerDisplayNameSnapshot, orderItem.Seller?.Username);
        }

        private static string? ResolveActorDisplayName(User? actorUser)
        {
            if (actorUser == null)
            {
                return null;
            }

            var fullName = string.Join(" ", new[] { actorUser.FirstName, actorUser.LastName }
                .Where(value => !string.IsNullOrWhiteSpace(value)));

            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }

            return FirstNonEmptyOrNull(actorUser.Username, actorUser.Email);
        }

        private static string FirstNonEmpty(params string?[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            return string.Empty;
        }

        private static string? FirstNonEmptyOrNull(params string?[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            return null;
        }

        private static string? FindCreatedMetadataValue(IEnumerable<CaseEvent> timeline, string propertyName)
        {
            var createdEvent = timeline
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault(evt => string.Equals(evt.EventType, "created", StringComparison.OrdinalIgnoreCase));

            return createdEvent == null ? null : GetMetadataString(createdEvent.MetadataJson, propertyName);
        }

        private static bool HasMetadataFlag(
            IEnumerable<CaseEvent> timeline,
            string requestAction,
            string propertyName,
            string expectedValue)
        {
            return timeline.Any(evt =>
                string.Equals(GetMetadataString(evt.MetadataJson, "requestAction"), requestAction, StringComparison.OrdinalIgnoreCase)
                || string.Equals(GetMetadataString(evt.MetadataJson, propertyName), expectedValue, StringComparison.OrdinalIgnoreCase));
        }

        private static BuyerCaseTrackingResponseDto? BuildReturnTracking(IEnumerable<CaseEvent> timeline)
        {
            var trackingEvent = timeline
                .OrderByDescending(evt => evt.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault(evt => string.Equals(GetMetadataString(evt.MetadataJson, "requestAction"), "submit_return_tracking", StringComparison.OrdinalIgnoreCase));

            if (trackingEvent == null)
            {
                return null;
            }

            return new BuyerCaseTrackingResponseDto
            {
                Carrier = GetMetadataString(trackingEvent.MetadataJson, "carrier") ?? string.Empty,
                TrackingNumber = GetMetadataString(trackingEvent.MetadataJson, "trackingNumber") ?? string.Empty,
                ShippedAt = GetMetadataDateTime(trackingEvent.MetadataJson, "shippedAt"),
                ReceivedAt = GetMetadataDateTime(trackingEvent.MetadataJson, "receivedAt")
            };
        }

        private static BuyerCaseRefundSummaryResponseDto? BuildReturnRefundSummary(
            ReturnRequest returnRequest,
            Order? order,
            IEnumerable<CaseEvent> timeline)
        {
            var financialEvent = timeline
                .OrderByDescending(evt => evt.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault(evt => GetMetadataDecimal(evt.MetadataJson, "financialAmount").HasValue);

            var amount = GetMetadataDecimal(financialEvent?.MetadataJson, "financialAmount") ?? returnRequest.RefundAmount;
            if (!amount.HasValue)
            {
                return null;
            }

            var paymentMethod = order?.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault()?.Method ?? "Not available";

            return new BuyerCaseRefundSummaryResponseDto
            {
                Amount = amount.Value,
                Method = paymentMethod,
                Status = string.Equals(returnRequest.Status, "completed", StringComparison.OrdinalIgnoreCase)
                    ? "Refunded"
                    : "Refund processing",
                ProcessedAt = financialEvent?.CreatedAt ?? returnRequest.ClosedAt ?? returnRequest.ApprovedAt
            };
        }

        private static BuyerCaseRefundSummaryResponseDto? BuildDisputeRefundSummary(
            Dispute dispute,
            Order? order,
            IEnumerable<CaseEvent> timeline)
        {
            var financialEvent = timeline
                .OrderByDescending(evt => evt.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault(evt => GetMetadataDecimal(evt.MetadataJson, "financialAmount").HasValue);

            var amount = GetMetadataDecimal(financialEvent?.MetadataJson, "financialAmount");
            if (!amount.HasValue)
            {
                return null;
            }

            var paymentMethod = order?.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault()?.Method ?? "Not available";

            return new BuyerCaseRefundSummaryResponseDto
            {
                Amount = amount.Value,
                Method = paymentMethod,
                Status = string.Equals(dispute.Status, "resolved", StringComparison.OrdinalIgnoreCase)
                    ? "Refunded"
                    : "Refund processing",
                ProcessedAt = financialEvent?.CreatedAt ?? dispute.ResolvedAt ?? dispute.ClosedAt
            };
        }

        private static string ResolveReturnDisplayStatus(
            ReturnRequest returnRequest,
            string? requestedResolution,
            BuyerCaseRefundSummaryResponseDto? refundSummary,
            BuyerCaseTrackingResponseDto? returnTracking,
            bool isCancelled)
        {
            if (isCancelled)
            {
                return "Cancelled";
            }

            if (string.Equals(returnRequest.Status, "rejected", StringComparison.OrdinalIgnoreCase))
            {
                return "Rejected";
            }

            if (refundSummary != null && string.Equals(refundSummary.Status, "Refunded", StringComparison.OrdinalIgnoreCase))
            {
                return "Refunded";
            }

            if (returnTracking?.ReceivedAt != null)
            {
                return "Seller received return";
            }

            if (returnTracking?.ShippedAt != null)
            {
                return "Buyer shipped return";
            }

            if (string.Equals(returnRequest.Status, "approved", StringComparison.OrdinalIgnoreCase))
            {
                return string.Equals(requestedResolution, "refund_only", StringComparison.OrdinalIgnoreCase)
                    ? "Approved refund only"
                    : "Return shipping required";
            }

            if (string.Equals(returnRequest.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                return "Waiting seller response";
            }

            if (string.Equals(returnRequest.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                return refundSummary != null ? "Refunded" : "Closed";
            }

            return HumanizeFallbackStatus(returnRequest.Status);
        }

        private static string? ResolveReturnNextAction(
            ReturnRequest returnRequest,
            string? requestedResolution,
            BuyerCaseRefundSummaryResponseDto? refundSummary,
            BuyerCaseTrackingResponseDto? returnTracking,
            bool isCancelled)
        {
            if (isCancelled
                || string.Equals(returnRequest.Status, "rejected", StringComparison.OrdinalIgnoreCase)
                || string.Equals(returnRequest.Status, "completed", StringComparison.OrdinalIgnoreCase)
                || (refundSummary != null && string.Equals(refundSummary.Status, "Refunded", StringComparison.OrdinalIgnoreCase)))
            {
                return null;
            }

            if (string.Equals(returnRequest.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                return "Wait for the seller response or cancel this request.";
            }

            if (string.Equals(returnRequest.Status, "approved", StringComparison.OrdinalIgnoreCase)
                && string.Equals(requestedResolution, "refund_only", StringComparison.OrdinalIgnoreCase))
            {
                return "Wait for refund processing updates.";
            }

            if (string.Equals(returnRequest.Status, "approved", StringComparison.OrdinalIgnoreCase)
                && returnTracking?.ShippedAt == null)
            {
                return "Ship the item back and submit the return tracking.";
            }

            if (returnTracking?.ShippedAt != null && returnTracking?.ReceivedAt == null)
            {
                return "Wait for the seller to receive the return.";
            }

            if (returnTracking?.ReceivedAt != null)
            {
                return "Wait for refund processing updates.";
            }

            return null;
        }

        private static string ResolveDisputeDisplayStatus(
            Dispute dispute,
            BuyerCaseRefundSummaryResponseDto? refundSummary,
            bool isCancelled,
            bool isEscalated)
        {
            if (isCancelled)
            {
                return "Cancelled";
            }

            if (string.Equals(dispute.Status, "resolved", StringComparison.OrdinalIgnoreCase))
            {
                if (refundSummary != null)
                {
                    return "Resolved refunded";
                }

                if ((dispute.Resolution ?? string.Empty).Contains("deliver", StringComparison.OrdinalIgnoreCase))
                {
                    return "Resolved delivered";
                }

                return "Resolved";
            }

            if (isEscalated)
            {
                return "Escalated to platform";
            }

            if (string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase))
            {
                return "Waiting seller response";
            }

            if (string.Equals(dispute.Status, "in_progress", StringComparison.OrdinalIgnoreCase))
            {
                return "Seller responded";
            }

            if (string.Equals(dispute.Status, "closed", StringComparison.OrdinalIgnoreCase))
            {
                return "Closed";
            }

            return HumanizeFallbackStatus(dispute.Status);
        }

        private static string? ResolveDisputeNextAction(
            Dispute dispute,
            bool isCancelled,
            bool isEscalated,
            bool canEscalate)
        {
            if (isCancelled
                || string.Equals(dispute.Status, "closed", StringComparison.OrdinalIgnoreCase)
                || string.Equals(dispute.Status, "resolved", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            if (isEscalated)
            {
                return "Wait for platform review and the next case update.";
            }

            if (canEscalate)
            {
                return "You can escalate this INR request if the seller does not resolve it.";
            }

            if (string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase))
            {
                return "Wait for the seller response or cancel this request.";
            }

            if (string.Equals(dispute.Status, "in_progress", StringComparison.OrdinalIgnoreCase))
            {
                return "Wait for the latest case update.";
            }

            return null;
        }

        private static string? InferRequestedResolution(string? storedResolutionType)
        {
            return string.Equals(storedResolutionType, "refund", StringComparison.OrdinalIgnoreCase)
                ? "return_for_refund"
                : storedResolutionType;
        }

        private static string HumanizeFallbackStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return "Unknown";
            }

            return string.Join(" ",
                status
                    .Split('_', StringSplitOptions.RemoveEmptyEntries)
                    .Select(segment => char.ToUpperInvariant(segment[0]) + segment[1..].ToLowerInvariant()));
        }

        private static string? GetMetadataString(string? metadataJson, string propertyName)
        {
            if (string.IsNullOrWhiteSpace(metadataJson))
            {
                return null;
            }

            try
            {
                using var document = JsonDocument.Parse(metadataJson);
                if (document.RootElement.ValueKind != JsonValueKind.Object
                    || !document.RootElement.TryGetProperty(propertyName, out var property))
                {
                    return null;
                }

                return property.ValueKind switch
                {
                    JsonValueKind.String => property.GetString(),
                    JsonValueKind.Number => property.ToString(),
                    JsonValueKind.True => "true",
                    JsonValueKind.False => "false",
                    _ => null
                };
            }
            catch
            {
                return null;
            }
        }

        private static decimal? GetMetadataDecimal(string? metadataJson, string propertyName)
        {
            var rawValue = GetMetadataString(metadataJson, propertyName);
            return decimal.TryParse(rawValue, out var parsed) ? parsed : null;
        }

        private static DateTime? GetMetadataDateTime(string? metadataJson, string propertyName)
        {
            var rawValue = GetMetadataString(metadataJson, propertyName);
            return DateTime.TryParse(rawValue, out var parsed) ? parsed : null;
        }
    }
}
