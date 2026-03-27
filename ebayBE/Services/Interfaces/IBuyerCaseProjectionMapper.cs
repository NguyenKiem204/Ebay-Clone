using ebay.DTOs.Responses;
using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface IBuyerCaseProjectionMapper
    {
        BuyerCaseListItemResponseDto MapReturnListItem(ReturnRequest returnRequest, IEnumerable<CaseEvent>? timeline = null);

        BuyerCaseListItemResponseDto MapDisputeListItem(Dispute dispute, IEnumerable<CaseEvent>? timeline = null);

        ReturnRequestResponseDto MapReturnRequest(ReturnRequest returnRequest, IEnumerable<CaseEvent>? timeline = null);

        DisputeResponseDto MapDispute(Dispute dispute, IEnumerable<CaseEvent>? timeline = null);

        BuyerCaseEventResponseDto MapCaseEvent(CaseEvent caseEvent);

        BuyerCaseEvidenceResponseDto MapCaseAttachment(CaseAttachment caseAttachment);
    }
}
