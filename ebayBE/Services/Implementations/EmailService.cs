using ebay.Models;
using ebay.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace ebay.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly MailSettings _mailSettings;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            IOptions<MailSettings> mailSettings,
            IConfiguration configuration,
            ILogger<EmailService> logger)
        {
            _mailSettings = mailSettings.Value;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendRegistrationOtpAsync(string email, string otp)
        {
            var body = BuildEmailLayout(
                "Verify your registration",
                $@"
                    <p>Hello,</p>
                    <p>Thanks for creating an account on <b>Ebay Clone</b>. Use the OTP below to finish signing up:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 8px; color: #333; letter-spacing: 6px;'>
                        {otp}
                    </div>
                    <p style='color: #666; font-size: 14px; margin-top: 20px;'>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>");

            await SendEmailAsync(email, "Registration OTP - Ebay Clone", body);
        }

        public async Task SendPasswordResetOtpAsync(string email, string otp)
        {
            var body = BuildEmailLayout(
                "Reset your password",
                $@"
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Use the OTP below to continue:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 8px; color: #333; letter-spacing: 6px;'>
                        {otp}
                    </div>
                    <p style='color: #666; font-size: 14px; margin-top: 20px;'>This code expires in 10 minutes. If you did not request a reset, please ignore this email.</p>");

            await SendEmailAsync(email, "Password reset OTP - Ebay Clone", body);
        }

        public async Task SendWelcomeEmailAsync(string email, string firstName)
        {
            var body = BuildEmailLayout(
                "Welcome to Ebay Clone",
                $@"
                    <p>Hello {firstName},</p>
                    <p>Your account has been verified successfully.</p>
                    <p>Welcome to the Ebay Clone marketplace.</p>");

            await SendEmailAsync(email, "Welcome to Ebay Clone", body);
        }

        public async Task SendMemberOrderConfirmationAsync(
            string email,
            string memberDisplayName,
            string orderNumber,
            decimal totalAmount,
            string paymentMethod,
            string paymentStatus)
        {
            var body = BuildEmailLayout(
                "Your order has been placed",
                $@"
                    <p>Hello {memberDisplayName},</p>
                    <p>Thanks for shopping on <b>Ebay Clone</b>. Your order has been created successfully.</p>
                    {BuildInfoCard("Order number", orderNumber, ("Total", FormatAmount(totalAmount)), ("Payment method", paymentMethod.ToUpperInvariant()), ("Payment status", paymentStatus))}
                    <p>You can track this order anytime in <b>My eBay &gt; Orders</b>.</p>");

            await SendEmailAsync(email, $"Order confirmation {orderNumber} - Ebay Clone", body);
        }

        public async Task SendGuestOrderConfirmationAsync(
            string email,
            string guestFullName,
            string orderNumber,
            decimal totalAmount,
            string paymentMethod,
            string paymentStatus)
        {
            var guestLookupUrl = BuildGuestLookupUrl(orderNumber, email);
            var body = BuildEmailLayout(
                "Your guest order has been placed",
                $@"
                    <p>Hello {guestFullName},</p>
                    <p>Thanks for shopping on <b>Ebay Clone</b>. Your guest order has been created successfully.</p>
                    {BuildInfoCard("Order number", orderNumber, ("Total", FormatAmount(totalAmount)), ("Payment method", paymentMethod.ToUpperInvariant()), ("Payment status", paymentStatus))}
                    <p>You do not need to sign in to check this order later.</p>
                    {BuildPrimaryActionButton("Track guest order", guestLookupUrl)}
                    {BuildQuickLink("Quick link", guestLookupUrl)}");

            await SendEmailAsync(email, $"Order confirmation {orderNumber} - Ebay Clone", body);
        }

        public async Task SendMemberOrderShippedEmailAsync(
            string email,
            string memberDisplayName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime? estimatedArrivalUtc)
        {
            var etaText = estimatedArrivalUtc.HasValue
                ? estimatedArrivalUtc.Value.ToString("dd/MM/yyyy")
                : "To be updated";

            var body = BuildEmailLayout(
                "Your order is on the way",
                $@"
                    <p>Hello {memberDisplayName},</p>
                    <p>Your order <b>{orderNumber}</b> has been shipped.</p>
                    {BuildInfoCard("Tracking", trackingNumber, ("Carrier", carrier), ("Estimated arrival", etaText))}
                    <p>You can follow this shipment in <b>My eBay &gt; Orders</b>.</p>");

            await SendEmailAsync(email, $"Order {orderNumber} has shipped", body);
        }

        public async Task SendGuestOrderShippedEmailAsync(
            string email,
            string guestFullName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime? estimatedArrivalUtc)
        {
            var etaText = estimatedArrivalUtc.HasValue
                ? estimatedArrivalUtc.Value.ToString("dd/MM/yyyy")
                : "To be updated";
            var guestLookupUrl = BuildGuestLookupUrl(orderNumber, email);

            var body = BuildEmailLayout(
                "Your guest order is on the way",
                $@"
                    <p>Hello {guestFullName},</p>
                    <p>Your order <b>{orderNumber}</b> has been shipped.</p>
                    {BuildInfoCard("Tracking", trackingNumber, ("Carrier", carrier), ("Estimated arrival", etaText))}
                    {BuildPrimaryActionButton("Open guest order lookup", guestLookupUrl)}
                    {BuildQuickLink("Quick link", guestLookupUrl)}");

            await SendEmailAsync(email, $"Order {orderNumber} has shipped", body);
        }

        public async Task SendMemberOrderDeliveredEmailAsync(
            string email,
            string memberDisplayName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime deliveredAtUtc)
        {
            var deliveredText = deliveredAtUtc.ToString("dd/MM/yyyy HH:mm 'UTC'");

            var body = BuildEmailLayout(
                "Your order was delivered",
                $@"
                    <p>Hello {memberDisplayName},</p>
                    <p>Your order <b>{orderNumber}</b> has been marked as delivered.</p>
                    {BuildInfoCard("Delivery", deliveredText, ("Carrier", carrier), ("Tracking number", trackingNumber))}
                    <p>You can review the delivery, returns, and after-sales options in <b>My eBay &gt; Orders</b>.</p>");

            await SendEmailAsync(email, $"Order {orderNumber} was delivered", body);
        }

        public async Task SendGuestOrderDeliveredEmailAsync(
            string email,
            string guestFullName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime deliveredAtUtc)
        {
            var deliveredText = deliveredAtUtc.ToString("dd/MM/yyyy HH:mm 'UTC'");
            var guestLookupUrl = BuildGuestLookupUrl(orderNumber, email);

            var body = BuildEmailLayout(
                "Your guest order was delivered",
                $@"
                    <p>Hello {guestFullName},</p>
                    <p>Your order <b>{orderNumber}</b> has been marked as delivered.</p>
                    {BuildInfoCard("Delivery", deliveredText, ("Carrier", carrier), ("Tracking number", trackingNumber))}
                    {BuildPrimaryActionButton("Review guest order", guestLookupUrl)}
                    {BuildQuickLink("Quick link", guestLookupUrl)}");

            await SendEmailAsync(email, $"Order {orderNumber} was delivered", body);
        }

        public async Task SendAuctionWonEmailAsync(string email, string buyerDisplayName, string productTitle, decimal finalPrice, string orderNumber)
        {
            var body = BuildEmailLayout(
                "You won the auction",
                $@"
                    <p>Hello {buyerDisplayName},</p>
                    <p>Congratulations. You won the auction for:</p>
                    <div style='background-color: #f8f9fa; padding: 12px; border-radius: 8px; font-weight: bold; color: #333;'>{productTitle}</div>
                    <p style='margin-top: 16px;'>Final price: <b>{FormatAmount(finalPrice)}</b></p>
                    {BuildInfoCard("Order number", orderNumber)}
                    <p>Please open <b>My eBay &gt; Orders</b> to pay and complete the purchase.</p>");

            await SendEmailAsync(email, $"You won the auction: {productTitle}", body);
        }

        public async Task SendAuctionPaymentReminderEmailAsync(
            string email,
            string buyerDisplayName,
            string productTitle,
            decimal finalPrice,
            string orderNumber,
            DateTime paymentDueAtUtc)
        {
            var dueDisplay = paymentDueAtUtc.ToString("dd/MM/yyyy HH:mm 'UTC'");

            var body = BuildEmailLayout(
                "Auction payment reminder",
                $@"
                    <p>Hello {buyerDisplayName},</p>
                    <p>Your auction order is still waiting for payment.</p>
                    {BuildInfoCard("Product", productTitle, ("Final price", FormatAmount(finalPrice)), ("Order number", orderNumber), ("Payment due", dueDisplay))}
                    <p>Please open <b>My eBay &gt; Orders</b> and complete payment before the deadline.</p>");

            await SendEmailAsync(email, $"Auction payment reminder {orderNumber}", body);
        }

        public async Task SendMemberCaseUpdateEmailAsync(
            string email,
            string memberDisplayName,
            string orderNumber,
            string caseReference,
            string subject,
            string heading,
            string summary,
            string actionPath,
            string? nextStep = null)
        {
            var safeMemberName = string.IsNullOrWhiteSpace(memberDisplayName) ? "there" : memberDisplayName;
            var actionUrl = BuildFrontendUrl(actionPath);
            var safeNextStep = string.IsNullOrWhiteSpace(nextStep)
                ? "Open My eBay to review the latest case status and any next steps."
                : nextStep;

            var body = BuildEmailLayout(
                heading,
                $@"
                    <p>Hello {safeMemberName},</p>
                    <p>{summary}</p>
                    {BuildInfoCard("Case", caseReference, ("Order number", orderNumber))}
                    {BuildPrimaryActionButton("Open case details", actionUrl)}
                    <p style='margin-top: 12px; color: #555;'>{safeNextStep}</p>
                    {BuildQuickLink("Quick link", actionUrl)}");

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendGuestCaseUpdateEmailAsync(
            string email,
            string guestFullName,
            string orderNumber,
            string caseReference,
            string subject,
            string heading,
            string summary,
            string? nextStep = null)
        {
            var safeGuestName = string.IsNullOrWhiteSpace(guestFullName) ? "there" : guestFullName;
            var guestLookupUrl = BuildGuestLookupUrl(orderNumber, email);
            var safeNextStep = string.IsNullOrWhiteSpace(nextStep)
                ? "Use guest order lookup with the same order number and checkout email to reopen your order and guest cases without signing in."
                : nextStep;

            var body = BuildEmailLayout(
                heading,
                $@"
                    <p>Hello {safeGuestName},</p>
                    <p>{summary}</p>
                    {BuildInfoCard("Guest case", caseReference, ("Order number", orderNumber))}
                    {BuildPrimaryActionButton("Open guest order lookup", guestLookupUrl)}
                    <p style='margin-top: 12px; color: #555;'>{safeNextStep}</p>
                    {BuildQuickLink("Quick link", guestLookupUrl)}");

            await SendEmailAsync(email, subject, body);
        }

        private string BuildGuestLookupUrl(string orderNumber, string email)
        {
            var query = $"orderNumber={Uri.EscapeDataString(orderNumber)}&email={Uri.EscapeDataString(email)}";
            return BuildFrontendUrl($"/guest/orders/lookup?{query}");
        }

        private string BuildFrontendUrl(string pathOrUrl)
        {
            if (Uri.TryCreate(pathOrUrl, UriKind.Absolute, out var absoluteUri)
                && (absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps))
            {
                return absoluteUri.ToString();
            }

            var baseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
                ?? _configuration["FRONTEND_BASE_URL"]
                ?? _configuration["AppLinks:FrontendBaseUrl"]
                ?? _configuration["FrontendBaseUrl"]
                ?? "http://localhost:5173";

            baseUrl = baseUrl.TrimEnd('/');
            var normalizedPath = string.IsNullOrWhiteSpace(pathOrUrl)
                ? string.Empty
                : (pathOrUrl.StartsWith("/") ? pathOrUrl : $"/{pathOrUrl}");
            var baseUri = new Uri($"{baseUrl}/", UriKind.Absolute);
            var combinedUri = new Uri(baseUri, normalizedPath.TrimStart('/'));
            return combinedUri.ToString();
        }

        private static string BuildEmailLayout(string heading, string innerHtml)
        {
            return $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>{heading}</h2>
                    {innerHtml}
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";
        }

        private static string BuildInfoCard(string title, string primaryValue, params (string Label, string Value)[] details)
        {
            var detailsHtml = string.Join(
                string.Empty,
                details.Select(detail =>
                    $"<p style='margin: 8px 0 0; color: #333;'><b>{detail.Label}:</b> {detail.Value}</p>"));

            return $@"
                <div style='background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                    <p style='margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'>{title}</p>
                    <p style='margin: 0; font-size: 18px; font-weight: bold; color: #333;'>{primaryValue}</p>
                    {detailsHtml}
                </div>";
        }

        private static string BuildPrimaryActionButton(string label, string url)
        {
            var safeUrl = WebUtility.HtmlEncode(url);
            var safeLabel = WebUtility.HtmlEncode(label);

            return $@"
                <table role='presentation' cellspacing='0' cellpadding='0' border='0' style='margin: 20px 0 12px;'>
                    <tr>
                        <td bgcolor='#3665f3' style='border-radius: 999px;'>
                            <a href='{safeUrl}' style='display: inline-block; background: #3665f3; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 20px; border-radius: 999px;'>{safeLabel}</a>
                        </td>
                    </tr>
                </table>";
        }

        private static string BuildQuickLink(string label, string url)
        {
            var safeUrl = WebUtility.HtmlEncode(url);
            var safeLabel = WebUtility.HtmlEncode(label);

            return $@"
                <p style='margin-top: 12px; color: #555;'>
                    {safeLabel}: <a href='{safeUrl}' style='color: #3665f3; word-break: break-all;'>{safeUrl}</a>
                </p>";
        }

        private static string FormatAmount(decimal amount)
        {
            return $"${amount:N2}";
        }

        private async Task SendEmailAsync(string email, string subject, string body)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_mailSettings.SenderName, _mailSettings.SenderEmail));
            message.To.Add(new MailboxAddress(string.Empty, email));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = body }.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(_mailSettings.Server, _mailSettings.Port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_mailSettings.SenderEmail, _mailSettings.Password);
                await client.SendAsync(message);
                _logger.LogInformation("Email sent successfully to {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", email);
                throw;
            }
            finally
            {
                await client.DisconnectAsync(true);
            }
        }
    }
}
