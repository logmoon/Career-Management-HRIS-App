using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface ISuccessionPlanningService
    {
        // Succession Plan CRUD
        Task<ServiceResult<SuccessionPlan>> CreateSuccessionPlanAsync(CreateSuccessionPlanDto dto, int createdByUserId);
        Task<ServiceResult<SuccessionPlan>> UpdateSuccessionPlanAsync(int id, UpdateSuccessionPlanDto dto);
        Task<ServiceResult<bool>> DeleteSuccessionPlanAsync(int id);
        Task<ServiceResult<SuccessionPlan>> GetSuccessionPlanByIdAsync(int id);
        Task<ServiceResult<List<SuccessionPlan>>> GetAllSuccessionPlansAsync(string? status = null);
        Task<ServiceResult<List<SuccessionPlan>>> GetSuccessionPlansForPositionAsync(int positionId);

        // Smart Candidate Discovery
        Task<ServiceResult<List<SuccessionCandidate>>> GetSmartCandidatesForPositionAsync(int positionId);
        Task<ServiceResult<List<SuccessionCandidateAnalysis>>> AnalyzePotentialCandidatesAsync(int positionId);
        Task<ServiceResult<SuccessionCandidate>> AddCandidateToSuccessionPlanAsync(int successionPlanId, int employeeId, int priority);

        // Candidate Management
        Task<ServiceResult<SuccessionCandidate>> UpdateCandidateAsync(int candidateId, UpdateSuccessionCandidateDto dto);
        Task<ServiceResult<bool>> RemoveCandidateAsync(int candidateId);
        Task<ServiceResult<List<SuccessionCandidate>>> GetCandidatesForPlanAsync(int successionPlanId);

        // Succession Analytics
        Task<ServiceResult<SuccessionReadinessReport>> GenerateSuccessionReadinessReportAsync(int? departmentId = null);
        Task<ServiceResult<List<SuccessionRisk>>> IdentifySuccessionRisksAsync();
        Task<ServiceResult<SuccessionMetrics>> GetSuccessionMetricsAsync();

        // Integration with other systems
        Task<ServiceResult<bool>> ProcessRetirementPlanningAsync(int employeeId, DateTime expectedRetirementDate);
        Task<ServiceResult<List<SuccessionRecommendation>>> GetSuccessionRecommendationsAsync();
    }

    public class SuccessionPlanningService : ISuccessionPlanningService
    {
        private readonly CareerManagementDbContext _context;
        private readonly ICareerPathService _careerPathService;
        private readonly IPerformanceReviewService _performanceService;

        public SuccessionPlanningService(
            CareerManagementDbContext context,
            ICareerPathService careerPathService,
            IPerformanceReviewService performanceService)
        {
            _context = context;
            _careerPathService = careerPathService;
            _performanceService = performanceService;
        }

        #region Succession Plan CRUD

        public async Task<ServiceResult<SuccessionPlan>> CreateSuccessionPlanAsync(CreateSuccessionPlanDto dto, int createdByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var position = await _context.Positions
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.Id == dto.PositionId && p.IsActive);

                if (position == null)
                    return ServiceResult<SuccessionPlan>.Failure("Position not found or inactive");

                // Check if there's already an active succession plan for this position
                var existingPlan = await _context.SuccessionPlans
                    .FirstOrDefaultAsync(sp => sp.PositionId == dto.PositionId && sp.Status == "Active");

                if (existingPlan != null)
                    return ServiceResult<SuccessionPlan>.Failure("An active succession plan already exists for this position");

                var successionPlan = new SuccessionPlan
                {
                    PositionId = dto.PositionId,
                    Status = "Active",
                    CreatedByUserId = createdByUserId,
                    ReviewDate = dto.ReviewDate,
                    Notes = dto.Notes
                };

                _context.SuccessionPlans.Add(successionPlan);
                await _context.SaveChangesAsync();

                // Auto-discover and add potential candidates
                if (dto.AutoDiscoverCandidates)
                {
                    var candidatesResult = await GetSmartCandidatesForPositionAsync(dto.PositionId);
                    if (candidatesResult.IsSuccess)
                    {
                        var priority = 1;
                        foreach (var smartCandidate in candidatesResult.Data!.Take(5)) // Top 5 candidates
                        {
                            var candidate = new SuccessionCandidate
                            {
                                SuccessionPlanId = successionPlan.Id,
                                EmployeeId = smartCandidate.EmployeeId,
                                Priority = priority++,
                                MatchScore = smartCandidate.MatchScore,
                                Status = "UnderReview",
                                Notes = $"Auto-discovered candidate. Match score: {smartCandidate.MatchScore:F1}%"
                            };
                            _context.SuccessionCandidates.Add(candidate);
                        }
                        await _context.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();

                return await GetSuccessionPlanByIdAsync(successionPlan.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<SuccessionPlan>.Failure($"Failed to create succession plan: {ex.Message}");
            }
        }

        public async Task<ServiceResult<SuccessionPlan>> UpdateSuccessionPlanAsync(int id, UpdateSuccessionPlanDto dto)
        {
            try
            {
                var successionPlan = await _context.SuccessionPlans
                    .FirstOrDefaultAsync(sp => sp.Id == id);

                if (successionPlan == null)
                    return ServiceResult<SuccessionPlan>.Failure("Succession plan not found");

                if (!string.IsNullOrEmpty(dto.Status))
                    successionPlan.Status = dto.Status;

                if (dto.ReviewDate.HasValue)
                    successionPlan.ReviewDate = dto.ReviewDate;

                if (!string.IsNullOrEmpty(dto.Notes))
                    successionPlan.Notes = dto.Notes;

                successionPlan.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return await GetSuccessionPlanByIdAsync(id);
            }
            catch (Exception ex)
            {
                return ServiceResult<SuccessionPlan>.Failure($"Failed to update succession plan: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> DeleteSuccessionPlanAsync(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var successionPlan = await _context.SuccessionPlans
                    .Include(sp => sp.Candidates)
                    .FirstOrDefaultAsync(sp => sp.Id == id);

                if (successionPlan == null)
                    return ServiceResult<bool>.Failure("Succession plan not found");

                // Remove all candidates first
                _context.SuccessionCandidates.RemoveRange(successionPlan.Candidates);

                // Remove the succession plan
                _context.SuccessionPlans.Remove(successionPlan);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<bool>.Failure($"Failed to delete succession plan: {ex.Message}");
            }
        }

        public async Task<ServiceResult<SuccessionPlan>> GetSuccessionPlanByIdAsync(int id)
        {
            try
            {
                var successionPlan = await _context.SuccessionPlans
                    .Include(sp => sp.Position)
                    .ThenInclude(p => p.Department)
                    .Include(sp => sp.CreatedBy)
                    .Include(sp => sp.Candidates)
                    .ThenInclude(c => c.Employee)
                    .ThenInclude(e => e.User)
                    .FirstOrDefaultAsync(sp => sp.Id == id);

                if (successionPlan == null)
                    return ServiceResult<SuccessionPlan>.Failure("Succession plan not found");

                // Sort candidates by priority
                successionPlan.Candidates = successionPlan.Candidates.OrderBy(c => c.Priority).ToList();

                return ServiceResult<SuccessionPlan>.Success(successionPlan);
            }
            catch (Exception ex)
            {
                return ServiceResult<SuccessionPlan>.Failure($"Failed to get succession plan: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SuccessionPlan>>> GetAllSuccessionPlansAsync(string? status = null)
        {
            try
            {
                var query = _context.SuccessionPlans
                    .Include(sp => sp.Position)
                    .ThenInclude(p => p.Department)
                    .Include(sp => sp.Candidates)
                    .ThenInclude(c => c.Employee)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(sp => sp.Status == status);

                var successionPlans = await query
                    .OrderBy(sp => sp.Position.Department.Name)
                    .ThenBy(sp => sp.Position.Title)
                    .ToListAsync();

                return ServiceResult<List<SuccessionPlan>>.Success(successionPlans);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SuccessionPlan>>.Failure($"Failed to get succession plans: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SuccessionPlan>>> GetSuccessionPlansForPositionAsync(int positionId)
        {
            try
            {
                var successionPlans = await _context.SuccessionPlans
                    .Include(sp => sp.Position)
                    .Include(sp => sp.Candidates)
                    .ThenInclude(c => c.Employee)
                    .ThenInclude(e => e.User)
                    .Where(sp => sp.PositionId == positionId)
                    .OrderByDescending(sp => sp.CreatedAt)
                    .ToListAsync();

                return ServiceResult<List<SuccessionPlan>>.Success(successionPlans);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SuccessionPlan>>.Failure($"Failed to get succession plans for position: {ex.Message}");
            }
        }

        #endregion

        #region Smart Candidate Discovery

        public async Task<ServiceResult<List<SuccessionCandidate>>> GetSmartCandidatesForPositionAsync(int positionId)
        {
            try
            {
                var analysisResult = await AnalyzePotentialCandidatesAsync(positionId);
                if (!analysisResult.IsSuccess)
                    return ServiceResult<List<SuccessionCandidate>>.Failure(analysisResult.ErrorMessage);

                var candidates = analysisResult.Data!
                    .Where(candidate => candidate.OverallScore >= 60) // Minimum 60% match
                    .OrderByDescending(candidate => candidate.OverallScore)
                    .Take(10)
                    .Select((candidate, index) => new SuccessionCandidate
                    {
                        EmployeeId = candidate.EmployeeId,
                        Priority = index + 1,
                        MatchScore = (decimal)candidate.OverallScore,
                        Status = "UnderReview",
                        Notes = $"Smart discovery match: {candidate.OverallScore:F1}%. " +
                               $"Key strengths: {string.Join(", ", candidate.Strengths.Take(3))}"
                    })
                    .ToList();

                return ServiceResult<List<SuccessionCandidate>>.Success(candidates);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SuccessionCandidate>>.Failure($"Failed to get smart candidates: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SuccessionCandidateAnalysis>>> AnalyzePotentialCandidatesAsync(int positionId)
        {
            try
            {
                var targetPosition = await _context.Positions
                    .Include(p => p.Department)
                    .FirstOrDefaultAsync(p => p.Id == positionId);

                if (targetPosition == null)
                    return ServiceResult<List<SuccessionCandidateAnalysis>>.Failure("Position not found");

                // Get all employees who could potentially fill this position
                var potentialCandidates = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Department)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(e => e.PerformanceReviews.Where(pr => pr.Status == "Completed"))
                    .Include(e => e.EmployeeExperiences)
                    .Where(e => e.CurrentPositionId != positionId) // Can't succeed themselves
                    .ToListAsync();

                var analyses = new List<SuccessionCandidateAnalysis>();

                // Get career paths to this position for context
                var careerPathsToPosition = await _context.CareerPaths
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .Where(cp => cp.ToPositionId == positionId && cp.IsActive)
                    .ToListAsync();

                foreach (var candidate in potentialCandidates)
                {
                    var analysis = await AnalyzeIndividualCandidate(candidate, targetPosition, careerPathsToPosition);
                    if (analysis.OverallScore > 0) // Only include candidates with some potential
                    {
                        analyses.Add(analysis);
                    }
                }

                return ServiceResult<List<SuccessionCandidateAnalysis>>.Success(
                    analyses.OrderByDescending(a => a.OverallScore).ToList());
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SuccessionCandidateAnalysis>>.Failure($"Failed to analyze candidates: {ex.Message}");
            }
        }

        public async Task<ServiceResult<SuccessionCandidate>> AddCandidateToSuccessionPlanAsync(int successionPlanId, int employeeId, int priority)
        {
            try
            {
                var successionPlan = await _context.SuccessionPlans
                    .Include(sp => sp.Candidates)
                    .FirstOrDefaultAsync(sp => sp.Id == successionPlanId);

                if (successionPlan == null)
                    return ServiceResult<SuccessionCandidate>.Failure("Succession plan not found");

                var employee = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<SuccessionCandidate>.Failure("Employee not found");

                // Check if candidate already exists
                var existingCandidate = successionPlan.Candidates
                    .FirstOrDefault(c => c.EmployeeId == employeeId);

                if (existingCandidate != null)
                    return ServiceResult<SuccessionCandidate>.Failure("Employee is already a candidate for this succession plan");

                // Adjust priorities of existing candidates
                var candidatesToAdjust = successionPlan.Candidates
                    .Where(c => c.Priority >= priority)
                    .ToList();

                foreach (var candidate in candidatesToAdjust)
                {
                    candidate.Priority++;
                    candidate.UpdatedAt = DateTime.UtcNow;
                }

                // Analyze the candidate
                var analysisResult = await AnalyzePotentialCandidatesAsync(successionPlan.PositionId);
                var candidateAnalysis = analysisResult.Data?
                    .FirstOrDefault(a => a.EmployeeId == employeeId);

                var newCandidate = new SuccessionCandidate
                {
                    SuccessionPlanId = successionPlanId,
                    EmployeeId = employeeId,
                    Priority = priority,
                    MatchScore = candidateAnalysis != null ? (decimal)candidateAnalysis.OverallScore : 50m,
                    Status = "UnderReview",
                    Notes = candidateAnalysis != null
                        ? $"Match score: {candidateAnalysis.OverallScore:F1}%. Strengths: {string.Join(", ", candidateAnalysis.Strengths.Take(3))}"
                        : "Added manually - requires detailed evaluation"
                };

                _context.SuccessionCandidates.Add(newCandidate);
                await _context.SaveChangesAsync();

                // Load complete data for response
                var result = await _context.SuccessionCandidates
                    .Include(c => c.Employee)
                    .ThenInclude(e => e.User)
                    .FirstAsync(c => c.Id == newCandidate.Id);

                return ServiceResult<SuccessionCandidate>.Success(result);
            }
            catch (Exception ex)
            {
                return ServiceResult<SuccessionCandidate>.Failure($"Failed to add candidate: {ex.Message}");
            }
        }
        #endregion

        #region Candidate Management

        public async Task<ServiceResult<SuccessionCandidate>> UpdateCandidateAsync(int candidateId, UpdateSuccessionCandidateDto dto)
        {
            try
            {
                var candidate = await _context.SuccessionCandidates
                    .Include(c => c.Employee)
                    .ThenInclude(e => e.User)
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null)
                    return ServiceResult<SuccessionCandidate>.Failure("Candidate not found");

                if (dto.Priority.HasValue && dto.Priority.Value != candidate.Priority)
                {
                    // Handle priority changes
                    await AdjustCandidatePriorities(candidate.SuccessionPlanId, candidate.Priority, dto.Priority.Value);
                    candidate.Priority = dto.Priority.Value;
                }

                if (dto.MatchScore.HasValue)
                    candidate.MatchScore = dto.MatchScore.Value;

                if (!string.IsNullOrEmpty(dto.Status))
                    candidate.Status = dto.Status;

                if (!string.IsNullOrEmpty(dto.Notes))
                    candidate.Notes = dto.Notes;

                candidate.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return ServiceResult<SuccessionCandidate>.Success(candidate);
            }
            catch (Exception ex)
            {
                return ServiceResult<SuccessionCandidate>.Failure($"Failed to update candidate: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> RemoveCandidateAsync(int candidateId)
        {
            try
            {
                var candidate = await _context.SuccessionCandidates
                    .FirstOrDefaultAsync(c => c.Id == candidateId);

                if (candidate == null)
                    return ServiceResult<bool>.Failure("Candidate not found");

                var successionPlanId = candidate.SuccessionPlanId;
                var removedPriority = candidate.Priority;

                _context.SuccessionCandidates.Remove(candidate);

                // Adjust priorities of remaining candidates
                var candidatesToAdjust = await _context.SuccessionCandidates
                    .Where(c => c.SuccessionPlanId == successionPlanId && c.Priority > removedPriority)
                    .ToListAsync();

                foreach (var candidateToAdjust in candidatesToAdjust)
                {
                    candidateToAdjust.Priority--;
                    candidateToAdjust.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to remove candidate: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SuccessionCandidate>>> GetCandidatesForPlanAsync(int successionPlanId)
        {
            try
            {
                var candidates = await _context.SuccessionCandidates
                    .Include(c => c.Employee)
                    .ThenInclude(e => e.User)
                    .Include(c => c.Employee)
                    .ThenInclude(e => e.CurrentPosition)
                    .Include(c => c.Employee)
                    .ThenInclude(e => e.Department)
                    .Where(c => c.SuccessionPlanId == successionPlanId)
                    .OrderBy(c => c.Priority)
                    .ToListAsync();

                return ServiceResult<List<SuccessionCandidate>>.Success(candidates);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SuccessionCandidate>>.Failure($"Failed to get candidates: {ex.Message}");
            }
        }

        #endregion

        #region Succession Analytics

        public async Task<ServiceResult<SuccessionReadinessReport>> GenerateSuccessionReadinessReportAsync(int? departmentId = null)
        {
            try
            {
                var report = new SuccessionReadinessReport
                {
                    GeneratedDate = DateTime.UtcNow,
                    DepartmentId = departmentId
                };

                // Get positions to analyze
                var positionsQuery = _context.Positions
                    .Include(p => p.Department)
                    .Include(p => p.CurrentEmployees)
                    .Where(p => p.IsActive);

                if (departmentId.HasValue)
                    positionsQuery = positionsQuery.Where(p => p.DepartmentId == departmentId.Value);

                var positions = await positionsQuery.ToListAsync();

                foreach (var position in positions)
                {
                    var positionReadiness = new PositionSuccessionReadiness
                    {
                        Position = position,
                        IsKeyPosition = position.IsKeyPosition
                    };

                    // Check if there's an active succession plan
                    var successionPlan = await _context.SuccessionPlans
                        .Include(sp => sp.Candidates)
                        .FirstOrDefaultAsync(sp => sp.PositionId == position.Id && sp.Status == "Active");

                    if (successionPlan != null)
                    {
                        positionReadiness.HasSuccessionPlan = true;
                        positionReadiness.ReadyCandidatesCount = successionPlan.Candidates
                            .Count(c => c.Status == "Ready" || c.Status == "InTraining");
                        positionReadiness.TotalCandidatesCount = successionPlan.Candidates.Count;
                    }

                    // Calculate risk level
                    positionReadiness.RiskLevel = CalculateSuccessionRisk(positionReadiness);

                    report.PositionReadiness.Add(positionReadiness);
                }

                // Calculate overall metrics
                report.TotalPositions = report.PositionReadiness.Count;
                report.PositionsWithPlans = report.PositionReadiness.Count(pr => pr.HasSuccessionPlan);
                report.KeyPositionsAtRisk = report.PositionReadiness
                    .Count(pr => pr.IsKeyPosition && pr.RiskLevel == "High");
                report.OverallReadinessPercentage = report.TotalPositions > 0
                    ? (double)report.PositionsWithPlans / report.TotalPositions * 100
                    : 0;

                return ServiceResult<SuccessionReadinessReport>.Success(report);
            }
            catch (Exception ex)
            {
                return ServiceResult<SuccessionReadinessReport>.Failure($"Failed to generate readiness report: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SuccessionRisk>>> IdentifySuccessionRisksAsync()
        {
            try
            {
                var risks = new List<SuccessionRisk>();

                // Identify key positions without succession plans
                var keyPositionsWithoutPlans = await _context.Positions
                    .Include(p => p.Department)
                    .Include(p => p.CurrentEmployees)
                    .Where(p => p.IsKeyPosition && p.IsActive &&
                           !_context.SuccessionPlans.Any(sp => sp.PositionId == p.Id && sp.Status == "Active"))
                    .ToListAsync();

                foreach (var position in keyPositionsWithoutPlans)
                {
                    risks.Add(new SuccessionRisk
                    {
                        RiskType = "No Succession Plan",
                        Position = position,
                        RiskLevel = "High",
                        Description = $"Key position {position.Title} in {position.Department.Name} has no succession plan",
                        RecommendedAction = "Create succession plan and identify potential candidates"
                    });
                }

                // Identify positions with employees nearing retirement (assuming 65 as retirement age)
                var retirementRisks = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .ThenInclude(p => p.Department)
                    .Where(e => e.CurrentPosition != null && e.HireDate.AddYears(40) <= DateTime.UtcNow.AddYears(2))
                    .ToListAsync();

                foreach (var employee in retirementRisks)
                {
                    var hasSuccessionPlan = await _context.SuccessionPlans
                        .AnyAsync(sp => sp.PositionId == employee.CurrentPositionId && sp.Status == "Active");

                    if (!hasSuccessionPlan)
                    {
                        risks.Add(new SuccessionRisk
                        {
                            RiskType = "Retirement Risk",
                            Position = employee.CurrentPosition!,
                            Employee = employee,
                            RiskLevel = employee.CurrentPosition!.IsKeyPosition ? "High" : "Medium",
                            Description = $"Employee {employee.FirstName} {employee.LastName} may retire soon",
                            RecommendedAction = "Develop succession plan and begin knowledge transfer"
                        });
                    }
                }

                // Identify single points of failure
                var singlePointFailures = await _context.Positions
                    .Include(p => p.Department)
                    .Include(p => p.CurrentEmployees)
                    .Where(p => p.IsActive && p.CurrentEmployees.Count == 1)
                    .ToListAsync();

                foreach (var position in singlePointFailures)
                {
                    var hasReadyCandidates = await _context.SuccessionCandidates
                        .AnyAsync(sc => _context.SuccessionPlans
                            .Any(sp => sp.Id == sc.SuccessionPlanId && sp.PositionId == position.Id) &&
                            sc.Status == "Ready");

                    if (!hasReadyCandidates)
                    {
                        risks.Add(new SuccessionRisk
                        {
                            RiskType = "Single Point of Failure",
                            Position = position,
                            RiskLevel = position.IsKeyPosition ? "High" : "Medium",
                            Description = $"Position {position.Title} has only one employee with no ready successors",
                            RecommendedAction = "Cross-train employees and develop internal candidates"
                        });
                    }
                }

                return ServiceResult<List<SuccessionRisk>>.Success(risks.OrderByDescending(r =>
                    r.RiskLevel == "High" ? 3 : r.RiskLevel == "Medium" ? 2 : 1).ToList());
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SuccessionRisk>>.Failure($"Failed to identify succession risks: {ex.Message}");
            }
        }

        public async Task<ServiceResult<SuccessionMetrics>> GetSuccessionMetricsAsync()
        {
            try
            {
                var metrics = new SuccessionMetrics
                {
                    CalculatedDate = DateTime.UtcNow
                };

                // Basic counts
                metrics.TotalSuccessionPlans = await _context.SuccessionPlans.CountAsync();
                metrics.ActiveSuccessionPlans = await _context.SuccessionPlans
                    .CountAsync(sp => sp.Status == "Active");

                metrics.TotalCandidates = await _context.SuccessionCandidates.CountAsync();
                metrics.ReadyCandidates = await _context.SuccessionCandidates
                    .CountAsync(sc => sc.Status == "Ready");

                metrics.KeyPositionsWithPlans = await _context.Positions
                    .Where(p => p.IsKeyPosition && p.IsActive)
                    .CountAsync(p => _context.SuccessionPlans
                        .Any(sp => sp.PositionId == p.Id && sp.Status == "Active"));

                var totalKeyPositions = await _context.Positions
                    .CountAsync(p => p.IsKeyPosition && p.IsActive);

                metrics.KeyPositionsCoverage = totalKeyPositions > 0
                    ? (double)metrics.KeyPositionsWithPlans / totalKeyPositions * 100
                    : 0;

                // Average metrics
                var candidatesWithScores = await _context.SuccessionCandidates
                    .Where(sc => sc.MatchScore > 0)
                    .Select(sc => sc.MatchScore)
                    .ToListAsync();

                metrics.AverageCandidateMatchScore = candidatesWithScores.Any()
                    ? (double)candidatesWithScores.Average()
                    : 0;

                return ServiceResult<SuccessionMetrics>.Success(metrics);
            }
            catch (Exception ex)
            {
                return ServiceResult<SuccessionMetrics>.Failure($"Failed to get succession metrics: {ex.Message}");
            }
        }

        #endregion

        #region Integration Methods

        public async Task<ServiceResult<bool>> ProcessRetirementPlanningAsync(int employeeId, DateTime expectedRetirementDate)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .ThenInclude(p => p.Department)
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee?.CurrentPosition == null)
                    return ServiceResult<bool>.Failure("Employee or current position not found");

                // Check if succession plan exists for the position
                var existingPlan = await _context.SuccessionPlans
                    .FirstOrDefaultAsync(sp => sp.PositionId == employee.CurrentPositionId && sp.Status == "Active");

                if (existingPlan == null)
                {
                    // Create succession plan
                    var createDto = new CreateSuccessionPlanDto
                    {
                        PositionId = employee.CurrentPositionId.Value,
                        AutoDiscoverCandidates = true,
                        Notes = $"Created for retirement planning - {employee.FirstName} {employee.LastName} expected retirement: {expectedRetirementDate:yyyy-MM-dd}"
                    };

                    await CreateSuccessionPlanAsync(createDto, employee.UserId);
                }

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to process retirement planning: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SuccessionRecommendation>>> GetSuccessionRecommendationsAsync()
        {
            try
            {
                var recommendations = new List<SuccessionRecommendation>();

                // Recommendation 1: Key positions without plans
                var keyPositionsWithoutPlans = await _context.Positions
                    .Include(p => p.Department)
                    .Where(p => p.IsKeyPosition && p.IsActive &&
                           !_context.SuccessionPlans.Any(sp => sp.PositionId == p.Id && sp.Status == "Active"))
                    .Take(5)
                    .ToListAsync();

                foreach (var position in keyPositionsWithoutPlans)
                {
                    recommendations.Add(new SuccessionRecommendation
                    {
                        Type = "Create Succession Plan",
                        Priority = "High",
                        Description = $"Create succession plan for key position: {position.Title} in {position.Department.Name}",
                        PositionId = position.Id
                    });
                }

                // Recommendation 2: Plans with few candidates
                var plansWithFewCandidates = await _context.SuccessionPlans
                    .Include(sp => sp.Position)
                    .ThenInclude(p => p.Department)
                    .Include(sp => sp.Candidates)
                    .Where(sp => sp.Status == "Active" && sp.Candidates.Count < 2)
                    .Take(5)
                    .ToListAsync();

                foreach (var plan in plansWithFewCandidates)
                {
                    recommendations.Add(new SuccessionRecommendation
                    {
                        Type = "Add More Candidates",
                        Priority = "Medium",
                        Description = $"Add more candidates to succession plan for {plan.Position.Title}",
                        PositionId = plan.PositionId,
                        SuccessionPlanId = plan.Id
                    });
                }

                return ServiceResult<List<SuccessionRecommendation>>.Success(recommendations);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SuccessionRecommendation>>.Failure($"Failed to get recommendations: {ex.Message}");
            }
        }

        #endregion

        #region Private Helper Methods

        private async Task<SuccessionCandidateAnalysis> AnalyzeIndividualCandidate(
            Employee candidate, Position targetPosition, List<CareerPath> careerPaths)
        {
            var analysis = new SuccessionCandidateAnalysis
            {
                EmployeeId = candidate.Id,
                Employee = candidate,
                Strengths = new List<string>(),
                Weaknesses = new List<string>()
            };

            var scores = new List<double>();

            // 1. Experience Score (25%)
            var experienceScore = CalculateExperienceScore(candidate, targetPosition);
            scores.Add(experienceScore);
            if (experienceScore >= 80) analysis.Strengths.Add("Strong relevant experience");
            else if (experienceScore < 50) analysis.Weaknesses.Add("Limited relevant experience");

            // 2. Performance Score (30%)
            var performanceScore = CalculatePerformanceScore(candidate);
            scores.Add(performanceScore);
            if (performanceScore >= 85) analysis.Strengths.Add("Excellent performance record");
            else if (performanceScore < 60) analysis.Weaknesses.Add("Performance needs improvement");

            // 3. Skills Match (25%)
            var skillsScore = await CalculateSkillsMatchScore(candidate, targetPosition, careerPaths);
            scores.Add(skillsScore);
            if (skillsScore >= 80) analysis.Strengths.Add("Strong skills match");
            else if (skillsScore < 60) analysis.Weaknesses.Add("Skills gaps need addressing");

            // 4. Career Path Alignment (20%)
            var careerPathScore = CalculateCareerPathAlignment(candidate, targetPosition, careerPaths);
            scores.Add(careerPathScore);
            if (careerPathScore >= 80) analysis.Strengths.Add("Clear career progression path");

            // Calculate weighted overall score
            var weights = new[] { 0.25, 0.30, 0.25, 0.20 };
            analysis.OverallScore = scores.Select((score, index) => score * weights[index]).Sum();

            return analysis;
        }

        private double CalculateExperienceScore(Employee candidate, Position targetPosition)
        {
            var score = 0.0;

            // Years of experience
            var totalExperience = (DateTime.UtcNow - candidate.HireDate).TotalDays / 365.25;
            if (totalExperience >= 5) score += 40;
            else if (totalExperience >= 3) score += 25;
            else if (totalExperience >= 1) score += 10;

            // Department familiarity
            if (candidate.DepartmentId == targetPosition.DepartmentId) score += 30;
            else score += 10; // Cross-department experience can be valuable

            // Position level
            if (candidate.CurrentPosition != null)
            {
                // This is simplified - in reality you'd compare position levels more sophisticatedly
                var currentLevel = GetPositionLevel(candidate.CurrentPosition.Level);
                var targetLevel = GetPositionLevel(targetPosition.Level);

                if (currentLevel == targetLevel - 1) score += 30; // One level below
                else if (currentLevel == targetLevel) score += 20; // Same level (lateral move)
                else if (currentLevel >= targetLevel) score += 10; // Higher level

                // Check if current position is key position
                if (candidate.CurrentPosition.IsKeyPosition) score += 10;
            }

            return Math.Min(100, score);
        }

        private double CalculatePerformanceScore(Employee candidate)
        {
            if (!candidate.PerformanceReviews.Any()) return 50; // Neutral if no reviews

            var recentReviews = candidate.PerformanceReviews
                .OrderByDescending(pr => pr.ReviewPeriodEnd)
                .Take(3)
                .ToList();

            var averageRating = recentReviews.Average(pr => (double)pr.OverallRating);

            // Convert 1-5 rating to 0-100 score
            return (averageRating - 1) * 25;
        }

        private async Task<double> CalculateSkillsMatchScore(Employee candidate, Position targetPosition, List<CareerPath> careerPaths)
        {
            if (!careerPaths.Any()) return 70; // Default if no specific requirements

            var relevantPath = careerPaths.FirstOrDefault(cp => cp.FromPositionId == candidate.CurrentPositionId);
            if (relevantPath == null) return 50; // Default if no direct path

            if (!relevantPath.RequiredSkills.Any()) return 70; // No specific skill requirements

            var candidateSkills = candidate.EmployeeSkills.ToDictionary(es => es.SkillId, es => es.ProficiencyLevel);
            var totalRequiredSkills = relevantPath.RequiredSkills.Count;
            var matchedSkills = 0;
            var scoreSum = 0.0;

            foreach (var requiredSkill in relevantPath.RequiredSkills)
            {
                if (candidateSkills.TryGetValue(requiredSkill.SkillId, out var proficiency))
                {
                    if (proficiency >= requiredSkill.MinProficiencyLevel)
                    {
                        matchedSkills++;
                        scoreSum += 100;
                    }
                    else
                    {
                        // Partial credit based on how close they are
                        var ratio = (double)proficiency / requiredSkill.MinProficiencyLevel;
                        scoreSum += ratio * 60; // Max 60% for below required level
                    }
                }
                else
                {
                    scoreSum += 0; // No skill at all
                }
            }

            return scoreSum / totalRequiredSkills;
        }

        private double CalculateCareerPathAlignment(Employee candidate, Position targetPosition, List<CareerPath> careerPaths)
        {
            // Check if there's a direct career path from candidate's current position to target
            var directPath = careerPaths.FirstOrDefault(cp => cp.FromPositionId == candidate.CurrentPositionId);
            if (directPath != null) return 100;

            // Check if there's an indirect path (2-step)
            var indirectPaths = careerPaths.Where(cp =>
                careerPaths.Any(cp2 => cp2.FromPositionId == candidate.CurrentPositionId && cp2.ToPositionId == cp.FromPositionId))
                .ToList();

            if (indirectPaths.Any()) return 70;

            // Same department gets some points
            if (candidate.DepartmentId == targetPosition.DepartmentId) return 50;

            return 20; // Minimal alignment
        }

        private int GetPositionLevel(string level)
        {
            return level.ToLower() switch
            {
                "junior" => 1,
                "mid" => 2,
                "senior" => 3,
                "lead" => 4,
                "manager" => 5,
                "director" => 6,
                _ => 2
            };
        }

        private string CalculateSuccessionRisk(PositionSuccessionReadiness readiness)
        {
            if (!readiness.HasSuccessionPlan)
            {
                return readiness.IsKeyPosition ? "High" : "Medium";
            }

            if (readiness.ReadyCandidatesCount == 0)
            {
                return readiness.IsKeyPosition ? "High" : "Medium";
            }

            if (readiness.ReadyCandidatesCount >= 2)
            {
                return "Low";
            }

            return "Medium";
        }

        private async Task AdjustCandidatePriorities(int successionPlanId, int oldPriority, int newPriority)
        {
            var candidates = await _context.SuccessionCandidates
                .Where(c => c.SuccessionPlanId == successionPlanId)
                .ToListAsync();

            if (newPriority > oldPriority)
            {
                // Moving down in priority (higher number)
                var toAdjust = candidates.Where(c => c.Priority > oldPriority && c.Priority <= newPriority).ToList();
                foreach (var candidate in toAdjust)
                {
                    candidate.Priority--;
                    candidate.UpdatedAt = DateTime.UtcNow;
                }
            }
            else
            {
                // Moving up in priority (lower number)
                var toAdjust = candidates.Where(c => c.Priority >= newPriority && c.Priority < oldPriority).ToList();
                foreach (var candidate in toAdjust)
                {
                    candidate.Priority++;
                    candidate.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
        #endregion
    }

    #region DTOs and Analysis Classes

    public class CreateSuccessionPlanDto
    {
        public int PositionId { get; set; }
        public DateTime? ReviewDate { get; set; }
        public string? Notes { get; set; }
        public bool AutoDiscoverCandidates { get; set; } = true;
    }

    public class UpdateSuccessionPlanDto
    {
        public string? Status { get; set; }
        public DateTime? ReviewDate { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateSuccessionCandidateDto
    {
        public int? Priority { get; set; }
        public decimal? MatchScore { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class SuccessionCandidateAnalysis
    {
        public int EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public double OverallScore { get; set; }
        public List<string> Strengths { get; set; } = new List<string>();
        public List<string> Weaknesses { get; set; } = new List<string>();
    }

    public class SuccessionReadinessReport
    {
        public DateTime GeneratedDate { get; set; }
        public int? DepartmentId { get; set; }
        public List<PositionSuccessionReadiness> PositionReadiness { get; set; } = new List<PositionSuccessionReadiness>();
        public int TotalPositions { get; set; }
        public int PositionsWithPlans { get; set; }
        public int KeyPositionsAtRisk { get; set; }
        public double OverallReadinessPercentage { get; set; }
    }

    public class PositionSuccessionReadiness
    {
        public Position Position { get; set; } = null!;
        public bool IsKeyPosition { get; set; }
        public bool HasSuccessionPlan { get; set; }
        public int ReadyCandidatesCount { get; set; }
        public int TotalCandidatesCount { get; set; }
        public string RiskLevel { get; set; } = string.Empty; // Low, Medium, High
    }

    public class SuccessionRisk
    {
        public string RiskType { get; set; } = string.Empty;
        public Position Position { get; set; } = null!;
        public Employee? Employee { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
    }

    public class SuccessionMetrics
    {
        public DateTime CalculatedDate { get; set; }
        public int TotalSuccessionPlans { get; set; }
        public int ActiveSuccessionPlans { get; set; }
        public int TotalCandidates { get; set; }
        public int ReadyCandidates { get; set; }
        public int KeyPositionsWithPlans { get; set; }
        public double KeyPositionsCoverage { get; set; }
        public double AverageCandidateMatchScore { get; set; }
    }

    public class SuccessionRecommendation
    {
        public string Type { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? PositionId { get; set; }
        public int? SuccessionPlanId { get; set; }
    }

    #endregion
}