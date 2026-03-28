using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class BuyerCaseQueryService : IBuyerCaseQueryService
    {
        private readonly EbayDbContext _context;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;

        public BuyerCaseQueryService(
            EbayDbContext context,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper)
        {
            _context = context;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
        }

        public async Task<List<BuyerCaseListItemResponseDto>> GetBuyerCasesAsync(int userId)
        {
            var returnRequests = await BuildReturnRequestsQuery()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt ?? DateTime.MinValue)
                .ToListAsync();

            var disputes = await BuildDisputesQuery()
                .Where(d => d.RaisedBy == userId)
                .OrderByDescending(d => d.CreatedAt ?? DateTime.MinValue)
                .ToListAsync();

            var returnEventsById = await LoadReturnEventsAsync(returnRequests.Select(r => r.Id));
            var disputeEventsById = await LoadDisputeEventsAsync(disputes.Select(d => d.Id));

            var items = returnRequests
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

            return items;
        }

        public async Task<ReturnRequestResponseDto> GetReturnRequestAsync(int userId, int returnRequestId)
        {
            var returnRequest = await BuildReturnRequestsQuery()
                .Include(r => r.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(r => r.Id == returnRequestId && r.UserId == userId);

            if (returnRequest == null)
            {
                throw new NotFoundException("Return request not found.");
            }

            var timeline = await LoadReturnTimelineAsync(returnRequest.Id);
            return _buyerCaseProjectionMapper.MapReturnRequest(returnRequest, timeline);
        }

        public async Task<DisputeResponseDto> GetDisputeAsync(int userId, int disputeId)
        {
            var dispute = await BuildDisputesQuery()
                .Include(d => d.CaseAttachments)
                    .ThenInclude(attachment => attachment.UploadedByUser)
                .FirstOrDefaultAsync(d => d.Id == disputeId && d.RaisedBy == userId);

            if (dispute == null)
            {
                throw new NotFoundException("Dispute not found.");
            }

            var timeline = await LoadDisputeTimelineAsync(dispute.Id);
            return _buyerCaseProjectionMapper.MapDispute(dispute, timeline);
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

        private async Task<Dictionary<int, List<CaseEvent>>> LoadReturnEventsAsync(IEnumerable<int> returnRequestIds)
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
                .ToListAsync();

            return events
                .GroupBy(evt => evt.ReturnRequestId!.Value)
                .ToDictionary(group => group.Key, group => group.ToList());
        }

        private async Task<Dictionary<int, List<CaseEvent>>> LoadDisputeEventsAsync(IEnumerable<int> disputeIds)
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
                .ToListAsync();

            return events
                .GroupBy(evt => evt.DisputeId!.Value)
                .ToDictionary(group => group.Key, group => group.ToList());
        }

        private async Task<List<CaseEvent>> LoadReturnTimelineAsync(int returnRequestId)
        {
            return await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.ReturnRequestId == returnRequestId)
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync();
        }
// test
        private async Task<List<CaseEvent>> LoadDisputeTimelineAsync(int disputeId)
        {
            return await _context.CaseEvents
                .AsNoTracking()
                .Include(evt => evt.ActorUser)
                .Where(evt => evt.DisputeId == disputeId)
                .OrderBy(evt => evt.CreatedAt ?? DateTime.MinValue)
                .ToListAsync();
        }
    }
}
