using career_module.server.Infrastructure.Data;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : BaseController
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(
            CareerManagementDbContext context,
            INotificationService notificationService) : base(context)
        {
            _notificationService = notificationService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyNotifications([FromQuery] bool unreadOnly = false, [FromQuery] int limit = 50)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _notificationService.GetUserNotificationsAsync(currentUserId, unreadOnly, limit);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var currentUserId = GetCurrentUserId();
            var result = await _notificationService.GetUserNotificationsAsync(currentUserId, unreadOnly: true);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { count = result.Data!.Count });
        }

        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _notificationService.MarkAsReadAsync(id, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Notification marked as read" });
        }

        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var currentUserId = GetCurrentUserId();
            var result = await _notificationService.MarkAllAsReadAsync(currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "All notifications marked as read", count = result.Data });
        }

        [HttpPost("send")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Title and message are required" });

            var result = await _notificationService.NotifyAsync(
                dto.UserId,
                dto.Title,
                dto.Message,
                dto.ActionType ?? string.Empty,
                dto.RelatedEntityId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Notification sent successfully", notification = result.Data });
        }

        [HttpPost("send-to-hr")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> SendToHR([FromBody] SendBulkNotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Title and message are required" });

            var currentUserId = GetCurrentUserId();
            var result = await _notificationService.NotifyHRAsync(
                dto.Title,
                dto.Message,
                dto.ActionType ?? string.Empty,
                dto.RelatedEntityId,
                currentUserId); // Don't notify self

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = $"Notification sent to {result.Data!.Count} HR users", notifications = result.Data });
        }

        [HttpPost("send-to-role")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> SendToRole([FromBody] SendRoleNotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Title and message are required" });

            if (string.IsNullOrWhiteSpace(dto.Role))
                return BadRequest(new { message = "Role is required" });

            var currentUserId = GetCurrentUserId();
            var result = await _notificationService.NotifyRoleAsync(
                dto.Role,
                dto.Title,
                dto.Message,
                dto.ActionType ?? string.Empty,
                dto.RelatedEntityId,
                currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = $"Notification sent to {result.Data!.Count} users with role '{dto.Role}'", notifications = result.Data });
        }

        [HttpPost("notify-manager")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> NotifyManager([FromBody] NotifyManagerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Title and message are required" });

            if (dto.EmployeeId <= 0)
                return BadRequest(new { message = "Valid employee ID is required" });

            var currentUserId = GetCurrentUserId();
            var result = await _notificationService.NotifyManagerAsync(
                dto.EmployeeId,
                dto.Title,
                dto.Message,
                dto.ActionType ?? string.Empty,
                dto.RelatedEntityId,
                currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            if (result.Data == null)
                return Ok(new { message = "No manager to notify for this employee" });

            return Ok(new { message = "Manager notified successfully", notification = result.Data });
        }

        [HttpGet]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetAllNotifications([FromQuery] int? userId = null, [FromQuery] bool unreadOnly = false)
        {
            // Admin endpoint to view all notifications (for debugging/monitoring)
            var query = _context.Notifications.AsQueryable();

            if (userId.HasValue)
                query = query.Where(n => n.UserId == userId.Value);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var notifications = await query
                .Include(n => n.User)
                .OrderByDescending(n => n.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            // Admin-only: Hard delete notifications
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound(new { message = "Notification not found" });

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification deleted successfully" });
        }
    }

    #region DTOs for Notification Controller

    public class SendNotificationDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ActionType { get; set; }
        public int? RelatedEntityId { get; set; }
    }

    public class SendBulkNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ActionType { get; set; }
        public int? RelatedEntityId { get; set; }
    }

    public class SendRoleNotificationDto : SendBulkNotificationDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class NotifyManagerDto : SendBulkNotificationDto
    {
        public int EmployeeId { get; set; }
    }

    #endregion
}