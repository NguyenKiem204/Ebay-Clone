namespace ebay.Exceptions
{
    public class NotFoundException : CustomException
    {
        public NotFoundException(string message = "Not Found")
            : base(message, 404) { }
    }
}
