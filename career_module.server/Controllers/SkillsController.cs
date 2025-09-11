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
    public class SkillsController : BaseController
    {
        private readonly ISkillService _skillService;
        private readonly IEmployeeSkillService _employeeSkillService;

        public SkillsController(
            CareerManagementDbContext context,
            ISkillService skillService,
            IEmployeeSkillService employeeSkillService) : base(context)
        {
            _skillService = skillService;
            _employeeSkillService = employeeSkillService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSkills(
            [FromQuery] bool includeInactive = false,
            [FromQuery] string? category = null)
        {
            var result = await _skillService.GetAllSkillsAsync(!includeInactive, category);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSkillById(int id)
        {
            var result = await _skillService.GetSkillByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> CreateSkill([FromBody] CreateSkillDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Skill name is required" });

            var currentUserId = GetCurrentUserId();
            var result = await _skillService.CreateSkillAsync(dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetSkillById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> UpdateSkill(int id, [FromBody] UpdateSkillDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _skillService.UpdateSkillAsync(id, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> DeactivateSkill(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _skillService.DeactivateSkillAsync(id, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Skill deactivated successfully" });
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetSkillCategories()
        {
            var result = await _skillService.GetSkillCategoriesAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{id}/employees")]
        public async Task<IActionResult> GetEmployeesWithSkill(int id, [FromQuery] int? minProficiencyLevel = null)
        {
            var result = await _skillService.GetEmployeesWithSkillAsync(id, minProficiencyLevel);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        // Employee Skills endpoints
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeSkills(int employeeId)
        {
            // Check permissions: users can view their own skills, or HR/Admin/Manager can view others
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var employee = await _context.Employees.FindAsync(employeeId);
                if (employee == null)
                    return NotFound(new { message = "Employee not found" });

                if (employee.UserId != currentUserId)
                {
                    // Check if current user is the employee's manager
                    var isManager = employee.ManagerId.HasValue &&
                                   await _context.Employees.AnyAsync(e => e.Id == employee.ManagerId && e.UserId == currentUserId);

                    if (!isManager)
                        return Forbid("You can only view your own skills or your direct reports' skills");
                }
            }

            var result = await _employeeSkillService.GetEmployeeSkillsAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost("employee")]
        public async Task<IActionResult> AddEmployeeSkill([FromBody] AddEmployeeSkillDto dto)
        {
            if (dto.EmployeeId <= 0 || dto.SkillId <= 0)
                return BadRequest(new { message = "Valid employee ID and skill ID are required" });

            if (dto.ProficiencyLevel < 1 || dto.ProficiencyLevel > 5)
                return BadRequest(new { message = "Proficiency level must be between 1 and 5" });

            var currentUserId = GetCurrentUserId();
            var result = await _employeeSkillService.AddEmployeeSkillAsync(dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("employee/{employeeId}/skill/{skillId}")]
        public async Task<IActionResult> UpdateEmployeeSkill(
            int employeeId,
            int skillId,
            [FromBody] UpdateEmployeeSkillDto dto)
        {
            if (dto.ProficiencyLevel.HasValue && (dto.ProficiencyLevel < 1 || dto.ProficiencyLevel > 5))
                return BadRequest(new { message = "Proficiency level must be between 1 and 5" });

            var currentUserId = GetCurrentUserId();
            var result = await _employeeSkillService.UpdateEmployeeSkillAsync(employeeId, skillId, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("employee/{employeeId}/skill/{skillId}")]
        public async Task<IActionResult> RemoveEmployeeSkill(int employeeId, int skillId)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _employeeSkillService.RemoveEmployeeSkillAsync(employeeId, skillId, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Employee skill removed successfully" });
        }

        [HttpGet("employee/{employeeId}/gap-analysis/{targetPositionId}")]
        public async Task<IActionResult> GetSkillGaps(int employeeId, int targetPositionId)
        {
            // Check permissions
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var employee = await _context.Employees.FindAsync(employeeId);
                if (employee == null)
                    return NotFound(new { message = "Employee not found" });

                if (employee.UserId != currentUserId)
                {
                    var isManager = employee.ManagerId.HasValue &&
                                   await _context.Employees.AnyAsync(e => e.Id == employee.ManagerId && e.UserId == currentUserId);

                    if (!isManager)
                        return Forbid("You can only analyze your own skill gaps or your direct reports'");
                }
            }

            var result = await _employeeSkillService.GetSkillGapsAsync(employeeId, targetPositionId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("proficiency-levels")]
        public IActionResult GetProficiencyLevels()
        {
            var levels = new[]
            {
                new { Value = 1, Label = "Beginner", Description = "Basic understanding, requires guidance" },
                new { Value = 2, Label = "Novice", Description = "Limited experience, minimal guidance needed" },
                new { Value = 3, Label = "Intermediate", Description = "Good working knowledge, works independently" },
                new { Value = 4, Label = "Advanced", Description = "Extensive experience, can mentor others" },
                new { Value = 5, Label = "Expert", Description = "Deep expertise, recognized authority" }
            };

            return Ok(levels);
        }
    }
}