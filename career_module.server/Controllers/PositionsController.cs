using career_module.server.Infrastructure.Data;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PositionsController : BaseController
    {
        private readonly IPositionService _positionService;

        public PositionsController(CareerManagementDbContext context, IPositionService positionService) : base(context)
        {
            _positionService = positionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPositions(
            [FromQuery] bool includeInactive = false,
            [FromQuery] int? departmentId = null)
        {
            var result = await _positionService.GetAllPositionsAsync(!includeInactive, departmentId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPositionById(int id)
        {
            var result = await _positionService.GetPositionByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> CreatePosition([FromBody] CreatePositionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Position title is required" });

            if (dto.DepartmentId <= 0)
                return BadRequest(new { message = "Valid department ID is required" });

            var currentUserId = GetCurrentUserId();
            var result = await _positionService.CreatePositionAsync(dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetPositionById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> UpdatePosition(int id, [FromBody] UpdatePositionDto dto)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _positionService.UpdatePositionAsync(id, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> DeactivatePosition(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _positionService.DeactivatePositionAsync(id, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Position deactivated successfully" });
        }

        [HttpGet("{id}/employees")]
        public async Task<IActionResult> GetPositionEmployees(int id)
        {
            var result = await _positionService.GetPositionEmployeesAsync(id);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("vacant-key-positions")]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> GetVacantKeyPositions()
        {
            var result = await _positionService.GetVacantKeyPositionsAsync();

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("by-department/{departmentId}")]
        public async Task<IActionResult> GetPositionsByDepartment(int departmentId)
        {
            var result = await _positionService.GetPositionsByDepartmentAsync(departmentId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }
    }
}