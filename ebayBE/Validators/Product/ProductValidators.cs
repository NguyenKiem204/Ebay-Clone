using FluentValidation;
using ebay.DTOs.Requests;
using ebay.Validators.Store;

namespace ebay.Validators.Product
{
    public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
    {
        public CreateProductRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Tiêu đề không được để trống")
                .MinimumLength(10).WithMessage("Tiêu đề phải ít nhất 10 ký tự")
                .MaximumLength(150).WithMessage("Tiêu đề không được quá 150 ký tự")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Tiêu đề chứa từ ngữ không hợp lệ");

            RuleFor(x => x.Description)
                .MaximumLength(5000).WithMessage("Mô tả không được quá 5000 ký tự")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Mô tả chứa từ ngữ không hợp lệ");

            RuleFor(x => x.Price)
                .GreaterThan(0).When(x => !x.IsAuction).WithMessage("Giá sản phẩm phải lớn hơn 0");

            RuleFor(x => x.Stock)
                .GreaterThanOrEqualTo(0).WithMessage("Số lượng kho không được âm");

            RuleFor(x => x.Condition)
                .NotEmpty().WithMessage("Trạng thái sản phẩm (Condition) không được để trống");

            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage("Vui lòng chọn danh mục cho sản phẩm");

            RuleFor(x => x.Images)
                .Must(x => x != null && x.Count > 0).WithMessage("Sản phẩm phải có ít nhất 1 ảnh")
                .Must(x => x == null || x.Count <= 24).WithMessage("Sản phẩm không được quá 24 ảnh");
            
            RuleFor(x => x.StartingBid)
                .GreaterThan(0).When(x => x.IsAuction).WithMessage("Giá khởi điểm đấu giá phải lớn hơn 0");
        }
    }

    public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
    {
        public UpdateProductRequestValidator()
        {
            RuleFor(x => x.Title)
                .MinimumLength(10).When(x => !string.IsNullOrEmpty(x.Title)).WithMessage("Tiêu đề phải ít nhất 10 ký tự")
                .MaximumLength(150).When(x => !string.IsNullOrEmpty(x.Title)).WithMessage("Tiêu đề không được quá 150 ký tự")
                .Must(StoreValidationHelpers.NotContainBadWords).When(x => !string.IsNullOrEmpty(x.Title)).WithMessage("Tiêu đề chứa từ ngữ không hợp lệ");

            RuleFor(x => x.Description)
                .MaximumLength(5000).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("Mô tả không được quá 5000 ký tự")
                .Must(StoreValidationHelpers.NotContainBadWords).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("Mô tả chứa từ ngữ không hợp lệ");

            RuleFor(x => x.Price)
                .GreaterThan(0).When(x => x.Price.HasValue && (!x.IsAuction.HasValue || !x.IsAuction.Value)).WithMessage("Giá sản phẩm phải lớn hơn 0");

            RuleFor(x => x.Stock)
                .GreaterThanOrEqualTo(0).When(x => x.Stock.HasValue).WithMessage("Số lượng kho không được âm");
        }
    }
}
