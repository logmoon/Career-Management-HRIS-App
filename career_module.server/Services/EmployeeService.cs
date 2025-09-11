using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface IEmployeeService
    {
        Task<ServiceResult<List<Employee>>> GetAllEmployeesAsync(string? department = null, string? role = null, int page = 1, int pageSize = 50);
        Task<ServiceResult<Employee>> GetEmployeeByIdAsync(int id);
        Task<ServiceResult<Employee>> GetEmployeeByUserIdAsync(int userId);
        Task<ServiceResult<Employee>> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto);
        Task<ServiceResult<Employee>> ChangeDepartmentAsync(int employeeId, int newDepartmentId, int changedByUserId);
        Task<ServiceResult<Employee>> ChangeManagerAsync(int employeeId, int? newManagerId, int changedByUserId);
        Task<ServiceResult<List<Employee>>> GetDirectReportsAsync(int employeeId);
        Task<ServiceResult<List<Employee>>> GetOrganizationHierarchyAsync();
        Task<ServiceResult<List<Employee>>> SearchEmployeesAsync(string searchTerm);
    }

    public class EmployeeService : IEmployeeService
    {
        private readonly CareerManagementDbContext _context;
        private readonly INotificationService _notificationService;

        public EmployeeService(CareerManagementDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult<List<Employee>>> GetAllEmployeesAsync(string? department = null, string? role = null, int page = 1, int pageSize = 50)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 50;

                var query = _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Manager)
                    .ThenInclude(m => m.User)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(department))
                {
                    query = query.Where(e => e.Department.Name.Contains(department));
                }

                if (!string.IsNullOrEmpty(role))
                {
                    query = query.Where(e => e.User.Role == role);
                }

                var employees = await query
                    .OrderBy(e => e.Department.Name)
                    .ThenBy(e => e.LastName)
                    .ThenBy(e => e.FirstName)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return ServiceResult<List<Employee>>.Success(employees);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Employee>>.Failure($"Failed to get employees: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Employee>> GetEmployeeByIdAsync(int id)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Manager)
                    .ThenInclude(m => m.User)
                    .Include(e => e.DirectReports)
                    .ThenInclude(dr => dr.User)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(e => e.EmployeeExperiences)
                    .Include(e => e.EmployeeEducations)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (employee == null)
                    return ServiceResult<Employee>.Failure("Employee not found");

                return ServiceResult<Employee>.Success(employee);
            }
            catch (Exception ex)
            {
                return ServiceResult<Employee>.Failure($"Failed to get employee: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Employee>> GetEmployeeByUserIdAsync(int userId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Manager)
                    .ThenInclude(m => m.User)
                    .Include(e => e.DirectReports)
                    .ThenInclude(dr => dr.User)
                    .FirstOrDefaultAsync(e => e.UserId == userId);

                if (employee == null)
                    return ServiceResult<Employee>.Failure("Employee not found for this user");

                return ServiceResult<Employee>.Success(employee);
            }
            catch (Exception ex)
            {
                return ServiceResult<Employee>.Failure($"Failed to get employee by user ID: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Employee>> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (employee == null)
                    return ServiceResult<Employee>.Failure("Employee not found");

                // Update basic info
                if (!string.IsNullOrEmpty(dto.FirstName))
                    employee.FirstName = dto.FirstName;

                if (!string.IsNullOrEmpty(dto.LastName))
                    employee.LastName = dto.LastName;

                if (!string.IsNullOrEmpty(dto.Phone))
                    employee.Phone = dto.Phone;

                if (dto.Salary.HasValue)
                    employee.Salary = dto.Salary;

                if (dto.HireDate.HasValue)
                    employee.HireDate = dto.HireDate.Value;

                employee.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Reload with includes
                var updatedEmployee = await GetEmployeeByIdAsync(id);
                return updatedEmployee;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Employee>.Failure($"Failed to update employee: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Employee>> ChangeDepartmentAsync(int employeeId, int newDepartmentId, int changedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<Employee>.Failure("Employee not found");

                var newDepartment = await _context.Departments
                    .FirstOrDefaultAsync(d => d.Id == newDepartmentId && d.IsActive);

                if (newDepartment == null)
                    return ServiceResult<Employee>.Failure("New department not found or inactive");

                var changedBy = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == changedByUserId);

                if (changedBy == null)
                    return ServiceResult<Employee>.Failure("User making change not found");

                // Check permissions (only HR and Admin can change departments)
                if (changedBy.User.Role != "HR" && changedBy.User.Role != "Admin")
                    return ServiceResult<Employee>.Failure("Insufficient permissions to change department");

                var oldDepartment = employee.Department;
                employee.DepartmentId = newDepartmentId;
                employee.UpdatedAt = DateTime.UtcNow;

                // If moving out of "Pending Assignment", clear manager as they might not be in new dept
                if (oldDepartment.Name == "Pending Assignment")
                {
                    employee.ManagerId = null;
                }

                await _context.SaveChangesAsync();

                // Send notifications
                await _notificationService.NotifyAsync(
                    employee.User.Id,
                    "Department Assignment",
                    $"You have been assigned to the {newDepartment.Name} department by {changedBy.FirstName} {changedBy.LastName}",
                    "DepartmentChange",
                    employeeId
                );

                await transaction.CommitAsync();

                // Reload with includes
                var updatedEmployee = await GetEmployeeByIdAsync(employeeId);
                return updatedEmployee;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Employee>.Failure($"Failed to change department: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Employee>> ChangeManagerAsync(int employeeId, int? newManagerId, int changedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Manager)
                    .ThenInclude(m => m.User)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<Employee>.Failure("Employee not found");

                var changedBy = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == changedByUserId);

                if (changedBy == null)
                    return ServiceResult<Employee>.Failure("User making change not found");

                // Check permissions
                if (changedBy.User.Role != "HR" && changedBy.User.Role != "Admin" && changedBy.Id != employee.ManagerId)
                    return ServiceResult<Employee>.Failure("Insufficient permissions to change manager");

                Employee? newManager = null;
                if (newManagerId.HasValue)
                {
                    newManager = await _context.Employees
                        .Include(e => e.User)
                        .FirstOrDefaultAsync(e => e.Id == newManagerId.Value);

                    if (newManager == null)
                        return ServiceResult<Employee>.Failure("New manager not found");

                    // Prevent circular management (employee can't be their own manager or report to their direct report)
                    if (newManagerId.Value == employeeId)
                        return ServiceResult<Employee>.Failure("Employee cannot be their own manager");

                    var isCircular = await IsCircularManagementAsync(employeeId, newManagerId.Value);
                    if (isCircular)
                        return ServiceResult<Employee>.Failure("This would create a circular management structure");
                }

                var oldManager = employee.Manager;
                employee.ManagerId = newManagerId;
                employee.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send notifications
                if (newManager != null)
                {
                    await _notificationService.NotifyAsync(
                        employee.User.Id,
                        "Manager Assignment",
                        $"Your manager has been changed to {newManager.FirstName} {newManager.LastName}",
                        "ManagerChange",
                        employeeId
                    );

                    await _notificationService.NotifyAsync(
                        newManager.User.Id,
                        "New Direct Report",
                        $"{employee.FirstName} {employee.LastName} now reports to you",
                        "DirectReportAdded",
                        employeeId
                    );
                }

                await transaction.CommitAsync();

                // Reload with includes
                var updatedEmployee = await GetEmployeeByIdAsync(employeeId);
                return updatedEmployee;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Employee>.Failure($"Failed to change manager: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Employee>>> GetDirectReportsAsync(int employeeId)
        {
            try
            {
                var directReports = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.CurrentPosition)
                    .Where(e => e.ManagerId == employeeId)
                    .OrderBy(e => e.LastName)
                    .ThenBy(e => e.FirstName)
                    .ToListAsync();

                return ServiceResult<List<Employee>>.Success(directReports);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Employee>>.Failure($"Failed to get direct reports: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Employee>>> GetOrganizationHierarchyAsync()
        {
            try
            {
                var allEmployees = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Manager)
                    .ThenInclude(m => m.User)
                    .Include(e => e.DirectReports)
                    .OrderBy(e => e.Department.Name)
                    .ThenBy(e => e.LastName)
                    .ToListAsync();

                return ServiceResult<List<Employee>>.Success(allEmployees);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Employee>>.Failure($"Failed to get organization hierarchy: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Employee>>> SearchEmployeesAsync(string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                    return ServiceResult<List<Employee>>.Success(new List<Employee>());

                var employees = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.CurrentPosition)
                    .Where(e =>
                        e.FirstName.Contains(searchTerm) ||
                        e.LastName.Contains(searchTerm) ||
                        e.User.Email.Contains(searchTerm) ||
                        e.Department.Name.Contains(searchTerm) ||
                        (e.CurrentPosition != null && e.CurrentPosition.Title.Contains(searchTerm)))
                    .OrderBy(e => e.LastName)
                    .ThenBy(e => e.FirstName)
                    .Take(50) // Limit search results
                    .ToListAsync();

                return ServiceResult<List<Employee>>.Success(employees);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Employee>>.Failure($"Failed to search employees: {ex.Message}");
            }
        }

        #region Private Methods

        private async Task<bool> IsCircularManagementAsync(int employeeId, int potentialManagerId)
        {
            // Check if the potential manager reports up to the employee (directly or indirectly)
            var currentManagerId = potentialManagerId;
            var visited = new HashSet<int>();

            while (currentManagerId > 0 && !visited.Contains(currentManagerId))
            {
                if (currentManagerId == employeeId)
                    return true; // Circular reference found

                visited.Add(currentManagerId);

                var tmpManagerId = await _context.Employees
                    .Where(e => e.Id == currentManagerId)
                    .Select(e => e.ManagerId)
                    .FirstOrDefaultAsync();

                if (tmpManagerId.HasValue)
                    currentManagerId = tmpManagerId.Value;
                else
                    break;
            }

            return false; // No circular reference
        }

        #endregion
    }

    // DTO Classes
    public class UpdateEmployeeDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public decimal? Salary { get; set; }
        public DateTime? HireDate { get; set; }
    }
}