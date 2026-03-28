namespace ebay.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendRegistrationOtpAsync(string email, string otp);
        Task SendWelcomeEmailAsync(string email, string firstName);
        Task SendPasswordResetOtpAsync(string email, string otp);
        Task SendMemberOrderConfirmationAsync(string email, string memberDisplayName, string orderNumber, decimal totalAmount, string paymentMethod, string paymentStatus);
        Task SendGuestOrderConfirmationAsync(string email, string guestFullName, string orderNumber, decimal totalAmount, string paymentMethod, string paymentStatus);
        Task SendMemberOrderShippedEmailAsync(string email, string memberDisplayName, string orderNumber, string carrier, string trackingNumber, DateTime? estimatedArrivalUtc);
        Task SendGuestOrderShippedEmailAsync(string email, string guestFullName, string orderNumber, string carrier, string trackingNumber, DateTime? estimatedArrivalUtc);
        Task SendMemberOrderDeliveredEmailAsync(string email, string memberDisplayName, string orderNumber, string carrier, string trackingNumber, DateTime deliveredAtUtc);
        Task SendGuestOrderDeliveredEmailAsync(string email, string guestFullName, string orderNumber, string carrier, string trackingNumber, DateTime deliveredAtUtc);
        Task SendAuctionWonEmailAsync(string email, string buyerDisplayName, string productTitle, decimal finalPrice, string orderNumber);
        Task SendAuctionPaymentReminderEmailAsync(string email, string buyerDisplayName, string productTitle, decimal finalPrice, string orderNumber, DateTime paymentDueAtUtc);
        Task SendMemberCaseUpdateEmailAsync(
            string email,
            string memberDisplayName,
            string orderNumber,
            string caseReference,
            string subject,
            string heading,
            string summary,
            string actionPath,
            string? nextStep = null);
        Task SendGuestCaseUpdateEmailAsync(
            string email,
            string guestFullName,
            string orderNumber,
            string caseReference,
            string subject,
            string heading,
            string summary,
            string? nextStep = null);
    }
}
