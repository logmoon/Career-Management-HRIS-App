using career_module.server.Infrastructure.Data;
using career_module.server.Models.DTOs;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeeRequestsController : BaseController
    {
        private readonly IEmployeeRequestService _requestService;

        public EmployeeRequestsController(CareerManagementDbContext context, IEmployeeRequestService requestService) : base(context)
        {
            _requestService = requestService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RequestType))
                return BadRequest(new { message = "Request type is required" });

            var currentUserId = GetCurrentUserId();
            var currentEmployeeId = GetCurrentEmployeeId();

            // If no requester specified, use current user
            if (dto.RequesterId == 0)
                dto.RequesterId = currentEmployeeId;

            // Validate permissions: users can only create requests for themselves unless they're HR/Admin
            var currentUserRole = GetCurrentUserRole();
            if (currentUserRole != "HR" && currentUserRole != "Admin" && dto.RequesterId != currentEmployeeId)
            {
                return Forbid("You can only create requests for yourself");
            }

            var result = await _requestService.CreateRequestAsync(dto);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetRequestById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequestById(int id)
        {
            var result = await _requestService.GetRequestByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            // Check permissions: users can view their own requests, requests for them, or if they can approve them
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            var request = result.Data!;
            var canView = currentUserRole == "HR" || currentUserRole == "Admin" ||
                         request.RequesterId == currentEmployeeId ||
                         request.TargetEmployeeId == currentEmployeeId ||
                         request.CanApproveAsManager(currentEmployeeId) ||
                         request.CanApproveAsHR(currentUserRole);

            if (!canView)
                return Forbid("You don't have permission to view this request");

            return Ok(request);
        }

        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.GetRequestsByRequesterAsync(currentEmployeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            var result = await _requestService.GetPendingRequestsForUserAsync(currentUserId, currentUserRole);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveRequest(int id, [FromBody] ApprovalDto dto)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.ApproveRequestAsync(id, currentEmployeeId, dto.Notes);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Rejection reason is required" });

            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.RejectRequestAsync(id, currentEmployeeId, dto.Reason);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("types")]
        public IActionResult GetRequestTypes()
        {
            var requestTypes = new[]
            {
                new { Value = "Promotion", Label = "Promotion Request" },
                new { Value = "DepartmentChange", Label = "Department Change" },
                new { Value = "Training", Label = "Training Request" },
                new { Value = "LeaveRequest", Label = "Leave Request" },
                new { Value = "SalaryReview", Label = "Salary Review" },
                new { Value = "RoleChange", Label = "Role Change" },
                new { Value = "Other", Label = "Other Request" }
            };

            return Ok(requestTypes);
        }
    }

    // DTOs for the controller
    public class ApprovalDto
    {
        public string? Notes { get; set; }
    }

    public class RejectionDto
    {
        public string Reason { get; set; } = string.Empty;
    }
}