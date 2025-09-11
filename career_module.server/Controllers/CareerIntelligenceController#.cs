using career_module.server.Infrastructure.Data;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Controllers
{
    /// <summary>
    /// The Brain Controller - Replaces the generic Reports controller with intelligent insights
    /// Provides smart analytics, recommendations, and predictive insights
    /// </summary>
    [ApiController]
    [Route("api/intelligence")]
    [Authorize]
    public class CareerIntelligenceController : BaseController
    {
        private readonly ICareerIntelligenceService _intelligenceService;

        public CareerIntelligenceController(
            CareerManagementDbContext context,
            ICareerIntelligenceService intelligenceService) : base(context)
        {
            _intelligenceService = intelligenceService;
        }

        #region Smart Dashboard - The New Central Hub

        /// <summary>
        /// Get the intelligent dashboard - personalized for each user role
        /// This replaces the old basic dashboard with smart insights
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetIntelligentDashboard()
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            var result = await _intelligenceService.GetIntelligentDashboardAsync(
                currentEmployeeId > 0 ? currentEmployeeId : null,
                currentUserRole);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get smart recommendations personalized to the user
        /// </summary>
        [HttpGet("recommendations")]
        public async Task<IActionResult> GetSmartRecommendations()
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _intelligenceService.GetSmartRecommendationsAsync(
                currentEmployeeId > 0 ? currentEmployeeId : null);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Employee Intelligence & Career Insights

        /// <summary>
        /// Get comprehensive career intelligence report for an employee
        /// </summary>
        [HttpGet("employee/{employeeId}/career-intelligence")]
        public async Task<IActionResult> GetEmployeeCareerIntelligence(int employeeId)
        {
            // Check permissions
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                // Employees can only see their own intelligence
                if (employeeId != currentEmployeeId)
                {
                    // Managers can see their direct reports
                    if (currentUserRole == "Manager")
                    {
                        var isDirectReport = await _context.Employees
                            .AnyAsync(e => e.Id == employeeId && e.ManagerId == currentEmployeeId);

                        if (!isDirectReport)
                            return Forbid("You can only view intelligence for yourself or your direct reports");
                    }
                    else
                    {
                        return Forbid("You can only view your own career intelligence");
                    }
                }
            }

            var result = await _intelligenceService.GenerateEmployeeCareerIntelligenceAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get my career intelligence (shortcut for current user)
        /// </summary>
        [HttpGet("my-career-intelligence")]
        public async Task<IActionResult> GetMyCareerIntelligence()
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            if (currentEmployeeId == 0)
                return BadRequest(new { message = "Employee profile not found" });

            return await GetEmployeeCareerIntelligence(currentEmployeeId);
        }

        /// <summary>
        /// Get career opportunities for an employee
        /// </summary>
        [HttpGet("employee/{employeeId}/opportunities")]
        public async Task<IActionResult> GetCareerOpportunities(int employeeId)
        {
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            // Same permission check as career intelligence
            if (currentUserRole != "HR" && currentUserRole != "Admin" && employeeId != currentEmployeeId)
            {
                if (currentUserRole == "Manager")
                {
                    var isDirectReport = await _context.Employees
                        .AnyAsync(e => e.Id == employeeId && e.ManagerId == currentEmployeeId);

                    if (!isDirectReport)
                        return Forbid("Access denied");
                }
                else
                {
                    return Forbid("Access denied");
                }
            }

            var result = await _intelligenceService.IdentifyCareerOpportunitiesAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get skill development recommendations for an employee
        /// </summary>
        [HttpGet("employee/{employeeId}/skill-recommendations")]
        public async Task<IActionResult> GetSkillDevelopmentRecommendations(int employeeId)
        {
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            // Permission check
            if (currentUserRole != "HR" && currentUserRole != "Admin" && employeeId != currentEmployeeId)
            {
                if (currentUserRole == "Manager")
                {
                    var isDirectReport = await _context.Employees
                        .AnyAsync(e => e.Id == employeeId && e.ManagerId == currentEmployeeId);

                    if (!isDirectReport)
                        return Forbid("Access denied");
                }
                else
                {
                    return Forbid("Access denied");
                }
            }

            var result = await _intelligenceService.RecommendSkillDevelopmentAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get promotion readiness prediction for an employee
        /// </summary>
        [HttpGet("employee/{employeeId}/promotion-readiness")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetPromotionReadiness(int employeeId)
        {
            var result = await _intelligenceService.PredictPromotionReadinessAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get performance pattern analysis for an employee
        /// </summary>
        [HttpGet("employee/{employeeId}/performance-insights")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetPerformanceInsights(int employeeId)
        {
            var result = await _intelligenceService.AnalyzeCareerPerformancePatternAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Organizational Intelligence & Analytics

        /// <summary>
        /// Get comprehensive organizational intelligence report
        /// Replaces the old department-analytics and performance-statistics endpoints with smart insights
        /// </summary>
        [HttpGet("organization")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetOrganizationIntelligence()
        {
            var result = await _intelligenceService.GenerateOrganizationIntelligenceAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get department-specific intelligence
        /// Enhanced replacement for the old department analytics
        /// </summary>
        [HttpGet("department/{departmentId}")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetDepartmentIntelligence(int departmentId)
        {
            var currentUserRole = GetCurrentUserRole();

            // Managers can only see their own department
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == currentEmployeeId);

                if (employee == null || employee.DepartmentId != departmentId)
                    return Forbid("You can only view intelligence for your own department");
            }

            var result = await _intelligenceService.GetDepartmentIntelligenceAsync(departmentId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get organization-wide skills intelligence
        /// Enhanced replacement for the old skills-analytics endpoint
        /// </summary>
        [HttpGet("skills")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSkillsIntelligence([FromQuery] int? departmentId = null)
        {
            var currentUserRole = GetCurrentUserRole();

            // Managers can only see their own department
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == currentEmployeeId);

                if (employee != null)
                {
                    departmentId = employee.DepartmentId;
                }
            }

            var result = await _intelligenceService.GetSkillsIntelligenceAsync(departmentId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get talent risk analysis
        /// </summary>
        [HttpGet("talent-risks")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetTalentRisks()
        {
            var result = await _intelligenceService.IdentifyTalentRisksAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            // Filter for managers - only show risks in their department
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == currentEmployeeId);

                if (employee != null)
                {
                    result.Data = result.Data!.Where(risk => risk.Employee.DepartmentId == employee.DepartmentId).ToList();
                }
            }

            return Ok(result.Data);
        }

        /// <summary>
        /// Get attrition risk predictions
        /// </summary>
        [HttpGet("attrition-risks")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetAttritionRisks()
        {
            var result = await _intelligenceService.PredictAttritionRisksAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Team Intelligence (for Managers)

        /// <summary>
        /// Get team dynamics analysis for managers
        /// </summary>
        [HttpGet("my-team")]
        [Authorize(Roles = "Manager,HR,Admin")]
        public async Task<IActionResult> GetMyTeamDynamics()
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            if (currentEmployeeId == 0)
                return BadRequest(new { message = "Employee profile not found" });

            var result = await _intelligenceService.AnalyzeTeamDynamicsAsync(currentEmployeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get team dynamics for a specific manager
        /// </summary>
        [HttpGet("team/{managerId}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetTeamDynamics(int managerId)
        {
            var result = await _intelligenceService.AnalyzeTeamDynamicsAsync(managerId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Integration & Event Processing

        /// <summary>
        /// Process performance review completion to trigger intelligence updates
        /// Called internally when performance reviews are completed
        /// </summary>
        [HttpPost("process/performance-review/{reviewId}")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> ProcessPerformanceReviewCompletion(int reviewId)
        {
            var result = await _intelligenceService.ProcessPerformanceReviewCompletionAsync(reviewId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Performance review processed successfully", triggered_intelligence_update = true });
        }

        /// <summary>
        /// Process employee request completion to trigger intelligence updates
        /// Called internally when employee requests are approved
        /// </summary>
        [HttpPost("process/employee-request/{requestId}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> ProcessEmployeeRequestCompletion(int requestId)
        {
            var result = await _intelligenceService.ProcessEmployeeRequestCompletionAsync(requestId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Employee request processed successfully", triggered_intelligence_update = true });
        }

        #endregion

        #region Quick Actions & Insights

        /// <summary>
        /// Get quick insights for current user - used for widgets/notifications
        /// </summary>
        [HttpGet("quick-insights")]
        public async Task<IActionResult> GetQuickInsights()
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var currentUserRole = GetCurrentUserRole();

            var insights = new List<QuickInsight>();

            if (currentEmployeeId > 0)
            {
                // Get top 3 career opportunities
                var opportunities = await _intelligenceService.IdentifyCareerOpportunitiesAsync(currentEmployeeId);
                if (opportunities.IsSuccess && opportunities.Data!.Any())
                {
                    var topOpportunity = opportunities.Data!.First();
                    insights.Add(new QuickInsight
                    {
                        Type = "Career Opportunity",
                        Title = topOpportunity.Title,
                        Message = $"{topOpportunity.MatchScore:F0}% match - {topOpportunity.RecommendedAction}",
                        Priority = topOpportunity.Priority,
                        ActionUrl = "/career-opportunities"
                    });
                }

                // Get top skill recommendation
                var skills = await _intelligenceService.RecommendSkillDevelopmentAsync(currentEmployeeId);
                if (skills.IsSuccess && skills.Data!.Any())
                {
                    var topSkill = skills.Data!.First();
                    insights.Add(new QuickInsight
                    {
                        Type = "Skill Development",
                        Title = $"Develop {topSkill.Skill.Name}",
                        Message = $"Close the gap from level {topSkill.CurrentLevel} to {topSkill.RecommendedLevel}",
                        Priority = topSkill.Priority,
                        ActionUrl = "/skill-development"
                    });
                }
            }

            // Role-specific insights
            if (currentUserRole == "HR" || currentUserRole == "Admin")
            {
                var talentRisks = await _intelligenceService.IdentifyTalentRisksAsync();
                if (talentRisks.IsSuccess && talentRisks.Data!.Any())
                {
                    var topRisk = talentRisks.Data!.First();
                    insights.Add(new QuickInsight
                    {
                        Type = "Talent Risk",
                        Title = $"{topRisk.RiskType} - {topRisk.Employee.FirstName} {topRisk.Employee.LastName}",
                        Message = topRisk.RecommendedAction,
                        Priority = topRisk.RiskLevel,
                        ActionUrl = $"/employees/{topRisk.Employee.Id}"
                    });
                }
            }

            return Ok(insights.Take(5).ToList());
        }

        /// <summary>
        /// Search for intelligent insights across the organization
        /// </summary>
        [HttpGet("search")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> SearchIntelligence([FromQuery] string query, [FromQuery] string? type = null)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Search query is required" });

            var searchResults = new List<IntelligenceSearchResult>();

            // This is a simplified search - in a real app you'd have more sophisticated search
            if (type == null || type == "employees")
            {
                var employees = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.CurrentPosition)
                    .Where(e => e.FirstName.Contains(query) ||
                               e.LastName.Contains(query) ||
                               e.User.Email.Contains(query))
                    .Take(10)
                    .ToListAsync();

                foreach (var employee in employees)
                {
                    var intelligence = await _intelligenceService.GenerateEmployeeCareerIntelligenceAsync(employee.Id);
                    if (intelligence.IsSuccess)
                    {
                        searchResults.Add(new IntelligenceSearchResult
                        {
                            Type = "Employee Intelligence",
                            Title = $"{employee.FirstName} {employee.LastName}",
                            Summary = $"Career readiness insights available",
                            Url = $"/intelligence/employee/{employee.Id}",
                            RelevanceScore = 90
                        });
                    }
                }
            }

            return Ok(searchResults.OrderByDescending(r => r.RelevanceScore));
        }

        #endregion
    }

    #region Supporting DTOs

    public class QuickInsight
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string ActionUrl { get; set; } = string.Empty;
    }

    public class IntelligenceSearchResult
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public int RelevanceScore { get; set; }
    }

    #endregion
}