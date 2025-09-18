using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeeRequestsController : BaseController
    {
        private readonly IEmployeeRequestService _requestService;
        private readonly IEmployeeRequestFactory _requestFactory;

        public EmployeeRequestsController(
            CareerManagementDbContext context,
            IEmployeeRequestService requestService,
            IEmployeeRequestFactory requestFactory) : base(context)
        {
            _requestService = requestService;
            _requestFactory = requestFactory;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] JsonElement requestData)
        {
            try
            {
                // Extract request type from the JSON
                if (!requestData.TryGetProperty("requestType", out var requestTypeElement))
                    return BadRequest(new { message = "Request type is required" });

                var requestType = requestTypeElement.GetString();
                if (string.IsNullOrWhiteSpace(requestType))
                    return BadRequest(new { message = "Valid request type is required" });

                // Create the appropriate request object using the factory
                var request = _requestFactory.CreateRequest(requestType);
                if (request == null)
                    return BadRequest(new { message = $"Unknown request type: {requestType}" });

                // Deserialize the JSON into the specific request type
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                request = JsonSerializer.Deserialize(requestData.GetRawText(), request.GetType(), options) as EmployeeRequest;
                if (request == null)
                    return BadRequest(new { message = "Failed to parse request data" });

                var currentUserId = GetCurrentUserId();
                var currentEmployeeId = GetCurrentEmployeeId();
                var currentUserRole = GetCurrentUserRole();

                // If no requester specified, use current user
                if (request.RequesterId == 0)
                    request.RequesterId = currentEmployeeId;

                // Validate permissions: users can only create requests for themselves unless they're HR/Admin
                if (currentUserRole != "HR" && currentUserRole != "Admin" && request.RequesterId != currentEmployeeId)
                {
                    return Forbid("You can only create requests for yourself");
                }

                var result = await _requestService.CreateRequestAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { message = result.ErrorMessage });

                return CreatedAtAction(nameof(GetRequestById), new { id = result.Data!.Id }, result.Data);
            }
            catch (JsonException)
            {
                return BadRequest(new { message = "Invalid JSON format" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to create request: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelRequestById(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _requestService.CancelRequestAsync(id);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Request cancelled successfully" });
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

        // Convenience endpoints for creating specific request types from other services
        [HttpPost("promotion")]
        public async Task<IActionResult> CreatePromotionRequest([FromBody] CreatePromotionRequestDto dto)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.CreatePromotionRequestAsync(
                dto.RequesterId > 0 ? dto.RequesterId : currentEmployeeId,
                dto.TargetEmployeeId,
                dto.CareerPathId,
                dto.ProposedSalary,
                dto.NewManagerId,
                dto.Justification);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetRequestById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpPost("department-change")]
        public async Task<IActionResult> CreateDepartmentChangeRequest([FromBody] CreateDepartmentChangeRequestDto dto)
        {
            var currentEmployeeId = GetCurrentEmployeeId();
            var result = await _requestService.CreateDepartmentChangeRequestAsync(
                dto.RequesterId > 0 ? dto.RequesterId : currentEmployeeId,
                dto.TargetEmployeeId,
                dto.NewDepartmentId,
                dto.NewManagerId,
                dto.Reason);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetRequestById), new { id = result.Data!.Id }, result.Data);
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

    // Specific DTOs for convenience endpoints
    public class CreatePromotionRequestDto
    {
        public int RequesterId { get; set; }
        public int TargetEmployeeId { get; set; }
        public int CareerPathId { get; set; }
        public int? NewManagerId { get; set; }
        public decimal? ProposedSalary { get; set; }
        public string? Justification { get; set; }
    }

    public class CreateDepartmentChangeRequestDto
    {
        public int RequesterId { get; set; }
        public int TargetEmployeeId { get; set; }
        public int NewDepartmentId { get; set; }
        public int? NewManagerId { get; set; }
        public string? Reason { get; set; }
    }
}