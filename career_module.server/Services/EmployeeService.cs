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

        // Employee Experience methods
        Task<ServiceResult<List<EmployeeExperience>>> GetEmployeeExperiencesAsync(int employeeId);
        Task<ServiceResult<EmployeeExperience>> AddEmployeeExperienceAsync(int employeeId, CreateExperienceDto dto, int requestingUserId);
        Task<ServiceResult<EmployeeExperience>> UpdateEmployeeExperienceAsync(int experienceId, UpdateExperienceDto dto, int requestingUserId);
        Task<ServiceResult<bool>> DeleteEmployeeExperienceAsync(int experienceId, int requestingUserId);

        // Employee Education methods
        Task<ServiceResult<List<EmployeeEducation>>> GetEmployeeEducationsAsync(int employeeId);
        Task<ServiceResult<EmployeeEducation>> AddEmployeeEducationAsync(int employeeId, CreateEducationDto dto, int requestingUserId);
        Task<ServiceResult<EmployeeEducation>> UpdateEmployeeEducationAsync(int educationId, UpdateEducationDto dto, int requestingUserId);
        Task<ServiceResult<bool>> DeleteEmployeeEducationAsync(int educationId, int requestingUserId);
    }

    public class EmployeeService : IEmployeeService
    {
        private readonly CareerManagementDbContext _context;

        public EmployeeService(CareerManagementDbContext context)
        {
            _context = context;
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

        #region Employee Experience Methods

        public async Task<ServiceResult<List<EmployeeExperience>>> GetEmployeeExperiencesAsync(int employeeId)
        {
            try
            {
                var experiences = await _context.EmployeeExperiences
                    .Where(e => e.EmployeeId == employeeId)
                    .OrderByDescending(e => e.StartDate)
                    .ToListAsync();

                return ServiceResult<List<EmployeeExperience>>.Success(experiences);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EmployeeExperience>>.Failure($"Failed to get employee experiences: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeExperience>> AddEmployeeExperienceAsync(int employeeId, CreateExperienceDto dto, int requestingUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Check if employee exists
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<EmployeeExperience>.Failure("Employee not found");

                // Check permissions
                var requestingUser = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == requestingUserId);

                if (requestingUser == null)
                    return ServiceResult<EmployeeExperience>.Failure("Requesting user not found");

                var canEdit = CanEditEmployeeProfile(requestingUser.User.Role, requestingUser.Id, employeeId);
                if (!canEdit)
                    return ServiceResult<EmployeeExperience>.Failure("Insufficient permissions to add experience");

                // Validate dates
                if (dto.EndDate.HasValue && dto.EndDate.Value < dto.StartDate)
                    return ServiceResult<EmployeeExperience>.Failure("End date cannot be before start date");

                var experience = new EmployeeExperience
                {
                    EmployeeId = employeeId,
                    JobTitle = dto.JobTitle,
                    Company = dto.Company,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    Description = dto.Description ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                _context.EmployeeExperiences.Add(experience);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<EmployeeExperience>.Success(experience);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeExperience>.Failure($"Failed to add experience: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeExperience>> UpdateEmployeeExperienceAsync(int experienceId, UpdateExperienceDto dto, int requestingUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var experience = await _context.EmployeeExperiences
                    .Include(e => e.Employee)
                    .ThenInclude(emp => emp.User)
                    .FirstOrDefaultAsync(e => e.Id == experienceId);

                if (experience == null)
                    return ServiceResult<EmployeeExperience>.Failure("Experience not found");

                // Check permissions
                var requestingUser = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == requestingUserId);

                if (requestingUser == null)
                    return ServiceResult<EmployeeExperience>.Failure("Requesting user not found");

                var canEdit = CanEditEmployeeProfile(requestingUser.User.Role, requestingUser.Id, experience.EmployeeId);
                if (!canEdit)
                    return ServiceResult<EmployeeExperience>.Failure("Insufficient permissions to update experience");

                // Update fields
                if (!string.IsNullOrEmpty(dto.JobTitle))
                    experience.JobTitle = dto.JobTitle;

                if (!string.IsNullOrEmpty(dto.Company))
                    experience.Company = dto.Company;

                if (dto.StartDate.HasValue)
                    experience.StartDate = dto.StartDate.Value;

                if (dto.EndDate.HasValue)
                    experience.EndDate = dto.EndDate.Value;
                else if (dto.ClearEndDate)
                    experience.EndDate = null;

                if (dto.Description != null)
                    experience.Description = dto.Description;

                // Validate dates
                if (experience.EndDate.HasValue && experience.EndDate.Value < experience.StartDate)
                    return ServiceResult<EmployeeExperience>.Failure("End date cannot be before start date");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<EmployeeExperience>.Success(experience);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeExperience>.Failure($"Failed to update experience: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> DeleteEmployeeExperienceAsync(int experienceId, int requestingUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var experience = await _context.EmployeeExperiences
                    .FirstOrDefaultAsync(e => e.Id == experienceId);

                if (experience == null)
                    return ServiceResult<bool>.Failure("Experience not found");

                // Check permissions
                var requestingUser = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == requestingUserId);

                if (requestingUser == null)
                    return ServiceResult<bool>.Failure("Requesting user not found");

                var canEdit = CanEditEmployeeProfile(requestingUser.User.Role, requestingUser.Id, experience.EmployeeId);
                if (!canEdit)
                    return ServiceResult<bool>.Failure("Insufficient permissions to delete experience");

                _context.EmployeeExperiences.Remove(experience);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<bool>.Failure($"Failed to delete experience: {ex.Message}");
            }
        }

        #endregion

        #region Employee Education Methods

        public async Task<ServiceResult<List<EmployeeEducation>>> GetEmployeeEducationsAsync(int employeeId)
        {
            try
            {
                var educations = await _context.EmployeeEducations
                    .Where(e => e.EmployeeId == employeeId)
                    .OrderByDescending(e => e.GraduationYear ?? 0)
                    .ToListAsync();

                return ServiceResult<List<EmployeeEducation>>.Success(educations);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EmployeeEducation>>.Failure($"Failed to get employee educations: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeEducation>> AddEmployeeEducationAsync(int employeeId, CreateEducationDto dto, int requestingUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Check if employee exists
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<EmployeeEducation>.Failure("Employee not found");

                // Check permissions
                var requestingUser = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == requestingUserId);

                if (requestingUser == null)
                    return ServiceResult<EmployeeEducation>.Failure("Requesting user not found");

                var canEdit = CanEditEmployeeProfile(requestingUser.User.Role, requestingUser.Id, employeeId);
                if (!canEdit)
                    return ServiceResult<EmployeeEducation>.Failure("Insufficient permissions to add education");

                // Validate graduation year
                if (dto.GraduationYear.HasValue)
                {
                    var currentYear = DateTime.UtcNow.Year;
                    if (dto.GraduationYear.Value < 1900 || dto.GraduationYear.Value > currentYear + 10)
                        return ServiceResult<EmployeeEducation>.Failure("Invalid graduation year");
                }

                var education = new EmployeeEducation
                {
                    EmployeeId = employeeId,
                    Degree = dto.Degree,
                    Institution = dto.Institution,
                    GraduationYear = dto.GraduationYear,
                    FieldOfStudy = dto.FieldOfStudy ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                _context.EmployeeEducations.Add(education);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<EmployeeEducation>.Success(education);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeEducation>.Failure($"Failed to add education: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeEducation>> UpdateEmployeeEducationAsync(int educationId, UpdateEducationDto dto, int requestingUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var education = await _context.EmployeeEducations
                    .Include(e => e.Employee)
                    .ThenInclude(emp => emp.User)
                    .FirstOrDefaultAsync(e => e.Id == educationId);

                if (education == null)
                    return ServiceResult<EmployeeEducation>.Failure("Education not found");

                // Check permissions
                var requestingUser = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == requestingUserId);

                if (requestingUser == null)
                    return ServiceResult<EmployeeEducation>.Failure("Requesting user not found");

                var canEdit = CanEditEmployeeProfile(requestingUser.User.Role, requestingUser.Id, education.EmployeeId);
                if (!canEdit)
                    return ServiceResult<EmployeeEducation>.Failure("Insufficient permissions to update education");

                // Update fields
                if (!string.IsNullOrEmpty(dto.Degree))
                    education.Degree = dto.Degree;

                if (!string.IsNullOrEmpty(dto.Institution))
                    education.Institution = dto.Institution;

                if (dto.GraduationYear.HasValue)
                {
                    var currentYear = DateTime.UtcNow.Year;
                    if (dto.GraduationYear.Value < 1900 || dto.GraduationYear.Value > currentYear + 10)
                        return ServiceResult<EmployeeEducation>.Failure("Invalid graduation year");

                    education.GraduationYear = dto.GraduationYear.Value;
                }

                if (dto.FieldOfStudy != null)
                    education.FieldOfStudy = dto.FieldOfStudy;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<EmployeeEducation>.Success(education);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<EmployeeEducation>.Failure($"Failed to update education: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> DeleteEmployeeEducationAsync(int educationId, int requestingUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var education = await _context.EmployeeEducations
                    .FirstOrDefaultAsync(e => e.Id == educationId);

                if (education == null)
                    return ServiceResult<bool>.Failure("Education not found");

                // Check permissions
                var requestingUser = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == requestingUserId);

                if (requestingUser == null)
                    return ServiceResult<bool>.Failure("Requesting user not found");

                var canEdit = CanEditEmployeeProfile(requestingUser.User.Role, requestingUser.Id, education.EmployeeId);
                if (!canEdit)
                    return ServiceResult<bool>.Failure("Insufficient permissions to delete education");

                _context.EmployeeEducations.Remove(education);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<bool>.Failure($"Failed to delete education: {ex.Message}");
            }
        }

        #endregion

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

        private static bool CanEditEmployeeProfile(string userRole, int requestingEmployeeId, int targetEmployeeId)
        {
            // HR and Admin can edit anyone's profile
            if (userRole == "HR" || userRole == "Admin")
                return true;

            // Users can edit their own profile
            return requestingEmployeeId == targetEmployeeId;
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

    // Experience DTOs
    public class CreateExperienceDto
    {
        public string JobTitle { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateExperienceDto
    {
        public string? JobTitle { get; set; }
        public string? Company { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool ClearEndDate { get; set; } = false;
        public string? Description { get; set; }
    }

    // Education DTOs
    public class CreateEducationDto
    {
        public string Degree { get; set; } = string.Empty;
        public string Institution { get; set; } = string.Empty;
        public int? GraduationYear { get; set; }
        public string? FieldOfStudy { get; set; }
    }

    public class UpdateEducationDto
    {
        public string? Degree { get; set; }
        public string? Institution { get; set; }
        public int? GraduationYear { get; set; }
        public string? FieldOfStudy { get; set; }
    }
}