using FluentValidation;
using ebay.DTOs.Requests;

namespace ebay.Validators.Store
{
    public class CreateStoreRequestValidator : AbstractValidator<CreateStoreRequest>
    {
        public CreateStoreRequestValidator()
        {
            RuleFor(x => x.StoreName)
                .NotEmpty().WithMessage("Tên cửa hàng không được để trống")
                .Length(3, 30).WithMessage("Tên cửa hàng phải từ 3 đến 30 ký tự")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Tên cửa hàng chứa từ ngữ không hợp lệ");

            RuleFor(x => x.Description)
                .Must(StoreValidationHelpers.NotContainLinks).WithMessage("Mô tả không được chứa liên kết (URL)")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Mô tả chứa từ ngữ không hợp lệ")
                .Must(StoreValidationHelpers.NotBeSpam).WithMessage("Nội dung mô tả có dấu hiệu spam");
        }
    }

    public class UpdateStoreRequestValidator : AbstractValidator<UpdateStoreRequest>
    {
        public UpdateStoreRequestValidator()
        {
            RuleFor(x => x.StoreName)
                .NotEmpty().WithMessage("Tên cửa hàng không được để trống")
                .Length(3, 30).WithMessage("Tên cửa hàng phải từ 3 đến 30 ký tự")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Tên cửa hàng chứa từ ngữ không hợp lệ");

            RuleFor(x => x.Description)
                .Must(StoreValidationHelpers.NotContainLinks).WithMessage("Mô tả không được chứa liên kết (URL)")
                .Must(StoreValidationHelpers.NotContainBadWords).WithMessage("Mô tả chứa từ ngữ không hợp lệ")
                .Must(StoreValidationHelpers.NotBeSpam).WithMessage("Nội dung mô tả có dấu hiệu spam");
        }
    }

    public static class StoreValidationHelpers
    {
        public static bool NotContainLinks(string? description)
        {
            if (string.IsNullOrEmpty(description)) return true;
            var linkPatterns = new[] { "http", "https", "www.", ".com", ".vn", ".net", ".org" };
            return !linkPatterns.Any(p => description.ToLower().Contains(p));
        }

        public static bool NotContainBadWords(string? input)
        {
            if (string.IsNullOrEmpty(input)) return true;

            // 1. Bình thường hóa: Chuyển về chữ thường
            string normalized = input.ToLower();

            // 2. Xóa các ký tự đặc biệt, dấu chấm, khoảng trắng để tránh lách (v.d: p.o.r.n -> porn)
            normalized = new string(normalized.Where(c => char.IsLetterOrDigit(c)).ToArray());

            // 3. Gộp các ký tự lặp liên tiếp để tránh lách (v.d: pooorrrnn -> porn)
            normalized = CollapseRepeatedCharacters(normalized);

            var badWords = new[] { "sex", "porn", "scam", "fraud", "gambling", "phandong", "matuy", "bacap" };
            
            return !badWords.Any(w => normalized.Contains(w));
        }

        private static string CollapseRepeatedCharacters(string value)
        {
            if (string.IsNullOrEmpty(value)) return value;
            var result = new System.Text.StringBuilder();
            result.Append(value[0]);
            for (int i = 1; i < value.Length; i++)
            {
                if (value[i] != value[i - 1])
                {
                    result.Append(value[i]);
                }
            }
            return result.ToString();
        }

        public static bool NotBeSpam(string? description)
        {
            if (string.IsNullOrEmpty(description)) return true;
            if (description.Length > 15)
            {
                var distinctChars = description.Replace(" ", "").Distinct().Count();
                if (distinctChars < 3) return false;
            }
            return true;
        }
    }
}
