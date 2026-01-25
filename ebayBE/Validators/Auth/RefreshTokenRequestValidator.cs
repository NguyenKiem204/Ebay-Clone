using ebay.DTOs.Requests;
using FluentValidation;

namespace ebay.Validators.Auth
{
    public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequestDto>
    {
        public RefreshTokenRequestValidator()
        {
            RuleFor(x => x.RefreshToken)
                .NotEmpty().WithMessage("Refresh token là bắt buộc")
                .MinimumLength(20).WithMessage("Refresh token không hợp lệ")
                .MaximumLength(500).WithMessage("Refresh token không hợp lệ")
                .Matches(@"^[A-Za-z0-9_-]+$").WithMessage("Refresh token không hợp lệ");
        }
    }
}
