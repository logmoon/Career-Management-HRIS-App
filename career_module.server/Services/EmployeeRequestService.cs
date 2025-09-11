using career_module.server.Infrastructure.Data;
using career_module.server.Models.DTOs;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface IEmployeeRequestService
    {
        Task<ServiceResult<EmployeeRequest>> CreateRequestAsync(CreateRequestDto request);
        Task<ServiceResult<EmployeeRequest>> ApproveRequestAsync(int requestId, int approverId, string? notes = null);
        Task<ServiceResult<EmployeeRequest>> RejectRequestAsync(int requestId, int rejectorId, string reason);
        Task<ServiceResult<List<EmployeeRequest>>> GetPendingRequestsForUserAsync(int userId, string userRole);
        Task<ServiceResult<List<EmployeeRequest>>> GetRequestsByRequesterAsync(int requesterId);
        Task<ServiceResult<EmployeeRequest>> GetRequestByIdAsync(int requestId);
    }

    public class EmployeeRequestService : IEmployeeRequestService
    {
        private readonly CareerManagementDbContext _context;
        private readonly INotificationService _notificationService;

        public EmployeeRequestService(CareerManagementDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult<EmployeeRequest>> CreateRequestAsync(CreateRequestDto request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Load requester with user info for role checking
                var requester = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == request.RequesterId);

                if (requester == null)
                    return ServiceResult<EmployeeRequest>.Failure("Requester not found");

                // Load target employee if specified
                Employee? targetEmployee = null;
                if (request.TargetEmployeeId.HasValue)
                {
                    targetEmployee = await _context.Employees
                        .Include(e => e.User)
                        .Include(e => e.Manager)
                        .FirstOrDefaultAsync(e => e.Id == request.TargetEmployeeId.Value);

                    if (targetEmployee == null)
                        return ServiceResult<EmployeeRequest>.Failure("Target employee not found");
                }

                // Create the request
                var employeeRequest = new EmployeeRequest
                {
                    RequesterId = request.RequesterId,
                    TargetEmployeeId = request.TargetEmployeeId,
                    RequestType = request.RequestType,
                    Notes = request.Notes,
                    Requester = requester,
                    TargetEmployee = targetEmployee
                };

                // Set initial status based on requester role
                employeeRequest.SetInitialStatus();

                _context.EmployeeRequests.Add(employeeRequest);
                await _context.SaveChangesAsync();

                // Send notifications based on status
                await SendRequestNotificationsAsync(employeeRequest);

                await transaction.CommitAsync();

                return ServiceResult<EmployeeRequest>.Success(employeeRequest);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeRequest>.Failure($"Failed to create request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeRequest>> ApproveRequestAsync(int requestId, int approverId, string? notes = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.EmployeeRequests
                    .Include(r => r.Requester)
                    .ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee)
                    .ThenInclude(te => te.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return ServiceResult<EmployeeRequest>.Failure("Request not found");

                var approver = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == approverId);

                if (approver == null)
                    return ServiceResult<EmployeeRequest>.Failure("Approver not found");

                // Determine approval type and validate permissions
                string approverRole = approver.User.Role;
                bool isManagerApproval = false;
                bool isHRApproval = false;

                if (request.Status == "Pending")
                {
                    // Check if this is a manager approval
                    if (request.CanApproveAsManager(approverId))
                    {
                        isManagerApproval = true;
                        request.Status = "ManagerApproved";
                        request.ApprovedByManagerId = approverId;
                        request.ManagerApprovalDate = DateTime.UtcNow;
                    }
                    // Or direct HR/Admin approval
                    else if (request.CanApproveAsHR(approverRole))
                    {
                        isHRApproval = true;
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
                    // Only HR can give final approval
                    if (request.CanApproveAsHR(approverRole))
                    {
                        isHRApproval = true;
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

                // Add approval notes
                if (!string.IsNullOrEmpty(notes))
                {
                    request.Notes = string.IsNullOrEmpty(request.Notes)
                        ? $"Approval notes: {notes}"
                        : $"{request.Notes}\nApproval notes: {notes}";
                }

                await _context.SaveChangesAsync();

                // Send notifications
                await SendApprovalNotificationsAsync(request, approver, isManagerApproval, isHRApproval);

                await transaction.CommitAsync();

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
                    .Include(r => r.Requester)
                    .ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee)
                    .ThenInclude(te => te.User)
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
                    canReject = request.CanApproveAsManager(rejectorId) || request.CanApproveAsHR(rejectorRole);
                }
                else if (request.Status == "ManagerApproved")
                {
                    canReject = request.CanApproveAsHR(rejectorRole);
                }

                if (!canReject)
                    return ServiceResult<EmployeeRequest>.Failure("You don't have permission to reject this request");

                request.Status = "Rejected";
                request.RejectionReason = reason;

                await _context.SaveChangesAsync();

                // Send rejection notifications
                await SendRejectionNotificationsAsync(request, rejector, reason);

                await transaction.CommitAsync();

                return ServiceResult<EmployeeRequest>.Success(request);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeRequest>.Failure($"Failed to reject request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<EmployeeRequest>>> GetPendingRequestsForUserAsync(int userId, string userRole)
        {
            try
            {
                var query = _context.EmployeeRequests
                    .Include(r => r.Requester)
                    .ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee)
                    .ThenInclude(te => te.User)
                    .Where(r => r.Status == "Pending" || r.Status == "ManagerApproved");

                // Filter based on user role and permissions
                if (userRole == "HR" || userRole == "Admin")
                {
                    // HR and Admin can see all pending requests
                }
                else if (userRole == "Manager")
                {
                    // Managers can see requests for their direct reports
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
                    // Regular employees can only see their own requests
                    var employeeId = await _context.Employees
                        .Where(e => e.UserId == userId)
                        .Select(e => e.Id)
                        .FirstOrDefaultAsync();

                    query = query.Where(r => r.RequesterId == employeeId);
                }

                var requests = await query
                    .OrderByDescending(r => r.RequestDate)
                    .ToListAsync();

                return ServiceResult<List<EmployeeRequest>>.Success(requests);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EmployeeRequest>>.Failure($"Failed to get pending requests: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<EmployeeRequest>>> GetRequestsByRequesterAsync(int requesterId)
        {
            try
            {
                var requests = await _context.EmployeeRequests
                    .Include(r => r.TargetEmployee)
                    .ThenInclude(te => te.User)
                    .Include(r => r.ApprovedByManager)
                    .ThenInclude(am => am.User)
                    .Include(r => r.ApprovedByHR)
                    .ThenInclude(ah => ah.User)
                    .Where(r => r.RequesterId == requesterId)
                    .OrderByDescending(r => r.RequestDate)
                    .ToListAsync();

                return ServiceResult<List<EmployeeRequest>>.Success(requests);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EmployeeRequest>>.Failure($"Failed to get requests: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeRequest>> GetRequestByIdAsync(int requestId)
        {
            try
            {
                var request = await _context.EmployeeRequests
                    .Include(r => r.Requester)
                    .ThenInclude(r => r.User)
                    .Include(r => r.TargetEmployee)
                    .ThenInclude(te => te.User)
                    .Include(r => r.ApprovedByManager)
                    .ThenInclude(am => am.User)
                    .Include(r => r.ApprovedByHR)
                    .ThenInclude(ah => ah.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return ServiceResult<EmployeeRequest>.Failure("Request not found");

                return ServiceResult<EmployeeRequest>.Success(request);
            }
            catch (Exception ex)
            {
                return ServiceResult<EmployeeRequest>.Failure($"Failed to get request: {ex.Message}");
            }
        }

        #region Private Notification Methods

        private async Task SendRequestNotificationsAsync(EmployeeRequest request)
        {
            string requesterName = $"{request.Requester.FirstName} {request.Requester.LastName}";
            string requestTitle = GetRequestTitle(request.RequestType);

            switch (request.Status)
            {
                case "Pending":
                    // Notify manager first
                    if (request.TargetEmployee?.ManagerId != null || request.Requester.ManagerId != null)
                    {
                        int targetEmployeeId = request.TargetEmployeeId ?? request.RequesterId;
                        await _notificationService.NotifyManagerAsync(
                            targetEmployeeId,
                            $"New {requestTitle} Request",
                            $"{requesterName} has submitted a {requestTitle.ToLower()} request that requires your approval",
                            request.RequestType,
                            request.Id,
                            request.RequesterId
                        );
                    }
                    else
                    {
                        // No manager, send directly to HR
                        await _notificationService.NotifyHRAsync(
                            $"New {requestTitle} Request",
                            $"{requesterName} has submitted a {requestTitle.ToLower()} request that requires approval",
                            request.RequestType,
                            request.Id,
                            request.RequesterId
                        );
                    }
                    break;

                case "ManagerApproved":
                    // Notify HR for final approval
                    await _notificationService.NotifyHRAsync(
                        $"{requestTitle} Request - Manager Approved",
                        $"A {requestTitle.ToLower()} request from {requesterName} has been approved by their manager and awaits HR approval",
                        request.RequestType,
                        request.Id
                    );
                    break;

                case "AutoApproved":
                    // Notify requester of auto-approval
                    await _notificationService.NotifyAsync(
                        request.Requester.User.Id,
                        $"{requestTitle} Request Approved",
                        $"Your {requestTitle.ToLower()} request has been automatically approved",
                        request.RequestType,
                        request.Id
                    );
                    break;
            }
        }

        private async Task SendApprovalNotificationsAsync(EmployeeRequest request, Employee approver, bool isManagerApproval, bool isHRApproval)
        {
            string requestTitle = GetRequestTitle(request.RequestType);
            string approverName = $"{approver.FirstName} {approver.LastName}";

            if (isManagerApproval)
            {
                // Notify requester of manager approval
                await _notificationService.NotifyAsync(
                    request.Requester.User.Id,
                    $"{requestTitle} Request - Manager Approved",
                    $"Your {requestTitle.ToLower()} request has been approved by {approverName} and is now awaiting HR approval",
                    request.RequestType,
                    request.Id
                );
            }
            else if (isHRApproval)
            {
                // Notify requester of final approval
                await _notificationService.NotifyAsync(
                    request.Requester.User.Id,
                    $"{requestTitle} Request Approved",
                    $"Your {requestTitle.ToLower()} request has been fully approved by {approverName}",
                    request.RequestType,
                    request.Id
                );

                // If there was a target employee different from requester, notify them too
                if (request.TargetEmployee != null && request.TargetEmployee.Id != request.RequesterId)
                {
                    await _notificationService.NotifyAsync(
                        request.TargetEmployee.User.Id,
                        $"{requestTitle} Request Approved",
                        $"A {requestTitle.ToLower()} request concerning you has been approved",
                        request.RequestType,
                        request.Id
                    );
                }
            }
        }

        private async Task SendRejectionNotificationsAsync(EmployeeRequest request, Employee rejector, string reason)
        {
            string requestTitle = GetRequestTitle(request.RequestType);
            string rejectorName = $"{rejector.FirstName} {rejector.LastName}";

            // Notify requester of rejection
            await _notificationService.NotifyAsync(
                request.Requester.User.Id,
                $"{requestTitle} Request Rejected",
                $"Your {requestTitle.ToLower()} request has been rejected by {rejectorName}. Reason: {reason}",
                request.RequestType,
                request.Id
            );
        }

        private string GetRequestTitle(string requestType)
        {
            return requestType switch
            {
                "Promotion" => "Promotion",
                "DepartmentChange" => "Department Change",
                "Training" => "Training",
                "LeaveRequest" => "Leave Request",
                "SalaryReview" => "Salary Review",
                _ => "Employee Request"
            };
        }

        #endregion
    }
}
