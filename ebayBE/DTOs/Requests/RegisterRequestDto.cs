using System.ComponentModel.DataAnnotations;

namespace ebay.DTOs.Requests
{
    public class RegisterRequestDto
    {
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? Phone { get; set; }
        
        public string Password { get; set; } = null!;
        public string ConfirmPassword { get; set; } = null!;
    }
}
