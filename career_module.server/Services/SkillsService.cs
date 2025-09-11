using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface ISkillService
    {
        Task<ServiceResult<List<Skill>>> GetAllSkillsAsync(bool activeOnly = true, string? category = null);
        Task<ServiceResult<Skill>> GetSkillByIdAsync(int id);
        Task<ServiceResult<Skill>> CreateSkillAsync(CreateSkillDto dto, int createdByUserId);
        Task<ServiceResult<Skill>> UpdateSkillAsync(int id, UpdateSkillDto dto, int updatedByUserId);
        Task<ServiceResult<bool>> DeactivateSkillAsync(int id, int deactivatedByUserId);
        Task<ServiceResult<List<string>>> GetSkillCategoriesAsync();
        Task<ServiceResult<List<Employee>>> GetEmployeesWithSkillAsync(int skillId, int? minProficiencyLevel = null);
    }

    public interface IEmployeeSkillService
    {
        Task<ServiceResult<List<EmployeeSkill>>> GetEmployeeSkillsAsync(int employeeId);
        Task<ServiceResult<EmployeeSkill>> AddEmployeeSkillAsync(AddEmployeeSkillDto dto, int updatedByUserId);
        Task<ServiceResult<EmployeeSkill>> UpdateEmployeeSkillAsync(int employeeId, int skillId, UpdateEmployeeSkillDto dto, int updatedByUserId);
        Task<ServiceResult<bool>> RemoveEmployeeSkillAsync(int employeeId, int skillId, int removedByUserId);
        Task<ServiceResult<List<SkillGapDto>>> GetSkillGapsAsync(int employeeId, int targetPositionId);
    }

    public class SkillService : ISkillService
    {
        private readonly CareerManagementDbContext _context;

        public SkillService(CareerManagementDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<List<Skill>>> GetAllSkillsAsync(bool activeOnly = true, string? category = null)
        {
            try
            {
                var query = _context.Skills.AsQueryable();

                if (activeOnly)
                {
                    query = query.Where(s => s.IsActive);
                }

                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(s => s.Category.ToLower() == category.ToLower());
                }

                var skills = await query
                    .OrderBy(s => s.Category)
                    .ThenBy(s => s.Name)
                    .ToListAsync();

                return ServiceResult<List<Skill>>.Success(skills);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Skill>>.Failure($"Failed to get skills: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Skill>> GetSkillByIdAsync(int id)
        {
            try
            {
                var skill = await _context.Skills
                    .Include(s => s.EmployeeSkills)
                    .ThenInclude(es => es.Employee)
                    .ThenInclude(e => e.User)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (skill == null)
                    return ServiceResult<Skill>.Failure("Skill not found");

                return ServiceResult<Skill>.Success(skill);
            }
            catch (Exception ex)
            {
                return ServiceResult<Skill>.Failure($"Failed to get skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Skill>> CreateSkillAsync(CreateSkillDto dto, int createdByUserId)
        {
            try
            {
                // Validate creator permissions
                var creator = await _context.Users.FindAsync(createdByUserId);
                if (creator == null || (creator.Role != "Admin" && creator.Role != "HR"))
                {
                    return ServiceResult<Skill>.Failure("Insufficient permissions to create skill");
                }

                // Check for duplicate skill names
                var existingSkill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.Name.ToLower() == dto.Name.ToLower() && s.IsActive);

                if (existingSkill != null)
                    return ServiceResult<Skill>.Failure("Skill with this name already exists");

                var skill = new Skill
                {
                    Name = dto.Name,
                    Category = dto.Category ?? "General",
                    Description = dto.Description ?? string.Empty,
                    IsActive = true
                };

                _context.Skills.Add(skill);
                await _context.SaveChangesAsync();

                return ServiceResult<Skill>.Success(skill);
            }
            catch (Exception ex)
            {
                return ServiceResult<Skill>.Failure($"Failed to create skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<Skill>> UpdateSkillAsync(int id, UpdateSkillDto dto, int updatedByUserId)
        {
            try
            {
                // Validate updater permissions
                var updater = await _context.Users.FindAsync(updatedByUserId);
                if (updater == null || (updater.Role != "Admin" && updater.Role != "HR"))
                {
                    return ServiceResult<Skill>.Failure("Insufficient permissions to update skill");
                }

                var skill = await _context.Skills.FindAsync(id);
                if (skill == null)
                    return ServiceResult<Skill>.Failure("Skill not found");

                // Check for duplicate names if name is being changed
                if (!string.IsNullOrEmpty(dto.Name) && dto.Name != skill.Name)
                {
                    var existingSkill = await _context.Skills
                        .FirstOrDefaultAsync(s => s.Name.ToLower() == dto.Name.ToLower() && s.Id != id && s.IsActive);

                    if (existingSkill != null)
                        return ServiceResult<Skill>.Failure("Skill with this name already exists");

                    skill.Name = dto.Name;
                }

                if (!string.IsNullOrEmpty(dto.Category))
                    skill.Category = dto.Category;

                if (dto.Description != null)
                    skill.Description = dto.Description;

                if (dto.IsActive.HasValue)
                    skill.IsActive = dto.IsActive.Value;

                await _context.SaveChangesAsync();

                return ServiceResult<Skill>.Success(skill);
            }
            catch (Exception ex)
            {
                return ServiceResult<Skill>.Failure($"Failed to update skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> DeactivateSkillAsync(int id, int deactivatedByUserId)
        {
            try
            {
                // Validate permissions
                var deactivator = await _context.Users.FindAsync(deactivatedByUserId);
                if (deactivator == null || (deactivator.Role != "Admin" && deactivator.Role != "HR"))
                {
                    return ServiceResult<bool>.Failure("Insufficient permissions to deactivate skill");
                }

                var skill = await _context.Skills.FindAsync(id);
                if (skill == null)
                    return ServiceResult<bool>.Failure("Skill not found");

                skill.IsActive = false;
                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to deactivate skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<string>>> GetSkillCategoriesAsync()
        {
            try
            {
                var categories = await _context.Skills
                    .Where(s => s.IsActive)
                    .Select(s => s.Category)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return ServiceResult<List<string>>.Success(categories);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<string>>.Failure($"Failed to get skill categories: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<Employee>>> GetEmployeesWithSkillAsync(int skillId, int? minProficiencyLevel = null)
        {
            try
            {
                var query = _context.EmployeeSkills
                    .Include(es => es.Employee)
                    .ThenInclude(e => e.User)
                    .Include(es => es.Employee.Department)
                    .Where(es => es.SkillId == skillId);

                if (minProficiencyLevel.HasValue)
                {
                    query = query.Where(es => es.ProficiencyLevel >= minProficiencyLevel.Value);
                }

                var employees = await query
                    .Select(es => es.Employee)
                    .OrderBy(e => e.LastName)
                    .ThenBy(e => e.FirstName)
                    .ToListAsync();

                return ServiceResult<List<Employee>>.Success(employees);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<Employee>>.Failure($"Failed to get employees with skill: {ex.Message}");
            }
        }
    }

    public class EmployeeSkillService : IEmployeeSkillService
    {
        private readonly CareerManagementDbContext _context;
        private readonly INotificationService _notificationService;

        public EmployeeSkillService(CareerManagementDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult<List<EmployeeSkill>>> GetEmployeeSkillsAsync(int employeeId)
        {
            try
            {
                var employeeSkills = await _context.EmployeeSkills
                    .Include(es => es.Skill)
                    .Where(es => es.EmployeeId == employeeId)
                    .OrderBy(es => es.Skill.Category)
                    .ThenBy(es => es.Skill.Name)
                    .ToListAsync();

                return ServiceResult<List<EmployeeSkill>>.Success(employeeSkills);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<EmployeeSkill>>.Failure($"Failed to get employee skills: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeSkill>> AddEmployeeSkillAsync(AddEmployeeSkillDto dto, int updatedByUserId)
        {
            try
            {
                // Validate permissions
                var updater = await _context.Users.FindAsync(updatedByUserId);
                if (updater == null)
                    return ServiceResult<EmployeeSkill>.Failure("User not found");

                var employee = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId);

                if (employee == null)
                    return ServiceResult<EmployeeSkill>.Failure("Employee not found");

                // Check permissions: users can only add skills to themselves, or HR/Admin/Manager can add to others
                if (updater.Role != "HR" && updater.Role != "Admin" && employee.UserId != updatedByUserId)
                {
                    // Check if updater is the employee's manager
                    var isManager = employee.ManagerId.HasValue &&
                                   await _context.Employees.AnyAsync(e => e.Id == employee.ManagerId && e.UserId == updatedByUserId);

                    if (!isManager)
                        return ServiceResult<EmployeeSkill>.Failure("Insufficient permissions to add skills to this employee");
                }

                // Validate skill exists
                var skill = await _context.Skills.FindAsync(dto.SkillId);
                if (skill == null || !skill.IsActive)
                    return ServiceResult<EmployeeSkill>.Failure("Skill not found or inactive");

                // Check if employee already has this skill
                var existingSkill = await _context.EmployeeSkills
                    .FirstOrDefaultAsync(es => es.EmployeeId == dto.EmployeeId && es.SkillId == dto.SkillId);

                if (existingSkill != null)
                    return ServiceResult<EmployeeSkill>.Failure("Employee already has this skill");

                // Validate proficiency level
                if (dto.ProficiencyLevel < 1 || dto.ProficiencyLevel > 5)
                    return ServiceResult<EmployeeSkill>.Failure("Proficiency level must be between 1 and 5");

                var employeeSkill = new EmployeeSkill
                {
                    EmployeeId = dto.EmployeeId,
                    SkillId = dto.SkillId,
                    ProficiencyLevel = dto.ProficiencyLevel,
                    AcquiredDate = dto.AcquiredDate ?? DateTime.UtcNow,
                    LastAssessedDate = DateTime.UtcNow,
                    Notes = dto.Notes
                };

                _context.EmployeeSkills.Add(employeeSkill);
                await _context.SaveChangesAsync();

                // Load with includes
                var result = await _context.EmployeeSkills
                    .Include(es => es.Skill)
                    .Include(es => es.Employee)
                    .FirstAsync(es => es.EmployeeId == dto.EmployeeId && es.SkillId == dto.SkillId);

                return ServiceResult<EmployeeSkill>.Success(result);
            }
            catch (Exception ex)
            {
                return ServiceResult<EmployeeSkill>.Failure($"Failed to add employee skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<EmployeeSkill>> UpdateEmployeeSkillAsync(int employeeId, int skillId, UpdateEmployeeSkillDto dto, int updatedByUserId)
        {
            try
            {
                var employeeSkill = await _context.EmployeeSkills
                    .Include(es => es.Employee)
                    .ThenInclude(e => e.User)
                    .Include(es => es.Skill)
                    .FirstOrDefaultAsync(es => es.EmployeeId == employeeId && es.SkillId == skillId);

                if (employeeSkill == null)
                    return ServiceResult<EmployeeSkill>.Failure("Employee skill not found");

                // Validate permissions
                var updater = await _context.Users.FindAsync(updatedByUserId);
                if (updater == null)
                    return ServiceResult<EmployeeSkill>.Failure("User not found");

                if (updater.Role != "HR" && updater.Role != "Admin" && employeeSkill.Employee.UserId != updatedByUserId)
                {
                    // Check if updater is the employee's manager
                    var isManager = employeeSkill.Employee.ManagerId.HasValue &&
                                   await _context.Employees.AnyAsync(e => e.Id == employeeSkill.Employee.ManagerId && e.UserId == updatedByUserId);

                    if (!isManager)
                        return ServiceResult<EmployeeSkill>.Failure("Insufficient permissions to update skills for this employee");
                }

                // Update fields
                if (dto.ProficiencyLevel.HasValue)
                {
                    if (dto.ProficiencyLevel < 1 || dto.ProficiencyLevel > 5)
                        return ServiceResult<EmployeeSkill>.Failure("Proficiency level must be between 1 and 5");

                    employeeSkill.ProficiencyLevel = dto.ProficiencyLevel.Value;
                }

                if (dto.AcquiredDate.HasValue)
                    employeeSkill.AcquiredDate = dto.AcquiredDate.Value;

                if (dto.Notes != null)
                    employeeSkill.Notes = dto.Notes;

                employeeSkill.LastAssessedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ServiceResult<EmployeeSkill>.Success(employeeSkill);
            }
            catch (Exception ex)
            {
                return ServiceResult<EmployeeSkill>.Failure($"Failed to update employee skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> RemoveEmployeeSkillAsync(int employeeId, int skillId, int removedByUserId)
        {
            try
            {
                var employeeSkill = await _context.EmployeeSkills
                    .Include(es => es.Employee)
                    .ThenInclude(e => e.User)
                    .FirstOrDefaultAsync(es => es.EmployeeId == employeeId && es.SkillId == skillId);

                if (employeeSkill == null)
                    return ServiceResult<bool>.Failure("Employee skill not found");

                // Validate permissions
                var remover = await _context.Users.FindAsync(removedByUserId);
                if (remover == null)
                    return ServiceResult<bool>.Failure("User not found");

                if (remover.Role != "HR" && remover.Role != "Admin" && employeeSkill.Employee.UserId != removedByUserId)
                {
                    // Check if remover is the employee's manager
                    var isManager = employeeSkill.Employee.ManagerId.HasValue &&
                                   await _context.Employees.AnyAsync(e => e.Id == employeeSkill.Employee.ManagerId && e.UserId == removedByUserId);

                    if (!isManager)
                        return ServiceResult<bool>.Failure("Insufficient permissions to remove skills from this employee");
                }

                _context.EmployeeSkills.Remove(employeeSkill);
                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to remove employee skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SkillGapDto>>> GetSkillGapsAsync(int employeeId, int targetPositionId)
        {
            try
            {
                // Get employee with their current skills
                var employee = await _context.Employees
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<List<SkillGapDto>>.Failure("Employee not found");

                // Get target position
                var position = await _context.Positions
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.Id == targetPositionId);

                if (position == null)
                    return ServiceResult<List<SkillGapDto>>.Failure("Position not found");

                // Get required skills for career paths leading to this position
                var requiredSkills = await _context.CareerPaths
                    .Where(cp => cp.ToPositionId == targetPositionId && cp.IsActive)
                    .SelectMany(cp => cp.RequiredSkills)
                    .Include(cps => cps.Skill)
                    .GroupBy(cps => cps.SkillId)
                    .Select(g => new
                    {
                        SkillId = g.Key,
                        Skill = g.First().Skill,
                        MaxRequiredLevel = g.Max(cps => cps.MinProficiencyLevel),
                        IsMandatory = g.Any(cps => cps.IsMandatory)
                    })
                    .ToListAsync();

                // If no specific career path skills defined, get common skills from employees in similar positions
                if (!requiredSkills.Any())
                {
                    // Get skills from employees currently in this position or similar level positions
                    var similarPositionSkills = await _context.Employees
                        .Where(e => e.CurrentPositionId == targetPositionId ||
                                   (e.CurrentPosition != null && e.CurrentPosition.Level == position.Level))
                        .SelectMany(e => e.EmployeeSkills)
                        .Include(es => es.Skill)
                        .GroupBy(es => es.SkillId)
                        .Where(g => g.Count() >= 2) // Skill appears in at least 2 employees
                        .Select(g => new
                        {
                            SkillId = g.Key,
                            Skill = g.First().Skill,
                            MaxRequiredLevel = (int)Math.Ceiling(g.Average(es => es.ProficiencyLevel)),
                            IsMandatory = false
                        })
                        .ToListAsync();

                    requiredSkills = similarPositionSkills;
                }

                var skillGaps = new List<SkillGapDto>();

                // Current employee skills dictionary for quick lookup
                var currentSkills = employee.EmployeeSkills.ToDictionary(es => es.SkillId, es => es.ProficiencyLevel);

                foreach (var requiredSkill in requiredSkills)
                {
                    var currentLevel = currentSkills.ContainsKey(requiredSkill.SkillId)
                        ? currentSkills[requiredSkill.SkillId]
                        : 0;

                    var gap = Math.Max(0, requiredSkill.MaxRequiredLevel - currentLevel);

                    skillGaps.Add(new SkillGapDto
                    {
                        SkillName = requiredSkill.Skill.Name,
                        RequiredLevel = requiredSkill.MaxRequiredLevel,
                        CurrentLevel = currentLevel,
                        Gap = gap,
                        Category = requiredSkill.Skill.Category,
                        IsMandatory = requiredSkill.IsMandatory,
                        SkillId = requiredSkill.SkillId
                    });
                }

                // Sort by gap (highest first) then by mandatory status
                var sortedGaps = skillGaps
                    .OrderByDescending(sg => sg.IsMandatory)
                    .ThenByDescending(sg => sg.Gap)
                    .ThenBy(sg => sg.SkillName)
                    .ToList();

                return ServiceResult<List<SkillGapDto>>.Success(sortedGaps);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SkillGapDto>>.Failure($"Failed to analyze skill gaps: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SkillRecommendationDto>>> GetSkillRecommendationsAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(e => e.CurrentPosition)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<List<SkillRecommendationDto>>.Failure("Employee not found");

                var recommendations = new List<SkillRecommendationDto>();

                // Get potential career paths from current position
                var careerPaths = await _context.CareerPaths
                    .Where(cp => cp.FromPositionId == employee.CurrentPositionId && cp.IsActive)
                    .Include(cp => cp.ToPosition)
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(cps => cps.Skill)
                    .ToListAsync();

                var currentSkills = employee.EmployeeSkills.ToDictionary(es => es.SkillId, es => es.ProficiencyLevel);

                foreach (var path in careerPaths)
                {
                    foreach (var requiredSkill in path.RequiredSkills)
                    {
                        var currentLevel = currentSkills.ContainsKey(requiredSkill.SkillId)
                            ? currentSkills[requiredSkill.SkillId]
                            : 0;

                        if (currentLevel < requiredSkill.MinProficiencyLevel)
                        {
                            var existingRecommendation = recommendations.FirstOrDefault(r => r.SkillId == requiredSkill.SkillId);

                            if (existingRecommendation == null)
                            {
                                recommendations.Add(new SkillRecommendationDto
                                {
                                    SkillId = requiredSkill.SkillId,
                                    SkillName = requiredSkill.Skill.Name,
                                    Category = requiredSkill.Skill.Category,
                                    CurrentLevel = currentLevel,
                                    RecommendedLevel = requiredSkill.MinProficiencyLevel,
                                    Priority = requiredSkill.IsMandatory ? "High" : "Medium",
                                    Reason = $"Required for advancement to {path.ToPosition.Title}",
                                    CareerPaths = new List<string> { path.ToPosition.Title }
                                });
                            }
                            else
                            {
                                existingRecommendation.CareerPaths.Add(path.ToPosition.Title);
                                existingRecommendation.RecommendedLevel = Math.Max(existingRecommendation.RecommendedLevel, requiredSkill.MinProficiencyLevel);
                                if (requiredSkill.IsMandatory && existingRecommendation.Priority != "High")
                                {
                                    existingRecommendation.Priority = "High";
                                }
                            }
                        }
                    }
                }

                // Add trending skills in department/industry
                var departmentSkills = await _context.Employees
                    .Where(e => e.DepartmentId == employee.DepartmentId && e.Id != employeeId)
                    .SelectMany(e => e.EmployeeSkills)
                    .Include(es => es.Skill)
                    .Where(es => es.LastAssessedDate >= DateTime.UtcNow.AddMonths(-12)) // Recent skills
                    .GroupBy(es => es.SkillId)
                    .Where(g => g.Count() >= 3) // Popular skills
                    .Select(g => new { SkillId = g.Key, Skill = g.First().Skill, AvgLevel = g.Average(es => es.ProficiencyLevel) })
                    .ToListAsync();

                foreach (var deptSkill in departmentSkills)
                {
                    if (!currentSkills.ContainsKey(deptSkill.SkillId) && !recommendations.Any(r => r.SkillId == deptSkill.SkillId))
                    {
                        recommendations.Add(new SkillRecommendationDto
                        {
                            SkillId = deptSkill.SkillId,
                            SkillName = deptSkill.Skill.Name,
                            Category = deptSkill.Skill.Category,
                            CurrentLevel = 0,
                            RecommendedLevel = Math.Max(1, (int)Math.Ceiling(deptSkill.AvgLevel * 0.7)), // 70% of department average
                            Priority = "Low",
                            Reason = "Popular skill in your department",
                            CareerPaths = new List<string> { "Department trending" }
                        });
                    }
                }

                var sortedRecommendations = recommendations
                    .OrderBy(r => r.Priority == "High" ? 0 : r.Priority == "Medium" ? 1 : 2)
                    .ThenByDescending(r => r.RecommendedLevel - r.CurrentLevel)
                    .ToList();

                return ServiceResult<List<SkillRecommendationDto>>.Success(sortedRecommendations);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SkillRecommendationDto>>.Failure($"Failed to get skill recommendations: {ex.Message}");
            }
        }
    }
    // DTO Classes
    public class SkillGapDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public int RequiredLevel { get; set; }
        public int CurrentLevel { get; set; }
        public int Gap { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsMandatory { get; set; }
    }

    public class SkillRecommendationDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int CurrentLevel { get; set; }
        public int RecommendedLevel { get; set; }
        public string Priority { get; set; } = string.Empty; // High, Medium, Low
        public string Reason { get; set; } = string.Empty;
        public List<string> CareerPaths { get; set; } = new List<string>();
    }

    public class CreateSkillDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateSkillDto
    {
        public string? Name { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AddEmployeeSkillDto
    {
        public int EmployeeId { get; set; }
        public int SkillId { get; set; }
        public int ProficiencyLevel { get; set; }
        public DateTime? AcquiredDate { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateEmployeeSkillDto
    {
        public int? ProficiencyLevel { get; set; }
        public DateTime? AcquiredDate { get; set; }
        public string? Notes { get; set; }
    }

}