using career_module.server.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : BaseController
    {
        public NotificationsController(CareerManagementDbContext context) : base(context)
        {
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var currentUserId = GetCurrentUserId();
            var notifications = await _context.Notifications
                .Where(n => n.UserId == currentUserId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null || notification.UserId != GetCurrentUserId())
                return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
