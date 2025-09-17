using career_module.server.Infrastructure.Data;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeesController : BaseController
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(CareerManagementDbContext context, IEmployeeService employeeService) : base(context)
        {
            _employeeService = employeeService;
        }

        #region Employee Basic Operations

        [HttpGet]
        public async Task<IActionResult> GetAllEmployees(
            [FromQuery] string? department = null,
            [FromQuery] string? role = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var result = await _employeeService.GetAllEmployeesAsync(department, role, page, pageSize);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployeeById(int id)
        {
            var result = await _employeeService.GetEmployeeByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.GetEmployeeByUserIdAsync(currentUserId);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
        {
            // Check permissions: users can only update their own profile, or HR/Admin can update anyone
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var employeeResult = await _employeeService.GetEmployeeByIdAsync(id);
                if (!employeeResult.IsSuccess)
                    return NotFound(new { message = employeeResult.ErrorMessage });

                if (employeeResult.Data!.UserId != currentUserId)
                    return Forbid("You can only update your own profile");
            }

            var result = await _employeeService.UpdateEmployeeAsync(id, dto);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("{id}/department")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> ChangeDepartment(int id, [FromBody] ChangeDepartmentDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.ChangeDepartmentAsync(id, dto.NewDepartmentId, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("{id}/manager")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> ChangeManager(int id, [FromBody] ChangeManagerDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.ChangeManagerAsync(id, dto.NewManagerId, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{id}/direct-reports")]
        public async Task<IActionResult> GetDirectReports(int id)
        {
            // Check permissions: users can see their own direct reports, or HR/Admin can see anyone's
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var employeeResult = await _employeeService.GetEmployeeByIdAsync(id);
                if (!employeeResult.IsSuccess)
                    return NotFound(new { message = employeeResult.ErrorMessage });

                if (employeeResult.Data!.UserId != currentUserId)
                    return Forbid("You can only view your own direct reports");
            }

            var result = await _employeeService.GetDirectReportsAsync(id);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("org-chart")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetOrganizationChart()
        {
            var result = await _employeeService.GetOrganizationHierarchyAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchEmployees([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return BadRequest(new { message = "Search term is required" });

            var result = await _employeeService.SearchEmployeesAsync(searchTerm);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        #endregion

        #region Employee Experience Operations

        [HttpGet("{employeeId}/experiences")]
        public async Task<IActionResult> GetEmployeeExperiences(int employeeId)
        {
            // Check permissions: users can view their own experiences, or HR/Admin can view anyone's
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var employeeResult = await _employeeService.GetEmployeeByIdAsync(employeeId);
                if (!employeeResult.IsSuccess)
                    return NotFound(new { message = employeeResult.ErrorMessage });

                if (employeeResult.Data!.UserId != currentUserId)
                    return Forbid("You can only view your own experience");
            }

            var result = await _employeeService.GetEmployeeExperiencesAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost("{employeeId}/experiences")]
        public async Task<IActionResult> AddEmployeeExperience(int employeeId, [FromBody] CreateExperienceDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.AddEmployeeExperienceAsync(employeeId, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(
                nameof(GetEmployeeExperiences),
                new { employeeId = employeeId },
                result.Data);
        }

        [HttpPut("experiences/{experienceId}")]
        public async Task<IActionResult> UpdateEmployeeExperience(int experienceId, [FromBody] UpdateExperienceDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.UpdateEmployeeExperienceAsync(experienceId, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("experiences/{experienceId}")]
        public async Task<IActionResult> DeleteEmployeeExperience(int experienceId)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.DeleteEmployeeExperienceAsync(experienceId, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return NoContent();
        }

        #endregion

        #region Employee Education Operations

        [HttpGet("{employeeId}/educations")]
        public async Task<IActionResult> GetEmployeeEducations(int employeeId)
        {
            // Check permissions: users can view their own educations, or HR/Admin can view anyone's
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var employeeResult = await _employeeService.GetEmployeeByIdAsync(employeeId);
                if (!employeeResult.IsSuccess)
                    return NotFound(new { message = employeeResult.ErrorMessage });

                if (employeeResult.Data!.UserId != currentUserId)
                    return Forbid("You can only view your own education");
            }

            var result = await _employeeService.GetEmployeeEducationsAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost("{employeeId}/educations")]
        public async Task<IActionResult> AddEmployeeEducation(int employeeId, [FromBody] CreateEducationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.AddEmployeeEducationAsync(employeeId, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(
                nameof(GetEmployeeEducations),
                new { employeeId = employeeId },
                result.Data);
        }

        [HttpPut("educations/{educationId}")]
        public async Task<IActionResult> UpdateEmployeeEducation(int educationId, [FromBody] UpdateEducationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.UpdateEmployeeEducationAsync(educationId, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("educations/{educationId}")]
        public async Task<IActionResult> DeleteEmployeeEducation(int educationId)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _employeeService.DeleteEmployeeEducationAsync(educationId, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return NoContent();
        }
        #endregion
    }

    public class ChangeDepartmentDto
    {
        public int NewDepartmentId { get; set; }
    }
    public class ChangeManagerDto
    {
        public int? NewManagerId { get; set; }
    }
}