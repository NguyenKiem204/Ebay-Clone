using ebay.DTOs.Requests;
using FluentValidation;

namespace ebay.Validators.Auth
{
    public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequestDto>
    {
        public ResetPasswordRequestValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage("Token là bắt buộc")
                .MinimumLength(20).WithMessage("Token không hợp lệ")
                .MaximumLength(500).WithMessage("Token không hợp lệ");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Mật khẩu mới là bắt buộc")
                .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
                .MaximumLength(128).WithMessage("Mật khẩu mới không được vượt quá 128 ký tự")
                .Matches(@"[A-Z]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ hoa")
                .Matches(@"[a-z]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ thường")
                .Matches(@"[0-9]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ số")
                .Matches(@"[@$!%*?&]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&)");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().WithMessage("Xác nhận mật khẩu là bắt buộc")
                .Equal(x => x.NewPassword).WithMessage("Mật khẩu xác nhận không khớp");
        }
    }
}
