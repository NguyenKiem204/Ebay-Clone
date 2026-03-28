using ebay.DTOs.Requests;
using FluentValidation;

namespace ebay.Validators.Auth
{
    public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequestDto>
    {
        public RefreshTokenRequestValidator()
        {
            RuleFor(x => x.RefreshToken)
                .NotEmpty().WithMessage("Refresh token is required")
                .MinimumLength(20).WithMessage("Invalid refresh token")
                .MaximumLength(500).WithMessage("Invalid refresh token")
                .Matches(@"^[A-Za-z0-9_-]+$").WithMessage("Invalid refresh token");
        }
    }
}
