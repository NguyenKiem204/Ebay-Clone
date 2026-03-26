using ebay.Attributes;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [ApiController]
    [Route("api/checkout")]
    public class CheckoutController : ControllerBase
    {
        private readonly ICheckoutCoreService _checkoutCoreService;
        private readonly IGuestCheckoutService _guestCheckoutService;
        private readonly IGuestOrderLookupService _guestOrderLookupService;

        public CheckoutController(
            ICheckoutCoreService checkoutCoreService,
            IGuestCheckoutService guestCheckoutService,
            IGuestOrderLookupService guestOrderLookupService)
        {
            _checkoutCoreService = checkoutCoreService;
            _guestCheckoutService = guestCheckoutService;
            _guestOrderLookupService = guestOrderLookupService;
        }

        [AllowAnonymous]
        [HttpPost("guest/eligibility")]
        public async Task<ActionResult<ApiResponse<GuestCheckoutEligibilityResponseDto>>> EvaluateGuestEligibility(
            [FromBody] GuestCheckoutEligibilityRequestDto request,
            CancellationToken cancellationToken)
        {
            var coreResult = await _checkoutCoreService.PrepareAsync(
                request.Items.Select(item => new CheckoutCoreItemRequest
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity
                }),
                cancellationToken);

            var response = MapGuestEligibilityResponse(coreResult);
            return Ok(ApiResponse<GuestCheckoutEligibilityResponseDto>.SuccessResponse(response));
        }

        [AllowAnonymous]
        [HttpPost("guest/orders")]
        public async Task<ActionResult<ApiResponse<CreateGuestOrderResponseDto>>> CreateGuestOrder(
            [FromBody] CreateGuestOrderRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestCheckoutService.CreateOrderAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<CreateGuestOrderResponseDto>.SuccessResponse(data, "Tạo đơn guest thành công"));
        }

        [AllowAnonymous]
        [RateLimit("GuestOrderLookup", 5, 1, RateLimitPeriod.Minute)]
        [HttpPost("guest/orders/lookup")]
        public async Task<ActionResult<ApiResponse<GuestOrderLookupResponseDto>>> LookupGuestOrder(
            [FromBody] GuestOrderLookupRequestDto request,
            CancellationToken cancellationToken)
        {
            var data = await _guestOrderLookupService.LookupAsync(request, cancellationToken);
            return Ok(ApiResponse<GuestOrderLookupResponseDto>.SuccessResponse(data, "Yêu cầu tra cứu đã được xử lý"));
        }

        [AllowAnonymous]
        [RateLimit("GuestOrderResendConfirmation", 3, 15, RateLimitPeriod.Minute)]
        [HttpPost("guest/orders/resend-confirmation")]
        public async Task<ActionResult<ApiResponse<object>>> ResendGuestOrderConfirmation(
            [FromBody] GuestOrderLookupRequestDto request,
            CancellationToken cancellationToken)
        {
            await _guestOrderLookupService.ResendConfirmationEmailAsync(request, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "If the order details match, a confirmation email will be sent."));
        }

        private static GuestCheckoutEligibilityResponseDto MapGuestEligibilityResponse(CheckoutCoreResult coreResult)
        {
            var issues = coreResult.Issues
                .Select(issue => new GuestCheckoutIssueResponseDto
                {
                    ProductId = issue.ProductId,
                    Code = issue.Code,
                    Message = issue.Message
                })
                .ToList();

            var normalizedItems = coreResult.NormalizedItems
                .Select(item => new GuestCheckoutNormalizedItemResponseDto
                {
                    ProductId = item.ProductId,
                    Title = item.Title,
                    SellerId = item.SellerId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    LineSubtotal = item.LineSubtotal,
                    ShippingFee = item.ShippingFee,
                    LineTotal = item.LineTotal,
                    AvailableStock = item.AvailableStock,
                    IsAuction = item.IsAuction
                })
                .ToList();

            var reasons = issues
                .Select(issue => issue.Message)
                .Distinct()
                .ToList();

            // For the guest eligibility endpoint, Eligible intentionally mirrors
            // GuestPhase1Eligible because this route evaluates guest Phase 1 rules only.
            var eligible = coreResult.GuestPhase1Eligible;

            return new GuestCheckoutEligibilityResponseDto
            {
                Eligible = eligible,
                GuestPhase1Eligible = coreResult.GuestPhase1Eligible,
                Reasons = reasons,
                Issues = issues,
                NormalizedItems = normalizedItems,
                Subtotal = coreResult.Subtotal,
                ShippingFee = coreResult.ShippingFee,
                DiscountAmount = coreResult.DiscountAmount,
                Tax = coreResult.Tax,
                TotalAmount = coreResult.TotalAmount,
                AllowedPaymentMethods = new List<string> { "COD" }
            };
        }
    }
}
