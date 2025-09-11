using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface ICareerPathService
    {
        // Career Path CRUD
        Task<ServiceResult<CareerPath>> CreateCareerPathAsync(CreateCareerPathDto dto, int createdByUserId);
        Task<ServiceResult<CareerPath>> UpdateCareerPathAsync(int id, UpdateCareerPathDto dto, int updatedByUserId);
        Task<ServiceResult<bool>> DeleteCareerPathAsync(int id, int deletedByUserId);
        Task<ServiceResult<CareerPath>> GetCareerPathByIdAsync(int id);
        Task<ServiceResult<List<CareerPath>>> GetAllCareerPathsAsync(bool includeInactive = false);

        // Smart Career Path Discovery
        Task<ServiceResult<List<CareerPathRecommendation>>> GetRecommendedPathsForEmployeeAsync(int employeeId);
        Task<ServiceResult<List<CareerPath>>> GetAvailablePathsFromPositionAsync(int positionId);
        Task<ServiceResult<List<CareerPath>>> GetPathsToPositionAsync(int positionId);

        // Career Path Analysis
        Task<ServiceResult<CareerPathAnalysis>> AnalyzeEmployeeReadinessAsync(int employeeId, int careerPathId);
        Task<ServiceResult<List<SkillGapAnalysis>>> GetSkillGapsForPathAsync(int employeeId, int careerPathId);
        Task<ServiceResult<CareerRoadmap>> GenerateCareerRoadmapAsync(int employeeId, int targetPositionId);

        // Career Path Skills Management
        Task<ServiceResult<CareerPathSkill>> AddRequiredSkillAsync(int careerPathId, int skillId, int minProficiency, bool isMandatory = true);
        Task<ServiceResult<bool>> RemoveRequiredSkillAsync(int careerPathId, int skillId);
        Task<ServiceResult<List<CareerPathSkill>>> GetRequiredSkillsAsync(int careerPathId);
    }

    public class CareerPathService : ICareerPathService
    {
        private readonly CareerManagementDbContext _context;
        private readonly INotificationService _notificationService;

        public CareerPathService(
            CareerManagementDbContext context,
            INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;

        }

        #region Career Path CRUD

        public async Task<ServiceResult<CareerPath>> CreateCareerPathAsync(CreateCareerPathDto dto, int createdByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate positions exist
                var fromPosition = await _context.Positions
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.Id == dto.FromPositionId && p.IsActive);

                var toPosition = await _context.Positions
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.Id == dto.ToPositionId && p.IsActive);

                if (fromPosition == null || toPosition == null)
                    return ServiceResult<CareerPath>.Failure("One or both positions not found or inactive");

                // Check if path already exists
                var existingPath = await _context.CareerPaths
                    .FirstOrDefaultAsync(cp => cp.FromPositionId == dto.FromPositionId && cp.ToPositionId == dto.ToPositionId);

                if (existingPath != null)
                    return ServiceResult<CareerPath>.Failure("Career path already exists between these positions");

                var careerPath = new CareerPath
                {
                    FromPositionId = dto.FromPositionId,
                    ToPositionId = dto.ToPositionId,
                    MinYearsInCurrentRole = dto.MinYearsInCurrentRole,
                    MinTotalExperience = dto.MinTotalExperience,
                    MinPerformanceRating = dto.MinPerformanceRating,
                    RequiredCertifications = dto.RequiredCertifications,
                    RequiredEducationLevel = dto.RequiredEducationLevel,
                    Description = dto.Description,
                    CreatedByUserId = createdByUserId
                };

                _context.CareerPaths.Add(careerPath);
                await _context.SaveChangesAsync();

                // Add required skills if specified
                if (dto.RequiredSkills?.Any() == true)
                {
                    foreach (var skillReq in dto.RequiredSkills)
                    {
                        var careerPathSkill = new CareerPathSkill
                        {
                            CareerPathId = careerPath.Id,
                            SkillId = skillReq.SkillId,
                            MinProficiencyLevel = skillReq.MinProficiencyLevel,
                            IsMandatory = skillReq.IsMandatory
                        };
                        _context.CareerPathSkills.Add(careerPathSkill);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // Load complete data for response
                var result = await GetCareerPathByIdAsync(careerPath.Id);

                // Notify employees who might be interested in this new path
                await NotifyRelevantEmployeesOfNewPath(careerPath);

                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<CareerPath>.Failure($"Failed to create career path: {ex.Message}");
            }
        }

        public async Task<ServiceResult<CareerPath>> UpdateCareerPathAsync(int id, UpdateCareerPathDto dto, int updatedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var careerPath = await _context.CareerPaths
                    .FirstOrDefaultAsync(cp => cp.Id == id);

                if (careerPath == null)
                    return ServiceResult<CareerPath>.Failure("Career path not found");

                // Update properties
                if (dto.MinYearsInCurrentRole.HasValue)
                    careerPath.MinYearsInCurrentRole = dto.MinYearsInCurrentRole.Value;

                if (dto.MinTotalExperience.HasValue)
                    careerPath.MinTotalExperience = dto.MinTotalExperience.Value;

                if (dto.MinPerformanceRating.HasValue)
                    careerPath.MinPerformanceRating = dto.MinPerformanceRating.Value;

                if (!string.IsNullOrEmpty(dto.RequiredCertifications))
                    careerPath.RequiredCertifications = dto.RequiredCertifications;

                if (!string.IsNullOrEmpty(dto.RequiredEducationLevel))
                    careerPath.RequiredEducationLevel = dto.RequiredEducationLevel;

                if (!string.IsNullOrEmpty(dto.Description))
                    careerPath.Description = dto.Description;

                if (dto.IsActive.HasValue)
                    careerPath.IsActive = dto.IsActive.Value;

                careerPath.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return await GetCareerPathByIdAsync(id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<CareerPath>.Failure($"Failed to update career path: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> DeleteCareerPathAsync(int id, int deletedByUserId)
        {
            try
            {
                var careerPath = await _context.CareerPaths
                    .FirstOrDefaultAsync(cp => cp.Id == id);

                if (careerPath == null)
                    return ServiceResult<bool>.Failure("Career path not found");

                careerPath.IsActive = false;
                careerPath.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to delete career path: {ex.Message}");
            }
        }

        public async Task<ServiceResult<CareerPath>> GetCareerPathByIdAsync(int id)
        {
            try
            {
                var careerPath = await _context.CareerPaths
                    .Include(cp => cp.FromPosition)
                    .ThenInclude(p => p.Department)
                    .Include(cp => cp.ToPosition)
                    .ThenInclude(p => p.Department)
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .Include(cp => cp.CreatedBy)
                    .FirstOrDefaultAsync(cp => cp.Id == id);

                if (careerPath == null)
                    return ServiceResult<CareerPath>.Failure("Career path not found");

                return ServiceResult<CareerPath>.Success(careerPath);
            }
            catch (Exception ex)
            {
                return ServiceResult<CareerPath>.Failure($"Failed to get career path: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<CareerPath>>> GetAllCareerPathsAsync(bool includeInactive = false)
        {
            try
            {
                var query = _context.CareerPaths
                    .Include(cp => cp.FromPosition)
                    .ThenInclude(p => p.Department)
                    .Include(cp => cp.ToPosition)
                    .ThenInclude(p => p.Department)
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .AsQueryable();

                if (!includeInactive)
                    query = query.Where(cp => cp.IsActive);

                var careerPaths = await query
                    .OrderBy(cp => cp.FromPosition.Department.Name)
                    .ThenBy(cp => cp.FromPosition.Title)
                    .ThenBy(cp => cp.ToPosition.Title)
                    .ToListAsync();

                return ServiceResult<List<CareerPath>>.Success(careerPaths);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<CareerPath>>.Failure($"Failed to get career paths: {ex.Message}");
            }
        }

        #endregion

        #region Smart Career Path Discovery

        public async Task<ServiceResult<List<CareerPathRecommendation>>> GetRecommendedPathsForEmployeeAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(e => e.PerformanceReviews.Where(pr => pr.Status == "Completed"))
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee?.CurrentPosition == null)
                    return ServiceResult<List<CareerPathRecommendation>>.Failure("Employee or current position not found");

                // Get all available paths from current position
                var availablePaths = await _context.CareerPaths
                    .Include(cp => cp.ToPosition)
                    .ThenInclude(p => p.Department)
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .Where(cp => cp.FromPositionId == employee.CurrentPositionId && cp.IsActive)
                    .ToListAsync();

                var recommendations = new List<CareerPathRecommendation>();

                foreach (var path in availablePaths)
                {
                    var readinessResult = await AnalyzeEmployeeReadinessAsync(employeeId, path.Id);
                    if (readinessResult.IsSuccess)
                    {
                        var recommendation = new CareerPathRecommendation
                        {
                            CareerPath = path,
                            ReadinessScore = readinessResult.Data!.ReadinessPercentage,
                            Analysis = readinessResult.Data,
                            Priority = CalculatePathPriority(readinessResult.Data, employee)
                        };
                        recommendations.Add(recommendation);
                    }
                }

                // Sort by readiness score and priority
                recommendations = recommendations
                    .OrderByDescending(r => r.ReadinessScore)
                    .ThenByDescending(r => r.Priority)
                    .ToList();

                return ServiceResult<List<CareerPathRecommendation>>.Success(recommendations);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<CareerPathRecommendation>>.Failure($"Failed to get recommended paths: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<CareerPath>>> GetAvailablePathsFromPositionAsync(int positionId)
        {
            try
            {
                var careerPaths = await _context.CareerPaths
                    .Include(cp => cp.ToPosition)
                    .ThenInclude(p => p.Department)
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .Where(cp => cp.FromPositionId == positionId && cp.IsActive)
                    .OrderBy(cp => cp.ToPosition.Department.Name)
                    .ThenBy(cp => cp.ToPosition.Title)
                    .ToListAsync();

                return ServiceResult<List<CareerPath>>.Success(careerPaths);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<CareerPath>>.Failure($"Failed to get available paths: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<CareerPath>>> GetPathsToPositionAsync(int positionId)
        {
            try
            {
                var careerPaths = await _context.CareerPaths
                    .Include(cp => cp.FromPosition)
                    .ThenInclude(p => p.Department)
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .Where(cp => cp.ToPositionId == positionId && cp.IsActive)
                    .OrderBy(cp => cp.FromPosition.Department.Name)
                    .ThenBy(cp => cp.FromPosition.Title)
                    .ToListAsync();

                return ServiceResult<List<CareerPath>>.Success(careerPaths);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<CareerPath>>.Failure($"Failed to get paths to position: {ex.Message}");
            }
        }

        #endregion

        #region Career Path Analysis

        public async Task<ServiceResult<CareerPathAnalysis>> AnalyzeEmployeeReadinessAsync(int employeeId, int careerPathId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(e => e.PerformanceReviews.Where(pr => pr.Status == "Completed"))
                    .Include(e => e.EmployeeEducations)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                var careerPath = await _context.CareerPaths
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .Include(cp => cp.ToPosition)
                    .FirstOrDefaultAsync(cp => cp.Id == careerPathId);

                if (employee == null || careerPath == null)
                    return ServiceResult<CareerPathAnalysis>.Failure("Employee or career path not found");

                var analysis = new CareerPathAnalysis
                {
                    EmployeeId = employeeId,
                    CareerPathId = careerPathId,
                    AnalysisDate = DateTime.UtcNow
                };

                // Calculate years in current role
                analysis.YearsInCurrentRole = (DateTime.UtcNow - employee.HireDate).Days / 365.25;

                // Calculate total experience (simplified - using hire date as proxy)
                analysis.TotalExperience = analysis.YearsInCurrentRole;

                // Get recent performance rating
                var recentReview = employee.PerformanceReviews
                    .OrderByDescending(pr => pr.ReviewPeriodEnd)
                    .FirstOrDefault();
                analysis.CurrentPerformanceRating = recentReview?.OverallRating ?? 0;

                // Analyze requirements
                analysis.MeetsExperienceRequirement = analysis.YearsInCurrentRole >= careerPath.MinYearsInCurrentRole;
                analysis.MeetsTotalExperienceRequirement = analysis.TotalExperience >= careerPath.MinTotalExperience;
                analysis.MeetsPerformanceRequirement = !careerPath.MinPerformanceRating.HasValue ||
                    analysis.CurrentPerformanceRating >= careerPath.MinPerformanceRating;

                // Education analysis
                analysis.MeetsEducationRequirement = string.IsNullOrEmpty(careerPath.RequiredEducationLevel) ||
                    employee.EmployeeEducations.Any(ed => ed.Degree.Contains(careerPath.RequiredEducationLevel));

                // Skills analysis
                var skillGapsResult = await GetSkillGapsForPathAsync(employeeId, careerPathId);
                if (skillGapsResult.IsSuccess)
                {
                    analysis.SkillGaps = skillGapsResult.Data!;
                    var totalRequiredSkills = careerPath.RequiredSkills.Count;
                    var metSkills = analysis.SkillGaps.Count(sg => sg.CurrentProficiency >= sg.RequiredProficiency);
                    analysis.SkillCompletionPercentage = totalRequiredSkills == 0 ? 100 : (metSkills * 100.0) / totalRequiredSkills;
                }

                // Calculate overall readiness percentage
                var criteriaCount = 4; // experience, total exp, performance, education
                var metCriteria = 0;

                if (analysis.MeetsExperienceRequirement) metCriteria++;
                if (analysis.MeetsTotalExperienceRequirement) metCriteria++;
                if (analysis.MeetsPerformanceRequirement) metCriteria++;
                if (analysis.MeetsEducationRequirement) metCriteria++;

                var baseReadiness = (metCriteria * 100.0) / criteriaCount;
                var skillsWeight = 0.4; // Skills are 40% of readiness
                var criteriasWeight = 0.6; // Other criteria are 60%

                analysis.ReadinessPercentage = (baseReadiness * criteriasWeight) +
                    (analysis.SkillCompletionPercentage * skillsWeight);

                // Generate recommendations
                analysis.Recommendations = GenerateRecommendations(analysis, careerPath);

                return ServiceResult<CareerPathAnalysis>.Success(analysis);
            }
            catch (Exception ex)
            {
                return ServiceResult<CareerPathAnalysis>.Failure($"Failed to analyze employee readiness: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SkillGapAnalysis>>> GetSkillGapsForPathAsync(int employeeId, int careerPathId)
        {
            try
            {
                var employeeSkills = await _context.EmployeeSkills
                    .Include(es => es.Skill)
                    .Where(es => es.EmployeeId == employeeId)
                    .ToListAsync();

                var requiredSkills = await _context.CareerPathSkills
                    .Include(cps => cps.Skill)
                    .Where(cps => cps.CareerPathId == careerPathId)
                    .ToListAsync();

                var skillGaps = new List<SkillGapAnalysis>();

                foreach (var requiredSkill in requiredSkills)
                {
                    var employeeSkill = employeeSkills.FirstOrDefault(es => es.SkillId == requiredSkill.SkillId);
                    var currentProficiency = employeeSkill?.ProficiencyLevel ?? 0;

                    var gap = new SkillGapAnalysis
                    {
                        Skill = requiredSkill.Skill,
                        RequiredProficiency = requiredSkill.MinProficiencyLevel,
                        CurrentProficiency = currentProficiency,
                        Gap = Math.Max(0, requiredSkill.MinProficiencyLevel - currentProficiency),
                        IsMandatory = requiredSkill.IsMandatory,
                        Priority = CalculateSkillPriority(requiredSkill, currentProficiency)
                    };

                    skillGaps.Add(gap);
                }

                return ServiceResult<List<SkillGapAnalysis>>.Success(skillGaps.OrderByDescending(sg => sg.Priority).ToList());
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SkillGapAnalysis>>.Failure($"Failed to get skill gaps: {ex.Message}");
            }
        }

        public async Task<ServiceResult<CareerRoadmap>> GenerateCareerRoadmapAsync(int employeeId, int targetPositionId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee?.CurrentPosition == null)
                    return ServiceResult<CareerRoadmap>.Failure("Employee or current position not found");

                var roadmap = new CareerRoadmap
                {
                    EmployeeId = employeeId,
                    TargetPositionId = targetPositionId,
                    CurrentPositionId = employee.CurrentPositionId!.Value,
                    GeneratedDate = DateTime.UtcNow
                };

                // Find path(s) to target position
                var directPath = await _context.CareerPaths
                    .Include(cp => cp.ToPosition)
                    .FirstOrDefaultAsync(cp => cp.FromPositionId == employee.CurrentPositionId &&
                        cp.ToPositionId == targetPositionId && cp.IsActive);

                if (directPath != null)
                {
                    // Direct path available
                    roadmap.Steps.Add(new RoadmapStep
                    {
                        Order = 1,
                        FromPositionId = employee.CurrentPositionId.Value,
                        ToPositionId = targetPositionId,
                        CareerPathId = directPath.Id,
                        EstimatedTimeMonths = Math.Max(directPath.MinYearsInCurrentRole * 12, 12)
                    });
                }
                else
                {
                    // Find multi-step path
                    var multiStepPaths = await FindMultiStepPath(employee.CurrentPositionId.Value, targetPositionId);
                    roadmap.Steps.AddRange(multiStepPaths);
                }

                roadmap.EstimatedTotalTimeMonths = roadmap.Steps.Sum(s => s.EstimatedTimeMonths);

                return ServiceResult<CareerRoadmap>.Success(roadmap);
            }
            catch (Exception ex)
            {
                return ServiceResult<CareerRoadmap>.Failure($"Failed to generate career roadmap: {ex.Message}");
            }
        }

        #endregion

        #region Career Path Skills Management

        public async Task<ServiceResult<CareerPathSkill>> AddRequiredSkillAsync(int careerPathId, int skillId, int minProficiency, bool isMandatory = true)
        {
            try
            {
                var existingSkill = await _context.CareerPathSkills
                    .FirstOrDefaultAsync(cps => cps.CareerPathId == careerPathId && cps.SkillId == skillId);

                if (existingSkill != null)
                    return ServiceResult<CareerPathSkill>.Failure("Skill already required for this career path");

                var careerPathSkill = new CareerPathSkill
                {
                    CareerPathId = careerPathId,
                    SkillId = skillId,
                    MinProficiencyLevel = minProficiency,
                    IsMandatory = isMandatory
                };

                _context.CareerPathSkills.Add(careerPathSkill);
                await _context.SaveChangesAsync();

                // Load with skill info
                var result = await _context.CareerPathSkills
                    .Include(cps => cps.Skill)
                    .FirstAsync(cps => cps.Id == careerPathSkill.Id);

                return ServiceResult<CareerPathSkill>.Success(result);
            }
            catch (Exception ex)
            {
                return ServiceResult<CareerPathSkill>.Failure($"Failed to add required skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> RemoveRequiredSkillAsync(int careerPathId, int skillId)
        {
            try
            {
                var careerPathSkill = await _context.CareerPathSkills
                    .FirstOrDefaultAsync(cps => cps.CareerPathId == careerPathId && cps.SkillId == skillId);

                if (careerPathSkill == null)
                    return ServiceResult<bool>.Failure("Required skill not found");

                _context.CareerPathSkills.Remove(careerPathSkill);
                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to remove required skill: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<CareerPathSkill>>> GetRequiredSkillsAsync(int careerPathId)
        {
            try
            {
                var requiredSkills = await _context.CareerPathSkills
                    .Include(cps => cps.Skill)
                    .Where(cps => cps.CareerPathId == careerPathId)
                    .OrderByDescending(cps => cps.IsMandatory)
                    .ThenBy(cps => cps.Skill.Name)
                    .ToListAsync();

                return ServiceResult<List<CareerPathSkill>>.Success(requiredSkills);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<CareerPathSkill>>.Failure($"Failed to get required skills: {ex.Message}");
            }
        }

        #endregion

        #region Private Helper Methods

        private async Task NotifyRelevantEmployeesOfNewPath(CareerPath careerPath)
        {
            // Notify employees in the "from" position about new career opportunity
            var relevantEmployees = await _context.Employees
                .Include(e => e.User)
                .Where(e => e.CurrentPositionId == careerPath.FromPositionId)
                .ToListAsync();

            foreach (var employee in relevantEmployees)
            {
                await _notificationService.NotifyAsync(
                    employee.User.Id,
                    "New Career Path Available",
                    $"A new career path has been created from your current position. Check your career development options!",
                    "NewCareerPath",
                    careerPath.Id
                );
            }
        }

        private int CalculatePathPriority(CareerPathAnalysis analysis, Employee employee)
        {
            var priority = 0;

            // Higher priority for higher readiness
            if (analysis.ReadinessPercentage >= 80) priority += 50;
            else if (analysis.ReadinessPercentage >= 60) priority += 30;
            else if (analysis.ReadinessPercentage >= 40) priority += 10;

            // Higher priority for better performance
            if (analysis.CurrentPerformanceRating >= 4.0m) priority += 20;
            else if (analysis.CurrentPerformanceRating >= 3.5m) priority += 10;

            // Higher priority for longer tenure
            if (analysis.YearsInCurrentRole >= 3) priority += 15;
            else if (analysis.YearsInCurrentRole >= 2) priority += 10;

            return priority;
        }

        private int CalculateSkillPriority(CareerPathSkill requiredSkill, int currentProficiency)
        {
            var priority = 0;

            // Mandatory skills get higher priority
            if (requiredSkill.IsMandatory) priority += 50;

            // Bigger gaps get higher priority
            var gap = requiredSkill.MinProficiencyLevel - currentProficiency;
            priority += gap * 10;

            return Math.Max(0, priority);
        }

        private List<string> GenerateRecommendations(CareerPathAnalysis analysis, CareerPath careerPath)
        {
            var recommendations = new List<string>();

            if (!analysis.MeetsExperienceRequirement)
            {
                var yearsNeeded = careerPath.MinYearsInCurrentRole - analysis.YearsInCurrentRole;
                recommendations.Add($"Gain {yearsNeeded:F1} more years of experience in your current role");
            }

            if (!analysis.MeetsPerformanceRequirement && careerPath.MinPerformanceRating.HasValue)
            {
                recommendations.Add($"Improve performance rating to at least {careerPath.MinPerformanceRating:F1}");
            }

            if (!analysis.MeetsEducationRequirement && !string.IsNullOrEmpty(careerPath.RequiredEducationLevel))
            {
                recommendations.Add($"Obtain {careerPath.RequiredEducationLevel} degree or certification");
            }

            // Add skill-specific recommendations
            var criticalSkillGaps = analysis.SkillGaps?.Where(sg => sg.IsMandatory && sg.Gap > 0).ToList();
            if (criticalSkillGaps?.Any() == true)
            {
                foreach (var gap in criticalSkillGaps.Take(3)) // Top 3 critical gaps
                {
                    recommendations.Add($"Develop {gap.Skill.Name} skills to level {gap.RequiredProficiency}");
                }
            }

            return recommendations;
        }

        private async Task<List<RoadmapStep>> FindMultiStepPath(int startPositionId, int targetPositionId)
        {
            // Simple implementation - finds intermediate positions
            var steps = new List<RoadmapStep>();
            var visited = new HashSet<int> { startPositionId };
            var currentPositionId = startPositionId;

            // Find paths from current position
            var availablePaths = await _context.CareerPaths
                .Where(cp => cp.FromPositionId == startPositionId && cp.IsActive)
                .ToListAsync();

            // Look for paths that might lead to target (simplified approach)
            foreach (var path in availablePaths.Take(2)) // Limit to avoid infinite loops
            {
                if (!visited.Contains(path.ToPositionId))
                {
                    steps.Add(new RoadmapStep
                    {
                        Order = steps.Count + 1,
                        FromPositionId = path.FromPositionId,
                        ToPositionId = path.ToPositionId,
                        CareerPathId = path.Id,
                        EstimatedTimeMonths = Math.Max(path.MinYearsInCurrentRole * 12, 12)
                    });

                    // Check if this leads to target
                    var nextPaths = await _context.CareerPaths
                        .Where(cp => cp.FromPositionId == path.ToPositionId &&
                                    cp.ToPositionId == targetPositionId && cp.IsActive)
                        .FirstOrDefaultAsync();

                    if (nextPaths != null)
                    {
                        steps.Add(new RoadmapStep
                        {
                            Order = steps.Count + 1,
                            FromPositionId = path.ToPositionId,
                            ToPositionId = targetPositionId,
                            CareerPathId = nextPaths.Id,
                            EstimatedTimeMonths = Math.Max(nextPaths.MinYearsInCurrentRole * 12, 12)
                        });
                        break;
                    }
                }
            }

            return steps;
        }

        #endregion
    }

    #region DTOs and Analysis Classes

    public class CreateCareerPathDto
    {
        public int FromPositionId { get; set; }
        public int ToPositionId { get; set; }
        public int MinYearsInCurrentRole { get; set; } = 1;
        public int MinTotalExperience { get; set; } = 0;
        public decimal? MinPerformanceRating { get; set; }
        public string? RequiredCertifications { get; set; }
        public string? RequiredEducationLevel { get; set; }
        public string? Description { get; set; }
        public List<CreateCareerPathSkillDto>? RequiredSkills { get; set; }
    }

    public class CreateCareerPathSkillDto
    {
        public int SkillId { get; set; }
        public int MinProficiencyLevel { get; set; }
        public bool IsMandatory { get; set; } = true;
    }

    public class UpdateCareerPathDto
    {
        public int? MinYearsInCurrentRole { get; set; }
        public int? MinTotalExperience { get; set; }
        public decimal? MinPerformanceRating { get; set; }
        public string? RequiredCertifications { get; set; }
        public string? RequiredEducationLevel { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }

    public class CareerPathRecommendation
    {
        public CareerPath CareerPath { get; set; } = null!;
        public double ReadinessScore { get; set; }
        public CareerPathAnalysis Analysis { get; set; } = null!;
        public int Priority { get; set; }
    }

    public class CareerPathAnalysis
    {
        public int EmployeeId { get; set; }
        public int CareerPathId { get; set; }
        public DateTime AnalysisDate { get; set; }

        public double YearsInCurrentRole { get; set; }
        public double TotalExperience { get; set; }
        public decimal CurrentPerformanceRating { get; set; }

        public bool MeetsExperienceRequirement { get; set; }
        public bool MeetsTotalExperienceRequirement { get; set; }
        public bool MeetsPerformanceRequirement { get; set; }
        public bool MeetsEducationRequirement { get; set; }

        public List<SkillGapAnalysis> SkillGaps { get; set; } = new List<SkillGapAnalysis>();
        public double SkillCompletionPercentage { get; set; }
        public double ReadinessPercentage { get; set; }

        public List<string> Recommendations { get; set; } = new List<string>();
    }

    public class SkillGapAnalysis
    {
        public Skill Skill { get; set; } = null!;
        public int RequiredProficiency { get; set; }
        public int CurrentProficiency { get; set; }
        public int Gap { get; set; }
        public bool IsMandatory { get; set; }
        public int Priority { get; set; }
    }

    public class CareerRoadmap
    {
        public int EmployeeId { get; set; }
        public int CurrentPositionId { get; set; }
        public int TargetPositionId { get; set; }
        public DateTime GeneratedDate { get; set; }
        public List<RoadmapStep> Steps { get; set; } = new List<RoadmapStep>();
        public double EstimatedTotalTimeMonths { get; set; }
    }

    public class RoadmapStep
    {
        public int Order { get; set; }
        public int FromPositionId { get; set; }
        public int ToPositionId { get; set; }
        public int CareerPathId { get; set; }
        public double EstimatedTimeMonths { get; set; }
    }

    #endregion
}