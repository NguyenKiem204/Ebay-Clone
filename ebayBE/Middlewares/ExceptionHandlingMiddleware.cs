using System.Net;
using System.Text.Json;
using ebay.DTOs.Responses;
using ebay.Exceptions;

namespace ebay.Middlewares
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var statusCode = HttpStatusCode.InternalServerError;
            var message = "Đã xảy ra lỗi";
            List<string>? errors = null;

            switch (exception)
            {
                case UnauthorizedException unauthorizedException:
                    statusCode = HttpStatusCode.Unauthorized;
                    message = unauthorizedException.Message;
                    break;

                case ForbiddenException forbiddenException:
                    statusCode = HttpStatusCode.Forbidden;
                    message = forbiddenException.Message;
                    break;

                case NotFoundException notFoundException:
                    statusCode = HttpStatusCode.NotFound;
                    message = notFoundException.Message;
                    break;

                case BadRequestException badRequest:
                    statusCode = HttpStatusCode.BadRequest;
                    message = badRequest.Message;
                    errors = badRequest.Errors;
                    break;

                case CustomException customException:
                    statusCode = (HttpStatusCode)customException.StatusCode;
                    message = customException.Message;
                    errors = customException.Errors;
                    break;
            }

            var response = ApiResponse<object>.ErrorResponse(message, errors);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            return context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
    }
}
