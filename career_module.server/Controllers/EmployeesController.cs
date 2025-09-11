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
    }

    // Additional DTOs for the controller
    public class ChangeDepartmentDto
    {
        public int NewDepartmentId { get; set; }
    }

    public class ChangeManagerDto
    {
        public int? NewManagerId { get; set; }
    }
}