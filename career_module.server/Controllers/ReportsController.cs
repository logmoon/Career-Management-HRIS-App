using career_module.server.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : BaseController
    {
        public ReportsController(CareerManagementDbContext context) : base(context)
        {
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData()
        {
            try
            {
                var currentUserRole = GetCurrentUserRole();
                var currentEmployeeId = GetCurrentEmployeeId();

                var dashboardData = new DashboardDto();

                // Basic statistics available to everyone
                dashboardData.TotalEmployees = await _context.Employees.CountAsync();
                dashboardData.TotalDepartments = await _context.Departments.Where(d => d.IsActive).CountAsync();
                dashboardData.TotalPositions = await _context.Positions.Where(p => p.IsActive).CountAsync();

                // Role-specific data
                if (currentUserRole == "HR" || currentUserRole == "Admin")
                {
                    // HR and Admin get full dashboard
                    dashboardData.PendingRequests = await _context.EmployeeRequests
                        .CountAsync(r => r.Status == "Pending" || r.Status == "ManagerApproved");

                    dashboardData.PendingAssignments = await _context.Employees
                        .Include(e => e.Department)
                        .CountAsync(e => e.Department.Name == "Pending Assignment");

                    dashboardData.RecentHires = await _context.Employees
                        .Where(e => e.HireDate >= DateTime.UtcNow.AddDays(-30))
                        .CountAsync();

                    dashboardData.DepartmentStats = await _context.Departments
                        .Where(d => d.IsActive)
                        .Select(d => new DepartmentStatDto
                        {
                            Name = d.Name,
                            EmployeeCount = d.Employees.Count(),
                            HeadName = d.HeadOfDepartment != null
                                ? $"{d.HeadOfDepartment.FirstName} {d.HeadOfDepartment.LastName}"
                                : "Unassigned"
                        })
                        .OrderBy(d => d.Name)
                        .ToListAsync();
                }
                else if (currentUserRole == "Manager")
                {
                    // Managers get team-specific data
                    dashboardData.MyDirectReports = await _context.Employees
                        .CountAsync(e => e.ManagerId == currentEmployeeId);

                    dashboardData.MyTeamRequests = await _context.EmployeeRequests
                        .CountAsync(r => (r.TargetEmployee != null && r.TargetEmployee.ManagerId == currentEmployeeId) ||
                                        r.Requester.ManagerId == currentEmployeeId);
                }
                else
                {
                    // Regular employees get personal data
                    dashboardData.MyRequests = await _context.EmployeeRequests
                        .CountAsync(r => r.RequesterId == currentEmployeeId);

                    dashboardData.MyPendingRequests = await _context.EmployeeRequests
                        .CountAsync(r => r.RequesterId == currentEmployeeId &&
                                        (r.Status == "Pending" || r.Status == "ManagerApproved"));
                }

                // Recent activity for all users
                dashboardData.RecentNotifications = await _context.Notifications
                    .Where(n => n.UserId == GetCurrentUserId())
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(5)
                    .Select(n => new RecentNotificationDto
                    {
                        Title = n.Title,
                        Message = n.Message,
                        CreatedAt = n.CreatedAt,
                        IsRead = n.IsRead
                    })
                    .ToListAsync();

                return Ok(dashboardData);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to get dashboard data: {ex.Message}" });
            }
        }

        [HttpGet("department-analytics")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetDepartmentAnalytics()
        {
            try
            {
                var analytics = await _context.Departments
                    .Where(d => d.IsActive && d.Name != "Pending Assignment")
                    .Select(d => new DepartmentAnalyticsDto
                    {
                        DepartmentName = d.Name,
                        EmployeeCount = d.Employees.Count(),
                        ActivePositions = d.Positions.Count(p => p.IsActive),
                        AverageTenure = d.Employees.Any()
                            ? d.Employees.Average(e => EF.Functions.DateDiffDay(e.HireDate, DateTime.UtcNow))
                            : 0,
                        HasHead = d.HeadOfDepartmentId.HasValue
                    })
                    .OrderByDescending(d => d.EmployeeCount)
                    .ToListAsync();

                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to get department analytics: {ex.Message}" });
            }
        }

        [HttpGet("request-summary")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetRequestSummary()
        {
            try
            {
                var summary = await _context.EmployeeRequests
                    .GroupBy(r => r.Status)
                    .Select(g => new RequestSummaryDto
                    {
                        Status = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var typeBreakdown = await _context.EmployeeRequests
                    .GroupBy(r => r.RequestType)
                    .Select(g => new RequestTypeBreakdownDto
                    {
                        RequestType = g.Key,
                        Count = g.Count(),
                        PendingCount = g.Count(r => r.Status == "Pending" || r.Status == "ManagerApproved")
                    })
                    .OrderByDescending(r => r.Count)
                    .ToListAsync();

                return Ok(new { statusSummary = summary, typeBreakdown = typeBreakdown });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to get request summary: {ex.Message}" });
            }
        }

        [HttpGet("performance-statistics")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetPerformanceStatistics([FromQuery] int? departmentId = null)
        {
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            try
            {
                var query = _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .ThenInclude(e => e.Department)
                    .AsQueryable();

                // Apply department filter based on role
                if (currentUserRole == "Manager")
                {
                    var directReportIds = await _context.Employees
                        .Where(e => e.ManagerId == currentEmployeeId)
                        .Select(e => e.Id)
                        .ToListAsync();
                    query = query.Where(pr => directReportIds.Contains(pr.EmployeeId));
                }
                else if (departmentId.HasValue)
                {
                    query = query.Where(pr => pr.Employee.DepartmentId == departmentId.Value);
                }

                var reviews = await query.ToListAsync();
                var currentYear = DateTime.UtcNow.Year;

                var statistics = new
                {
                    TotalReviews = reviews.Count,
                    ReviewsThisYear = reviews.Count(r => r.ReviewPeriodEnd.Year == currentYear),
                    CompletedReviews = reviews.Count(r => r.Status == "Completed" || r.Status == "Approved"),
                    PendingReviews = reviews.Count(r => r.Status == "Draft"),
                    AverageRating = reviews.Where(r => r.OverallRating > 0).Average(r => (double?)r.OverallRating) ?? 0,
                    RatingDistribution = reviews.Where(r => r.OverallRating > 0)
                        .GroupBy(r => (int)r.OverallRating)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ReviewsByStatus = reviews.GroupBy(r => r.Status)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ReviewsByMonth = reviews.Where(r => r.ReviewPeriodEnd.Year == currentYear)
                        .GroupBy(r => r.ReviewPeriodEnd.Month)
                        .ToDictionary(g => g.Key, g => g.Count())
                };

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to get statistics: {ex.Message}" });
            }
        }

        [HttpGet("skills-analytics")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSkillsAnalytics([FromQuery] int? departmentId = null)
        {
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            try
            {
                var query = _context.EmployeeSkills
                    .Include(es => es.Employee)
                    .ThenInclude(e => e.Department)
                    .Include(es => es.Skill)
                    .AsQueryable();

                // Apply filters based on role
                if (currentUserRole == "Manager")
                {
                    var directReportIds = await _context.Employees
                        .Where(e => e.ManagerId == currentEmployeeId)
                        .Select(e => e.Id)
                        .ToListAsync();
                    query = query.Where(es => directReportIds.Contains(es.EmployeeId));
                }
                else if (departmentId.HasValue)
                {
                    query = query.Where(es => es.Employee.DepartmentId == departmentId.Value);
                }

                var employeeSkills = await query.ToListAsync();

                var analytics = new
                {
                    TotalSkillsTracked = employeeSkills.Select(es => es.SkillId).Distinct().Count(),
                    AverageProficiencyLevel = employeeSkills.Any() ? Math.Round(employeeSkills.Average(es => (double)es.ProficiencyLevel), 2) : 0,
                    SkillsByCategory = employeeSkills
                        .GroupBy(es => es.Skill.Category)
                        .ToDictionary(g => g.Key, g => new
                        {
                            Count = g.Count(),
                            AverageProficiency = Math.Round(g.Average(es => (double)es.ProficiencyLevel), 2),
                            UniqueSkills = g.Select(es => es.SkillId).Distinct().Count()
                        }),
                    TopSkills = employeeSkills
                        .GroupBy(es => es.Skill.Name)
                        .Select(g => new
                        {
                            SkillName = g.Key,
                            EmployeeCount = g.Count(),
                            AverageProficiency = Math.Round(g.Average(es => (double)es.ProficiencyLevel), 2),
                            Category = g.First().Skill.Category
                        })
                        .OrderByDescending(s => s.EmployeeCount)
                        .Take(10)
                        .ToList(),
                    ProficiencyDistribution = employeeSkills
                        .GroupBy(es => es.ProficiencyLevel)
                        .ToDictionary(g => g.Key, g => g.Count())
                };

                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to get skills analytics: {ex.Message}" });
            }
        }
    }


    public class PerformanceAnalyticsReportDto
    {
        public int TotalReviews { get; set; }
        public int ReviewsThisYear { get; set; }
        public double AverageRating { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
        public List<MonthlyPerformanceDto> MonthlyTrend { get; set; } = new();
        public List<DepartmentPerformanceDto> DepartmentBreakdown { get; set; } = new();
    }

    public class MonthlyPerformanceDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int ReviewCount { get; set; }
        public double AverageRating { get; set; }
    }

    public class DepartmentPerformanceDto
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int ReviewCount { get; set; }
        public double AverageRating { get; set; }
        public int EmployeeCount { get; set; }
    }

    public class DashboardDto
    {
        public int TotalEmployees { get; set; }
        public int TotalDepartments { get; set; }
        public int TotalPositions { get; set; }
        public int PendingRequests { get; set; }
        public int PendingAssignments { get; set; }
        public int RecentHires { get; set; }
        public int MyDirectReports { get; set; }
        public int MyTeamRequests { get; set; }
        public int MyRequests { get; set; }
        public int MyPendingRequests { get; set; }
        public List<DepartmentStatDto> DepartmentStats { get; set; } = new();
        public List<RecentNotificationDto> RecentNotifications { get; set; } = new();
    }

    public class DepartmentStatDto
    {
        public string Name { get; set; } = string.Empty;
        public int EmployeeCount { get; set; }
        public string HeadName { get; set; } = string.Empty;
    }

    public class RecentNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }

    public class DepartmentAnalyticsDto
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int EmployeeCount { get; set; }
        public int ActivePositions { get; set; }
        public double AverageTenure { get; set; }
        public bool HasHead { get; set; }
    }

    public class RequestSummaryDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class RequestTypeBreakdownDto
    {
        public string RequestType { get; set; } = string.Empty;
        public int Count { get; set; }
        public int PendingCount { get; set; }
    }
}