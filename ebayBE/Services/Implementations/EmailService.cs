using ebay.Models;
using ebay.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace ebay.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly MailSettings _mailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<MailSettings> mailSettings, ILogger<EmailService> logger)
        {
            _mailSettings = mailSettings.Value;
            _logger = logger;
        }

        public async Task SendRegistrationOtpAsync(string email, string otp)
        {
            var subject = "Mã xác thực đăng ký tài khoản - Ebay Clone";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>Xác thực đăng ký tài khoản</h2>
                    <p>Chào bạn,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>Ebay Clone</b>. Đây là mã OTP để hoàn tất quá trình đăng ký của bạn:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; color: #333; letter-spacing: 5px;'>
                        {otp}
                    </div>
                    <p style='color: #666; font-size: 14px; margin-top: 20px;'>Mã này sẽ hết hạn sau 10 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetOtpAsync(string email, string otp)
        {
            var subject = "Mã xác thực đặt lại mật khẩu - Ebay Clone";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #d93025; text-align: center;'>Đặt lại mật khẩu</h2>
                    <p>Chào bạn,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP dưới đây để tiến hành đặt lại mật khẩu:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; color: #333; letter-spacing: 5px;'>
                        {otp}
                    </div>
                    <p style='color: #666; font-size: 14px; margin-top: 20px;'>Lưu ý: Mã này chỉ có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này và đảm bảo tài khoản của bạn vẫn an toàn.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendWelcomeEmailAsync(string email, string firstName)
        {
            var subject = "Chào mừng bạn đến với Ebay Clone!";
            var body = $"<h1>Chào {firstName},</h1><p>Tài khoản của bạn đã được xác thực thành công. Chào mừng bạn đến với cộng đồng mua sắm của chúng tôi!</p>";
            await SendEmailAsync(email, subject, body);
        }

        private async Task SendEmailAsync(string email, string subject, string body)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_mailSettings.SenderName, _mailSettings.SenderEmail));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = body };
            message.Body = bodyBuilder.ToMessageBody();

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
