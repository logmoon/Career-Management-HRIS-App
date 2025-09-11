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
    public class CareerPathController : BaseController
    {
        private readonly ICareerPathService _careerPathService;

        public CareerPathController(CareerManagementDbContext context, ICareerPathService careerPathService)
            : base(context)
        {
            _careerPathService = careerPathService;
        }

        #region Career Path CRUD

        [HttpPost]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> CreateCareerPath([FromBody] CreateCareerPathDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _careerPathService.CreateCareerPathAsync(dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetCareerPath), new { id = result.Data!.Id }, result.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCareerPath(int id)
        {
            var result = await _careerPathService.GetCareerPathByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCareerPaths([FromQuery] bool includeInactive = false)
        {
            // Only HR and Admin can see inactive paths
            var currentUserRole = GetCurrentUserRole();
            if (includeInactive && currentUserRole != "HR" && currentUserRole != "Admin")
                includeInactive = false;

            var result = await _careerPathService.GetAllCareerPathsAsync(includeInactive);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> UpdateCareerPath(int id, [FromBody] UpdateCareerPathDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _careerPathService.UpdateCareerPathAsync(id, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> DeleteCareerPath(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _careerPathService.DeleteCareerPathAsync(id, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Career path deactivated successfully" });
        }

        #endregion

        #region Smart Career Path Discovery

        [HttpGet("recommendations")]
        public async Task<IActionResult> GetMyRecommendations()
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            if (currentEmployeeId == 0)
                return BadRequest(new { message = "Employee profile not found" });

            var result = await _careerPathService.GetRecommendedPathsForEmployeeAsync(currentEmployeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("employee/{employeeId}/recommendations")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetEmployeeRecommendations(int employeeId)
        {
            // Managers can only see their direct reports' recommendations
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == employeeId && e.ManagerId == currentEmployeeId);

                if (employee == null)
                    return Forbid("You can only view recommendations for your direct reports");
            }

            var result = await _careerPathService.GetRecommendedPathsForEmployeeAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("from-position/{positionId}")]
        public async Task<IActionResult> GetPathsFromPosition(int positionId)
        {
            var result = await _careerPathService.GetAvailablePathsFromPositionAsync(positionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("to-position/{positionId}")]
        public async Task<IActionResult> GetPathsToPosition(int positionId)
        {
            var result = await _careerPathService.GetPathsToPositionAsync(positionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Career Path Analysis

        [HttpGet("{careerPathId}/analyze")]
        public async Task<IActionResult> AnalyzeMyReadiness(int careerPathId)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            if (currentEmployeeId == 0)
                return BadRequest(new { message = "Employee profile not found" });

            var result = await _careerPathService.AnalyzeEmployeeReadinessAsync(currentEmployeeId, careerPathId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{careerPathId}/analyze/{employeeId}")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> AnalyzeEmployeeReadiness(int careerPathId, int employeeId)
        {
            // Managers can only analyze their direct reports
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole == "Manager")
            {
                var currentEmployeeId = GetCurrentEmployeeId();
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == employeeId && e.ManagerId == currentEmployeeId);

                if (employee == null)
                    return Forbid("You can only analyze your direct reports");
            }

            var result = await _careerPathService.AnalyzeEmployeeReadinessAsync(employeeId, careerPathId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{careerPathId}/skill-gaps")]
        public async Task<IActionResult> GetMySkillGaps(int careerPathId)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            if (currentEmployeeId == 0)
                return BadRequest(new { message = "Employee profile not found" });

            var result = await _careerPathService.GetSkillGapsForPathAsync(currentEmployeeId, careerPathId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{careerPathId}/skill-gaps/{employeeId}")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetEmployeeSkillGaps(int careerPathId, int employeeId)
        {
            var result = await _careerPathService.GetSkillGapsForPathAsync(employeeId, careerPathId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("roadmap/to-position/{targetPositionId}")]
        public async Task<IActionResult> GetMyCareerRoadmap(int targetPositionId)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            if (currentEmployeeId == 0)
                return BadRequest(new { message = "Employee profile not found" });

            var result = await _careerPathService.GenerateCareerRoadmapAsync(currentEmployeeId, targetPositionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("roadmap/{employeeId}/to-position/{targetPositionId}")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetEmployeeCareerRoadmap(int employeeId, int targetPositionId)
        {
            var result = await _careerPathService.GenerateCareerRoadmapAsync(employeeId, targetPositionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Career Path Skills Management

        [HttpPost("{careerPathId}/skills")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> AddRequiredSkill(int careerPathId, [FromBody] AddCareerPathSkillDto dto)
        {
            var result = await _careerPathService.AddRequiredSkillAsync(
                careerPathId, dto.SkillId, dto.MinProficiencyLevel, dto.IsMandatory);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("{careerPathId}/skills/{skillId}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> RemoveRequiredSkill(int careerPathId, int skillId)
        {
            var result = await _careerPathService.RemoveRequiredSkillAsync(careerPathId, skillId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Required skill removed successfully" });
        }

        [HttpGet("{careerPathId}/skills")]
        public async Task<IActionResult> GetRequiredSkills(int careerPathId)
        {
            var result = await _careerPathService.GetRequiredSkillsAsync(careerPathId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion
    }

    #region Additional DTOs for Controller

    public class AddCareerPathSkillDto
    {
        public int SkillId { get; set; }
        public int MinProficiencyLevel { get; set; }
        public bool IsMandatory { get; set; } = true;
    }

    #endregion
}