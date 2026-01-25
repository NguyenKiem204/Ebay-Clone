namespace ebay.Configuration
{
    public class RateLimitOptions
    {
        public const string SectionName = "RateLimit";

        public LoginRateLimit Login { get; set; } = new();
        public RegisterRateLimit Register { get; set; } = new();
        public PasswordResetRateLimit PasswordReset { get; set; } = new();
        public EmailVerificationRateLimit EmailVerification { get; set; } = new();
        public GeneralRateLimit General { get; set; } = new();

        public class LoginRateLimit
        {
            public int MaxAttempts { get; set; } = 5;
            public int WindowMinutes { get; set; } = 15;
        }

        public class RegisterRateLimit
        {
            public int MaxAttempts { get; set; } = 3;
            public int WindowMinutes { get; set; } = 60;
        }

        public class PasswordResetRateLimit
        {
            public int MaxAttempts { get; set; } = 3;
            public int WindowMinutes { get; set; } = 60;
        }

        public class EmailVerificationRateLimit
        {
            public int MaxAttempts { get; set; } = 5;
            public int WindowMinutes { get; set; } = 60;
        }

        public class GeneralRateLimit
        {
            public int MaxRequests { get; set; } = 100;
            public int WindowMinutes { get; set; } = 1;
        }
    }
}
