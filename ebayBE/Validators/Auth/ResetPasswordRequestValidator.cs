using ebay.DTOs.Requests;
using FluentValidation;

namespace ebay.Validators.Auth
{
    public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequestDto>
    {
        public ResetPasswordRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email là bắt buộc")
                .EmailAddress().WithMessage("Email không hợp lệ");

            RuleFor(x => x.Otp)
                .NotEmpty().WithMessage("Mã OTP là bắt buộc")
                .Length(6).WithMessage("Mã OTP phải có 6 chữ số");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Mật khẩu mới là bắt buộc")
                .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
    }
}
