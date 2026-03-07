using System.ComponentModel.DataAnnotations;

namespace ebay.DTOs.Requests
{
    public class AddressRequestDto
    {
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string Phone { get; set; } = null!;

        [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
        public string Street { get; set; } = null!;

        [Required(ErrorMessage = "Thành phố là bắt buộc")]
        public string City { get; set; } = null!;

        public string? State { get; set; }
        public string? PostalCode { get; set; }

        [Required(ErrorMessage = "Quốc gia là bắt buộc")]
        public string Country { get; set; } = null!;

        public bool IsDefault { get; set; }
    }
}
