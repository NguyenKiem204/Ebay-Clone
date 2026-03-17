namespace ebay.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendRegistrationOtpAsync(string email, string otp);
        Task SendWelcomeEmailAsync(string email, string firstName);
        Task SendPasswordResetOtpAsync(string email, string otp);
    }
}
