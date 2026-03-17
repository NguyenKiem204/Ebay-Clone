namespace ebay.DTOs.Requests
{
    public class VerifyOtpRequestDto
    {
        public string Email { get; set; } = null!;
        public string Otp { get; set; } = null!;
    }

    public class ResendOtpRequestDto
    {
        public string Email { get; set; } = null!;
    }
}
