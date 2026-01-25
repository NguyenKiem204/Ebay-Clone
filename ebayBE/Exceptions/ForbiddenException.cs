namespace ebay.Exceptions
{
    public class ForbiddenException : CustomException
    {
        public ForbiddenException(string message = "Forbidden")
            : base(message, 403) { }
    }
}
