using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using ebay.Configuration;
using ebay.Exceptions;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace ebay.Services.Implementations
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileService> _logger;
        private readonly CloudinarySettings _cloudinarySettings;
        private readonly Cloudinary? _cloudinary;
        private const long DefaultMaxFileSize = 10 * 1024 * 1024;
        private static readonly string[] DefaultAllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private static readonly string[] VideoExtensions = { ".mp4", ".mov", ".webm", ".ogg" };

        public FileService(
            IWebHostEnvironment environment,
            IOptions<CloudinarySettings> cloudinaryOptions,
            IConfiguration configuration,
            ILogger<FileService> logger)
        {
            _environment = environment;
            _logger = logger;
            _cloudinarySettings = BuildCloudinarySettings(cloudinaryOptions.Value, configuration);
            if (_cloudinarySettings.IsConfigured)
            {
                _cloudinary = new Cloudinary(new Account(
                    _cloudinarySettings.CloudName,
                    _cloudinarySettings.ApiKey,
                    _cloudinarySettings.ApiSecret))
                {
                    Api = { Secure = true }
                };
            }
        }

        public async Task<string> SaveFileAsync(
            IFormFile file,
            string subFolder,
            string[]? allowedExtensions = null,
            long? maxFileSizeBytes = null)
        {
            if (file == null || file.Length == 0)
            {
                return null!;
            }

            var maxSize = maxFileSizeBytes ?? DefaultMaxFileSize;
            var extensions = allowedExtensions ?? DefaultAllowedExtensions;

            if (file.Length > maxSize)
            {
                throw new BadRequestException($"File exceeds the allowed size limit ({maxSize / 1024 / 1024}MB).");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!extensions.Contains(extension))
            {
                throw new BadRequestException($"Unsupported file format. Allowed extensions: {string.Join(", ", extensions)}");
            }

            if (_cloudinarySettings.IsConfigured)
            {
                return await UploadToCloudinaryAsync(file, subFolder, extension);
            }

            var wwwRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(wwwRootPath))
            {
                wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadsFolder = Path.Combine(wwwRootPath, "uploads", subFolder);
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return $"/uploads/{subFolder}/{fileName}";
        }

        public void DeleteFile(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath))
            {
                return;
            }

            if (Uri.TryCreate(relativePath, UriKind.Absolute, out var absoluteUri))
            {
                if (_cloudinary != null && absoluteUri.Host.Contains("cloudinary.com", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        DeleteCloudinaryAssetAsync(absoluteUri).GetAwaiter().GetResult();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete Cloudinary asset {Url}", relativePath);
                    }
                }
                return;
            }

            var rootPath = string.IsNullOrEmpty(_environment.WebRootPath)
                ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
                : _environment.WebRootPath;

            var path = Path.Combine(rootPath, relativePath.TrimStart('/'));
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }

        private async Task<string> UploadToCloudinaryAsync(IFormFile file, string subFolder, string extension)
        {
            var normalizedFolder = BuildCloudinaryFolder(subFolder);
            var publicId = $"{Guid.NewGuid():N}";
            await using var stream = file.OpenReadStream();
            RawUploadResult uploadResult;

            if (VideoExtensions.Contains(extension))
            {
                uploadResult = await _cloudinary!.UploadAsync(new VideoUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = normalizedFolder,
                    PublicId = publicId,
                    UseFilename = false,
                    UniqueFilename = false,
                    Overwrite = false
                });
            }
            else
            {
                uploadResult = await _cloudinary!.UploadAsync(new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = normalizedFolder,
                    PublicId = publicId,
                    UseFilename = false,
                    UniqueFilename = false,
                    Overwrite = false
                });
            }

            if (uploadResult.Error != null)
            {
                _logger.LogError("Cloudinary upload failed: {Message}", uploadResult.Error.Message);
                throw new BadRequestException("Image upload failed. Please try again.");
            }

            if (!string.IsNullOrWhiteSpace(uploadResult.SecureUrl?.ToString()))
            {
                return uploadResult.SecureUrl.ToString();
            }

            throw new BadRequestException("Image upload failed. Cloud URL was not returned.");
        }

        private async Task DeleteCloudinaryAssetAsync(Uri assetUrl)
        {
            var publicId = ExtractCloudinaryPublicId(assetUrl);
            if (string.IsNullOrWhiteSpace(publicId))
            {
                return;
            }

            var resourceType = assetUrl.AbsolutePath.Contains("/video/upload/", StringComparison.OrdinalIgnoreCase)
                ? ResourceType.Video
                : ResourceType.Image;

            var result = await _cloudinary!.DestroyAsync(new DeletionParams(publicId)
            {
                ResourceType = resourceType,
                Invalidate = true
            });

            if (result.Error != null)
            {
                _logger.LogWarning("Cloudinary delete failed: {Message}", result.Error.Message);
            }
        }

        private string BuildCloudinaryFolder(string subFolder)
        {
            var baseFolder = (_cloudinarySettings.Folder ?? "ebay-clone").Trim().Trim('/');
            var childFolder = (subFolder ?? string.Empty).Trim().Trim('/').Replace('\\', '/');
            return string.IsNullOrWhiteSpace(childFolder) ? baseFolder : $"{baseFolder}/{childFolder}";
        }

        private static string? ExtractCloudinaryPublicId(Uri assetUrl)
        {
            var absolutePath = assetUrl.AbsolutePath;
            var uploadMarker = absolutePath.IndexOf("/upload/", StringComparison.OrdinalIgnoreCase);
            if (uploadMarker < 0)
            {
                return null;
            }

            var pathAfterUpload = absolutePath[(uploadMarker + "/upload/".Length)..].Trim('/');
            if (string.IsNullOrWhiteSpace(pathAfterUpload))
            {
                return null;
            }

            var segments = pathAfterUpload.Split('/', StringSplitOptions.RemoveEmptyEntries).ToList();
            if (segments.Count == 0)
            {
                return null;
            }

            if (segments[0].StartsWith("v", StringComparison.OrdinalIgnoreCase) &&
                segments[0].Length > 1 &&
                segments[0][1..].All(char.IsDigit))
            {
                segments.RemoveAt(0);
            }

            if (segments.Count == 0)
            {
                return null;
            }

            var lastSegment = segments[^1];
            var extension = Path.GetExtension(lastSegment);
            if (!string.IsNullOrEmpty(extension))
            {
                segments[^1] = lastSegment[..^extension.Length];
            }

            return string.Join("/", segments);
        }

        private static CloudinarySettings BuildCloudinarySettings(CloudinarySettings options, IConfiguration configuration)
        {
            return new CloudinarySettings
            {
                CloudName = FirstNonEmpty(
                    options.CloudName,
                    configuration["Cloudinary:CloudName"],
                    configuration["Cloudinary__CloudName"],
                    configuration["CLOUDINARY_CLOUD_NAME"]),
                ApiKey = FirstNonEmpty(
                    options.ApiKey,
                    configuration["Cloudinary:ApiKey"],
                    configuration["Cloudinary__ApiKey"],
                    configuration["CLOUDINARY_API_KEY"]),
                ApiSecret = FirstNonEmpty(
                    options.ApiSecret,
                    configuration["Cloudinary:ApiSecret"],
                    configuration["Cloudinary__ApiSecret"],
                    configuration["CLOUDINARY_API_SECRET"]),
                Folder = FirstNonEmpty(
                    options.Folder,
                    configuration["Cloudinary:Folder"],
                    configuration["Cloudinary__Folder"],
                    configuration["CLOUDINARY_FOLDER"],
                    "ebay-clone")
            };
        }

        private static string FirstNonEmpty(params string?[] values)
        {
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim() ?? string.Empty;
        }
    }
}
