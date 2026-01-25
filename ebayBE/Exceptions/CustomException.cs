namespace ebay.Exceptions
{
    public class CustomException : Exception
    {
        public int StatusCode { get; set; }
        public List<string>? Errors { get; set; }

        public CustomException(string message, int statusCode = 400, List<string>? errors = null)
            : base(message)
        {
            StatusCode = statusCode;
            Errors = errors;
        }
    }
}
