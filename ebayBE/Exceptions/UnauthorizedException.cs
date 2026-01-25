namespace ebay.Exceptions
{
    public class UnauthorizedException : CustomException
    {
        public UnauthorizedException(string message = "Unauthorized")
            : base(message, 401) { }
    }
}
