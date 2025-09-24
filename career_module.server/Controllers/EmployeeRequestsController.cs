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

        public EmployeeRequestsController(
            CareerManagementDbContext context,
            IEmployeeRequestService requestService) : base(context)
        {
            _requestService = requestService;
        }

        /// <summary>
        /// Get available request types
        /// </summary>
        [HttpGet("types")]
        public async Task<IActionResult> GetRequestTypes()
        {
            var result = await _requestService.GetAvailableRequestTypesAsync();
            return Ok(result.Data);
        }

        /// <summary>
        /// Create a new employee request
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateEmployeeRequestDto requestDto)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var currentUserRole = GetCurrentUserRole();

            // If no requester specified, use current user
            if (requestDto.RequesterId == 0)
                requestDto.RequesterId = currentEmployeeId;

            // Validate permissions: users can only create requests for themselves unless they're HR/Admin
            if (currentUserRole != "HR" && currentUserRole != "Admin" && requestDto.RequesterId != currentEmployeeId)
            {
                return Forbid("You can only create requests for yourself");
            }

            var result = await _requestService.CreateRequestAsync(requestDto, currentEmployeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetRequestById), new { id = result.Data!.Id },
                EmployeeRequestDto.FromEntity(result.Data));
        }

        /// <summary>
        /// Get a specific request by ID
        /// </summary>
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
                         request.TargetEmployeeId == currentEmployeeId;
            // Note: For approval permissions, we'd need to check the original entity, not DTO

            if (!canView)
                return Forbid("You don't have permission to view this request");

            return Ok(request);
        }

        /// <summary>
        /// Get requests created by the current user
        /// </summary>
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.GetRequestsByRequesterAsync(currentEmployeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        /// <summary>
        /// Get pending requests that the current user can approve
        /// </summary>
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

        /// <summary>
        /// Approve a pending request
        /// </summary>
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveRequest(int id, [FromBody] ApprovalDto dto)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.ApproveRequestAsync(id, currentEmployeeId, dto.Notes);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(EmployeeRequestDto.FromEntity(result.Data!));
        }

        /// <summary>
        /// Reject a pending request
        /// </summary>
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Rejection reason is required" });

            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.RejectRequestAsync(id, currentEmployeeId, dto.Reason);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(EmployeeRequestDto.FromEntity(result.Data!));
        }

        /// <summary>
        /// Cancel a request (only by the requester)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelRequest(int id)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.CancelRequestAsync(id, currentEmployeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Request cancelled successfully" });
        }

        /// <summary>
        /// Convenience endpoint for creating promotion requests
        /// </summary>
        [HttpPost("position-change")]
        public async Task<IActionResult> CreatePositionChangeRequest([FromBody] CreatePromotionRequestDto dto)
        {
            var requestDto = new CreateEmployeeRequestDto
            {
                RequestType = "PositionChange",
                RequesterId = dto.RequesterId,
                TargetEmployeeId = dto.TargetEmployeeId,
                EffectiveDate = dto.EffectiveDate,
                NewPositionId = dto.NewPositionId,
                ProposedSalary = dto.ProposedSalary,
                Justification = dto.Justification,
                NewManagerId = dto.NewManagerId
            };

            return await CreateRequest(requestDto);
        }

        /// <summary>
        /// Convenience endpoint for creating department change requests
        /// </summary>
        [HttpPost("department-change")]
        public async Task<IActionResult> CreateDepartmentChangeRequest([FromBody] CreateDepartmentChangeRequestDto dto)
        {
            var requestDto = new CreateEmployeeRequestDto
            {
                RequestType = "DepartmentChange",
                RequesterId = dto.RequesterId,
                TargetEmployeeId = dto.TargetEmployeeId,
                EffectiveDate = dto.EffectiveDate,
                NewDepartmentId = dto.NewDepartmentId,
                NewManagerId = dto.NewManagerId,
                Reason = dto.Reason
            };

            return await CreateRequest(requestDto);
        }
    }

    // Convenience DTOs for specific request types
    public class CreatePromotionRequestDto
    {
        public int RequesterId { get; set; }
        public int TargetEmployeeId { get; set; }
        public int NewPositionId { get; set; }
        public int? NewManagerId { get; set; }
        public decimal? ProposedSalary { get; set; }
        public string? Justification { get; set; }
        public DateTime? EffectiveDate { get; set; }
    }

    public class CreateDepartmentChangeRequestDto
    {
        public int RequesterId { get; set; }
        public int TargetEmployeeId { get; set; }
        public int NewDepartmentId { get; set; }
        public int? NewManagerId { get; set; }
        public string? Reason { get; set; }
        public DateTime? EffectiveDate { get; set; }
    }
}