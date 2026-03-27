using System.Text.Json;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class BuyerCaseCommandService : IBuyerCaseCommandService
    {
        private readonly EbayDbContext _context;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseNotificationService _caseNotificationService;

        public BuyerCaseCommandService(
            EbayDbContext context,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper,
            ICaseNotificationService caseNotificationService)
        {
            _context = context;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
            _caseNotificationService = caseNotificationService;
        }

        public async Task<ReturnRequestResponseDto> CancelReturnRequestAsync(
            int userId,
            int returnRequestId,
            CancelBuyerCaseRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var returnRequest = await LoadBuyerReturnRequestAsync(userId, returnRequestId, cancellationToken);

            if (!string.Equals(returnRequest.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Only waiting return requests can be cancelled by the buyer.");
            }

            var note = NormalizeOptional(request.Note) ?? "Cancelled by buyer.";
            var now = DateTime.UtcNow;

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                returnRequest.Status = "rejected";
                returnRequest.AdminNotes = note;
                returnRequest.RejectedAt = now;
                returnRequest.ClosedAt = now;
                returnRequest.UpdatedAt = now;

                await _context.CaseEvents.AddAsync(new CaseEvent
                {
                    ReturnRequestId = returnRequest.Id,
                    EventType = "closed",
                    ActorType = "buyer",
                    ActorUserId = userId,
                    Message = "Buyer cancelled this return / refund request.",
                    MetadataJson = JsonSerializer.Serialize(new
                    {
                        requestAction = "cancel_return",
                        buyerDisplayStatus = "cancelled",
                        note
                    }),
                    CreatedAt = now
                }, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }

            await _caseNotificationService.TryCreateReturnLifecycleNotificationAsync(
                userId,
                returnRequest.Id,
                "cancelled",
                returnRequest.Order?.OrderNumber,
                cancellationToken);

            return _buyerCaseProjectionMapper.MapReturnRequest(
                returnRequest,
                await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken));
        }

        public async Task<ReturnRequestResponseDto> SubmitReturnTrackingAsync(
            int userId,
            int returnRequestId,
            SubmitReturnTrackingDto request,
            CancellationToken cancellationToken = default)
        {
            var returnRequest = await LoadBuyerReturnRequestAsync(userId, returnRequestId, cancellationToken);
            if (!string.Equals(returnRequest.Status, "approved", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Return tracking can only be submitted after the return is approved.");
            }

            var carrier = NormalizeRequired(request.Carrier, "Carrier is required.");
            var trackingNumber = NormalizeRequired(request.TrackingNumber, "Tracking number is required.");
            var timeline = await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken);

            if (timeline.Any(evt => evt.MetadataJson != null && evt.MetadataJson.Contains("\"requestAction\":\"submit_return_tracking\"")))
            {
                throw new BadRequestException("Return tracking has already been submitted for this request.");
            }

            var now = DateTime.UtcNow;
            await _context.CaseEvents.AddAsync(new CaseEvent
            {
                ReturnRequestId = returnRequest.Id,
                EventType = "status_changed",
                ActorType = "buyer",
                ActorUserId = userId,
                Message = "Buyer shipped the return and submitted tracking.",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    requestAction = "submit_return_tracking",
                    buyerDisplayStatus = "buyer_shipped_return",
                    carrier,
                    trackingNumber,
                    shippedAt = request.ShippedAt
                }),
                CreatedAt = now
            }, cancellationToken);

            returnRequest.UpdatedAt = now;
            await _context.SaveChangesAsync(cancellationToken);

            return _buyerCaseProjectionMapper.MapReturnRequest(
                returnRequest,
                await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken));
        }

        public async Task<DisputeResponseDto> CancelInrClaimAsync(
            int userId,
            int disputeId,
            CancelBuyerCaseRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var dispute = await LoadBuyerDisputeAsync(userId, disputeId, cancellationToken);
            EnsureInrCase(dispute);

            if (!string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Only waiting INR requests can be cancelled by the buyer.");
            }

            var note = NormalizeOptional(request.Note) ?? "Cancelled by buyer.";
            var now = DateTime.UtcNow;

            dispute.Status = "closed";
            dispute.ClosedReason = note;
            dispute.ClosedAt = now;
            dispute.UpdatedAt = now;

            await _context.CaseEvents.AddAsync(new CaseEvent
            {
                DisputeId = dispute.Id,
                EventType = "closed",
                ActorType = "buyer",
                ActorUserId = userId,
                Message = "Buyer cancelled this INR request.",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    requestAction = "cancel_inr",
                    buyerDisplayStatus = "cancelled",
                    note
                }),
                CreatedAt = now
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            await _caseNotificationService.TryCreateDisputeLifecycleNotificationAsync(
                userId,
                dispute.Id,
                dispute.CaseType,
                "closed",
                dispute.Order?.OrderNumber,
                cancellationToken);

            return _buyerCaseProjectionMapper.MapDispute(
                dispute,
                await LoadDisputeTimelineAsync(dispute.Id, cancellationToken));
        }

        public async Task<DisputeResponseDto> EscalateInrClaimAsync(
            int userId,
            int disputeId,
            EscalateInrClaimDto request,
            CancellationToken cancellationToken = default)
        {
            var dispute = await LoadBuyerDisputeAsync(userId, disputeId, cancellationToken);
            EnsureInrCase(dispute);

            if (!string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Only waiting INR requests can be escalated by the buyer.");
            }

            var description = NormalizeRequired(request.Description, "Escalation details are required.");
            var eligibleAt = (dispute.CreatedAt ?? DateTime.UtcNow).AddDays(3);
            if (DateTime.UtcNow < eligibleAt)
            {
                throw new BadRequestException("This INR request cannot be escalated yet. Please wait for the seller response window to pass.");
            }

            var timeline = await LoadDisputeTimelineAsync(dispute.Id, cancellationToken);
            if (timeline.Any(evt => evt.MetadataJson != null && evt.MetadataJson.Contains("\"requestAction\":\"escalate_inr\"")))
            {
                throw new BadRequestException("This INR request has already been escalated.");
            }

            var now = DateTime.UtcNow;
            dispute.Status = "in_progress";
            dispute.UpdatedAt = now;

            await _context.CaseEvents.AddAsync(new CaseEvent
            {
                DisputeId = dispute.Id,
                EventType = "escalated",
                ActorType = "buyer",
                ActorUserId = userId,
                Message = "Buyer escalated this INR request to the platform.",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    requestAction = "escalate_inr",
                    buyerDisplayStatus = "escalated_to_platform",
                    description
                }),
                CreatedAt = now
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            await _caseNotificationService.TryCreateDisputeLifecycleNotificationAsync(
                userId,
                dispute.Id,
                dispute.CaseType,
                "in_progress",
                dispute.Order?.OrderNumber,
                cancellationToken);

            return _buyerCaseProjectionMapper.MapDispute(
                dispute,
                await LoadDisputeTimelineAsync(dispute.Id, cancellationToken));
        }

        private async Task<ReturnRequest> LoadBuyerReturnRequestAsync(int userId, int returnRequestId, CancellationToken cancellationToken)
        {
            var returnRequest = await _context.ReturnRequests
                .Include(r => r.Order)
                    .ThenInclude(o => o.Payments)
                .Include(r => r.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi!.Seller)
                .Include(r => r.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(r => r.Id == returnRequestId && r.UserId == userId, cancellationToken);

            if (returnRequest == null)
            {
                throw new NotFoundException("Return request not found.");
            }

            return returnRequest;
        }

        private async Task<Dispute> LoadBuyerDisputeAsync(int userId, int disputeId, CancellationToken cancellationToken)
        {
            var dispute = await _context.Disputes
                .Include(d => d.Order)
                    .ThenInclude(o => o.Payments)
                .Include(d => d.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(d => d.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Include(d => d.OrderItem)
                    .ThenInclude(oi => oi!.Seller)
                .Include(d => d.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(d => d.Id == disputeId && d.RaisedBy == userId, cancellationToken);

            if (dispute == null)
            {
                throw new NotFoundException("Dispute not found.");
            }

            return dispute;
        }

        private async Task<List<CaseEvent>> LoadReturnTimelineAsync(int returnRequestId, CancellationToken cancellationToken)
        {
            return await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.ReturnRequestId == returnRequestId)
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);
        }

        private async Task<List<CaseEvent>> LoadDisputeTimelineAsync(int disputeId, CancellationToken cancellationToken)
        {
            return await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.DisputeId == disputeId)
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);
        }

        private static void EnsureInrCase(Dispute dispute)
        {
            if (!string.Equals(dispute.CaseType, "inr", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("This action is only supported for item-not-received requests.");
            }
        }

        private static string NormalizeRequired(string? value, string errorMessage)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new BadRequestException(errorMessage);
            }

            return value.Trim();
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
