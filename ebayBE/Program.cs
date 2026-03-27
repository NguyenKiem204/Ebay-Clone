using System.Text;
using ebay.Configuration;
using ebay.Middlewares;
using ebay.Models;
using ebay.Services.Implementations;
using ebay.Services.Interfaces;
using ebay.Validators.Auth;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Load environment variables from .env file
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Explicitly re-add env vars so DotNetEnv values (set before builder creation) are picked up
builder.Configuration.AddEnvironmentVariables();

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<ExternalAuthSettings>(
    builder.Configuration.GetSection("ExternalAuthSettings"));
builder.Services.Configure<MailSettings>(
    builder.Configuration.GetSection("MailSettings"));
builder.Services.Configure<CloudinarySettings>(
    builder.Configuration.GetSection("Cloudinary"));

var jwtSettings = builder.Configuration
    .GetSection("JwtSettings")
    .Get<JwtSettings>()!;

if (Encoding.UTF8.GetBytes(jwtSettings.SecretKey).Length < 32)
    throw new InvalidOperationException("JWT SecretKey must be at least 256-bit");

builder.Services.AddDbContext<EbayDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();
builder.Services.AddDataProtection();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<ICheckoutCoreService, CheckoutCoreService>();
builder.Services.AddScoped<IGuestCheckoutService, GuestCheckoutService>();
builder.Services.AddScoped<IGuestAfterSalesAccessService, GuestAfterSalesAccessService>();
builder.Services.AddScoped<IGuestOrderLookupService, GuestOrderLookupService>();
builder.Services.AddScoped<IGuestReturnRequestService, GuestReturnRequestService>();
builder.Services.AddScoped<IGuestDisputeService, GuestDisputeService>();
builder.Services.AddScoped<IGuestCaseQueryService, GuestCaseQueryService>();
builder.Services.AddScoped<IBuyerCasePolicyService, BuyerCasePolicyService>();
builder.Services.AddScoped<IAfterSalesExperienceService, AfterSalesExperienceService>();
builder.Services.AddScoped<ICaseActionService, CaseActionService>();
builder.Services.AddScoped<ICaseSlaService, CaseSlaService>();
builder.Services.AddScoped<IBuyerCaseProjectionMapper, BuyerCaseProjectionMapper>();
builder.Services.AddScoped<IBuyerCaseQueryService, BuyerCaseQueryService>();
builder.Services.AddScoped<IBuyerCaseCommandService, BuyerCaseCommandService>();
builder.Services.AddScoped<IGuestCaseCommandService, GuestCaseCommandService>();
builder.Services.AddScoped<IInternalCaseQueryService, InternalCaseQueryService>();
builder.Services.AddScoped<ICaseEvidenceService, CaseEvidenceService>();
builder.Services.AddScoped<ICaseNotificationService, CaseNotificationService>();
builder.Services.AddScoped<IAuctionNotificationService, AuctionNotificationService>();
builder.Services.AddScoped<IOrderNotificationService, OrderNotificationService>();
builder.Services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
builder.Services.AddScoped<IOrderProjectionMapper, OrderProjectionMapper>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderCancellationService, OrderCancellationService>();
builder.Services.AddScoped<IAuctionSettlementService, AuctionSettlementService>();
builder.Services.AddScoped<IAuctionPaymentFollowUpService, AuctionPaymentFollowUpService>();
builder.Services.AddScoped<IDisputeService, DisputeService>();
builder.Services.AddScoped<IDisputeActionService, DisputeActionService>();
builder.Services.AddScoped<IReturnRequestService, ReturnRequestService>();
builder.Services.AddScoped<IReturnRequestActionService, ReturnRequestActionService>();
builder.Services.AddScoped<IStoreService, StoreService>();
builder.Services.AddScoped<IBidService, BidService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ISellerService, SellerService>();
builder.Services.AddScoped<IReviewFeedbackService, ReviewFeedbackService>();
builder.Services.AddScoped<ISellerOrderQueryService, SellerOrderQueryService>();
builder.Services.AddScoped<ISellerOrderFulfillmentService, SellerOrderFulfillmentService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IPaypalService, PaypalService>();
builder.Services.AddHostedService<ebay.Services.Implementations.HistoryCleanupService>();
builder.Services.AddHostedService<ebay.Services.Implementations.AuctionSettlementBackgroundService>();
builder.Services.AddHostedService<ebay.Services.Implementations.AuctionPaymentFollowUpBackgroundService>();
builder.Services.AddHostedService<ebay.Services.Implementations.AuctionNotificationBackgroundService>();

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Read token from cookie if present
                if (context.Request.Cookies.ContainsKey("accessToken"))
                {
                    context.Token = context.Request.Cookies["accessToken"];
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddHealthChecks();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5000") // Vite default ports
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for cookies
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "eBay API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        In = ParameterLocation.Header
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                In = ParameterLocation.Header
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Bật Swagger cho mọi môi trường để dễ test
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "eBay API v1");
    c.RoutePrefix = "swagger"; // Truy cập tại /swagger
});

app.MapHealthChecks("/health");
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<AntiSpamMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();
app.UseCors("AllowFrontend"); // Enable CORS before Auth
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();
// Apply migrations automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<EbayDbContext>();
        if (context.Database.GetPendingMigrations().Any())
        {
            context.Database.Migrate();
            Console.WriteLine("✅ Database updated with new migrations.");
        }
        await ReviewFeedbackSchemaSync.EnsureAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

app.Run();

