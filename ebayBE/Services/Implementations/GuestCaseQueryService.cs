using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class GuestCaseQueryService : IGuestCaseQueryService
    {
        private readonly EbayDbContext _context;
        private readonly IGuestAfterSalesAccessService _guestAfterSalesAccessService;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;

        public GuestCaseQueryService(
            EbayDbContext context,
            IGuestAfterSalesAccessService guestAfterSalesAccessService,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper)
        {
            _context = context;
            _guestAfterSalesAccessService = guestAfterSalesAccessService;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
        }

        public async Task<GuestCaseListResponseDto> GetGuestCasesAsync(
            GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var accessDecision = await ValidateGuestOrderAccessAsync(request, cancellationToken);
            var guestOrderId = accessDecision.OrderId!.Value;

            var returnRequests = await BuildReturnRequestsQuery()
                .Where(r => r.OrderId == guestOrderId && r.Order.CustomerType == "guest")
                .OrderByDescending(r => r.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);

            var disputes = await BuildDisputesQuery()
                .Where(d => d.OrderId == guestOrderId && d.Order.CustomerType == "guest")
                .OrderByDescending(d => d.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);

            var returnEventsById = await LoadReturnEventsAsync(returnRequests.Select(r => r.Id), cancellationToken);
            var disputeEventsById = await LoadDisputeEventsAsync(disputes.Select(d => d.Id), cancellationToken);

            var cases = returnRequests
                .Select(returnRequest =>
                    _buyerCaseProjectionMapper.MapReturnListItem(
                        returnRequest,
                        returnEventsById.GetValueOrDefault(returnRequest.Id)))
                .Concat(disputes.Select(dispute =>
                    _buyerCaseProjectionMapper.MapDisputeListItem(
                        dispute,
                        disputeEventsById.GetValueOrDefault(dispute.Id))))
                .OrderByDescending(item => item.CreatedAt)
                .ToList();

            return new GuestCaseListResponseDto
            {
                Cases = cases,
                AfterSalesAccess = MapAfterSalesAccess(accessDecision)
            };
        }

        public async Task<GuestReturnCaseDetailResponseDto> GetGuestReturnRequestAsync(
            int returnRequestId,
            GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var accessDecision = await ValidateGuestOrderAccessAsync(request, cancellationToken);
            var guestOrderId = accessDecision.OrderId!.Value;

            var returnRequest = await BuildReturnRequestsQuery()
                .Include(r => r.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(
                    r => r.Id == returnRequestId
                        && r.OrderId == guestOrderId
                        && r.Order.CustomerType == "guest",
                    cancellationToken);

            if (returnRequest == null)
            {
                throw new NotFoundException("Guest return request not found.");
            }

            var timeline = await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken);
            return new GuestReturnCaseDetailResponseDto
            {
                Case = _buyerCaseProjectionMapper.MapReturnRequest(returnRequest, timeline),
                AfterSalesAccess = MapAfterSalesAccess(accessDecision)
            };
        }

        public async Task<GuestDisputeCaseDetailResponseDto> GetGuestDisputeAsync(
            int disputeId,
            GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var accessDecision = await ValidateGuestOrderAccessAsync(request, cancellationToken);
            var guestOrderId = accessDecision.OrderId!.Value;

            var dispute = await BuildDisputesQuery()
                .Include(d => d.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(
                    d => d.Id == disputeId
                        && d.OrderId == guestOrderId
                        && d.Order.CustomerType == "guest",
                    cancellationToken);

            if (dispute == null)
            {
                throw new NotFoundException("Guest dispute not found.");
            }

            var timeline = await LoadDisputeTimelineAsync(dispute.Id, cancellationToken);
            return new GuestDisputeCaseDetailResponseDto
            {
                Case = _buyerCaseProjectionMapper.MapDispute(dispute, timeline),
                AfterSalesAccess = MapAfterSalesAccess(accessDecision)
            };
        }

        private async Task<GuestAfterSalesAccessDecision> ValidateGuestOrderAccessAsync(
            GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken)
        {
            var accessDecision = await _guestAfterSalesAccessService.ValidateOrderAccessAsync(
                new GuestAfterSalesAccessRequest
                {
                    OrderNumber = request.OrderNumber,
                    Email = request.Email,
                    AccessToken = request.AccessToken
                },
                cancellationToken);

            if (!accessDecision.Allowed || !accessDecision.OrderId.HasValue)
            {
                throw new BadRequestException(
                    "Guest order access could not be verified.",
                    new List<string> { "guest_access_denied" });
            }

            return accessDecision;
        }

        private static GuestAfterSalesAccessResponseDto? MapAfterSalesAccess(GuestAfterSalesAccessDecision accessDecision)
        {
            if (accessDecision.Grant == null)
            {
                return null;
            }

            return new GuestAfterSalesAccessResponseDto
            {
                AccessToken = accessDecision.Grant.AccessToken,
                ExpiresAt = accessDecision.Grant.ExpiresAtUtc,
                ProofMethod = accessDecision.Grant.ProofMethod
            };
        }

        private IQueryable<ReturnRequest> BuildReturnRequestsQuery()
        {
            return _context.ReturnRequests
                .AsNoTracking()
                .Include(r => r.Order)
                    .ThenInclude(o => o.Payments)
                .Include(r => r.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi!.Seller);
        }

        private IQueryable<Dispute> BuildDisputesQuery()
        {
            return _context.Disputes
                .AsNoTracking()
                .Include(d => d.Order)
                    .ThenInclude(o => o.Payments)
                .Include(d => d.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(d => d.OrderItem)
                    .ThenInclude(oi => oi!.Product)
                .Include(d => d.OrderItem)
                    .ThenInclude(oi => oi!.Seller);
        }

        private async Task<Dictionary<int, List<CaseEvent>>> LoadReturnEventsAsync(
            IEnumerable<int> returnRequestIds,
            CancellationToken cancellationToken)
        {
            var ids = returnRequestIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return new Dictionary<int, List<CaseEvent>>();
            }

            var events = await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.ReturnRequestId.HasValue && ids.Contains(evt.ReturnRequestId.Value))
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);

            return events
                .GroupBy(evt => evt.ReturnRequestId!.Value)
                .ToDictionary(group => group.Key, group => group.ToList());
        }

        private async Task<Dictionary<int, List<CaseEvent>>> LoadDisputeEventsAsync(
            IEnumerable<int> disputeIds,
            CancellationToken cancellationToken)
        {
            var ids = disputeIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return new Dictionary<int, List<CaseEvent>>();
            }

            var events = await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.DisputeId.HasValue && ids.Contains(evt.DisputeId.Value))
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);

            return events
                .GroupBy(evt => evt.DisputeId!.Value)
                .ToDictionary(group => group.Key, group => group.ToList());
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
    }
}
