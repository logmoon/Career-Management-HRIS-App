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
    public class SuccessionPlanningController : BaseController
    {
        private readonly ISuccessionPlanningService _successionPlanningService;

        public SuccessionPlanningController(
            CareerManagementDbContext context,
            ISuccessionPlanningService successionPlanningService) : base(context)
        {
            _successionPlanningService = successionPlanningService;
        }

        #region Succession Plan CRUD

        [HttpPost("plans")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> CreateSuccessionPlan([FromBody] CreateSuccessionPlanDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _successionPlanningService.CreateSuccessionPlanAsync(dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetSuccessionPlan), new { id = result.Data!.Id }, result.Data);
        }

        [HttpGet("plans/{id}")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSuccessionPlan(int id)
        {
            var result = await _successionPlanningService.GetSuccessionPlanByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            // Managers can only view plans for positions in their department or their direct reports
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var position = result.Data!.Position;

                // Check if manager has access to this position
                var hasAccess = await _context.Employees
                    .AnyAsync(e => e.Id == currentEmployeeId &&
                        (e.DepartmentId == position.DepartmentId || e.Id == position.Department.HeadOfDepartmentId));

                if (!hasAccess)
                    return Forbid("You can only view succession plans for positions in your department");
            }

            return Ok(result.Data);
        }

        [HttpGet("plans")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetAllSuccessionPlans([FromQuery] string? status = null)
        {
            var result = await _successionPlanningService.GetAllSuccessionPlansAsync(status);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            // Filter for managers - only show plans for their department
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var employee = await _context.Employees
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.Id == currentEmployeeId);

                if (employee != null)
                {
                    result.Data = result.Data!.Where(sp => sp.Position.DepartmentId == employee.DepartmentId).ToList();
                }
            }

            return Ok(result.Data);
        }

        [HttpPut("plans/{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> UpdateSuccessionPlan(int id, [FromBody] UpdateSuccessionPlanDto dto)
        {
            var result = await _successionPlanningService.UpdateSuccessionPlanAsync(id, dto);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("plans/{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> DeleteSuccessionPlan(int id)
        {
            var result = await _successionPlanningService.DeleteSuccessionPlanAsync(id);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Succession plan deleted successfully" });
        }

        [HttpGet("plans/position/{positionId}")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSuccessionPlansForPosition(int positionId)
        {
            var result = await _successionPlanningService.GetSuccessionPlansForPositionAsync(positionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Smart Candidate Discovery

        [HttpGet("positions/{positionId}/smart-candidates")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSmartCandidatesForPosition(int positionId)
        {
            var result = await _successionPlanningService.GetSmartCandidatesForPositionAsync(positionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("positions/{positionId}/analyze-candidates")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> AnalyzePotentialCandidates(int positionId)
        {
            var result = await _successionPlanningService.AnalyzePotentialCandidatesAsync(positionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost("plans/{successionPlanId}/candidates")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> AddCandidateToSuccessionPlan(
            int successionPlanId, [FromBody] AddSuccessionCandidateDto dto)
        {
            var result = await _successionPlanningService.AddCandidateToSuccessionPlanAsync(
                successionPlanId, dto.EmployeeId, dto.Priority);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Candidate Management

        [HttpGet("plans/{successionPlanId}/candidates")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetCandidatesForPlan(int successionPlanId)
        {
            var result = await _successionPlanningService.GetCandidatesForPlanAsync(successionPlanId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("candidates/{candidateId}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> UpdateCandidate(int candidateId, [FromBody] UpdateSuccessionCandidateDto dto)
        {
            var result = await _successionPlanningService.UpdateCandidateAsync(candidateId, dto);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("candidates/{candidateId}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> RemoveCandidate(int candidateId)
        {
            var result = await _successionPlanningService.RemoveCandidateAsync(candidateId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Candidate removed successfully" });
        }

        #endregion

        #region Succession Analytics

        [HttpGet("reports/readiness")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSuccessionReadinessReport([FromQuery] int? departmentId = null)
        {
            // Managers can only see their own department
            var currentUserRole = GetCurrentUserRole();
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

            var result = await _successionPlanningService.GenerateSuccessionReadinessReportAsync(departmentId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("reports/risks")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSuccessionRisks()
        {
            var result = await _successionPlanningService.IdentifySuccessionRisksAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            // Filter for managers - only show risks for their department
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == currentEmployeeId);

                if (employee != null)
                {
                    result.Data = result.Data!.Where(risk => risk.Position.DepartmentId == employee.DepartmentId).ToList();
                }
            }

            return Ok(result.Data);
        }

        [HttpGet("reports/metrics")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> GetSuccessionMetrics()
        {
            var result = await _successionPlanningService.GetSuccessionMetricsAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("recommendations")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSuccessionRecommendations()
        {
            var result = await _successionPlanningService.GetSuccessionRecommendationsAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Integration Features

        [HttpPost("retirement-planning")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> ProcessRetirementPlanning([FromBody] RetirementPlanningDto dto)
        {
            var result = await _successionPlanningService.ProcessRetirementPlanningAsync(
                dto.EmployeeId, dto.ExpectedRetirementDate);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Retirement planning processed successfully" });
        }

        [HttpGet("dashboard")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetSuccessionDashboard()
        {
            var metricsResult = await _successionPlanningService.GetSuccessionMetricsAsync();
            var risksResult = await _successionPlanningService.IdentifySuccessionRisksAsync();
            var recommendationsResult = await _successionPlanningService.GetSuccessionRecommendationsAsync();

            var dashboard = new SuccessionDashboardDto
            {
                Metrics = metricsResult.IsSuccess ? metricsResult.Data : null,
                TopRisks = risksResult.IsSuccess ? risksResult.Data?.Take(5).ToList() : new List<SuccessionRisk>(),
                Recommendations = recommendationsResult.IsSuccess ? recommendationsResult.Data?.Take(5).ToList() : new List<SuccessionRecommendation>()
            };

            return Ok(dashboard);
        }

        #endregion
    }

    #region DTOs for Controller

    public class AddSuccessionCandidateDto
    {
        public int EmployeeId { get; set; }
        public int Priority { get; set; } = 1;
    }

    public class RetirementPlanningDto
    {
        public int EmployeeId { get; set; }
        public DateTime ExpectedRetirementDate { get; set; }
    }

    public class SuccessionDashboardDto
    {
        public SuccessionMetrics? Metrics { get; set; }
        public List<SuccessionRisk> TopRisks { get; set; } = new List<SuccessionRisk>();
        public List<SuccessionRecommendation> Recommendations { get; set; } = new List<SuccessionRecommendation>();
    }

    #endregion
}