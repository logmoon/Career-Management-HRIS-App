using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface IDepartmentService
    {
        Task<ServiceResult<List<Department>>> GetAllDepartmentsAsync(bool activeOnly = true);
        Task<ServiceResult<Department>> GetDepartmentByIdAsync(int id);
        Task<ServiceResult<Department>> CreateDepartmentAsync(CreateDepartmentDto dto, int createdByUserId);
        Task<ServiceResult<Department>> UpdateDepartmentAsync(int id, UpdateDepartmentDto dto, int updatedByUserId);
        Task<ServiceResult<bool>> DeactivateDepartmentAsync(int id, int deactivatedByUserId);
        Task<ServiceResult<List<Employee>>> GetDepartmentEmployeesAsync(int departmentId);
        Task<ServiceResult<Department>> AssignHeadOfDepartmentAsync(int departmentId, int employeeId, int assignedByUserId);
        Task<ServiceResult<List<Department>>> GetDepartmentsWithStatsAsync();
    }

    public class DepartmentService : IDepartmentService
    {
        private readonly CareerManagementDbContext _context;

        public DepartmentService(CareerManagementDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<List<Department>>> GetAllDepartmentsAsync(bool activeOnly = true)
        {
            try
            {
                var query = _context.Departments
                    .Include(d => d.HeadOfDepartment)
                    .ThenInclude(h => h.User)
                    .AsQueryable();

                if (activeOnly)
                {
                    query = query.Where(d => d.IsActive);
                }

                var departments = await query
                    .OrderBy(d => d.Name)
                    .ToListAsync();

                return ServiceResult<List<Department>>.Success(departments);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Department>>.Failure($"Failed to get departments: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Department>> GetDepartmentByIdAsync(int id)
        {
            try
            {
                var department = await _context.Departments
                    .Include(d => d.HeadOfDepartment)
                    .ThenInclude(h => h.User)
                    .Include(d => d.Employees)
                    .ThenInclude(e => e.User)
                    .Include(d => d.Positions)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (department == null)
                    return ServiceResult<Department>.Failure("Department not found");

                return ServiceResult<Department>.Success(department);
            }
            catch (Exception ex)
            {
                return ServiceResult<Department>.Failure($"Failed to get department: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Department>> CreateDepartmentAsync(CreateDepartmentDto dto, int createdByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate creator permissions
                var creator = await _context.Users.FindAsync(createdByUserId);
                if (creator == null || (creator.Role != "Admin" && creator.Role != "HR"))
                {
                    return ServiceResult<Department>.Failure("Insufficient permissions to create department");
                }

                // Check if department name already exists
                var existingDept = await _context.Departments
                    .FirstOrDefaultAsync(d => d.Name.ToLower() == dto.Name.ToLower());

                if (existingDept != null)
                    return ServiceResult<Department>.Failure("Department with this name already exists");

                var department = new Department
                {
                    Name = dto.Name,
                    Description = dto.Description ?? string.Empty,
                    IsActive = true
                };

                _context.Departments.Add(department);
                await _context.SaveChangesAsync();

                // If head of department is specified, assign them
                if (dto.HeadOfDepartmentId.HasValue)
                {
                    var headResult = await AssignHeadOfDepartmentInternalAsync(
                        department.Id, dto.HeadOfDepartmentId.Value, createdByUserId);

                    if (!headResult.IsSuccess)
                    {
                        await transaction.RollbackAsync();
                        return ServiceResult<Department>.Failure(headResult.ErrorMessage);
                    }
                }

                await transaction.CommitAsync();

                // Reload with includes
                var createdDepartment = await GetDepartmentByIdAsync(department.Id);
                return createdDepartment;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Department>.Failure($"Failed to create department: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Department>> UpdateDepartmentAsync(int id, UpdateDepartmentDto dto, int updatedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate updater permissions
                var updater = await _context.Users.FindAsync(updatedByUserId);
                if (updater == null || (updater.Role != "Admin" && updater.Role != "HR"))
                {
                    return ServiceResult<Department>.Failure("Insufficient permissions to update department");
                }

                var department = await _context.Departments.FindAsync(id);
                if (department == null)
                    return ServiceResult<Department>.Failure("Department not found");

                // Check if new name conflicts with existing department
                if (!string.IsNullOrEmpty(dto.Name) && dto.Name != department.Name)
                {
                    var existingDept = await _context.Departments
                        .FirstOrDefaultAsync(d => d.Name.ToLower() == dto.Name.ToLower() && d.Id != id);

                    if (existingDept != null)
                        return ServiceResult<Department>.Failure("Department with this name already exists");

                    department.Name = dto.Name;
                }

                if (dto.Description != null)
                    department.Description = dto.Description;

                if (dto.IsActive.HasValue)
                    department.IsActive = dto.IsActive.Value;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Reload with includes
                var updatedDepartment = await GetDepartmentByIdAsync(id);
                return updatedDepartment;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Department>.Failure($"Failed to update department: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> DeactivateDepartmentAsync(int id, int deactivatedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate permissions
                var deactivator = await _context.Users.FindAsync(deactivatedByUserId);
                if (deactivator == null || deactivator.Role != "Admin")
                {
                    return ServiceResult<bool>.Failure("Only administrators can deactivate departments");
                }

                var department = await _context.Departments
                    .Include(d => d.Employees)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (department == null)
                    return ServiceResult<bool>.Failure("Department not found");

                if (department.Name == "Pending Assignment")
                    return ServiceResult<bool>.Failure("Cannot deactivate the 'Pending Assignment' department");

                // Check if department has active employees
                if (department.Employees.Any())
                {
                    return ServiceResult<bool>.Failure("Cannot deactivate department with active employees. Please reassign employees first.");
                }

                department.IsActive = false;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<bool>.Failure($"Failed to deactivate department: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Employee>>> GetDepartmentEmployeesAsync(int departmentId)
        {
            try
            {
                var employees = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Manager)
                    .ThenInclude(m => m.User)
                    .Where(e => e.DepartmentId == departmentId)
                    .OrderBy(e => e.LastName)
                    .ThenBy(e => e.FirstName)
                    .ToListAsync();

                return ServiceResult<List<Employee>>.Success(employees);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Employee>>.Failure($"Failed to get department employees: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Department>> AssignHeadOfDepartmentAsync(int departmentId, int employeeId, int assignedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var result = await AssignHeadOfDepartmentInternalAsync(departmentId, employeeId, assignedByUserId);
                if (!result.IsSuccess)
                {
                    await transaction.RollbackAsync();
                    return result;
                }

                await transaction.CommitAsync();
                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Department>.Failure($"Failed to assign head of department: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Department>>> GetDepartmentsWithStatsAsync()
        {
            try
            {
                var departments = await _context.Departments
                    .Include(d => d.HeadOfDepartment)
                    .ThenInclude(h => h.User)
                    .Where(d => d.IsActive)
                    .Select(d => new
                    {
                        Department = d,
                        EmployeeCount = d.Employees.Count(),
                        PositionCount = d.Positions.Count()
                    })
                    .OrderBy(d => d.Department.Name)
                    .ToListAsync();

                var departmentList = departments.Select(d =>
                {
                    var dept = d.Department;
                    // Could add custom properties here for stats if needed
                    return dept;
                }).ToList();

                return ServiceResult<List<Department>>.Success(departmentList);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Department>>.Failure($"Failed to get department statistics: {ex.Message}");
            }
        }

        #region Private Methods

        private async Task<ServiceResult<Department>> AssignHeadOfDepartmentInternalAsync(int departmentId, int employeeId, int assignedByUserId)
        {
            // Validate permissions
            var assigner = await _context.Users.FindAsync(assignedByUserId);
            if (assigner == null || (assigner.Role != "Admin" && assigner.Role != "HR"))
            {
                return ServiceResult<Department>.Failure("Insufficient permissions to assign head of department");
            }

            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null)
                return ServiceResult<Department>.Failure("Department not found");

            var employee = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
                return ServiceResult<Department>.Failure("Employee not found");

            // Verify employee is in the same department
            if (employee.DepartmentId != departmentId)
                return ServiceResult<Department>.Failure("Employee must be in the department to be assigned as head");

            var previousHeadId = department.HeadOfDepartmentId;
            department.HeadOfDepartmentId = employeeId;

            await _context.SaveChangesAsync();

            // Notify previous head if there was one
            if (previousHeadId.HasValue && previousHeadId != employeeId)
            {
                var previousHead = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == previousHeadId.Value);
            }

            // Notify department employees
            var departmentEmployees = await _context.Employees
                .Include(e => e.User)
                .Where(e => e.DepartmentId == departmentId && e.Id != employeeId)
                .ToListAsync();

            // Reload with includes
            var updatedDepartment = await GetDepartmentByIdAsync(departmentId);
            return updatedDepartment;
        }

        #endregion
    }

    // DTO Classes
    public class CreateDepartmentDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? HeadOfDepartmentId { get; set; }
    }

    public class UpdateDepartmentDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }
}