using System.ComponentModel.DataAnnotations;

namespace ebay.DTOs.Requests
{
    public class ChangePasswordRequestDto
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
        public string ConfirmPassword { get; set; } = null!;
    }
}
