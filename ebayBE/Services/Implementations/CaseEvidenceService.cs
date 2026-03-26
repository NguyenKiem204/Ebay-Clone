using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class CaseEvidenceService : ICaseEvidenceService
    {
        private const string RoleBuyer = "buyer";
        private const string RoleSeller = "seller";
        private const string RoleAdmin = "admin";

        private readonly EbayDbContext _context;
        private readonly IBuyerCaseProjectionMapper _buyerCaseProjectionMapper;
        private readonly ICaseActionService _caseActionService;
        private readonly IFileService _fileService;

        public CaseEvidenceService(
            EbayDbContext context,
            IBuyerCaseProjectionMapper buyerCaseProjectionMapper,
            ICaseActionService caseActionService,
            IFileService fileService)
        {
            _context = context;
            _buyerCaseProjectionMapper = buyerCaseProjectionMapper;
            _caseActionService = caseActionService;
            _fileService = fileService;
        }

        public async Task<BuyerCaseEvidenceResponseDto> UploadReturnEvidenceAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            UploadCaseEvidenceDto request,
            CancellationToken cancellationToken = default)
        {
            ValidateRequest(request);

            var actor = new CaseActionActorContext(actorUserId, actorRole);
            var returnRequest = await _context.ReturnRequests
                .Include(r => r.Order)
                    .ThenInclude(o => o.OrderItems)
                .Include(r => r.OrderItem)
                .FirstOrDefaultAsync(r => r.Id == returnRequestId, cancellationToken);

            if (returnRequest == null)
            {
                throw new NotFoundException("Return request not found.");
            }

            await EnsureReturnUploadAccessAllowedAsync(returnRequest, actor, cancellationToken);
            return await SaveReturnEvidenceAsync(returnRequest, actor, request, cancellationToken);
        }

        public async Task<BuyerCaseEvidenceResponseDto> UploadDisputeEvidenceAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            UploadCaseEvidenceDto request,
            CancellationToken cancellationToken = default)
        {
            ValidateRequest(request);

            var actor = new CaseActionActorContext(actorUserId, actorRole);
            var dispute = await _context.Disputes
                .Include(d => d.Order)
                    .ThenInclude(o => o.OrderItems)
                .Include(d => d.OrderItem)
                .FirstOrDefaultAsync(d => d.Id == disputeId, cancellationToken);

            if (dispute == null)
            {
                throw new NotFoundException("Dispute not found.");
            }

            await EnsureDisputeUploadAccessAllowedAsync(dispute, actor, cancellationToken);
            return await SaveDisputeEvidenceAsync(dispute, actor, request, cancellationToken);
        }

        private async Task<BuyerCaseEvidenceResponseDto> SaveReturnEvidenceAsync(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            UploadCaseEvidenceDto request,
            CancellationToken cancellationToken)
        {
            string? filePath = null;
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                filePath = await _fileService.SaveFileAsync(request.File, "cases/returns");

                var attachment = new CaseAttachment
                {
                    ReturnRequestId = returnRequest.Id,
                    FilePath = filePath,
                    OriginalFileName = Path.GetFileName(request.File.FileName),
                    ContentType = request.File.ContentType,
                    FileSizeBytes = request.File.Length,
                    Label = NormalizeOptionalText(request.Label),
                    EvidenceType = NormalizeOptionalText(request.EvidenceType),
                    UploadedByUserId = actor.UserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CaseAttachments.Add(attachment);
                await _context.SaveChangesAsync(cancellationToken);

                var caseEvent = _caseActionService.BuildReturnEvidenceAddedEvent(returnRequest, actor, attachment, attachment.CreatedAt);
                _context.CaseEvents.Add(caseEvent);
                await _context.SaveChangesAsync(cancellationToken);

                attachment.UploadedByUser = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(user => user.Id == actor.UserId, cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                return _buyerCaseProjectionMapper.MapCaseAttachment(attachment);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                if (!string.IsNullOrWhiteSpace(filePath))
                {
                    _fileService.DeleteFile(filePath);
                }

                throw;
            }
        }

        private async Task<BuyerCaseEvidenceResponseDto> SaveDisputeEvidenceAsync(
            Dispute dispute,
            CaseActionActorContext actor,
            UploadCaseEvidenceDto request,
            CancellationToken cancellationToken)
        {
            string? filePath = null;
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                filePath = await _fileService.SaveFileAsync(request.File, "cases/disputes");

                var attachment = new CaseAttachment
                {
                    DisputeId = dispute.Id,
                    FilePath = filePath,
                    OriginalFileName = Path.GetFileName(request.File.FileName),
                    ContentType = request.File.ContentType,
                    FileSizeBytes = request.File.Length,
                    Label = NormalizeOptionalText(request.Label),
                    EvidenceType = NormalizeOptionalText(request.EvidenceType),
                    UploadedByUserId = actor.UserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CaseAttachments.Add(attachment);
                await _context.SaveChangesAsync(cancellationToken);

                var caseEvent = _caseActionService.BuildDisputeEvidenceAddedEvent(dispute, actor, attachment, attachment.CreatedAt);
                _context.CaseEvents.Add(caseEvent);
                await _context.SaveChangesAsync(cancellationToken);

                attachment.UploadedByUser = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(user => user.Id == actor.UserId, cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                return _buyerCaseProjectionMapper.MapCaseAttachment(attachment);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                if (!string.IsNullOrWhiteSpace(filePath))
                {
                    _fileService.DeleteFile(filePath);
                }

                throw;
            }
        }

        private async Task EnsureReturnUploadAccessAllowedAsync(
            ReturnRequest returnRequest,
            CaseActionActorContext actor,
            CancellationToken cancellationToken)
        {
            var normalizedRole = Normalize(actor.Role);

            if (normalizedRole == RoleBuyer)
            {
                if (actor.UserId != returnRequest.UserId)
                {
                    throw new ForbiddenException("You do not have access to upload evidence to this return request.");
                }

                return;
            }

            if (normalizedRole is RoleSeller or RoleAdmin)
            {
                var decision = await _caseActionService.EvaluateReturnAccessAsync(returnRequest, actor, cancellationToken);
                if (!decision.Allowed)
                {
                    throw new ForbiddenException(decision.Message);
                }

                return;
            }

            throw new ForbiddenException("This actor role is not allowed to upload case evidence.");
        }

        private async Task EnsureDisputeUploadAccessAllowedAsync(
            Dispute dispute,
            CaseActionActorContext actor,
            CancellationToken cancellationToken)
        {
            var normalizedRole = Normalize(actor.Role);

            if (normalizedRole == RoleBuyer)
            {
                if (actor.UserId != dispute.RaisedBy)
                {
                    throw new ForbiddenException("You do not have access to upload evidence to this dispute.");
                }

                return;
            }

            if (normalizedRole is RoleSeller or RoleAdmin)
            {
                var decision = await _caseActionService.EvaluateDisputeAccessAsync(dispute, actor, cancellationToken);
                if (!decision.Allowed)
                {
                    throw new ForbiddenException(decision.Message);
                }

                return;
            }

            throw new ForbiddenException("This actor role is not allowed to upload case evidence.");
        }

        private static void ValidateRequest(UploadCaseEvidenceDto request)
        {
            if (request.File == null || request.File.Length <= 0)
            {
                throw new BadRequestException("A case evidence file is required.");
            }

            if (!string.IsNullOrWhiteSpace(request.Label) && request.Label.Trim().Length > 100)
            {
                throw new BadRequestException("Evidence label cannot exceed 100 characters.");
            }

            if (!string.IsNullOrWhiteSpace(request.EvidenceType) && request.EvidenceType.Trim().Length > 50)
            {
                throw new BadRequestException("Evidence type cannot exceed 50 characters.");
            }
        }

        private static string Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }

        private static string? NormalizeOptionalText(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }
    }
}
