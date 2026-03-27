using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class InternalCaseQueryService : IInternalCaseQueryService
    {
        private readonly EbayDbContext _context;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseActionService _caseActionService;

        public InternalCaseQueryService(
            EbayDbContext context,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper,
            ICaseActionService caseActionService)
        {
            _context = context;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
            _caseActionService = caseActionService;
        }

        public async Task<List<BuyerCaseListItemResponseDto>> GetQueueCasesAsync(
            int actorUserId,
            string actorRole,
            CancellationToken cancellationToken = default)
        {
            var actor = new CaseActionActorContext(actorUserId, actorRole);

            var returnRequests = await BuildReturnRequestsQuery()
                .OrderByDescending(r => r.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);

            var disputes = await BuildDisputesQuery()
                .OrderByDescending(d => d.CreatedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);

            var accessibleReturns = new List<ReturnRequest>();
            foreach (var returnRequest in returnRequests)
            {
                var accessDecision = await _caseActionService.EvaluateReturnAccessAsync(
                    returnRequest,
                    actor,
                    cancellationToken);

                if (accessDecision.Allowed)
                {
                    accessibleReturns.Add(returnRequest);
                }
            }

            var accessibleDisputes = new List<Dispute>();
            foreach (var dispute in disputes)
            {
                var accessDecision = await _caseActionService.EvaluateDisputeAccessAsync(
                    dispute,
                    actor,
                    cancellationToken);

                if (accessDecision.Allowed)
                {
                    accessibleDisputes.Add(dispute);
                }
            }

            var returnEventsById = await LoadReturnEventsAsync(accessibleReturns.Select(r => r.Id), cancellationToken);
            var disputeEventsById = await LoadDisputeEventsAsync(accessibleDisputes.Select(d => d.Id), cancellationToken);

            return accessibleReturns
                .Select(returnRequest => _buyerCaseProjectionMapper.MapReturnListItem(
                    returnRequest,
                    returnEventsById.GetValueOrDefault(returnRequest.Id)))
                .Concat(accessibleDisputes.Select(dispute => _buyerCaseProjectionMapper.MapDisputeListItem(
                    dispute,
                    disputeEventsById.GetValueOrDefault(dispute.Id))))
                .OrderByDescending(item => item.CreatedAt)
                .ToList();
        }

        public async Task<ReturnRequestResponseDto> GetReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            CancellationToken cancellationToken = default)
        {
            var returnRequest = await BuildReturnRequestsQuery()
                .Include(r => r.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(r => r.Id == returnRequestId, cancellationToken);

            if (returnRequest == null)
            {
                throw new NotFoundException("Return request not found.");
            }

            await EnsureReturnAccessAllowedAsync(returnRequest, actorUserId, actorRole, cancellationToken);

            var timeline = await LoadReturnTimelineAsync(returnRequest.Id, cancellationToken);
            return _buyerCaseProjectionMapper.MapReturnRequest(returnRequest, timeline);
        }

        public async Task<DisputeResponseDto> GetDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            CancellationToken cancellationToken = default)
        {
            var dispute = await BuildDisputesQuery()
                .Include(d => d.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(d => d.Id == disputeId, cancellationToken);

            if (dispute == null)
            {
                throw new NotFoundException("Dispute not found.");
            }

            await EnsureDisputeAccessAllowedAsync(dispute, actorUserId, actorRole, cancellationToken);

            var timeline = await LoadDisputeTimelineAsync(dispute.Id, cancellationToken);
            return _buyerCaseProjectionMapper.MapDispute(dispute, timeline);
        }

        private async Task EnsureReturnAccessAllowedAsync(
            ReturnRequest returnRequest,
            int actorUserId,
            string actorRole,
            CancellationToken cancellationToken)
        {
            var decision = await _caseActionService.EvaluateReturnAccessAsync(
                returnRequest,
                new CaseActionActorContext(actorUserId, actorRole),
                cancellationToken);

            if (!decision.Allowed)
            {
                throw new ForbiddenException(decision.Message);
            }
        }

        private async Task EnsureDisputeAccessAllowedAsync(
            Dispute dispute,
            int actorUserId,
            string actorRole,
            CancellationToken cancellationToken)
        {
            var decision = await _caseActionService.EvaluateDisputeAccessAsync(
                dispute,
                new CaseActionActorContext(actorUserId, actorRole),
                cancellationToken);

            if (!decision.Allowed)
            {
                throw new ForbiddenException(decision.Message);
            }
        }

        private IQueryable<ReturnRequest> BuildReturnRequestsQuery()
        {
            return _context.ReturnRequests
                .AsNoTracking()
                .Include(r => r.Order)
                    .ThenInclude(o => o.Payments)
                .Include(r => r.Order)
                    .ThenInclude(o => o.ShippingInfo)
                .Include(r => r.Order)
                    .ThenInclude(o => o.OrderItems)
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
                .Include(d => d.Order)
                    .ThenInclude(o => o.OrderItems)
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
