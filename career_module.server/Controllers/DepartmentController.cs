using career_module.server.Infrastructure.Data;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentsController : BaseController
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentsController(CareerManagementDbContext context, IDepartmentService departmentService) : base(context)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllDepartments([FromQuery] bool includeInactive = false)
        {
            var result = await _departmentService.GetAllDepartmentsAsync(!includeInactive);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartmentById(int id)
        {
            var result = await _departmentService.GetDepartmentByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Department name is required" });

            var currentUserId = GetCurrentUserId();
            var result = await _departmentService.CreateDepartmentAsync(dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetDepartmentById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> UpdateDepartment(int id, [FromBody] UpdateDepartmentDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _departmentService.UpdateDepartmentAsync(id, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeactivateDepartment(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _departmentService.DeactivateDepartmentAsync(id, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Department deactivated successfully" });
        }

        [HttpGet("{id}/employees")]
        public async Task<IActionResult> GetDepartmentEmployees(int id)
        {
            var result = await _departmentService.GetDepartmentEmployeesAsync(id);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("{id}/head")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> AssignHeadOfDepartment(int id, [FromBody] AssignHeadDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _departmentService.AssignHeadOfDepartmentAsync(id, dto.EmployeeId, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("with-stats")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetDepartmentsWithStats()
        {
            var result = await _departmentService.GetDepartmentsWithStatsAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }
    }

    // Additional DTO for the controller
    public class AssignHeadDto
    {
        public int EmployeeId { get; set; }
    }
}