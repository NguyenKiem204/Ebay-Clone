using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly EbayDbContext _context;

        public NotificationsController(EbayDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<ActionResult<ApiResponse<NotificationListResponseDto>>> GetNotifications([FromQuery] int limit = 10)
        {
            if (limit <= 0)
            {
                limit = 10;
            }

            var userId = GetUserId();
            var items = await _context.Notifications
                .Where(notification => notification.UserId == userId)
                .OrderByDescending(notification => notification.CreatedAt)
                .Take(limit)
                .Select(notification => new NotificationItemResponseDto
                {
                    Id = notification.Id,
                    Type = notification.Type,
                    Title = notification.Title,
                    Body = notification.Body,
                    Link = notification.Link,
                    IsRead = notification.IsRead == true,
                    CreatedAt = notification.CreatedAt
                })
                .ToListAsync();

            var unreadCount = await _context.Notifications
                .CountAsync(notification => notification.UserId == userId && notification.IsRead != true);

            return Ok(ApiResponse<NotificationListResponseDto>.SuccessResponse(new NotificationListResponseDto
            {
                Items = items,
                UnreadCount = unreadCount
            }));
        }

        [HttpPost("{id}/read")]
        public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
        {
            var userId = GetUserId();
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

            if (notification == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Notification not found."));
            }

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResponse(null!, "Notification marked as read."));
        }

        [HttpPost("mark-all-read")]
        public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead()
        {
            var userId = GetUserId();
            var now = DateTime.UtcNow;

            var notifications = await _context.Notifications
                .Where(notification => notification.UserId == userId && notification.IsRead != true)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = now;
            }

            if (notifications.Count > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(ApiResponse<object>.SuccessResponse(null!, "All notifications marked as read."));
        }
    }
}
