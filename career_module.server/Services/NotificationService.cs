using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface INotificationService
    {
        Task<ServiceResult<Notification>> NotifyAsync(int userId, string title, string message, string actionType, int? relatedId = null);
        Task<ServiceResult<List<Notification>>> NotifyHRAsync(string title, string message, string actionType, int? relatedId = null, int? excludeUserId = null);
        Task<ServiceResult<Notification?>> NotifyManagerAsync(int employeeId, string title, string message, string actionType, int? relatedId = null, int? excludeUserId = null);
        Task<ServiceResult<List<Notification>>> NotifyRoleAsync(string role, string title, string message, string actionType, int? relatedId = null, int? excludeUserId = null);
        Task<ServiceResult<List<Notification>>> GetUserNotificationsAsync(int userId, bool unreadOnly = false, int limit = 50);
        Task<ServiceResult<Notification>> MarkAsReadAsync(int notificationId, int userId);
        Task<ServiceResult<int>> MarkAllAsReadAsync(int userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly CareerManagementDbContext _context;

        public NotificationService(CareerManagementDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<Notification>> NotifyAsync(int userId, string title, string message, string actionType, int? relatedId = null)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(message))
                    return ServiceResult<Notification>.Failure("Title and message are required");

                // Verify user exists
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId && u.IsActive);
                if (!userExists)
                    return ServiceResult<Notification>.Failure("User not found or inactive");

                var notification = new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    ActionType = actionType,
                    RelatedEntityId = relatedId,
                    IsRead = false
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return ServiceResult<Notification>.Success(notification);
            }
            catch (Exception ex)
            {
                return ServiceResult<Notification>.Failure($"Failed to create notification: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Notification>>> NotifyHRAsync(string title, string message, string actionType, int? relatedId = null, int? excludeUserId = null)
        {
            try
            {
                var hrUsers = await _context.Users
                    .Where(u => u.Role == "HR" && u.IsActive && u.Id != excludeUserId)
                    .ToListAsync();

                if (!hrUsers.Any())
                    return ServiceResult<List<Notification>>.Failure("No active HR users found");

                var notifications = new List<Notification>();

                foreach (var hrUser in hrUsers)
                {
                    var result = await NotifyAsync(hrUser.Id, title, message, actionType, relatedId);
                    if (result.IsSuccess && result.Data != null)
                    {
                        notifications.Add(result.Data);
                    }
                }

                return ServiceResult<List<Notification>>.Success(notifications);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Notification>>.Failure($"Failed to notify HR: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Notification?>> NotifyManagerAsync(int employeeId, string title, string message, string actionType, int? relatedId = null, int? excludeUserId = null)
        {
            try
            {
                var managerUserId = await _context.Employees
                    .Where(e => e.Id == employeeId &&
                               e.ManagerId != null &&
                               e.Manager != null &&
                               e.Manager.User != null &&
                               e.Manager.User.IsActive)
                    .Select(e => e.Manager.User.Id)
                    .FirstOrDefaultAsync();

                if (managerUserId == 0 || managerUserId == excludeUserId)
                {
                    return ServiceResult<Notification?>.Success(null); // No manager to notify, but not an error
                }

                var result = await NotifyAsync(managerUserId, title, message, actionType, relatedId);
                if (result.IsSuccess)
                {
                    return ServiceResult<Notification?>.Success(result.Data);
                }

                return ServiceResult<Notification?>.Failure(result.ErrorMessage);
            }
            catch (Exception ex)
            {
                return ServiceResult<Notification?>.Failure($"Failed to notify manager: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Notification>>> NotifyRoleAsync(string role, string title, string message, string actionType, int? relatedId = null, int? excludeUserId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(role))
                    return ServiceResult<List<Notification>>.Failure("Role is required");

                var roleUsers = await _context.Users
                    .Where(u => u.Role == role && u.IsActive && u.Id != excludeUserId)
                    .ToListAsync();

                if (!roleUsers.Any())
                    return ServiceResult<List<Notification>>.Success(new List<Notification>()); // No users to notify, but not an error

                var notifications = new List<Notification>();

                foreach (var user in roleUsers)
                {
                    var result = await NotifyAsync(user.Id, title, message, actionType, relatedId);
                    if (result.IsSuccess && result.Data != null)
                    {
                        notifications.Add(result.Data);
                    }
                }

                return ServiceResult<List<Notification>>.Success(notifications);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Notification>>.Failure($"Failed to notify role {role}: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Notification>>> GetUserNotificationsAsync(int userId, bool unreadOnly = false, int limit = 50)
        {
            try
            {
                if (limit <= 0 || limit > 100)
                    limit = 50; // Reasonable default and maximum

                var query = _context.Notifications
                    .Where(n => n.UserId == userId);

                if (unreadOnly)
                {
                    query = query.Where(n => !n.IsRead);
                }

                var notifications = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(limit)
                    .ToListAsync();

                return ServiceResult<List<Notification>>.Success(notifications);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Notification>>.Failure($"Failed to get notifications: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Notification>> MarkAsReadAsync(int notificationId, int userId)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

                if (notification == null)
                    return ServiceResult<Notification>.Failure("Notification not found or access denied");

                if (!notification.IsRead)
                {
                    notification.IsRead = true;
                    await _context.SaveChangesAsync();
                }

                return ServiceResult<Notification>.Success(notification);
            }
            catch (Exception ex)
            {
                return ServiceResult<Notification>.Failure($"Failed to mark notification as read: {ex.Message}");
            }
        }

        public async Task<ServiceResult<int>> MarkAllAsReadAsync(int userId)
        {
            try
            {
                var unreadNotifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                }

                await _context.SaveChangesAsync();

                return ServiceResult<int>.Success(unreadNotifications.Count);
            }
            catch (Exception ex)
            {
                return ServiceResult<int>.Failure($"Failed to mark all notifications as read: {ex.Message}");
            }
        }
    }
}