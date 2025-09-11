using career_module.server.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace career_module.server.Controllers
{
    public class BaseController : ControllerBase
    {
        protected CareerManagementDbContext _context;
        public BaseController(CareerManagementDbContext context)
        {
            _context = context;
        }

        protected int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub") ?? User.FindFirst("id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        protected int GetCurrentEmployeeId()
        {
            var currentUserId = GetCurrentUserId();
            var employeeId = _context.Employees
                .Where(e => e.UserId == currentUserId)
                .Select(e => e.Id)
                .FirstOrDefault();

            return employeeId;
        }
        protected string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role) ?? User.FindFirst("role");
            return roleClaim?.Value ?? throw new UnauthorizedAccessException("User role not found in token");
        }
    }
}
