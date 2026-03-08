using ebay.DTOs.Requests;
using FluentValidation;

namespace ebay.Validators.Auth
{
    public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
    {
        public RegisterRequestValidator()
        {
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Username là bắt buộc")
                .MinimumLength(3).WithMessage("Username phải có ít nhất 3 ký tự")
                .MaximumLength(50).WithMessage("Username không được vượt quá 50 ký tự")
                .Matches(@"^[a-zA-Z0-9_.-]+$")
                    .WithMessage("Username chỉ được chứa chữ cái, số, dấu gạch dưới, dấu chấm và dấu gạch ngang")
                .Must(x => !string.IsNullOrWhiteSpace(x) && x.Trim() == x)
                    .WithMessage("Username không được chứa khoảng trắng ở đầu hoặc cuối");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("Tên là bắt buộc")
                .MaximumLength(100).WithMessage("Tên không được vượt quá 100 ký tự");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Họ là bắt buộc")
                .MaximumLength(100).WithMessage("Họ không được vượt quá 100 ký tự");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email là bắt buộc")
                .EmailAddress().WithMessage("Email không hợp lệ")
                .MaximumLength(255).WithMessage("Email không được vượt quá 255 ký tự");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Mật khẩu là bắt buộc")
                .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự")
                .MaximumLength(128).WithMessage("Mật khẩu không được vượt quá 128 ký tự")
                .Matches(@"[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa")
                .Matches(@"[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ thường")
                .Matches(@"[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số")
                .Matches(@"[@$!%*?&]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&)");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().WithMessage("Xác nhận mật khẩu là bắt buộc")
                .Equal(x => x.Password).WithMessage("Mật khẩu xác nhận không khớp");
        }
    }
}
