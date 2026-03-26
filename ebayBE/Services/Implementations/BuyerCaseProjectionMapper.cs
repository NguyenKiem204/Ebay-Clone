using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;

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

            return new ReturnRequestResponseDto
            {
                Id = returnRequest.Id,
                OrderId = returnRequest.OrderId,
                OrderItemId = returnRequest.OrderItemId,
                RequestType = returnRequest.RequestType,
                ReasonCode = returnRequest.ReasonCode,
                Reason = returnRequest.Reason,
                ResolutionType = returnRequest.ResolutionType,
                Status = returnRequest.Status,
                RefundAmount = returnRequest.RefundAmount,
                ApprovedAt = returnRequest.ApprovedAt,
                RejectedAt = returnRequest.RejectedAt,
                ClosedAt = returnRequest.ClosedAt,
                CreatedAt = returnRequest.CreatedAt ?? DateTime.UtcNow,
                Order = order == null ? null : MapOrderSummary(order),
                OrderItem = orderItem == null ? null : MapOrderItemSummary(orderItem),
                Sla = MapSla(_caseSlaService.EvaluateReturn(returnRequest)),
                Evidence = MapEvidence(returnRequest.CaseAttachments),
                Timeline = MapTimeline(timeline)
            };
        }

        public DisputeResponseDto MapDispute(Dispute dispute, IEnumerable<CaseEvent>? timeline = null)
        {
            Order? order = dispute.Order;
            var orderItem = ResolveOrderItem(dispute.OrderItem, dispute.OrderItemId, order);

            return new DisputeResponseDto
            {
                Id = dispute.Id,
                OrderId = dispute.OrderId,
                OrderItemId = dispute.OrderItemId,
                CaseType = dispute.CaseType,
                Description = dispute.Description,
                Status = dispute.Status,
                Resolution = dispute.Resolution,
                EscalatedFromReturnRequestId = dispute.EscalatedFromReturnRequestId,
                ClosedReason = dispute.ClosedReason,
                ResolvedAt = dispute.ResolvedAt,
                ClosedAt = dispute.ClosedAt,
                CreatedAt = dispute.CreatedAt ?? DateTime.UtcNow,
                Order = order == null ? null : MapOrderSummary(order),
                OrderItem = orderItem == null ? null : MapOrderItemSummary(orderItem),
                Sla = MapSla(_caseSlaService.EvaluateDispute(dispute)),
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
    }
}
