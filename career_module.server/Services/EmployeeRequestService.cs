using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using career_module.server.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface IEmployeeRequestService
    {
        Task<ServiceResult<EmployeeRequest>> CreateRequestAsync(CreateEmployeeRequestDto requestDto, int currentEmployeeId);
        Task<ServiceResult<bool>> CancelRequestAsync(int requestId, int currentEmployeeId);
        Task<ServiceResult<EmployeeRequest>> ApproveRequestAsync(int requestId, int approverId, string? notes = null);
        Task<ServiceResult<EmployeeRequest>> RejectRequestAsync(int requestId, int rejectorId, string reason);
        Task<ServiceResult<List<EmployeeRequestDto>>> GetPendingRequestsForUserAsync(int userId, string userRole);
        Task<ServiceResult<List<EmployeeRequestDto>>> GetRequestsByRequesterAsync(int requesterId);
        Task<ServiceResult<EmployeeRequestDto>> GetRequestByIdAsync(int requestId);
        Task<ServiceResult<List<object>>> GetAvailableRequestTypesAsync();
    }

    public class EmployeeRequestService : IEmployeeRequestService
    {
        private readonly CareerManagementDbContext _context;
        private readonly IEmployeeService _employeeService;

        public EmployeeRequestService(
            CareerManagementDbContext context,
            IEmployeeService employeeService)
        {
            _context = context;
            _employeeService = employeeService;
        }

        public async Task<ServiceResult<EmployeeRequest>> CreateRequestAsync(CreateEmployeeRequestDto requestDto, int currentEmployeeId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Basic validation
                if (!IsValidRequestType(requestDto.RequestType))
                    return ServiceResult<EmployeeRequest>.Failure($"Invalid request type: {requestDto.RequestType}");

                // Load requester
                var requester = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == (requestDto.RequesterId > 0 ? requestDto.RequesterId : currentEmployeeId));

                if (requester == null)
                    return ServiceResult<EmployeeRequest>.Failure("Requester not found");

                // Load target employee if specified
                Employee? targetEmployee = null;
                if (requestDto.TargetEmployeeId.HasValue)
                {
                    targetEmployee = await _context.Employees
                        .Include(e => e.User)
                        .Include(e => e.Manager)
                        .FirstOrDefaultAsync(e => e.Id == requestDto.TargetEmployeeId.Value);

                    if (targetEmployee == null)
                        return ServiceResult<EmployeeRequest>.Failure("Target employee not found");
                }

                // Create the request
                var request = new EmployeeRequest
                {
                    RequesterId = requester.Id,
                    TargetEmployeeId = requestDto.TargetEmployeeId,
                    RequestType = requestDto.RequestType,
                    EffectiveDate = requestDto.EffectiveDate,
                    Notes = requestDto.Notes,

                    // Set navigation properties
                    Requester = requester,
                    TargetEmployee = targetEmployee
                };

                // Populate request-specific fields
                PopulateRequestSpecificFields(request, requestDto);

                // Validate request data
                if (!request.IsValidForRequestType())
                    return ServiceResult<EmployeeRequest>.Failure($"Missing required fields for {requestDto.RequestType} request");

                // Set initial status
                request.SetInitialStatus();

                _context.EmployeeRequests.Add(request);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Execute the request if fully approved
                if (request.Status == "HRApproved" || request.Status == "AutoApproved")
                {
                    var executed = await ExecuteRequestAsync(request, request.RequesterId);
                    if (!executed)
                    {
                        return ServiceResult<EmployeeRequest>.Failure("Request created but execution failed");
                    }
                }

                return ServiceResult<EmployeeRequest>.Success(request);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeRequest>.Failure($"Failed to create request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> CancelRequestAsync(int requestId, int currentEmployeeId)
        {
            try
            {
                var request = await _context.EmployeeRequests
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return ServiceResult<bool>.Failure("Request not found");

                // Only requester can cancel their own requests
                if (request.RequesterId != currentEmployeeId)
                    return ServiceResult<bool>.Failure("You can only cancel your own requests");

                if (request.Status != "Pending" && request.Status != "ManagerApproved")
                    return ServiceResult<bool>.Failure("Request cannot be canceled in its current status");

                request.Status = "Canceled";
                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to cancel request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeRequest>> ApproveRequestAsync(int requestId, int approverId, string? notes = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.EmployeeRequests
                    .Include(r => r.Requester).ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee).ThenInclude(te => te.User)
                    .Include(r => r.NewPosition)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return ServiceResult<EmployeeRequest>.Failure("Request not found");

                var approver = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == approverId);

                if (approver == null)
                    return ServiceResult<EmployeeRequest>.Failure("Approver not found");

                string approverRole = approver.User.Role;

                // Handle approval logic
                if (request.Status == "Pending")
                {
                    if (request.CanApproveAsManager(approverId))
                    {
                        request.Status = "ManagerApproved";
                        request.ApprovedByManagerId = approverId;
                        request.ManagerApprovalDate = DateTime.UtcNow;
                    }
                    else if (request.CanApproveAsHR(approverId, approverRole))
                    {
                        request.Status = "HRApproved";
                        request.ApprovedByHRId = approverId;
                        request.HRApprovalDate = DateTime.UtcNow;
                    }
                    else
                    {
                        return ServiceResult<EmployeeRequest>.Failure("You don't have permission to approve this request");
                    }
                }
                else if (request.Status == "ManagerApproved")
                {
                    if (request.CanApproveAsHR(approverId, approverRole))
                    {
                        request.Status = "HRApproved";
                        request.ApprovedByHRId = approverId;
                        request.HRApprovalDate = DateTime.UtcNow;
                    }
                    else
                    {
                        return ServiceResult<EmployeeRequest>.Failure("Only HR can give final approval");
                    }
                }
                else
                {
                    return ServiceResult<EmployeeRequest>.Failure("Request cannot be approved in its current status");
                }

                // Add notes
                if (!string.IsNullOrEmpty(notes))
                {
                    request.Notes = string.IsNullOrEmpty(request.Notes)
                        ? $"Approval notes: {notes}"
                        : $"{request.Notes}\nApproval notes: {notes}";
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Execute the request if fully approved
                if (request.Status == "HRApproved" || request.Status == "AutoApproved")
                {
                    var executed = await ExecuteRequestAsync(request, approverId);
                    if (!executed)
                    {
                        return ServiceResult<EmployeeRequest>.Failure("Request approved but execution failed");
                    }
                }

                return ServiceResult<EmployeeRequest>.Success(request);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeRequest>.Failure($"Failed to approve request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeRequest>> RejectRequestAsync(int requestId, int rejectorId, string reason)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.EmployeeRequests
                    .Include(r => r.Requester).ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee).ThenInclude(te => te.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return ServiceResult<EmployeeRequest>.Failure("Request not found");

                var rejector = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == rejectorId);

                if (rejector == null)
                    return ServiceResult<EmployeeRequest>.Failure("Rejector not found");

                string rejectorRole = rejector.User.Role;

                // Validate rejection permissions
                bool canReject = false;
                if (request.Status == "Pending")
                {
                    canReject = request.CanApproveAsManager(rejectorId) || request.CanApproveAsHR(rejectorId, rejectorRole);
                }
                else if (request.Status == "ManagerApproved")
                {
                    canReject = request.CanApproveAsHR(rejectorId, rejectorRole);
                }

                if (!canReject)
                    return ServiceResult<EmployeeRequest>.Failure("You don't have permission to reject this request");

                request.Status = "Rejected";
                request.RejectionReason = reason;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<EmployeeRequest>.Success(request);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeRequest>.Failure($"Failed to reject request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<EmployeeRequestDto>>> GetPendingRequestsForUserAsync(int userId, string userRole)
        {
            try
            {
                var query = _context.EmployeeRequests
                    .Include(r => r.Requester).ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee).ThenInclude(te => te.User)
                    .Include(r => r.ApprovedByManager).ThenInclude(am => am.User)
                    .Include(r => r.ApprovedByHR).ThenInclude(ah => ah.User)
                    .Where(r => r.Status == "Pending" || r.Status == "ManagerApproved");

                // Filter based on user role and permissions
                if (userRole == "HR" || userRole == "Admin")
                {
                    // HR and Admin can see all pending requests
                }
                else if (userRole == "Manager")
                {
                    var employeeId = await _context.Employees
                        .Where(e => e.UserId == userId)
                        .Select(e => e.Id)
                        .FirstOrDefaultAsync();

                    query = query.Where(r =>
                        (r.TargetEmployee != null && r.TargetEmployee.ManagerId == employeeId) ||
                        (r.TargetEmployee == null && r.Requester.ManagerId == employeeId));
                }
                else
                {
                    var employeeId = await _context.Employees
                        .Where(e => e.UserId == userId)
                        .Select(e => e.Id)
                        .FirstOrDefaultAsync();

                    query = query.Where(r => r.RequesterId == employeeId);
                }

                var requests = await query
                    .OrderByDescending(r => r.RequestDate)
                    .ToListAsync();

                var requestDtos = requests.Select(EmployeeRequestDto.FromEntity).ToList();
                return ServiceResult<List<EmployeeRequestDto>>.Success(requestDtos);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EmployeeRequestDto>>.Failure($"Failed to get pending requests: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<EmployeeRequestDto>>> GetRequestsByRequesterAsync(int requesterId)
        {
            try
            {
                var requests = await _context.EmployeeRequests
                    .Include(r => r.Requester).ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee).ThenInclude(te => te.User)
                    .Include(r => r.ApprovedByManager).ThenInclude(am => am.User)
                    .Include(r => r.ApprovedByHR).ThenInclude(ah => ah.User)
                    .Where(r => r.RequesterId == requesterId)
                    .OrderByDescending(r => r.RequestDate)
                    .ToListAsync();

                var requestDtos = requests.Select(EmployeeRequestDto.FromEntity).ToList();
                return ServiceResult<List<EmployeeRequestDto>>.Success(requestDtos);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EmployeeRequestDto>>.Failure($"Failed to get requests: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeRequestDto>> GetRequestByIdAsync(int requestId)
        {
            try
            {
                var request = await _context.EmployeeRequests
                    .Include(r => r.Requester).ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee).ThenInclude(te => te.User)
                    .Include(r => r.ApprovedByManager).ThenInclude(am => am.User)
                    .Include(r => r.ApprovedByHR).ThenInclude(ah => ah.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return ServiceResult<EmployeeRequestDto>.Failure("Request not found");

                var requestDto = EmployeeRequestDto.FromEntity(request);
                return ServiceResult<EmployeeRequestDto>.Success(requestDto);
            }
            catch (Exception ex)
            {
                return ServiceResult<EmployeeRequestDto>.Failure($"Failed to get request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<object>>> GetAvailableRequestTypesAsync()
        {
            var requestTypes = new List<object>
            {
                new { Value = "PositionChange", Label = "Position Change", Description = "Request a change in position" },
                new { Value = "DepartmentChange", Label = "Department Change", Description = "Request to change department" },
                new { Value = "Transfer", Label = "Transfer Request", Description = "Request a transfer to another location/team" }
            };

            return ServiceResult<List<object>>.Success(requestTypes);
        }

        // Private helper methods
        private static bool IsValidRequestType(string requestType)
        {
            return requestType is "PositionChange" or "DepartmentChange" or "Transfer";
        }

        private static void PopulateRequestSpecificFields(EmployeeRequest request, CreateEmployeeRequestDto dto)
        {
            switch (dto.RequestType)
            {
                case "PositionChange":
                    request.NewPositionId = dto.NewPositionId;
                    request.ProposedSalary = dto.ProposedSalary;
                    request.Justification = dto.Justification;
                    request.NewManagerId = dto.NewManagerId;
                    break;

                case "DepartmentChange":
                case "Transfer":
                    request.NewDepartmentId = dto.NewDepartmentId;
                    request.NewManagerId = dto.NewManagerId;
                    request.Reason = dto.Reason;
                    break;
            }
        }

        private async Task<bool> ExecuteRequestAsync(EmployeeRequest request, int approverId)
        {
            try
            {
                var targetEmployee = request.TargetEmployee ?? request.Requester;

                switch (request.RequestType)
                {
                    case "PositionChange":
                        if (request.NewPositionId.HasValue)
                        {
                            var position = _context.Positions.Where(p => p.Id == request.NewPositionId.Value)
                                .FirstOrDefault();

                            if (position != null)
                            {
                                targetEmployee.CurrentPositionId = position.Id;

                                // Change Role
                                targetEmployee.User.Role = "Employee";
                                if (position.Level == "Manager" || position.Level == "Director")
                                {
                                    targetEmployee.User.Role = "Manager";
                                }
                                await _employeeService.ChangeDepartmentAsync(targetEmployee.Id, position.DepartmentId, approverId);
                            }
                        }

                        if (request.NewManagerId.HasValue)
                            await _employeeService.ChangeManagerAsync(targetEmployee.Id, request.NewManagerId, approverId);

                        if (request.ProposedSalary.HasValue)
                            targetEmployee.Salary = request.ProposedSalary.Value;
                        break;

                    case "DepartmentChange":
                    case "Transfer":
                        if (request.NewDepartmentId.HasValue)
                            await _employeeService.ChangeDepartmentAsync(targetEmployee.Id, request.NewDepartmentId.Value, approverId);

                        if (request.NewManagerId.HasValue)
                            await _employeeService.ChangeManagerAsync(targetEmployee.Id, request.NewManagerId, approverId);
                        break;
                }

                request.ProcessedDate = DateTime.UtcNow;
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}