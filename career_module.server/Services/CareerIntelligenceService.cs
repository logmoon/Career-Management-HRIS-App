using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    /// <summary>
    /// The intelligence layer that connects all career management systems together
    /// This service makes the application "smart" by analyzing patterns and making recommendations
    /// </summary>
    public interface ICareerIntelligenceService
    {
        // Main Intelligence Functions
        Task<ServiceResult<CareerIntelligenceReport>> GenerateEmployeeCareerIntelligenceAsync(int employeeId);
        Task<ServiceResult<OrganizationIntelligenceReport>> GenerateOrganizationIntelligenceAsync();
        Task<ServiceResult<List<SmartRecommendation>>> GetSmartRecommendationsAsync(int? employeeId = null);

        // Proactive Career Management
        Task<ServiceResult<List<CareerOpportunity>>> IdentifyCareerOpportunitiesAsync(int employeeId);
        Task<ServiceResult<List<SkillDevelopmentRecommendation>>> RecommendSkillDevelopmentAsync(int employeeId);
        Task<ServiceResult<List<TalentRisk>>> IdentifyTalentRisksAsync();

        // Performance & Career Integration
        Task<ServiceResult<CareerPerformanceInsight>> AnalyzeCareerPerformancePatternAsync(int employeeId);
        Task<ServiceResult<bool>> ProcessPerformanceReviewCompletionAsync(int performanceReviewId);
        Task<ServiceResult<bool>> ProcessEmployeeRequestCompletionAsync(int requestId);

        // Predictive Analytics
        Task<ServiceResult<PromotionReadinessScore>> PredictPromotionReadinessAsync(int employeeId);
        Task<ServiceResult<List<AttritionRisk>>> PredictAttritionRisksAsync();
        Task<ServiceResult<TeamDynamicsInsight>> AnalyzeTeamDynamicsAsync(int managerId);

        // Smart Dashboard & Analytics (replaces Reports controller)
        Task<ServiceResult<IntelligentDashboard>> GetIntelligentDashboardAsync(int? employeeId = null, string? userRole = null);
        Task<ServiceResult<DepartmentIntelligence>> GetDepartmentIntelligenceAsync(int departmentId);
        Task<ServiceResult<SkillsIntelligence>> GetSkillsIntelligenceAsync(int? departmentId = null);
    }

    public class CareerIntelligenceService : ICareerIntelligenceService
    {
        private readonly CareerManagementDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ICareerPathService _careerPathService;
        private readonly ISuccessionPlanningService _successionPlanningService;
        private readonly IPerformanceReviewService _performanceService;

        public CareerIntelligenceService(
            CareerManagementDbContext context,
            INotificationService notificationService,
            ICareerPathService careerPathService,
            ISuccessionPlanningService successionPlanningService,
            IPerformanceReviewService performanceService)
        {
            _context = context;
            _notificationService = notificationService;
            _careerPathService = careerPathService;
            _successionPlanningService = successionPlanningService;
            _performanceService = performanceService;
        }

        #region Main Intelligence Functions

        public async Task<ServiceResult<CareerIntelligenceReport>> GenerateEmployeeCareerIntelligenceAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.CurrentPosition)
                    .ThenInclude(p => p.Department)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(e => e.PerformanceReviews)
                    .Include(e => e.RequestsMade)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<CareerIntelligenceReport>.Failure("Employee not found");

                var report = new CareerIntelligenceReport
                {
                    EmployeeId = employeeId,
                    Employee = employee,
                    GeneratedDate = DateTime.UtcNow
                };

                // Career Path Analysis
                if (employee.CurrentPositionId.HasValue)
                {
                    var careerPathsResult = await _careerPathService.GetRecommendedPathsForEmployeeAsync(employeeId);
                    if (careerPathsResult.IsSuccess)
                    {
                        report.CareerPathRecommendations = careerPathsResult.Data!.Take(5).ToList();
                    }
                }

                // Skill Development Analysis
                var skillRecommendations = await RecommendSkillDevelopmentAsync(employeeId);
                if (skillRecommendations.IsSuccess)
                {
                    report.SkillDevelopmentRecommendations = skillRecommendations.Data!;
                }

                // Performance Pattern Analysis
                var performanceInsight = await AnalyzeCareerPerformancePatternAsync(employeeId);
                if (performanceInsight.IsSuccess)
                {
                    report.PerformanceInsight = performanceInsight.Data!;
                }

                // Promotion Readiness
                var promotionReadiness = await PredictPromotionReadinessAsync(employeeId);
                if (promotionReadiness.IsSuccess)
                {
                    report.PromotionReadiness = promotionReadiness.Data!;
                }

                // Career Opportunities
                var opportunities = await IdentifyCareerOpportunitiesAsync(employeeId);
                if (opportunities.IsSuccess)
                {
                    report.CareerOpportunities = opportunities.Data!;
                }

                // Generate Smart Insights
                report.SmartInsights = GenerateSmartInsights(report);

                return ServiceResult<CareerIntelligenceReport>.Success(report);
            }
            catch (Exception ex)
            {
                return ServiceResult<CareerIntelligenceReport>.Failure($"Failed to generate intelligence report: {ex.Message}");
            }
        }

        public async Task<ServiceResult<OrganizationIntelligenceReport>> GenerateOrganizationIntelligenceAsync()
        {
            try
            {
                var report = new OrganizationIntelligenceReport
                {
                    GeneratedDate = DateTime.UtcNow
                };

                // Talent Risks
                var talentRisks = await IdentifyTalentRisksAsync();
                if (talentRisks.IsSuccess)
                {
                    report.TalentRisks = talentRisks.Data!.Take(10).ToList();
                }

                // Attrition Risks
                var attritionRisks = await PredictAttritionRisksAsync();
                if (attritionRisks.IsSuccess)
                {
                    report.AttritionRisks = attritionRisks.Data!.Take(10).ToList();
                }

                // Department Analysis
                report.DepartmentInsights = await GenerateDepartmentInsightsAsync();

                // Skill Gaps Across Organization
                report.OrganizationSkillGaps = await IdentifyOrganizationSkillGapsAsync();

                // Career Path Utilization
                report.CareerPathUtilization = await AnalyzeCareerPathUtilizationAsync();

                // Performance Trends
                report.PerformanceTrends = await AnalyzeOrganizationPerformanceTrendsAsync();

                // High-level recommendations
                report.StrategicRecommendations = await GenerateStrategicRecommendationsAsync();

                return ServiceResult<OrganizationIntelligenceReport>.Success(report);
            }
            catch (Exception ex)
            {
                return ServiceResult<OrganizationIntelligenceReport>.Failure($"Failed to generate organization intelligence: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SmartRecommendation>>> GetSmartRecommendationsAsync(int? employeeId = null)
        {
            try
            {
                var recommendations = new List<SmartRecommendation>();

                if (employeeId.HasValue)
                {
                    recommendations.AddRange(await GenerateEmployeeRecommendationsAsync(employeeId.Value));
                }
                else
                {
                    recommendations.AddRange(await GenerateOrganizationRecommendationsAsync());
                }

                return ServiceResult<List<SmartRecommendation>>.Success(
                    recommendations.OrderByDescending(r => r.Priority).Take(10).ToList());
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SmartRecommendation>>.Failure($"Failed to get smart recommendations: {ex.Message}");
            }
        }

        #endregion

        #region Proactive Career Management

        public async Task<ServiceResult<List<CareerOpportunity>>> IdentifyCareerOpportunitiesAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<List<CareerOpportunity>>.Failure("Employee not found");

                var opportunities = new List<CareerOpportunity>();

                // 1. Internal Position Opportunities (vacant positions employee might qualify for)
                var vacantPositions = await _context.Positions
                    .Include(p => p.Department)
                    .Include(p => p.CurrentEmployees)
                    .Where(p => p.IsActive && !p.CurrentEmployees.Any())
                    .ToListAsync();

                foreach (var position in vacantPositions)
                {
                    var matchScore = await CalculatePositionMatchScore(employee, position);
                    if (matchScore >= 60) // Only suggest positions with 60%+ match
                    {
                        opportunities.Add(new CareerOpportunity
                        {
                            Type = "Vacant Position",
                            Title = position.Title,
                            Department = position.Department.Name,
                            MatchScore = matchScore,
                            Description = $"Open position in {position.Department.Name}: {position.Title}",
                            RecommendedAction = "Apply through employee request system",
                            Priority = matchScore >= 80 ? "High" : "Medium",
                            RelatedId = position.Id
                        });
                    }
                }

                // 2. Succession Planning Opportunities
                var successionCandidacies = await _context.SuccessionCandidates
                    .Include(sc => sc.SuccessionPlan)
                    .ThenInclude(sp => sp.Position)
                    .ThenInclude(p => p.Department)
                    .Where(sc => sc.EmployeeId == employeeId)
                    .ToListAsync();

                foreach (var candidacy in successionCandidacies)
                {
                    opportunities.Add(new CareerOpportunity
                    {
                        Type = "Succession Plan",
                        Title = candidacy.SuccessionPlan.Position.Title,
                        Department = candidacy.SuccessionPlan.Position.Department.Name,
                        MatchScore = (double)candidacy.MatchScore,
                        Description = $"You're identified as candidate #{candidacy.Priority} for {candidacy.SuccessionPlan.Position.Title}",
                        RecommendedAction = candidacy.Status == "Ready" ? "Discuss readiness with manager" : "Continue skill development",
                        Priority = candidacy.Priority <= 2 ? "High" : "Medium",
                        RelatedId = candidacy.Id
                    });
                }

                // 3. Cross-Training Opportunities
                var crossTrainingOpps = await IdentifyCrossTrainingOpportunities(employee);
                opportunities.AddRange(crossTrainingOpps);

                return ServiceResult<List<CareerOpportunity>>.Success(
                    opportunities.OrderByDescending(o => o.MatchScore).ToList());
            }
            catch (Exception ex)
            {
                return ServiceResult<List<CareerOpportunity>>.Failure($"Failed to identify opportunities: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<SkillDevelopmentRecommendation>>> RecommendSkillDevelopmentAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee?.CurrentPosition == null)
                    return ServiceResult<List<SkillDevelopmentRecommendation>>.Failure("Employee or position not found");

                var recommendations = new List<SkillDevelopmentRecommendation>();

                // Get skills required for potential career paths
                var careerPaths = await _context.CareerPaths
                    .Include(cp => cp.RequiredSkills)
                    .ThenInclude(rs => rs.Skill)
                    .Include(cp => cp.ToPosition)
                    .Where(cp => cp.FromPositionId == employee.CurrentPositionId && cp.IsActive)
                    .ToListAsync();

                var employeeSkillLookup = employee.EmployeeSkills.ToDictionary(es => es.SkillId, es => es.ProficiencyLevel);

                foreach (var careerPath in careerPaths)
                {
                    foreach (var requiredSkill in careerPath.RequiredSkills)
                    {
                        var currentLevel = employeeSkillLookup.GetValueOrDefault(requiredSkill.SkillId, 0);
                        var gap = requiredSkill.MinProficiencyLevel - currentLevel;

                        if (gap > 0)
                        {
                            var existingRec = recommendations.FirstOrDefault(r => r.Skill.Id == requiredSkill.SkillId);
                            if (existingRec == null)
                            {
                                recommendations.Add(new SkillDevelopmentRecommendation
                                {
                                    Skill = requiredSkill.Skill,
                                    CurrentLevel = currentLevel,
                                    RecommendedLevel = requiredSkill.MinProficiencyLevel,
                                    Gap = gap,
                                    Priority = requiredSkill.IsMandatory ? "High" : "Medium",
                                    Reason = $"Required for career path to {careerPath.ToPosition.Title}",
                                    SuggestedActions = GenerateSkillDevelopmentActions(requiredSkill.Skill, gap)
                                });
                            }
                            else if (requiredSkill.MinProficiencyLevel > existingRec.RecommendedLevel)
                            {
                                existingRec.RecommendedLevel = requiredSkill.MinProficiencyLevel;
                                existingRec.Gap = requiredSkill.MinProficiencyLevel - currentLevel;
                                existingRec.Reason += $", {careerPath.ToPosition.Title}";
                            }
                        }
                    }
                }

                // Add trending skills in organization
                var trendingSkills = await IdentifyTrendingSkillsInOrganization();
                foreach (var skill in trendingSkills.Take(3))
                {
                    var currentLevel = employeeSkillLookup.GetValueOrDefault(skill.Id, 0);
                    if (currentLevel < 3) // Suggest if below intermediate level
                    {
                        recommendations.Add(new SkillDevelopmentRecommendation
                        {
                            Skill = skill,
                            CurrentLevel = currentLevel,
                            RecommendedLevel = 3,
                            Gap = 3 - currentLevel,
                            Priority = "Low",
                            Reason = "Trending skill in organization",
                            SuggestedActions = GenerateSkillDevelopmentActions(skill, 3 - currentLevel)
                        });
                    }
                }

                return ServiceResult<List<SkillDevelopmentRecommendation>>.Success(
                    recommendations.OrderBy(r => r.Priority == "High" ? 1 : r.Priority == "Medium" ? 2 : 3)
                                  .ThenByDescending(r => r.Gap)
                                  .ToList());
            }
            catch (Exception ex)
            {
                return ServiceResult<List<SkillDevelopmentRecommendation>>.Failure($"Failed to recommend skills: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<TalentRisk>>> IdentifyTalentRisksAsync()
        {
            try
            {
                var risks = new List<TalentRisk>();

                // 1. High Performers with No Career Path
                var highPerformersNoPaths = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.CurrentPosition)
                    .ThenInclude(p => p.Department)
                    .Include(e => e.PerformanceReviews)
                    .Where(e => e.CurrentPosition != null)
                    .ToListAsync();

                foreach (var employee in highPerformersNoPaths)
                {
                    var avgRating = employee.PerformanceReviews
                        .Where(pr => pr.Status == "Completed")
                        .OrderByDescending(pr => pr.ReviewPeriodEnd)
                        .Take(3)
                        .DefaultIfEmpty()
                        .Average(pr => pr?.OverallRating ?? 0);

                    if (avgRating >= 4.0m) // High performer
                    {
                        var hasCareerPaths = await _context.CareerPaths
                            .AnyAsync(cp => cp.FromPositionId == employee.CurrentPositionId && cp.IsActive);

                        if (!hasCareerPaths)
                        {
                            risks.Add(new TalentRisk
                            {
                                Employee = employee,
                                RiskType = "No Career Progression",
                                RiskLevel = "High",
                                Description = $"High-performing employee {employee.FirstName} {employee.LastName} has no defined career paths",
                                Impact = "May lead to disengagement and attrition",
                                RecommendedAction = "Create career development plan and define advancement opportunities"
                            });
                        }
                    }
                }

                // 2. Long-tenured employees without recent promotions
                var longTenuredEmployees = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.RequestsMade)
                    .Where(e => e.HireDate <= DateTime.UtcNow.AddYears(-3))
                    .ToListAsync();

                foreach (var employee in longTenuredEmployees)
                {
                    var hasRecentPromotionRequest = employee.RequestsMade
                        .Any(r => r.RequestType == "Promotion" &&
                                 r.RequestDate >= DateTime.UtcNow.AddYears(-2) &&
                                 r.Status == "HRApproved");

                    if (!hasRecentPromotionRequest)
                    {
                        risks.Add(new TalentRisk
                        {
                            Employee = employee,
                            RiskType = "Career Stagnation",
                            RiskLevel = "Medium",
                            Description = $"Employee {employee.FirstName} {employee.LastName} has been in role for {(DateTime.UtcNow - employee.HireDate).TotalDays / 365:F1} years without promotion",
                            Impact = "Risk of disengagement and seeking external opportunities",
                            RecommendedAction = "Review performance and discuss career aspirations"
                        });
                    }
                }

                // 3. Key position holders without successors
                var keyPositionsResult = await _successionPlanningService.IdentifySuccessionRisksAsync();
                if (keyPositionsResult.IsSuccess)
                {
                    foreach (var successionRisk in keyPositionsResult.Data!)
                    {
                        if (successionRisk.RiskType == "No Succession Plan" && successionRisk.Employee != null)
                        {
                            risks.Add(new TalentRisk
                            {
                                Employee = successionRisk.Employee,
                                RiskType = "Key Person Risk",
                                RiskLevel = successionRisk.RiskLevel,
                                Description = successionRisk.Description,
                                Impact = "Business continuity risk if employee leaves unexpectedly",
                                RecommendedAction = successionRisk.RecommendedAction
                            });
                        }
                    }
                }

                return ServiceResult<List<TalentRisk>>.Success(risks);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<TalentRisk>>.Failure($"Failed to identify talent risks: {ex.Message}");
            }
        }

        #endregion

        #region Performance & Career Integration

        public async Task<ServiceResult<CareerPerformanceInsight>> AnalyzeCareerPerformancePatternAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.PerformanceReviews)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<CareerPerformanceInsight>.Failure("Employee not found");

                var insight = new CareerPerformanceInsight
                {
                    EmployeeId = employeeId
                };

                var reviews = employee.PerformanceReviews
                    .Where(pr => pr.Status == "Completed")
                    .OrderBy(pr => pr.ReviewPeriodEnd)
                    .ToList();

                if (reviews.Count >= 2)
                {
                    var recent = reviews.TakeLast(3).ToList();
                    var older = reviews.Take(reviews.Count - 3).ToList();

                    insight.CurrentAverageRating = (double)recent.Average(r => r.OverallRating);
                    insight.HistoricalAverageRating = older.Any() ? (double)older.Average(r => r.OverallRating) : insight.CurrentAverageRating;

                    insight.PerformanceTrend = insight.CurrentAverageRating > insight.HistoricalAverageRating + 0.2 ? "Improving" :
                                             insight.CurrentAverageRating < insight.HistoricalAverageRating - 0.2 ? "Declining" : "Stable";

                    // Calculate consistency
                    var variance = CalculateVariance(reviews.Select(r => (double)r.OverallRating));
                    insight.PerformanceConsistency = variance < 0.5 ? "High" : variance < 1.0 ? "Medium" : "Low";

                    // Generate insights based on patterns
                    if (insight.CurrentAverageRating >= 4.0 && insight.PerformanceTrend == "Improving")
                    {
                        insight.Insights.Add("Strong performer with upward trajectory - excellent promotion candidate");
                    }
                    else if (insight.PerformanceTrend == "Declining")
                    {
                        insight.Insights.Add("Performance decline detected - consider providing additional support or training");
                    }

                    if (insight.PerformanceConsistency == "High" && insight.CurrentAverageRating >= 3.5)
                    {
                        insight.Insights.Add("Reliable performer - good candidate for succession planning");
                    }
                }

                return ServiceResult<CareerPerformanceInsight>.Success(insight);
            }
            catch (Exception ex)
            {
                return ServiceResult<CareerPerformanceInsight>.Failure($"Failed to analyze performance pattern: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> ProcessPerformanceReviewCompletionAsync(int performanceReviewId)
        {
            try
            {
                var review = await _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .ThenInclude(e => e.User)
                    .FirstOrDefaultAsync(pr => pr.Id == performanceReviewId);

                if (review == null)
                    return ServiceResult<bool>.Failure("Performance review not found");

                // Trigger career intelligence analysis
                var intelligenceReport = await GenerateEmployeeCareerIntelligenceAsync(review.EmployeeId);

                // Send proactive notifications based on performance
                if (review.OverallRating >= 4.0m)
                {
                    await _notificationService.NotifyAsync(
                        review.Employee.User.Id,
                        "Career Development Opportunity",
                        "Based on your excellent performance review, new career opportunities may be available. Check your career recommendations!",
                        "CareerOpportunity",
                        review.EmployeeId
                    );

                    // Notify HR about high performer
                    await _notificationService.NotifyHRAsync(
                        "High Performer Identified",
                        $"{review.Employee.FirstName} {review.Employee.LastName} received a {review.OverallRating} rating - consider for career advancement",
                        "HighPerformer",
                        review.EmployeeId
                    );
                }

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to process performance review completion: {ex.Message}");
            }
        }

        public async Task<ServiceResult<bool>> ProcessEmployeeRequestCompletionAsync(int requestId)
        {
            try
            {
                var request = await _context.EmployeeRequests
                    .Include(r => r.Requester)
                    .ThenInclude(e => e.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null || request.Status != "HRApproved")
                    return ServiceResult<bool>.Failure("Request not found or not approved");

                // Update career intelligence based on request type
                if (request.RequestType == "Promotion")
                {
                    // Trigger succession planning analysis for the old position
                    var employee = request.TargetEmployee ?? request.Requester;
                    if (employee.CurrentPositionId.HasValue)
                    {
                        await _successionPlanningService.GetSmartCandidatesForPositionAsync(employee.CurrentPositionId.Value);
                    }

                    // Send congratulatory notification with next steps
                    await _notificationService.NotifyAsync(
                        request.Requester.User.Id,
                        "Promotion Approved - Next Steps",
                        "Congratulations! Your promotion has been approved. We'll update your career profile and identify new development opportunities.",
                        "PromotionApproved",
                        requestId
                    );
                }

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Failed to process request completion: {ex.Message}");
            }
        }

        #endregion

        #region Predictive Analytics

        public async Task<ServiceResult<PromotionReadinessScore>> PredictPromotionReadinessAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.PerformanceReviews)
                    .Include(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(e => e.RequestsMade)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee?.CurrentPosition == null)
                    return ServiceResult<PromotionReadinessScore>.Failure("Employee or position not found");

                var score = new PromotionReadinessScore
                {
                    EmployeeId = employeeId,
                    CalculatedDate = DateTime.UtcNow
                };

                var factors = new List<double>();
                var factorDescriptions = new List<string>();

                // 1. Performance Factor (40% weight)
                var recentReviews = employee.PerformanceReviews
                    .Where(pr => pr.Status == "Completed")
                    .OrderByDescending(pr => pr.ReviewPeriodEnd)
                    .Take(3)
                    .ToList();

                if (recentReviews.Any())
                {
                    var avgRating = (double)recentReviews.Average(pr => pr.OverallRating);
                    var performanceScore = (avgRating - 1) * 25; // Convert 1-5 scale to 0-100
                    factors.Add(performanceScore * 0.4);
                    factorDescriptions.Add($"Performance: {avgRating:F1}/5.0 ({performanceScore:F1}%)");
                }

                // 2. Tenure Factor (20% weight)
                var yearsInRole = (DateTime.UtcNow - employee.HireDate).TotalDays / 365.25;
                var tenureScore = Math.Min(100, yearsInRole * 33.33); // 3+ years = 100%
                factors.Add(tenureScore * 0.2);
                factorDescriptions.Add($"Tenure: {yearsInRole:F1} years ({tenureScore:F1}%)");

                // 3. Skills Factor (25% weight)
                var skillsScore = await CalculateSkillsReadinessScore(employee);
                factors.Add(skillsScore * 0.25);
                factorDescriptions.Add($"Skills Readiness: {skillsScore:F1}%");

                // 4. Career Engagement Factor (15% weight)
                var engagementScore = CalculateCareerEngagementScore(employee);
                factors.Add(engagementScore * 0.15);
                factorDescriptions.Add($"Career Engagement: {engagementScore:F1}%");

                score.OverallScore = factors.Sum();
                score.Factors = factorDescriptions;

                // Determine readiness level
                score.ReadinessLevel = score.OverallScore >= 80 ? "High" :
                                     score.OverallScore >= 60 ? "Medium" : "Low";

                // Generate recommendations
                score.Recommendations = GeneratePromotionRecommendations(score, employee);

                return ServiceResult<PromotionReadinessScore>.Success(score);
            }
            catch (Exception ex)
            {
                return ServiceResult<PromotionReadinessScore>.Failure($"Failed to predict promotion readiness: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<AttritionRisk>>> PredictAttritionRisksAsync()
        {
            try
            {
                var risks = new List<AttritionRisk>();

                // Get employees with risk indicators
                var employees = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.CurrentPosition)
                    .ThenInclude(p => p.Department)
                    .Include(e => e.PerformanceReviews)
                    .Include(e => e.RequestsMade)
                    .Include(e => e.EmployeeSkills)
                    .ToListAsync();

                foreach (var employee in employees)
                {
                    var riskScore = 0;
                    var riskFactors = new List<string>();

                    // Factor 1: Long tenure without promotion
                    var yearsInRole = (DateTime.UtcNow - employee.HireDate).TotalDays / 365.25;
                    if (yearsInRole > 3)
                    {
                        var recentPromotions = employee.RequestsMade
                            .Where(r => r.RequestType == "Promotion" && r.Status == "HRApproved")
                            .Any(r => r.RequestDate >= DateTime.UtcNow.AddYears(-2));

                        if (!recentPromotions)
                        {
                            riskScore += 30;
                            riskFactors.Add($"No promotions in {yearsInRole:F1} years");
                        }
                    }

                    // Factor 2: Performance trend
                    var recentReviews = employee.PerformanceReviews
                        .Where(pr => pr.Status == "Completed")
                        .OrderByDescending(pr => pr.ReviewPeriodEnd)
                        .Take(3)
                        .ToList();

                    if (recentReviews.Count >= 2)
                    {
                        var recent = (double)recentReviews.First().OverallRating;
                        var previous = (double)recentReviews.Skip(1).Average(pr => pr.OverallRating);

                        if (recent < previous - 0.5)
                        {
                            riskScore += 25;
                            riskFactors.Add("Declining performance trend");
                        }
                        else if (recent >= 4.0 && previous >= 4.0)
                        {
                            riskScore += 20; // High performers are attractive to other companies
                            riskFactors.Add("High performer (flight risk)");
                        }
                    }

                    // Factor 3: Request patterns
                    var recentRequests = employee.RequestsMade
                        .Where(r => r.RequestDate >= DateTime.UtcNow.AddMonths(-6))
                        .ToList();

                    var rejectedRequests = recentRequests.Count(r => r.Status == "Rejected");
                    if (rejectedRequests >= 2)
                    {
                        riskScore += 20;
                        riskFactors.Add($"{rejectedRequests} requests rejected recently");
                    }

                    // Factor 4: Skills vs. market demand
                    var hasMarketableSkills = employee.EmployeeSkills
                        .Any(es => es.ProficiencyLevel >= 4 &&
                                  (es.Skill.Category == "Technical" || es.Skill.Category == "Leadership"));

                    if (hasMarketableSkills)
                    {
                        riskScore += 15;
                        riskFactors.Add("Has highly marketable skills");
                    }

                    // Factor 5: Department stability
                    var departmentTurnover = await CalculateDepartmentTurnoverRate(employee.DepartmentId);
                    if (departmentTurnover > 0.15) // >15% turnover
                    {
                        riskScore += 15;
                        riskFactors.Add($"High department turnover ({departmentTurnover:P0})");
                    }

                    // Only include employees with significant risk
                    if (riskScore >= 50)
                    {
                        risks.Add(new AttritionRisk
                        {
                            Employee = employee,
                            RiskScore = riskScore,
                            RiskLevel = riskScore >= 80 ? "Critical" :
                                       riskScore >= 65 ? "High" : "Medium",
                            RiskFactors = riskFactors,
                            RecommendedActions = GenerateRetentionRecommendations(riskFactors, employee)
                        });
                    }
                }

                return ServiceResult<List<AttritionRisk>>.Success(
                    risks.OrderByDescending(r => r.RiskScore).ToList());
            }
            catch (Exception ex)
            {
                return ServiceResult<List<AttritionRisk>>.Failure($"Failed to predict attrition risks: {ex.Message}");
            }
        }

        public async Task<ServiceResult<TeamDynamicsInsight>> AnalyzeTeamDynamicsAsync(int managerId)
        {
            try
            {
                var manager = await _context.Employees
                    .Include(e => e.DirectReports)
                    .ThenInclude(dr => dr.User)
                    .Include(e => e.DirectReports)
                    .ThenInclude(dr => dr.CurrentPosition)
                    .Include(e => e.DirectReports)
                    .ThenInclude(dr => dr.PerformanceReviews)
                    .FirstOrDefaultAsync(e => e.Id == managerId);

                if (manager?.DirectReports?.Any() != true)
                    return ServiceResult<TeamDynamicsInsight>.Failure("Manager not found or has no direct reports");

                var insight = new TeamDynamicsInsight
                {
                    ManagerId = managerId,
                    TeamSize = manager.DirectReports.Count,
                    AnalysisDate = DateTime.UtcNow
                };

                // Performance distribution
                var performanceRatings = new List<double>();
                foreach (var directReport in manager.DirectReports)
                {
                    var recentReview = directReport.PerformanceReviews
                        .Where(pr => pr.Status == "Completed")
                        .OrderByDescending(pr => pr.ReviewPeriodEnd)
                        .FirstOrDefault();

                    if (recentReview != null)
                    {
                        performanceRatings.Add((double)recentReview.OverallRating);
                    }
                }

                if (performanceRatings.Any())
                {
                    insight.AverageTeamPerformance = performanceRatings.Average();
                    insight.PerformanceVariation = CalculateVariance(performanceRatings);

                    var highPerformers = performanceRatings.Count(r => r >= 4.0);
                    var lowPerformers = performanceRatings.Count(r => r < 3.0);

                    insight.HighPerformerCount = highPerformers;
                    insight.LowPerformerCount = lowPerformers;
                }

                // Team development opportunities
                insight.DevelopmentOpportunities = await IdentifyTeamDevelopmentOpportunities(manager.DirectReports.ToList());

                // Team insights
                insight.Insights = GenerateTeamInsights(insight);

                return ServiceResult<TeamDynamicsInsight>.Success(insight);
            }
            catch (Exception ex)
            {
                return ServiceResult<TeamDynamicsInsight>.Failure($"Failed to analyze team dynamics: {ex.Message}");
            }
        }

        #endregion

        #region Smart Dashboard & Analytics (replaces Reports controller)

        public async Task<ServiceResult<IntelligentDashboard>> GetIntelligentDashboardAsync(int? employeeId = null, string? userRole = null)
        {
            try
            {
                var dashboard = new IntelligentDashboard
                {
                    GeneratedDate = DateTime.UtcNow,
                    UserRole = userRole ?? "Employee"
                };

                if (employeeId.HasValue)
                {
                    // Employee-specific dashboard
                    var intelligenceReport = await GenerateEmployeeCareerIntelligenceAsync(employeeId.Value);
                    if (intelligenceReport.IsSuccess)
                    {
                        dashboard.PersonalInsights = intelligenceReport.Data;
                    }

                    var opportunities = await IdentifyCareerOpportunitiesAsync(employeeId.Value);
                    if (opportunities.IsSuccess)
                    {
                        dashboard.CareerOpportunities = opportunities.Data!.Take(5).ToList();
                    }

                    var skillRecommendations = await RecommendSkillDevelopmentAsync(employeeId.Value);
                    if (skillRecommendations.IsSuccess)
                    {
                        dashboard.SkillRecommendations = skillRecommendations.Data!.Take(5).ToList();
                    }
                }

                // Role-based organizational insights
                if (userRole == "HR" || userRole == "Admin")
                {
                    var orgIntelligence = await GenerateOrganizationIntelligenceAsync();
                    if (orgIntelligence.IsSuccess)
                    {
                        dashboard.OrganizationInsights = orgIntelligence.Data;
                    }

                    var talentRisks = await IdentifyTalentRisksAsync();
                    if (talentRisks.IsSuccess)
                    {
                        dashboard.TalentRisks = talentRisks.Data!.Take(5).ToList();
                    }

                    var attritionRisks = await PredictAttritionRisksAsync();
                    if (attritionRisks.IsSuccess)
                    {
                        dashboard.AttritionRisks = attritionRisks.Data!.Take(5).ToList();
                    }
                }
                else if (userRole == "Manager" && employeeId.HasValue)
                {
                    var teamInsights = await AnalyzeTeamDynamicsAsync(employeeId.Value);
                    if (teamInsights.IsSuccess)
                    {
                        dashboard.TeamInsights = teamInsights.Data;
                    }
                }

                // Smart recommendations for all users
                var recommendations = await GetSmartRecommendationsAsync(employeeId);
                if (recommendations.IsSuccess)
                {
                    dashboard.SmartRecommendations = recommendations.Data!.Take(8).ToList();
                }

                // Quick stats
                dashboard.QuickStats = await GenerateQuickStatsAsync(userRole, employeeId);

                return ServiceResult<IntelligentDashboard>.Success(dashboard);
            }
            catch (Exception ex)
            {
                return ServiceResult<IntelligentDashboard>.Failure($"Failed to generate intelligent dashboard: {ex.Message}");
            }
        }

        public async Task<ServiceResult<DepartmentIntelligence>> GetDepartmentIntelligenceAsync(int departmentId)
        {
            try
            {
                var department = await _context.Departments
                    .Include(d => d.Employees)
                    .ThenInclude(e => e.User)
                    .Include(d => d.Employees)
                    .ThenInclude(e => e.CurrentPosition)
                    .Include(d => d.Employees)
                    .ThenInclude(e => e.PerformanceReviews)
                    .Include(d => d.Employees)
                    .ThenInclude(e => e.EmployeeSkills)
                    .ThenInclude(es => es.Skill)
                    .Include(d => d.Positions)
                    .FirstOrDefaultAsync(d => d.Id == departmentId);

                if (department == null)
                    return ServiceResult<DepartmentIntelligence>.Failure("Department not found");

                var intelligence = new DepartmentIntelligence
                {
                    Department = department,
                    AnalysisDate = DateTime.UtcNow
                };

                // Performance metrics
                var allReviews = department.Employees
                    .SelectMany(e => e.PerformanceReviews.Where(pr => pr.Status == "Completed"))
                    .ToList();

                if (allReviews.Any())
                {
                    intelligence.AveragePerformance = (double)allReviews.Average(pr => pr.OverallRating);

                    var recentReviews = allReviews.Where(pr => pr.ReviewPeriodEnd >= DateTime.UtcNow.AddMonths(-12));
                    intelligence.PerformanceTrend = CalculatePerformanceTrend(recentReviews);
                }

                // Skills analysis
                var departmentSkills = department.Employees
                    .SelectMany(e => e.EmployeeSkills)
                    .GroupBy(es => es.Skill)
                    .Select(g => new SkillStrength
                    {
                        Skill = g.Key,
                        EmployeeCount = g.Count(),
                        AverageProficiency = g.Average(es => es.ProficiencyLevel),
                        MaxProficiency = g.Max(es => es.ProficiencyLevel)
                    })
                    .OrderByDescending(ss => ss.EmployeeCount)
                    .ThenByDescending(ss => ss.AverageProficiency)
                    .Take(10)
                    .ToList();

                intelligence.TopSkills = departmentSkills;

                // Talent risks specific to department
                var deptTalentRisks = await IdentifyTalentRisksAsync();
                if (deptTalentRisks.IsSuccess)
                {
                    intelligence.TalentRisks = deptTalentRisks.Data!
                        .Where(tr => tr.Employee.DepartmentId == departmentId)
                        .ToList();
                }

                // Career development opportunities
                intelligence.CareerDevelopmentOpportunities = await IdentifyDepartmentCareerOpportunities(departmentId);

                // Succession readiness
                var successionReport = await _successionPlanningService.GenerateSuccessionReadinessReportAsync(departmentId);
                if (successionReport.IsSuccess)
                {
                    intelligence.SuccessionReadiness = successionReport.Data;
                }

                return ServiceResult<DepartmentIntelligence>.Success(intelligence);
            }
            catch (Exception ex)
            {
                return ServiceResult<DepartmentIntelligence>.Failure($"Failed to generate department intelligence: {ex.Message}");
            }
        }

        public async Task<ServiceResult<SkillsIntelligence>> GetSkillsIntelligenceAsync(int? departmentId = null)
        {
            try
            {
                var intelligence = new SkillsIntelligence
                {
                    AnalysisDate = DateTime.UtcNow,
                    DepartmentId = departmentId
                };

                var query = _context.EmployeeSkills
                    .Include(es => es.Skill)
                    .Include(es => es.Employee)
                    .ThenInclude(e => e.Department)
                    .AsQueryable();

                if (departmentId.HasValue)
                {
                    query = query.Where(es => es.Employee.DepartmentId == departmentId.Value);
                }

                var allSkills = await query.ToListAsync();

                // Most common skills
                intelligence.MostCommonSkills = allSkills
                    .GroupBy(es => es.Skill)
                    .Select(g => new SkillStatistic
                    {
                        Skill = g.Key,
                        EmployeeCount = g.Count(),
                        AverageProficiency = g.Average(es => es.ProficiencyLevel),
                        HighProficiencyCount = g.Count(es => es.ProficiencyLevel >= 4)
                    })
                    .OrderByDescending(ss => ss.EmployeeCount)
                    .Take(10)
                    .ToList();

                // Skills gaps (skills in demand but low proficiency)
                intelligence.SkillGaps = await IdentifySkillGaps(departmentId);

                // Emerging skills (recently acquired or trending)
                intelligence.EmergingSkills = allSkills
                    .Where(es => es.AcquiredDate >= DateTime.UtcNow.AddMonths(-12))
                    .GroupBy(es => es.Skill)
                    .Select(g => new SkillStatistic
                    {
                        Skill = g.Key,
                        EmployeeCount = g.Count(),
                        AverageProficiency = g.Average(es => es.ProficiencyLevel)
                    })
                    .OrderByDescending(ss => ss.EmployeeCount)
                    .Take(10)
                    .ToList();

                // Skill development recommendations
                intelligence.DevelopmentRecommendations = await GenerateOrganizationSkillRecommendations(departmentId);

                return ServiceResult<SkillsIntelligence>.Success(intelligence);
            }
            catch (Exception ex)
            {
                return ServiceResult<SkillsIntelligence>.Failure($"Failed to generate skills intelligence: {ex.Message}");
            }
        }

        #endregion

        #region Private Helper Methods

        private async Task<List<SmartRecommendation>> GenerateEmployeeRecommendationsAsync(int employeeId)
        {
            var recommendations = new List<SmartRecommendation>();

            // Career path recommendations
            var careerPathsResult = await _careerPathService.GetRecommendedPathsForEmployeeAsync(employeeId);
            if (careerPathsResult.IsSuccess)
            {
                foreach (var path in careerPathsResult.Data!.Take(3))
                {
                    recommendations.Add(new SmartRecommendation
                    {
                        Type = "Career Path",
                        Title = $"Explore path to {path.CareerPath.ToPosition.Title}",
                        Description = $"You're {path.ReadinessScore:F0}% ready for this role",
                        Priority = path.ReadinessScore >= 80 ? 90 : path.ReadinessScore >= 60 ? 70 : 50,
                        ActionUrl = $"/career-paths/{path.CareerPath.Id}/analyze"
                    });
                }
            }

            // Skill development recommendations
            var skillsResult = await RecommendSkillDevelopmentAsync(employeeId);
            if (skillsResult.IsSuccess)
            {
                foreach (var skill in skillsResult.Data!.Take(2))
                {
                    recommendations.Add(new SmartRecommendation
                    {
                        Type = "Skill Development",
                        Title = $"Develop {skill.Skill.Name} skills",
                        Description = $"Improve from level {skill.CurrentLevel} to {skill.RecommendedLevel}",
                        Priority = skill.Priority == "High" ? 85 : 60,
                        ActionUrl = $"/skills/development/{skill.Skill.Id}"
                    });
                }
            }

            return recommendations;
        }

        private async Task<List<SmartRecommendation>> GenerateOrganizationRecommendationsAsync()
        {
            var recommendations = new List<SmartRecommendation>();

            // Talent risk recommendations
            var talentRisks = await IdentifyTalentRisksAsync();
            if (talentRisks.IsSuccess)
            {
                foreach (var risk in talentRisks.Data!.Take(3))
                {
                    recommendations.Add(new SmartRecommendation
                    {
                        Type = "Talent Risk",
                        Title = $"Address {risk.RiskType.ToLower()} for {risk.Employee.FirstName} {risk.Employee.LastName}",
                        Description = risk.RecommendedAction,
                        Priority = risk.RiskLevel == "High" ? 95 : 75,
                        ActionUrl = $"/employees/{risk.Employee.Id}"
                    });
                }
            }

            // Succession planning recommendations
            var successionRecs = await _successionPlanningService.GetSuccessionRecommendationsAsync();
            if (successionRecs.IsSuccess)
            {
                foreach (var rec in successionRecs.Data!.Take(3))
                {
                    recommendations.Add(new SmartRecommendation
                    {
                        Type = "Succession Planning",
                        Title = rec.Description,
                        Description = $"{rec.Type} - {rec.Priority} priority",
                        Priority = rec.Priority == "High" ? 90 : 70,
                        ActionUrl = rec.PositionId.HasValue ? $"/positions/{rec.PositionId}/succession" : "/succession"
                    });
                }
            }

            return recommendations;
        }

        private List<string> GenerateSmartInsights(CareerIntelligenceReport report)
        {
            var insights = new List<string>();

            if (report.PromotionReadiness?.ReadinessLevel == "High")
            {
                insights.Add($"You're highly ready for promotion with a {report.PromotionReadiness.OverallScore:F0}% readiness score");
            }

            if (report.CareerPathRecommendations.Any())
            {
                var topPath = report.CareerPathRecommendations.First();
                insights.Add($"Your top career path is to {topPath.CareerPath.ToPosition.Title} with {topPath.ReadinessScore:F0}% readiness");
            }

            if (report.SkillDevelopmentRecommendations.Count(s => s.Priority == "High") >= 2)
            {
                insights.Add("Focus on developing high-priority skills to accelerate your career growth");
            }

            if (report.PerformanceInsight?.PerformanceTrend == "Improving")
            {
                insights.Add("Your performance is trending upward - great time to pursue new opportunities!");
            }

            return insights;
        }

        private async Task<double> CalculatePositionMatchScore(Employee employee, Position position)
        {
            double score = 50; // Base score

            // Department familiarity
            if (employee.DepartmentId == position.DepartmentId)
                score += 20;

            // Performance factor
            var recentReview = employee.PerformanceReviews
                ?.Where(pr => pr.Status == "Completed")
                ?.OrderByDescending(pr => pr.ReviewPeriodEnd)
                ?.FirstOrDefault();

            if (recentReview != null && recentReview.OverallRating >= 3.5m)
                score += 20;

            // Skills factor (simplified)
            var hasRelevantSkills = employee.EmployeeSkills.Any(es => es.ProficiencyLevel >= 3);
            if (hasRelevantSkills)
                score += 10;

            return Math.Min(100, score);
        }

        private async Task<List<CareerOpportunity>> IdentifyCrossTrainingOpportunities(Employee employee)
        {
            var opportunities = new List<CareerOpportunity>();

            // Find departments with skill gaps that match employee's strengths
            var employeeTopSkills = employee.EmployeeSkills
                .Where(es => es.ProficiencyLevel >= 4)
                .Select(es => es.Skill)
                .ToList();

            if (employeeTopSkills.Any())
            {
                // Simplified cross-training identification
                var otherDepartments = await _context.Departments
                    .Where(d => d.Id != employee.DepartmentId && d.IsActive)
                    .Take(3)
                    .ToListAsync();

                foreach (var dept in otherDepartments)
                {
                    opportunities.Add(new CareerOpportunity
                    {
                        Type = "Cross-Training",
                        Title = $"Cross-train with {dept.Name}",
                        Department = dept.Name,
                        MatchScore = 70,
                        Description = $"Share your expertise in {string.Join(", ", employeeTopSkills.Take(2).Select(s => s.Name))}",
                        RecommendedAction = "Discuss with your manager",
                        Priority = "Low",
                        RelatedId = dept.Id
                    });
                }
            }

            return opportunities;
        }

        private async Task<List<Skill>> IdentifyTrendingSkillsInOrganization()
        {
            return await _context.EmployeeSkills
                .Where(es => es.AcquiredDate >= DateTime.UtcNow.AddMonths(-6))
                .GroupBy(es => es.Skill)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .Take(5)
                .ToListAsync();
        }

        private List<string> GenerateSkillDevelopmentActions(Skill skill, int gap)
        {
            var actions = new List<string>();

            if (gap <= 1)
            {
                actions.Add("Practice through current work assignments");
                actions.Add("Find a mentor in this skill area");
            }
            else if (gap <= 2)
            {
                actions.Add("Enroll in online training course");
                actions.Add("Join relevant professional communities");
                actions.Add("Take on projects that use this skill");
            }
            else
            {
                actions.Add("Complete formal training program");
                actions.Add("Consider certification in this area");
                actions.Add("Shadow experts in the organization");
            }

            return actions;
        }

        private async Task<double> CalculateSkillsReadinessScore(Employee employee)
        {
            if (!employee.EmployeeSkills.Any()) return 50; // Default if no skills

            var avgProficiency = employee.EmployeeSkills.Average(es => es.ProficiencyLevel);
            return Math.Min(100, avgProficiency * 20); // Convert 1-5 scale to 0-100
        }

        private double CalculateCareerEngagementScore(Employee employee)
        {
            var score = 50.0; // Base score

            // Recent requests show engagement
            var recentRequests = employee.RequestsMade
                .Count(r => r.RequestDate >= DateTime.UtcNow.AddMonths(-12));
            score += Math.Min(30, recentRequests * 10);

            // Skills updated recently
            var recentSkillUpdates = employee.EmployeeSkills
                .Count(es => es.LastAssessedDate >= DateTime.UtcNow.AddMonths(-6));
            score += Math.Min(20, recentSkillUpdates * 5);

            return Math.Min(100, score);
        }

        private List<string> GeneratePromotionRecommendations(PromotionReadinessScore score, Employee employee)
        {
            var recommendations = new List<string>();

            if (score.ReadinessLevel == "High")
            {
                recommendations.Add("Discuss promotion opportunities with your manager");
                recommendations.Add("Update your career goals and aspirations");
            }
            else if (score.ReadinessLevel == "Medium")
            {
                recommendations.Add("Focus on skill development in key areas");
                recommendations.Add("Seek additional responsibilities to demonstrate readiness");
            }
            else
            {
                recommendations.Add("Build foundation skills and gain more experience");
                recommendations.Add("Set clear development goals with your manager");
            }

            return recommendations;
        }

        private List<string> GenerateRetentionRecommendations(List<string> riskFactors, Employee employee)
        {
            var recommendations = new List<string>();

            if (riskFactors.Any(f => f.Contains("promotion")))
            {
                recommendations.Add("Discuss career advancement opportunities");
                recommendations.Add("Create clear promotion timeline");
            }

            if (riskFactors.Any(f => f.Contains("performance")))
            {
                recommendations.Add("Provide additional support and coaching");
                recommendations.Add("Identify root causes of performance issues");
            }

            if (riskFactors.Any(f => f.Contains("rejected")))
            {
                recommendations.Add("Review recent request decisions and provide feedback");
                recommendations.Add("Schedule one-on-one to address concerns");
            }

            return recommendations;
        }

        private async Task<double> CalculateDepartmentTurnoverRate(int departmentId)
        {
            // Simplified calculation - in reality you'd track departures
            var totalEmployees = await _context.Employees
                .CountAsync(e => e.DepartmentId == departmentId);

            // Mock calculation based on inactive users (simplified)
            var inactiveUsers = await _context.Users
                .Where(u => !u.IsActive && u.Employee != null && u.Employee.DepartmentId == departmentId)
                .CountAsync();

            return totalEmployees > 0 ? (double)inactiveUsers / totalEmployees : 0;
        }

        private double CalculateVariance(IEnumerable<double> values)
        {
            if (!values.Any()) return 0;

            var mean = values.Average();
            return values.Average(v => Math.Pow(v - mean, 2));
        }

        private async Task<List<DepartmentInsight>> GenerateDepartmentInsightsAsync()
        {
            var insights = new List<DepartmentInsight>();

            var departments = await _context.Departments
                .Include(d => d.Employees)
                .ThenInclude(e => e.PerformanceReviews)
                .Where(d => d.IsActive)
                .ToListAsync();

            foreach (var dept in departments)
            {
                var insight = new DepartmentInsight
                {
                    Department = dept,
                    EmployeeCount = dept.Employees.Count
                };

                var allReviews = dept.Employees
                    .SelectMany(e => e.PerformanceReviews.Where(pr => pr.Status == "Completed"))
                    .ToList();

                if (allReviews.Any())
                {
                    insight.AveragePerformance = (double)allReviews.Average(pr => pr.OverallRating);
                }

                insights.Add(insight);
            }

            return insights;
        }

        private async Task<List<OrganizationSkillGap>> IdentifyOrganizationSkillGapsAsync()
        {
            // Simplified - identify skills mentioned in career paths but lacking in organization
            var requiredSkills = await _context.CareerPathSkills
                .Include(cps => cps.Skill)
                .GroupBy(cps => cps.Skill)
                .Select(g => new { Skill = g.Key, MinLevel = g.Average(cps => cps.MinProficiencyLevel) })
                .ToListAsync();

            var gaps = new List<OrganizationSkillGap>();

            foreach (var required in requiredSkills)
            {
                var employeesWithSkill = await _context.EmployeeSkills
                    .Where(es => es.SkillId == required.Skill.Id)
                    .ToListAsync();

                var avgLevel = employeesWithSkill.Any()
                    ? employeesWithSkill.Average(es => es.ProficiencyLevel)
                    : 0;

                if (avgLevel < required.MinLevel)
                {
                    gaps.Add(new OrganizationSkillGap
                    {
                        Skill = required.Skill,
                        RequiredLevel = required.MinLevel,
                        CurrentAverageLevel = avgLevel,
                        Gap = required.MinLevel - avgLevel,
                        EmployeesWithSkill = employeesWithSkill.Count,
                        Priority = required.MinLevel - avgLevel > 2 ? "High" : "Medium"
                    });
                }
            }

            return gaps.OrderByDescending(g => g.Gap).Take(10).ToList();
        }

        private async Task<CareerPathUtilization> AnalyzeCareerPathUtilizationAsync()
        {
            var totalPaths = await _context.CareerPaths.CountAsync(cp => cp.IsActive);
            var pathsWithCandidates = await _context.CareerPaths
                .Where(cp => cp.IsActive)
                .CountAsync(cp => _context.EmployeeRequests
                    .Any(r => r.RequestType == "Promotion" && r.Status == "HRApproved"));

            return new CareerPathUtilization
            {
                TotalActivePaths = totalPaths,
                PathsWithActivity = pathsWithCandidates,
                UtilizationRate = totalPaths > 0 ? (double)pathsWithCandidates / totalPaths : 0
            };
        }

        private async Task<PerformanceTrends> AnalyzeOrganizationPerformanceTrendsAsync()
        {
            var recentReviews = await _context.PerformanceReviews
                .Where(pr => pr.Status == "Completed" && pr.ReviewPeriodEnd >= DateTime.UtcNow.AddMonths(-12))
                .ToListAsync();

            var olderReviews = await _context.PerformanceReviews
                .Where(pr => pr.Status == "Completed" &&
                           pr.ReviewPeriodEnd >= DateTime.UtcNow.AddMonths(-24) &&
                           pr.ReviewPeriodEnd < DateTime.UtcNow.AddMonths(-12))
                .ToListAsync();

            return new PerformanceTrends
            {
                CurrentPeriodAverage = recentReviews.Any() ? (double)recentReviews.Average(pr => pr.OverallRating) : 0,
                PreviousPeriodAverage = olderReviews.Any() ? (double)olderReviews.Average(pr => pr.OverallRating) : 0,
                TotalReviews = recentReviews.Count,
                TrendDirection = recentReviews.Any() && olderReviews.Any()
                    ? (recentReviews.Average(pr => pr.OverallRating) > olderReviews.Average(pr => pr.OverallRating) ? "Improving" : "Declining")
                    : "Stable"
            };
        }

        private async Task<List<string>> GenerateStrategicRecommendationsAsync()
        {
            var recommendations = new List<string>();

            // Analyze succession coverage
            var keyPositions = await _context.Positions.CountAsync(p => p.IsKeyPosition && p.IsActive);
            var keyPositionsWithPlans = await _context.Positions
                .Where(p => p.IsKeyPosition && p.IsActive)
                .CountAsync(p => _context.SuccessionPlans.Any(sp => sp.PositionId == p.Id && sp.Status == "Active"));

            if (keyPositions > 0 && (double)keyPositionsWithPlans / keyPositions < 0.8)
            {
                recommendations.Add("Increase succession planning coverage for key positions - currently below 80%");
            }

            // Analyze performance trends
            var performanceTrends = await AnalyzeOrganizationPerformanceTrendsAsync();
            if (performanceTrends.TrendDirection == "Declining")
            {
                recommendations.Add("Address declining performance trend through targeted training and support programs");
            }

            // Analyze career path utilization
            var pathUtilization = await AnalyzeCareerPathUtilizationAsync();
            if (pathUtilization.UtilizationRate < 0.3)
            {
                recommendations.Add("Improve career path awareness and utilization - many paths are underused");
            }

            return recommendations;
        }

        private async Task<List<TeamDevelopmentOpportunity>> IdentifyTeamDevelopmentOpportunities(List<Employee> teamMembers)
        {
            var opportunities = new List<TeamDevelopmentOpportunity>();

            // Skill sharing opportunities
            var allSkills = teamMembers.SelectMany(e => e.EmployeeSkills).ToList();
            var skillGaps = allSkills.GroupBy(es => es.Skill)
                .Where(g => g.Any(es => es.ProficiencyLevel >= 4) && g.Any(es => es.ProficiencyLevel <= 2))
                .Take(3);

            foreach (var gap in skillGaps)
            {
                var expert = gap.OrderByDescending(es => es.ProficiencyLevel).First().Employee;
                var novice = gap.OrderBy(es => es.ProficiencyLevel).First().Employee;

                opportunities.Add(new TeamDevelopmentOpportunity
                {
                    Type = "Skill Sharing",
                    Description = $"{expert.FirstName} {expert.LastName} can mentor {novice.FirstName} {novice.LastName} in {gap.Key.Name}",
                    Benefits = "Improves team capability and strengthens working relationships"
                });
            }

            return opportunities;
        }

        private List<string> GenerateTeamInsights(TeamDynamicsInsight insight)
        {
            var insights = new List<string>();

            if (insight.AverageTeamPerformance >= 4.0)
            {
                insights.Add("High-performing team - consider for challenging projects");
            }
            else if (insight.AverageTeamPerformance < 3.0)
            {
                insights.Add("Team performance below expectations - may need additional support");
            }

            if (insight.PerformanceVariation > 1.0)
            {
                insights.Add("High performance variation - consider balancing team workloads");
            }

            if (insight.HighPerformerCount >= insight.TeamSize * 0.6)
            {
                insights.Add("Team has strong talent density - good candidate for expansion");
            }

            return insights;
        }

        private string CalculatePerformanceTrend(IEnumerable<PerformanceReview> reviews)
        {
            var reviewList = reviews.OrderBy(r => r.ReviewPeriodEnd).ToList();
            if (reviewList.Count < 2) return "Stable";

            var recent = reviewList.TakeLast(reviewList.Count / 2).Average(r => r.OverallRating);
            var older = reviewList.Take(reviewList.Count / 2).Average(r => r.OverallRating);

            return recent > older + 0.2m ? "Improving" :
                   recent < older - 0.2m ? "Declining" : "Stable";
        }

        private async Task<List<CareerDevelopmentOpportunity>> IdentifyDepartmentCareerOpportunities(int departmentId)
        {
            var opportunities = new List<CareerDevelopmentOpportunity>();

            // Find vacant positions in department
            var vacantPositions = await _context.Positions
                .Include(p => p.CurrentEmployees)
                .Where(p => p.DepartmentId == departmentId && p.IsActive && !p.CurrentEmployees.Any())
                .ToListAsync();

            foreach (var position in vacantPositions)
            {
                opportunities.Add(new CareerDevelopmentOpportunity
                {
                    Type = "Internal Opening",
                    Description = $"Vacant {position.Title} position available for internal candidates",
                    RequiredSkills = "Based on position requirements",
                    Timeline = "Immediate"
                });
            }

            return opportunities;
        }

        private async Task<List<SkillGap>> IdentifySkillGaps(int? departmentId)
        {
            var gaps = new List<SkillGap>();

            // Skills required by career paths but lacking in the organization/department
            var query = _context.CareerPathSkills
                .Include(cps => cps.Skill)
                .Include(cps => cps.CareerPath)
                .ThenInclude(cp => cp.ToPosition)
                .AsQueryable();

            if (departmentId.HasValue)
            {
                query = query.Where(cps => cps.CareerPath.ToPosition.DepartmentId == departmentId.Value);
            }

            var requiredSkills = await query
                .GroupBy(cps => cps.Skill)
                .Select(g => new {
                    Skill = g.Key,
                    AvgRequired = g.Average(cps => cps.MinProficiencyLevel),
                    PathCount = g.Count()
                })
                .ToListAsync();

            foreach (var required in requiredSkills)
            {
                var employeeSkillsQuery = _context.EmployeeSkills
                    .Where(es => es.SkillId == required.Skill.Id);

                if (departmentId.HasValue)
                {
                    employeeSkillsQuery = employeeSkillsQuery
                        .Where(es => es.Employee.DepartmentId == departmentId.Value);
                }

                var employeeSkills = await employeeSkillsQuery.ToListAsync();
                var currentAvg = employeeSkills.Any() ? employeeSkills.Average(es => es.ProficiencyLevel) : 0;

                if (currentAvg < required.AvgRequired - 0.5)
                {
                    gaps.Add(new SkillGap
                    {
                        Skill = required.Skill,
                        RequiredLevel = required.AvgRequired,
                        CurrentLevel = currentAvg,
                        Gap = required.AvgRequired - currentAvg,
                        AffectedPathsCount = required.PathCount
                    });
                }
            }

            return gaps.OrderByDescending(g => g.Gap).Take(10).ToList();
        }

        private async Task<List<SkillDevelopmentRecommendation>> GenerateOrganizationSkillRecommendations(int? departmentId)
        {
            var recommendations = new List<SkillDevelopmentRecommendation>();

            var skillGaps = await IdentifySkillGaps(departmentId);

            foreach (var gap in skillGaps.Take(5))
            {
                recommendations.Add(new SkillDevelopmentRecommendation
                {
                    Skill = gap.Skill,
                    CurrentLevel = (int)gap.CurrentLevel,
                    RecommendedLevel = (int)Math.Ceiling(gap.RequiredLevel),
                    Gap = (int)Math.Ceiling(gap.Gap),
                    Priority = gap.Gap > 2 ? "High" : "Medium",
                    Reason = $"Required by {gap.AffectedPathsCount} career paths",
                    SuggestedActions = new List<string>
                    {
                        "Organize organization-wide training program",
                        "Hire external trainers or consultants",
                        "Create mentorship programs"
                    }
                });
            }

            return recommendations;
        }

        private async Task<QuickStats> GenerateQuickStatsAsync(string? userRole, int? employeeId)
        {
            var stats = new QuickStats();

            if (userRole == "HR" || userRole == "Admin")
            {
                stats.TotalEmployees = await _context.Employees.CountAsync();
                stats.ActiveCareerPaths = await _context.CareerPaths.CountAsync(cp => cp.IsActive);
                stats.PendingRequests = await _context.EmployeeRequests.CountAsync(r => r.Status == "Pending" || r.Status == "ManagerApproved");
                stats.SuccessionPlansActive = await _context.SuccessionPlans.CountAsync(sp => sp.Status == "Active");
            }
            else if (employeeId.HasValue)
            {
                var employee = await _context.Employees
                    .Include(e => e.DirectReports)
                    .Include(e => e.RequestsMade)
                    .FirstOrDefaultAsync(e => e.Id == employeeId.Value);

                if (employee != null)
                {
                    stats.MyDirectReports = employee.DirectReports.Count;
                    stats.MyPendingRequests = employee.RequestsMade.Count(r => r.Status == "Pending" || r.Status == "ManagerApproved");
                    stats.CareerOpportunities = await _context.CareerPaths
                        .CountAsync(cp => cp.FromPositionId == employee.CurrentPositionId && cp.IsActive);
                }
            }

            return stats;
        }

        #endregion
    }

    #region Data Transfer Objects and Analysis Classes

    public class CareerIntelligenceReport
    {
        public int EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public DateTime GeneratedDate { get; set; }

        public List<CareerPathRecommendation> CareerPathRecommendations { get; set; } = new List<CareerPathRecommendation>();
        public List<SkillDevelopmentRecommendation> SkillDevelopmentRecommendations { get; set; } = new List<SkillDevelopmentRecommendation>();
        public CareerPerformanceInsight? PerformanceInsight { get; set; }
        public PromotionReadinessScore? PromotionReadiness { get; set; }
        public List<CareerOpportunity> CareerOpportunities { get; set; } = new List<CareerOpportunity>();
        public List<string> SmartInsights { get; set; } = new List<string>();
    }

    public class OrganizationIntelligenceReport
    {
        public DateTime GeneratedDate { get; set; }
        public List<TalentRisk> TalentRisks { get; set; } = new List<TalentRisk>();
        public List<AttritionRisk> AttritionRisks { get; set; } = new List<AttritionRisk>();
        public List<DepartmentInsight> DepartmentInsights { get; set; } = new List<DepartmentInsight>();
        public List<OrganizationSkillGap> OrganizationSkillGaps { get; set; } = new List<OrganizationSkillGap>();
        public CareerPathUtilization? CareerPathUtilization { get; set; }
        public PerformanceTrends? PerformanceTrends { get; set; }
        public List<string> StrategicRecommendations { get; set; } = new List<string>();
    }

    public class SmartRecommendation
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Priority { get; set; } // 0-100
        public string ActionUrl { get; set; } = string.Empty;
    }

    public class CareerOpportunity
    {
        public string Type { get; set; } = string.Empty; // Vacant Position, Succession Plan, Cross-Training
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public double MatchScore { get; set; }
        public string Description { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty; // High, Medium, Low
        public int RelatedId { get; set; }
    }

    public class SkillDevelopmentRecommendation
    {
        public Skill Skill { get; set; } = null!;
        public int CurrentLevel { get; set; }
        public int RecommendedLevel { get; set; }
        public int Gap { get; set; }
        public string Priority { get; set; } = string.Empty; // High, Medium, Low
        public string Reason { get; set; } = string.Empty;
        public List<string> SuggestedActions { get; set; } = new List<string>();
    }

    public class TalentRisk
    {
        public Employee Employee { get; set; } = null!;
        public string RiskType { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = string.Empty; // High, Medium, Low
        public string Description { get; set; } = string.Empty;
        public string Impact { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
    }

    public class CareerPerformanceInsight
    {
        public int EmployeeId { get; set; }
        public double CurrentAverageRating { get; set; }
        public double HistoricalAverageRating { get; set; }
        public string PerformanceTrend { get; set; } = string.Empty; // Improving, Declining, Stable
        public string PerformanceConsistency { get; set; } = string.Empty; // High, Medium, Low
        public List<string> Insights { get; set; } = new List<string>();
    }

    public class PromotionReadinessScore
    {
        public int EmployeeId { get; set; }
        public DateTime CalculatedDate { get; set; }
        public double OverallScore { get; set; } // 0-100
        public string ReadinessLevel { get; set; } = string.Empty; // High, Medium, Low
        public List<string> Factors { get; set; } = new List<string>();
        public List<string> Recommendations { get; set; } = new List<string>();
    }

    public class AttritionRisk
    {
        public Employee Employee { get; set; } = null!;
        public int RiskScore { get; set; } // 0-100
        public string RiskLevel { get; set; } = string.Empty; // Critical, High, Medium
        public List<string> RiskFactors { get; set; } = new List<string>();
        public List<string> RecommendedActions { get; set; } = new List<string>();
    }

    public class TeamDynamicsInsight
    {
        public int ManagerId { get; set; }
        public int TeamSize { get; set; }
        public DateTime AnalysisDate { get; set; }
        public double AverageTeamPerformance { get; set; }
        public double PerformanceVariation { get; set; }
        public int HighPerformerCount { get; set; }
        public int LowPerformerCount { get; set; }
        public List<TeamDevelopmentOpportunity> DevelopmentOpportunities { get; set; } = new List<TeamDevelopmentOpportunity>();
        public List<string> Insights { get; set; } = new List<string>();
    }

    public class IntelligentDashboard
    {
        public DateTime GeneratedDate { get; set; }
        public string UserRole { get; set; } = string.Empty;

        // Personal insights for employee
        public CareerIntelligenceReport? PersonalInsights { get; set; }
        public List<CareerOpportunity> CareerOpportunities { get; set; } = new List<CareerOpportunity>();
        public List<SkillDevelopmentRecommendation> SkillRecommendations { get; set; } = new List<SkillDevelopmentRecommendation>();

        // Organizational insights for HR/Admin
        public OrganizationIntelligenceReport? OrganizationInsights { get; set; }
        public List<TalentRisk> TalentRisks { get; set; } = new List<TalentRisk>();
        public List<AttritionRisk> AttritionRisks { get; set; } = new List<AttritionRisk>();

        // Team insights for managers
        public TeamDynamicsInsight? TeamInsights { get; set; }

        // Common elements
        public List<SmartRecommendation> SmartRecommendations { get; set; } = new List<SmartRecommendation>();
        public QuickStats? QuickStats { get; set; }
    }

    public class DepartmentIntelligence
    {
        public Department Department { get; set; } = null!;
        public DateTime AnalysisDate { get; set; }
        public double AveragePerformance { get; set; }
        public string PerformanceTrend { get; set; } = string.Empty;
        public List<SkillStrength> TopSkills { get; set; } = new List<SkillStrength>();
        public List<TalentRisk> TalentRisks { get; set; } = new List<TalentRisk>();
        public List<CareerDevelopmentOpportunity> CareerDevelopmentOpportunities { get; set; } = new List<CareerDevelopmentOpportunity>();
        public SuccessionReadinessReport? SuccessionReadiness { get; set; }
    }

    public class SkillsIntelligence
    {
        public DateTime AnalysisDate { get; set; }
        public int? DepartmentId { get; set; }
        public List<SkillStatistic> MostCommonSkills { get; set; } = new List<SkillStatistic>();
        public List<SkillGap> SkillGaps { get; set; } = new List<SkillGap>();
        public List<SkillStatistic> EmergingSkills { get; set; } = new List<SkillStatistic>();
        public List<SkillDevelopmentRecommendation> DevelopmentRecommendations { get; set; } = new List<SkillDevelopmentRecommendation>();
    }

    // Supporting classes
    public class DepartmentInsight
    {
        public Department Department { get; set; } = null!;
        public int EmployeeCount { get; set; }
        public double AveragePerformance { get; set; }
    }

    public class OrganizationSkillGap
    {
        public Skill Skill { get; set; } = null!;
        public double RequiredLevel { get; set; }
        public double CurrentAverageLevel { get; set; }
        public double Gap { get; set; }
        public int EmployeesWithSkill { get; set; }
        public string Priority { get; set; } = string.Empty;
    }

    public class CareerPathUtilization
    {
        public int TotalActivePaths { get; set; }
        public int PathsWithActivity { get; set; }
        public double UtilizationRate { get; set; }
    }

    public class PerformanceTrends
    {
        public double CurrentPeriodAverage { get; set; }
        public double PreviousPeriodAverage { get; set; }
        public int TotalReviews { get; set; }
        public string TrendDirection { get; set; } = string.Empty;
    }

    public class TeamDevelopmentOpportunity
    {
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Benefits { get; set; } = string.Empty;
    }

    public class SkillStrength
    {
        public Skill Skill { get; set; } = null!;
        public int EmployeeCount { get; set; }
        public double AverageProficiency { get; set; }
        public int MaxProficiency { get; set; }
    }

    public class CareerDevelopmentOpportunity
    {
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RequiredSkills { get; set; } = string.Empty;
        public string Timeline { get; set; } = string.Empty;
    }

    public class SkillStatistic
    {
        public Skill Skill { get; set; } = null!;
        public int EmployeeCount { get; set; }
        public double AverageProficiency { get; set; }
        public int HighProficiencyCount { get; set; }
    }

    public class SkillGap
    {
        public Skill Skill { get; set; } = null!;
        public double RequiredLevel { get; set; }
        public double CurrentLevel { get; set; }
        public double Gap { get; set; }
        public int AffectedPathsCount { get; set; }
    }

    public class QuickStats
    {
        public int TotalEmployees { get; set; }
        public int ActiveCareerPaths { get; set; }
        public int PendingRequests { get; set; }
        public int SuccessionPlansActive { get; set; }
        public int MyDirectReports { get; set; }
        public int MyPendingRequests { get; set; }
        public int CareerOpportunities { get; set; }
    }

    #endregion
}