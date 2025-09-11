using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface IPositionService
    {
        Task<ServiceResult<List<Position>>> GetAllPositionsAsync(bool activeOnly = true, int? departmentId = null);
        Task<ServiceResult<Position>> GetPositionByIdAsync(int id);
        Task<ServiceResult<Position>> CreatePositionAsync(CreatePositionDto dto, int createdByUserId);
        Task<ServiceResult<Position>> UpdatePositionAsync(int id, UpdatePositionDto dto, int updatedByUserId);
        Task<ServiceResult<bool>> DeactivatePositionAsync(int id, int deactivatedByUserId);
        Task<ServiceResult<List<Employee>>> GetPositionEmployeesAsync(int positionId);
        Task<ServiceResult<List<Position>>> GetVacantKeyPositionsAsync();
        Task<ServiceResult<List<Position>>> GetPositionsByDepartmentAsync(int departmentId);
    }

    public class PositionService : IPositionService
    {
        private readonly CareerManagementDbContext _context;
        private readonly INotificationService _notificationService;

        public PositionService(CareerManagementDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult<List<Position>>> GetAllPositionsAsync(bool activeOnly = true, int? departmentId = null)
        {
            try
            {
                var query = _context.Positions
                    .Include(p => p.Department)
                    .Include(p => p.CurrentEmployees)
                    .ThenInclude(e => e.User)
                    .AsQueryable();

                if (activeOnly)
                {
                    query = query.Where(p => p.IsActive);
                }

                if (departmentId.HasValue)
                {
                    query = query.Where(p => p.DepartmentId == departmentId.Value);
                }

                var positions = await query
                    .OrderBy(p => p.Department.Name)
                    .ThenBy(p => p.Level)
                    .ThenBy(p => p.Title)
                    .ToListAsync();

                return ServiceResult<List<Position>>.Success(positions);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Position>>.Failure($"Failed to get positions: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Position>> GetPositionByIdAsync(int id)
        {
            try
            {
                var position = await _context.Positions
                    .Include(p => p.Department)
                    .Include(p => p.CurrentEmployees)
                    .ThenInclude(e => e.User)
                    .Include(p => p.SuccessionPlans)
                    .ThenInclude(sp => sp.Candidates)
                    .ThenInclude(c => c.Employee)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (position == null)
                    return ServiceResult<Position>.Failure("Position not found");

                return ServiceResult<Position>.Success(position);
            }
            catch (Exception ex)
            {
                return ServiceResult<Position>.Failure($"Failed to get position: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Position>> CreatePositionAsync(CreatePositionDto dto, int createdByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate creator permissions
                var creator = await _context.Users.FindAsync(createdByUserId);
                if (creator == null || (creator.Role != "Admin" && creator.Role != "HR"))
                {
                    return ServiceResult<Position>.Failure("Insufficient permissions to create position");
                }

                // Validate department exists
                var department = await _context.Departments.FindAsync(dto.DepartmentId);
                if (department == null || !department.IsActive)
                {
                    return ServiceResult<Position>.Failure("Department not found or inactive");
                }

                // Check for duplicate position titles in the same department
                var existingPosition = await _context.Positions
                    .FirstOrDefaultAsync(p => p.Title.ToLower() == dto.Title.ToLower() &&
                                             p.DepartmentId == dto.DepartmentId &&
                                             p.IsActive);

                if (existingPosition != null)
                    return ServiceResult<Position>.Failure("Position with this title already exists in the department");

                // Validate salary range
                if (dto.MinSalary.HasValue && dto.MaxSalary.HasValue && dto.MinSalary > dto.MaxSalary)
                    return ServiceResult<Position>.Failure("Minimum salary cannot be greater than maximum salary");

                var position = new Position
                {
                    Title = dto.Title,
                    DepartmentId = dto.DepartmentId,
                    Description = dto.Description ?? string.Empty,
                    MinSalary = dto.MinSalary,
                    MaxSalary = dto.MaxSalary,
                    Level = dto.Level ?? string.Empty,
                    IsKeyPosition = dto.IsKeyPosition,
                    IsActive = true
                };

                _context.Positions.Add(position);
                await _context.SaveChangesAsync();

                // Notify department head if exists
                if (department.HeadOfDepartmentId.HasValue)
                {
                    await _notificationService.NotifyAsync(
                        department.HeadOfDepartment!.User.Id,
                        "New Position Created",
                        $"A new position '{position.Title}' has been created in your department",
                        "PositionCreated",
                        position.Id
                    );
                }

                await transaction.CommitAsync();

                // Reload with includes
                var createdPosition = await GetPositionByIdAsync(position.Id);
                return createdPosition;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Position>.Failure($"Failed to create position: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Position>> UpdatePositionAsync(int id, UpdatePositionDto dto, int updatedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate updater permissions
                var updater = await _context.Users.FindAsync(updatedByUserId);
                if (updater == null || (updater.Role != "Admin" && updater.Role != "HR"))
                {
                    return ServiceResult<Position>.Failure("Insufficient permissions to update position");
                }

                var position = await _context.Positions
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (position == null)
                    return ServiceResult<Position>.Failure("Position not found");

                // Update fields
                if (!string.IsNullOrEmpty(dto.Title) && dto.Title != position.Title)
                {
                    // Check for duplicate titles in the same department
                    var existingPosition = await _context.Positions
                        .FirstOrDefaultAsync(p => p.Title.ToLower() == dto.Title.ToLower() &&
                                                 p.DepartmentId == position.DepartmentId &&
                                                 p.Id != id &&
                                                 p.IsActive);

                    if (existingPosition != null)
                        return ServiceResult<Position>.Failure("Position with this title already exists in the department");

                    position.Title = dto.Title;
                }

                if (dto.Description != null)
                    position.Description = dto.Description;

                if (dto.MinSalary.HasValue)
                    position.MinSalary = dto.MinSalary;

                if (dto.MaxSalary.HasValue)
                    position.MaxSalary = dto.MaxSalary;

                // Validate salary range
                if (position.MinSalary.HasValue && position.MaxSalary.HasValue &&
                    position.MinSalary > position.MaxSalary)
                    return ServiceResult<Position>.Failure("Minimum salary cannot be greater than maximum salary");

                if (!string.IsNullOrEmpty(dto.Level))
                    position.Level = dto.Level;

                if (dto.IsKeyPosition.HasValue)
                    position.IsKeyPosition = dto.IsKeyPosition.Value;

                if (dto.IsActive.HasValue)
                    position.IsActive = dto.IsActive.Value;

                position.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Reload with includes
                var updatedPosition = await GetPositionByIdAsync(id);
                return updatedPosition;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<Position>.Failure($"Failed to update position: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> DeactivatePositionAsync(int id, int deactivatedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate permissions
                var deactivator = await _context.Users.FindAsync(deactivatedByUserId);
                if (deactivator == null || (deactivator.Role != "Admin" && deactivator.Role != "HR"))
                {
                    return ServiceResult<bool>.Failure("Insufficient permissions to deactivate position");
                }

                var position = await _context.Positions
                    .Include(p => p.CurrentEmployees)
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (position == null)
                    return ServiceResult<bool>.Failure("Position not found");

                // Check if position has current employees
                if (position.CurrentEmployees.Any())
                {
                    return ServiceResult<bool>.Failure("Cannot deactivate position with current employees. Please reassign employees first.");
                }

                position.IsActive = false;
                position.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Notify department head
                if (position.Department.HeadOfDepartmentId.HasValue)
                {
                    await _notificationService.NotifyAsync(
                        position.Department.HeadOfDepartment!.User.Id,
                        "Position Deactivated",
                        $"The position '{position.Title}' has been deactivated",
                        "PositionDeactivated",
                        id
                    );
                }

                await transaction.CommitAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<bool>.Failure($"Failed to deactivate position: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Employee>>> GetPositionEmployeesAsync(int positionId)
        {
            try
            {
                var employees = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.Manager)
                    .ThenInclude(m => m.User)
                    .Where(e => e.CurrentPositionId == positionId)
                    .OrderBy(e => e.LastName)
                    .ThenBy(e => e.FirstName)
                    .ToListAsync();

                return ServiceResult<List<Employee>>.Success(employees);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Employee>>.Failure($"Failed to get position employees: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Position>>> GetVacantKeyPositionsAsync()
        {
            try
            {
                var vacantPositions = await _context.Positions
                    .Include(p => p.Department)
                    .Where(p => p.IsActive && p.IsKeyPosition && !p.CurrentEmployees.Any())
                    .OrderBy(p => p.Department.Name)
                    .ThenBy(p => p.Title)
                    .ToListAsync();

                return ServiceResult<List<Position>>.Success(vacantPositions);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Position>>.Failure($"Failed to get vacant key positions: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Position>>> GetPositionsByDepartmentAsync(int departmentId)
        {
            try
            {
                var positions = await _context.Positions
                    .Include(p => p.CurrentEmployees)
                    .ThenInclude(e => e.User)
                    .Where(p => p.DepartmentId == departmentId && p.IsActive)
                    .OrderBy(p => p.Level)
                    .ThenBy(p => p.Title)
                    .ToListAsync();

                return ServiceResult<List<Position>>.Success(positions);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Position>>.Failure($"Failed to get positions by department: {ex.Message}");
            }
        }
    }

    // DTO Classes
    public class CreatePositionDto
    {
        public string Title { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string? Description { get; set; }
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
        public string? Level { get; set; }
        public bool IsKeyPosition { get; set; } = false;
    }

    public class UpdatePositionDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
        public string? Level { get; set; }
        public bool? IsKeyPosition { get; set; }
        public bool? IsActive { get; set; }
    }
}