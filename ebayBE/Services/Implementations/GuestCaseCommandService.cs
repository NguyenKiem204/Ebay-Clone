using System.Text.Json;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class GuestCaseCommandService : IGuestCaseCommandService
    {
        private readonly EbayDbContext _context;
        private readonly IGuestAfterSalesAccessService _guestAfterSalesAccessService;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseNotificationService _caseNotificationService;

        public GuestCaseCommandService(
            EbayDbContext context,
            IGuestAfterSalesAccessService guestAfterSalesAccessService,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper,
            ICaseNotificationService caseNotificationService)
        {
            _context = context;
            _guestAfterSalesAccessService = guestAfterSalesAccessService;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
            _caseNotificationService = caseNotificationService;
        }

        public async Task<ReturnRequestResponseDto> CancelReturnRequestAsync(
            int returnRequestId,
            CancelGuestCaseRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var returnRequest = await LoadGuestReturnAsync(returnRequestId, request, cancellationToken);
            if (!string.Equals(returnRequest.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Only waiting return requests can be cancelled.");
            }

            var note = string.IsNullOrWhiteSpace(request.Note) ? "Cancelled by guest buyer." : request.Note.Trim();
            var now = DateTime.UtcNow;

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
                Message = "Guest buyer cancelled this return / refund request.",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    requestAction = "cancel_return",
                    buyerDisplayStatus = "cancelled",
                    note
                }),
                CreatedAt = now
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            await _caseNotificationService.TryCreateGuestReturnLifecycleNotificationAsync(
                returnRequest.Order,
                returnRequest.Id,
                "cancelled",
                cancellationToken);

            return _buyerCaseProjectionMapper.MapReturnRequest(
                returnRequest,
                await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken));
        }

        public async Task<ReturnRequestResponseDto> SubmitReturnTrackingAsync(
            int returnRequestId,
            SubmitGuestReturnTrackingDto request,
            CancellationToken cancellationToken = default)
        {
            var returnRequest = await LoadGuestReturnAsync(returnRequestId, request, cancellationToken);
            if (!string.Equals(returnRequest.Status, "approved", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Return tracking can only be submitted after approval.");
            }

            var timeline = await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken);
            if (timeline.Any(evt => evt.MetadataJson != null && evt.MetadataJson.Contains("\"requestAction\":\"submit_return_tracking\"")))
            {
                throw new BadRequestException("Return tracking has already been submitted.");
            }

            var carrier = NormalizeRequired(request.Carrier, "Carrier is required.");
            var trackingNumber = NormalizeRequired(request.TrackingNumber, "Tracking number is required.");
            var now = DateTime.UtcNow;

            await _context.CaseEvents.AddAsync(new CaseEvent
            {
                ReturnRequestId = returnRequest.Id,
                EventType = "status_changed",
                ActorType = "buyer",
                Message = "Guest buyer shipped the return and submitted tracking.",
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
            int disputeId,
            CancelGuestCaseRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var dispute = await LoadGuestDisputeAsync(disputeId, request, cancellationToken);
            EnsureInrCase(dispute);
            if (!string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Only waiting INR requests can be cancelled.");
            }

            var note = string.IsNullOrWhiteSpace(request.Note) ? "Cancelled by guest buyer." : request.Note.Trim();
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
                Message = "Guest buyer cancelled this INR request.",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    requestAction = "cancel_inr",
                    buyerDisplayStatus = "cancelled",
                    note
                }),
                CreatedAt = now
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            await _caseNotificationService.TryCreateGuestDisputeLifecycleNotificationAsync(
                dispute.Order,
                dispute.Id,
                dispute.CaseType,
                "closed",
                cancellationToken);

            return _buyerCaseProjectionMapper.MapDispute(
                dispute,
                await LoadDisputeTimelineAsync(dispute.Id, cancellationToken));
        }

        public async Task<DisputeResponseDto> EscalateInrClaimAsync(
            int disputeId,
            EscalateGuestInrClaimDto request,
            CancellationToken cancellationToken = default)
        {
            var dispute = await LoadGuestDisputeAsync(disputeId, request, cancellationToken);
            EnsureInrCase(dispute);
            if (!string.Equals(dispute.Status, "open", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Only waiting INR requests can be escalated.");
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
                Message = "Guest buyer escalated this INR request to the platform.",
                MetadataJson = JsonSerializer.Serialize(new
                {
                    requestAction = "escalate_inr",
                    buyerDisplayStatus = "escalated_to_platform",
                    description
                }),
                CreatedAt = now
            }, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            await _caseNotificationService.TryCreateGuestDisputeLifecycleNotificationAsync(
                dispute.Order,
                dispute.Id,
                dispute.CaseType,
                "in_progress",
                cancellationToken);

            return _buyerCaseProjectionMapper.MapDispute(
                dispute,
                await LoadDisputeTimelineAsync(dispute.Id, cancellationToken));
        }

        private async Task<GuestAfterSalesAccessDecision> ValidateGuestAccessAsync(
            GuestCaseActionAccessDto request,
            CancellationToken cancellationToken)
        {
            var decision = await _guestAfterSalesAccessService.ValidateOrderAccessAsync(
                new GuestAfterSalesAccessRequest
                {
                    OrderNumber = request.OrderNumber,
                    Email = request.Email,
                    AccessToken = request.AccessToken
                },
                cancellationToken);

            if (!decision.Allowed || !decision.OrderId.HasValue)
            {
                throw new BadRequestException("Guest order access could not be verified.");
            }

            return decision;
        }

        private async Task<ReturnRequest> LoadGuestReturnAsync(
            int returnRequestId,
            GuestCaseActionAccessDto request,
            CancellationToken cancellationToken)
        {
            var accessDecision = await ValidateGuestAccessAsync(request, cancellationToken);
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
                .FirstOrDefaultAsync(
                    r => r.Id == returnRequestId
                        && r.OrderId == accessDecision.OrderId
                        && r.Order.CustomerType == "guest",
                    cancellationToken);

            if (returnRequest == null)
            {
                throw new NotFoundException("Guest return request not found.");
            }

            return returnRequest;
        }

        private async Task<Dispute> LoadGuestDisputeAsync(
            int disputeId,
            GuestCaseActionAccessDto request,
            CancellationToken cancellationToken)
        {
            var accessDecision = await ValidateGuestAccessAsync(request, cancellationToken);
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
                .FirstOrDefaultAsync(
                    d => d.Id == disputeId
                        && d.OrderId == accessDecision.OrderId
                        && d.Order.CustomerType == "guest",
                    cancellationToken);

            if (dispute == null)
            {
                throw new NotFoundException("Guest dispute not found.");
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
    }
}
