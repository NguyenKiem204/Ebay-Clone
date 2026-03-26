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

        public async Task SendMemberOrderConfirmationAsync(string email, string memberDisplayName, string orderNumber, decimal totalAmount, string paymentMethod, string paymentStatus)
        {
            var subject = $"Xác nhận đơn hàng {orderNumber} - Ebay Clone";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>Đơn hàng của bạn đã được tiếp nhận</h2>
                    <p>Chào {memberDisplayName},</p>
                    <p>Cảm ơn bạn đã đặt hàng tại <b>Ebay Clone</b>.</p>
                    <p>Mã đơn hàng của bạn là:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 22px; font-weight: bold; border-radius: 5px; color: #333;'>
                        {orderNumber}
                    </div>
                    <p style='margin-top: 20px;'><b>Tóm tắt đơn hàng:</b></p>
                    <ul style='line-height: 1.8; color: #333;'>
                        <li>Tổng thanh toán: <b>{totalAmount:N0}</b></li>
                        <li>Phương thức thanh toán: <b>{paymentMethod.ToUpperInvariant()}</b></li>
                        <li>Trạng thái thanh toán hiện tại: <b>{paymentStatus}</b></li>
                    </ul>
                    <p>Bạn có thể theo dõi đơn hàng trong trang 'My eBay &gt; Orders'.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendGuestOrderConfirmationAsync(string email, string guestFullName, string orderNumber, decimal totalAmount, string paymentMethod, string paymentStatus)
        {
            var subject = $"Xác nhận đơn hàng {orderNumber} - Ebay Clone";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>Đơn hàng của bạn đã được tiếp nhận</h2>
                    <p>Chào {guestFullName},</p>
                    <p>Cảm ơn bạn đã đặt hàng tại <b>Ebay Clone</b>.</p>
                    <p>Đơn hàng của bạn đã được tạo thành công với mã đơn:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 22px; font-weight: bold; border-radius: 5px; color: #333;'>
                        {orderNumber}
                    </div>
                    <p style='margin-top: 20px;'><b>Tóm tắt đơn hàng:</b></p>
                    <ul style='line-height: 1.8; color: #333;'>
                        <li>Tổng thanh toán: <b>{totalAmount:N0}</b></li>
                        <li>Phương thức thanh toán: <b>{paymentMethod.ToUpperInvariant()}</b></li>
                        <li>Trạng thái thanh toán hiện tại: <b>{paymentStatus}</b></li>
                    </ul>
                    <p>Đây là email xác nhận rằng đơn hàng của bạn đã được đặt thành công.</p>
                    <p>Email này <b>không</b> xác nhận rằng thanh toán đã hoàn tất. Với đơn hàng COD, thanh toán sẽ được thực hiện khi nhận hàng.</p>
                    <p>Vui lòng lưu lại mã đơn hàng để dùng cho các bước tra cứu ở giai đoạn tiếp theo.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendMemberOrderShippedEmailAsync(
            string email,
            string memberDisplayName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime? estimatedArrivalUtc)
        {
            var subject = $"Đơn hàng {orderNumber} đã được gửi";
            var etaText = estimatedArrivalUtc.HasValue
                ? estimatedArrivalUtc.Value.ToString("dd/MM/yyyy")
                : "Sẽ cập nhật sau";

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>Đơn hàng của bạn đang trên đường giao</h2>
                    <p>Chào {memberDisplayName},</p>
                    <p>Seller đã cập nhật thông tin giao hàng cho đơn <b>{orderNumber}</b>.</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                        <p style='margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'>Tracking</p>
                        <p style='margin: 0; color: #333;'><b>Carrier:</b> {carrier}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Tracking number:</b> {trackingNumber}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Estimated arrival:</b> {etaText}</p>
                    </div>
                    <p>Bạn có thể theo dõi đơn hàng trong trang <b>My eBay &gt; Orders</b>.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendGuestOrderShippedEmailAsync(
            string email,
            string guestFullName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime? estimatedArrivalUtc)
        {
            var subject = $"Đơn hàng {orderNumber} đã được gửi";
            var etaText = estimatedArrivalUtc.HasValue
                ? estimatedArrivalUtc.Value.ToString("dd/MM/yyyy")
                : "Sẽ cập nhật sau";

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>Đơn hàng của bạn đang trên đường giao</h2>
                    <p>Chào {guestFullName},</p>
                    <p>Seller đã cập nhật thông tin giao hàng cho đơn <b>{orderNumber}</b>.</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                        <p style='margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'>Tracking</p>
                        <p style='margin: 0; color: #333;'><b>Carrier:</b> {carrier}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Tracking number:</b> {trackingNumber}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Estimated arrival:</b> {etaText}</p>
                    </div>
                    <p>Bạn có thể dùng guest order lookup với email checkout và mã đơn hàng để xem chi tiết đơn.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendMemberOrderDeliveredEmailAsync(
            string email,
            string memberDisplayName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime deliveredAtUtc)
        {
            var subject = $"Đơn hàng {orderNumber} đã giao thành công";
            var deliveredText = deliveredAtUtc.ToString("dd/MM/yyyy HH:mm 'UTC'");

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #059669; text-align: center;'>Đơn hàng của bạn đã giao thành công</h2>
                    <p>Chào {memberDisplayName},</p>
                    <p>Đơn <b>{orderNumber}</b> đã được cập nhật là <b>delivered</b>.</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                        <p style='margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'>Delivery</p>
                        <p style='margin: 0; color: #333;'><b>Carrier:</b> {carrier}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Tracking number:</b> {trackingNumber}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Delivered at:</b> {deliveredText}</p>
                    </div>
                    <p>Bạn có thể vào <b>My eBay &gt; Orders</b> để kiểm tra lại tracking, hoặc bắt đầu return / quality issue flow nếu có vấn đề sau khi nhận hàng.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendGuestOrderDeliveredEmailAsync(
            string email,
            string guestFullName,
            string orderNumber,
            string carrier,
            string trackingNumber,
            DateTime deliveredAtUtc)
        {
            var subject = $"Đơn hàng {orderNumber} đã giao thành công";
            var deliveredText = deliveredAtUtc.ToString("dd/MM/yyyy HH:mm 'UTC'");

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #059669; text-align: center;'>Đơn hàng của bạn đã giao thành công</h2>
                    <p>Chào {guestFullName},</p>
                    <p>Đơn <b>{orderNumber}</b> đã được cập nhật là <b>delivered</b>.</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                        <p style='margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'>Delivery</p>
                        <p style='margin: 0; color: #333;'><b>Carrier:</b> {carrier}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Tracking number:</b> {trackingNumber}</p>
                        <p style='margin: 8px 0 0; color: #333;'><b>Delivered at:</b> {deliveredText}</p>
                    </div>
                    <p>Bạn có thể dùng guest order lookup với email checkout và mã đơn để kiểm tra chi tiết đơn hoặc mở after-sales flow nếu cần.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendAuctionWonEmailAsync(string email, string buyerDisplayName, string productTitle, decimal finalPrice, string orderNumber)
        {
            var subject = $"Bạn đã thắng đấu giá: {productTitle}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>Chúc mừng! Bạn đã thắng phiên đấu giá</h2>
                    <p>Chào {buyerDisplayName},</p>
                    <p>Bạn vừa thắng đấu giá cho sản phẩm:</p>
                    <div style='background-color: #f8f9fa; padding: 12px; border-radius: 8px; font-weight: bold; color: #333;'>
                        {productTitle}
                    </div>
                    <p style='margin-top: 16px;'>Giá chốt: <b>{finalPrice:N0}</b></p>
                    <p>Hệ thống đã tạo đơn hàng tương ứng với mã:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 22px; font-weight: bold; border-radius: 5px; color: #333;'>
                        {orderNumber}
                    </div>
                    <p style='margin-top: 16px;'>Vui lòng vào trang <b>My eBay &gt; Orders</b> để thanh toán và hoàn tất giao dịch.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendAuctionPaymentReminderEmailAsync(string email, string buyerDisplayName, string productTitle, decimal finalPrice, string orderNumber, DateTime paymentDueAtUtc)
        {
            var subject = $"Nhắc thanh toán đơn đấu giá {orderNumber}";
            var dueDisplay = paymentDueAtUtc.ToString("dd/MM/yyyy HH:mm 'UTC'");

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #d97706; text-align: center;'>Nhắc thanh toán đơn thắng đấu giá</h2>
                    <p>Chào {buyerDisplayName},</p>
                    <p>Đơn hàng từ phiên đấu giá của bạn vẫn đang chờ thanh toán.</p>
                    <div style='background-color: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px;'>
                        <p style='margin: 0; font-weight: bold; color: #333;'>{productTitle}</p>
                        <p style='margin: 8px 0 0; color: #333;'>Giá chốt: <b>{finalPrice:N0}</b></p>
                        <p style='margin: 8px 0 0; color: #333;'>Mã đơn hàng: <b>{orderNumber}</b></p>
                    </div>
                    <p>Hạn thanh toán: <b>{dueDisplay}</b>.</p>
                    <p>Vui lòng vào <b>My eBay &gt; Orders</b> để hoàn tất thanh toán trước khi hết hạn.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

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
            var safeGuestName = string.IsNullOrWhiteSpace(guestFullName) ? "bạn" : guestFullName;
            var safeNextStep = string.IsNullOrWhiteSpace(nextStep)
                ? "Use guest order lookup with the same order number and checkout email to reopen your order and guest cases without signing in."
                : nextStep;

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #0056b3; text-align: center;'>{heading}</h2>
                    <p>Chào {safeGuestName},</p>
                    <p>{summary}</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                        <p style='margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'>Guest case</p>
                        <p style='margin: 0; font-size: 18px; font-weight: bold; color: #333;'>{caseReference}</p>
                        <p style='margin: 12px 0 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;'>Order number</p>
                        <p style='margin: 4px 0 0; font-size: 18px; font-weight: bold; color: #333;'>{orderNumber}</p>
                    </div>
                    <p>{safeNextStep}</p>
                    <p style='color: #666; font-size: 14px;'>For security, keep using the original checkout email when reopening guest after-sales pages.</p>
                    <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                    <p style='text-align: center; color: #999; font-size: 12px;'>&copy; 2026 Ebay Clone Project. All rights reserved.</p>
                </div>";

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
