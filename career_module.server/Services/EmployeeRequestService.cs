using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface IEmployeeRequestFactory
    {
        EmployeeRequest? CreateRequest(string requestType);
        List<object> GetAvailableRequestTypes();
        T? CreateRequest<T>() where T : EmployeeRequest, new();
    }

    public class EmployeeRequestFactory : IEmployeeRequestFactory
    {
        public EmployeeRequest? CreateRequest(string requestType)
        {
            return requestType switch
            {
                "Promotion" => new PromotionRequest(),
                "DepartmentChange" => new DepartmentChangeRequest(),
                _ => null
            };
        }

        public T? CreateRequest<T>() where T : EmployeeRequest, new()
        {
            return new T();
        }

        public List<object> GetAvailableRequestTypes()
        {
            return new List<object>
            {
                new { Value = "Promotion", Label = "Promotion Request", Description = "Request a promotion to a higher position" },
                new { Value = "DepartmentChange", Label = "Department Change", Description = "Request to change department" }
            };
        }
    }

    public interface IEmployeeRequestService
    {
        Task<ServiceResult<EmployeeRequest>> CreateRequestAsync<T>(T requestData) where T : EmployeeRequest;
        Task<ServiceResult<bool>> CancelRequestAsync(int requestId);
        Task<ServiceResult<EmployeeRequest>> ApproveRequestAsync(int requestId, int approverId, string? notes = null);
        Task<ServiceResult<EmployeeRequest>> RejectRequestAsync(int requestId, int rejectorId, string reason);
        Task<ServiceResult<List<EmployeeRequest>>> GetPendingRequestsForUserAsync(int userId, string userRole);
        Task<ServiceResult<List<EmployeeRequest>>> GetRequestsByRequesterAsync(int requesterId);
        Task<ServiceResult<EmployeeRequest>> GetRequestByIdAsync(int requestId);

        // Service-specific methods for creating requests from other services
        Task<ServiceResult<PromotionRequest>> CreatePromotionRequestAsync(int requesterId, int targetEmployeeId, int careerPathId, decimal? proposedSalary = null, int? managerId = null, string? justification = null);
        Task<ServiceResult<DepartmentChangeRequest>> CreateDepartmentChangeRequestAsync(int requesterId, int targetEmployeeId, int newDepartmentId, int? newManagerId = null, string? reason = null);
    }

    public class EmployeeRequestService : IEmployeeRequestService
    {
        private readonly CareerManagementDbContext _context;
        private readonly IServiceProvider _serviceProvider;
        private readonly IEmployeeRequestFactory _requestFactory;

        public EmployeeRequestService(
            CareerManagementDbContext context,
            IServiceProvider serviceProvider,
            IEmployeeRequestFactory requestFactory)
        {
            _context = context;
            _serviceProvider = serviceProvider;
            _requestFactory = requestFactory;
        }

        public async Task<ServiceResult<EmployeeRequest>> CreateRequestAsync<T>(T requestData) where T : EmployeeRequest
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Load requester with user info for role checking
                var requester = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == requestData.RequesterId);

                if (requester == null)
                    return ServiceResult<EmployeeRequest>.Failure("Requester not found");

                // Load target employee if specified
                Employee? targetEmployee = null;
                if (requestData.TargetEmployeeId.HasValue)
                {
                    targetEmployee = await _context.Employees
                        .Include(e => e.User)
                        .Include(e => e.Manager)
                        .FirstOrDefaultAsync(e => e.Id == requestData.TargetEmployeeId.Value);

                    if (targetEmployee == null)
                        return ServiceResult<EmployeeRequest>.Failure("Target employee not found");
                }

                // Set navigation properties
                requestData.Requester = requester;
                requestData.TargetEmployee = targetEmployee;

                // Set initial status based on requester role
                requestData.SetInitialStatus();

                _context.EmployeeRequests.Add(requestData);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return ServiceResult<EmployeeRequest>.Success(requestData);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeRequest>.Failure($"Failed to create request: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> CancelRequestAsync(int requestId)
        {
            try
            {
                var request = await _context.EmployeeRequests
                    .FirstOrDefaultAsync(er => er.Id == requestId);

                if (request == null)
                    return ServiceResult<bool>.Failure("Request not found");

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

                if (request.Status == "Pending")
                {
                    if (request.CanApproveAsManager(approverId))
                    {
                        request.Status = "ManagerApproved";
                        request.ApprovedByManagerId = approverId;
                        request.ManagerApprovalDate = DateTime.UtcNow;
                    }
                    else if (request.CanApproveAsHR(approverRole))
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
                    if (request.CanApproveAsHR(approverRole))
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

                // Add approval notes
                if (!string.IsNullOrEmpty(notes))
                {
                    request.Notes = string.IsNullOrEmpty(request.Notes)
                        ? $"Approval notes: {notes}"
                        : $"{request.Notes}\nApproval notes: {notes}";
                }

                // Execute the request if fully approved
                if (request.Status == "HRApproved")
                {
                    var executed = await request.ExecuteRequestAsync(_serviceProvider, approverId);
                    if (!executed)
                    {
                        return ServiceResult<EmployeeRequest>.Failure("Request approved but execution failed");
                    }
                }

                await _context.SaveChangesAsync();
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

        // Service-specific methods for creating requests from other services
        public async Task<ServiceResult<PromotionRequest>> CreatePromotionRequestAsync(int requesterId, int targetEmployeeId, int careerPathId, decimal? proposedSalary = null, int? managerId = null, string? justification = null)
        {
            var request = new PromotionRequest
            {
                RequesterId = requesterId,
                TargetEmployeeId = targetEmployeeId,
                CareerPathId = careerPathId,
                NewManagerId = managerId,
                ProposedSalary = proposedSalary,
                Justification = justification,
                EffectiveDate = DateTime.UtcNow.AddDays(30) // Default to 30 days from now
            };

            var result = await CreateRequestAsync(request);
            if (result.IsSuccess)
                return ServiceResult<PromotionRequest>.Success((PromotionRequest)result.Data!);

            return ServiceResult<PromotionRequest>.Failure(result.ErrorMessage!);
        }

        public async Task<ServiceResult<DepartmentChangeRequest>> CreateDepartmentChangeRequestAsync(int requesterId, int targetEmployeeId, int newDepartmentId, int? newManagerId = null, string? reason = null)
        {
            var request = new DepartmentChangeRequest
            {
                RequesterId = requesterId,
                TargetEmployeeId = targetEmployeeId,
                NewDepartmentId = newDepartmentId,
                NewManagerId = newManagerId,
                Reason = reason,
                EffectiveDate = DateTime.UtcNow.AddDays(14)
            };

            var result = await CreateRequestAsync(request);
            if (result.IsSuccess)
                return ServiceResult<DepartmentChangeRequest>.Success((DepartmentChangeRequest)result.Data!);

            return ServiceResult<DepartmentChangeRequest>.Failure(result.ErrorMessage!);
        }
    }
}