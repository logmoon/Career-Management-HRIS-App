using career_module.server.Models.Entities;
using career_module.server.Services;
using System.ComponentModel.DataAnnotations;

namespace career_module.server.Models.DTOs
{
    // DTO : Data Transfer Object, quite the chill concept!
    public class LoginRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
    public class AuthResultDto
    {
        public bool Success { get; set; }
        public string Token { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
    public class RegistrationResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class EmployeeDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        [Required]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime HireDate { get; set; }
        public int? ManagerId { get; set; }
        public int? CurrentPositionId { get; set; }
        public int DepartmentId { get; set; }
        public decimal? Salary { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Computed Properties
        public string FullName => $"{FirstName} {LastName}";

        public static EmployeeDto FromEmployee(Employee employee)
        {
            return new EmployeeDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Phone = employee.Phone,
                HireDate = employee.HireDate,
                ManagerId = employee.ManagerId,
                CurrentPositionId = employee.CurrentPositionId,
                DepartmentId = employee.DepartmentId,
                Salary = employee.Salary,
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt
            };
        }
    }

    public class SkillDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;

        public static SkillDto FromSkill(Skill skill)
        {
            return new SkillDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category
            };
        }
    }

    public class PositionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;

        public static PositionDto FromPosition(Position position)
        {
            return new PositionDto
            {
                Id = position.Id,
                Title = position.Title,
                Department = position.Department?.Name ?? ""
            };
        }
    }

    public class CareerPathDto
    {
        public int Id { get; set; }
        public string ToPositionTitle { get; set; } = string.Empty;
        public string ToPositionDepartment { get; set; } = string.Empty;

        public static CareerPathDto FromCareerPath(CareerPath careerPath)
        {
            return new CareerPathDto
            {
                Id = careerPath.Id,
                ToPositionTitle = careerPath.ToPosition?.Title ?? "",
                ToPositionDepartment = careerPath.ToPosition?.Department?.Name ?? ""
            };
        }
    }

    // weight versions of the main intelligence objects
    public class QuickInsightDto
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string ActionUrl { get; set; } = string.Empty;
    }

    public class SmartRecommendationDto
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Priority { get; set; }
        public string ActionUrl { get; set; } = string.Empty;
    }

    public class CareerOpportunityDto
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public double MatchScore { get; set; }
        public string Description { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int RelatedId { get; set; }
    }

    public class SkillDevelopmentRecommendationDto
    {
        public SkillDto Skill { get; set; } = null!;
        public int CurrentLevel { get; set; }
        public int RecommendedLevel { get; set; }
        public int Gap { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public List<string> SuggestedActions { get; set; } = new List<string>();

        public static SkillDevelopmentRecommendationDto FromSkillDevelopmentRecommendation(SkillDevelopmentRecommendation rec)
        {
            return new SkillDevelopmentRecommendationDto
            {
                Skill = SkillDto.FromSkill(rec.Skill),
                CurrentLevel = rec.CurrentLevel,
                RecommendedLevel = rec.RecommendedLevel,
                Gap = rec.Gap,
                Priority = rec.Priority,
                Reason = rec.Reason,
                SuggestedActions = rec.SuggestedActions
            };
        }
    }

    public class TalentRiskDto
    {
        public EmployeeDto Employee { get; set; } = null!;
        public string RiskType { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Impact { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;

        public static TalentRiskDto FromTalentRisk(TalentRisk risk)
        {
            return new TalentRiskDto
            {
                Employee = new EmployeeDto
                {
                    Id = risk.Employee.Id,
                    FirstName = risk.Employee.FirstName,
                    LastName = risk.Employee.LastName,
                    DepartmentId = risk.Employee.DepartmentId,
                    CurrentPositionId = risk.Employee.CurrentPositionId
                },
                RiskType = risk.RiskType,
                RiskLevel = risk.RiskLevel,
                Description = risk.Description,
                Impact = risk.Impact,
                RecommendedAction = risk.RecommendedAction
            };
        }
    }

    public class AttritionRiskDto
    {
        public EmployeeDto Employee { get; set; } = null!;
        public int RiskScore { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public List<string> RiskFactors { get; set; } = new List<string>();
        public List<string> RecommendedActions { get; set; } = new List<string>();

        public static AttritionRiskDto FromAttritionRisk(AttritionRisk risk)
        {
            return new AttritionRiskDto
            {
                Employee = new EmployeeDto
                {
                    Id = risk.Employee.Id,
                    FirstName = risk.Employee.FirstName,
                    LastName = risk.Employee.LastName,
                    DepartmentId = risk.Employee.DepartmentId,
                    CurrentPositionId = risk.Employee.CurrentPositionId
                },
                RiskScore = risk.RiskScore,
                RiskLevel = risk.RiskLevel,
                RiskFactors = risk.RiskFactors,
                RecommendedActions = risk.RecommendedActions
            };
        }
    }

    public class PromotionReadinessScoreDto
    {
        public int EmployeeId { get; set; }
        public double ReadinessScore { get; set; }
        public string ReadinessLevel { get; set; } = string.Empty;
        public List<string> Strengths { get; set; } = new List<string>();
        public List<string> AreasForDevelopment { get; set; } = new List<string>();
        public string TimeToReadiness { get; set; } = string.Empty;
        public List<string> RecommendedActions { get; set; } = new List<string>();
        public DateTime AssessmentDate { get; set; }

        public static PromotionReadinessScoreDto FromPromotionReadinessScore(PromotionReadinessScore score)
        {
            return new PromotionReadinessScoreDto
            {
                EmployeeId = score.EmployeeId,
                ReadinessScore = score.OverallScore,
                ReadinessLevel = score.ReadinessLevel,
                Strengths = score.Factors?.Take(3).ToList() ?? new List<string>(),
                AreasForDevelopment = new List<string>(),
                TimeToReadiness = score.ReadinessLevel == "High" ? "Ready now" :
                                score.ReadinessLevel == "Medium" ? "6-12 months" : "12+ months",
                RecommendedActions = score.Recommendations,
                AssessmentDate = score.CalculatedDate
            };
        }
    }

    public class CareerPerformanceInsightDto
    {
        public int EmployeeId { get; set; }
        public DateTime AnalysisDate { get; set; }
        public string PerformanceTrend { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public double RatingTrend { get; set; }
        public List<string> KeyStrengths { get; set; } = new List<string>();
        public List<string> DevelopmentAreas { get; set; } = new List<string>();
        public string CareerTrajectory { get; set; } = string.Empty;
        public List<string> Insights { get; set; } = new List<string>();

        public static CareerPerformanceInsightDto FromCareerPerformanceInsight(CareerPerformanceInsight insight)
        {
            return new CareerPerformanceInsightDto
            {
                EmployeeId = insight.EmployeeId,
                AnalysisDate = DateTime.UtcNow,
                PerformanceTrend = insight.PerformanceTrend,
                AverageRating = insight.CurrentAverageRating,
                RatingTrend = insight.CurrentAverageRating - insight.HistoricalAverageRating,
                KeyStrengths = new List<string>(),
                DevelopmentAreas = new List<string>(),
                CareerTrajectory = insight.PerformanceTrend == "Improving" ? "Ascending" :
                                insight.PerformanceTrend == "Declining" ? "Concerning" : "Stable",
                Insights = insight.Insights
            };
        }
    }

    public class CareerPathRecommendationDto
    {
        public CareerPathDto CareerPath { get; set; } = null!;
        public double ReadinessScore { get; set; }
        public string ReadinessLevel { get; set; } = string.Empty;
        public List<string> MissingSkills { get; set; } = new List<string>();

        public static CareerPathRecommendationDto FromCareerPathRecommendation(CareerPathRecommendation rec)
        {
            return new CareerPathRecommendationDto
            {
                CareerPath = CareerPathDto.FromCareerPath(rec.CareerPath),
                ReadinessScore = rec.ReadinessScore,
                ReadinessLevel = rec.ReadinessScore >= 80 ? "High" : rec.ReadinessScore >= 60 ? "Medium" : "Low",
                MissingSkills = rec.Analysis.SkillGaps?.Take(5).Select(sg => sg.Skill.Name).ToList() ?? new List<string>()
            };
        }
    }

    public class TeamDynamicsInsightDto
    {
        public int ManagerId { get; set; }
        public int TeamSize { get; set; }
        public DateTime AnalysisDate { get; set; }
        public double AverageTeamPerformance { get; set; }
        public double PerformanceVariation { get; set; }
        public int HighPerformerCount { get; set; }
        public int LowPerformerCount { get; set; }
        public List<string> DevelopmentOpportunities { get; set; } = new List<string>();
        public List<string> Insights { get; set; } = new List<string>();

        public static TeamDynamicsInsightDto FromTeamDynamicsInsight(TeamDynamicsInsight insight)
        {
            return new TeamDynamicsInsightDto
            {
                ManagerId = insight.ManagerId,
                TeamSize = insight.TeamSize,
                AnalysisDate = insight.AnalysisDate,
                AverageTeamPerformance = insight.AverageTeamPerformance,
                PerformanceVariation = insight.PerformanceVariation,
                HighPerformerCount = insight.HighPerformerCount,
                LowPerformerCount = insight.LowPerformerCount,
                DevelopmentOpportunities = insight.DevelopmentOpportunities?.Take(3).Select(d => d.Description).ToList() ?? new List<string>(),
                Insights = insight.Insights
            };
        }
    }

    public class QuickStatsDto
    {
        public int TotalEmployees { get; set; }
        public int ActiveCareerPaths { get; set; }
        public int PendingRequests { get; set; }
        public int SuccessionPlansActive { get; set; }
        public int MyDirectReports { get; set; }
        public int MyPendingRequests { get; set; }
        public int CareerOpportunities { get; set; }

        public static QuickStatsDto FromQuickStats(QuickStats stats)
        {
            return new QuickStatsDto
            {
                TotalEmployees = stats.TotalEmployees,
                ActiveCareerPaths = stats.ActiveCareerPaths,
                PendingRequests = stats.PendingRequests,
                SuccessionPlansActive = stats.SuccessionPlansActive,
                MyDirectReports = stats.MyDirectReports,
                MyPendingRequests = stats.MyPendingRequests,
                CareerOpportunities = stats.CareerOpportunities
            };
        }
    }

    // Main weight intelligence report
    public class CareerIntelligenceReportDto
    {
        public int EmployeeId { get; set; }
        public EmployeeDto Employee { get; set; } = null!;
        public DateTime GeneratedDate { get; set; }
        public List<CareerPathRecommendationDto> CareerPathRecommendations { get; set; } = new List<CareerPathRecommendationDto>();
        public List<SkillDevelopmentRecommendationDto> SkillDevelopmentRecommendations { get; set; } = new List<SkillDevelopmentRecommendationDto>();
        public CareerPerformanceInsightDto? PerformanceInsight { get; set; }
        public PromotionReadinessScoreDto? PromotionReadiness { get; set; }
        public List<CareerOpportunityDto> CareerOpportunities { get; set; } = new List<CareerOpportunityDto>();
        public List<string> SmartInsights { get; set; } = new List<string>();

        public static CareerIntelligenceReportDto FromCareerIntelligenceReport(CareerIntelligenceReport report)
        {
            return new CareerIntelligenceReportDto
            {
                EmployeeId = report.EmployeeId,
                Employee = EmployeeDto.FromEmployee(new Employee
                {
                    Id = report.Employee.Id,
                    FirstName = report.Employee.FirstName,
                    LastName = report.Employee.LastName,
                    DepartmentId = report.Employee.DepartmentId,
                    CurrentPositionId = report.Employee.CurrentPositionId
                }),
                GeneratedDate = report.GeneratedDate,
                CareerPathRecommendations = report.CareerPathRecommendations?.Take(3).Select(CareerPathRecommendationDto.FromCareerPathRecommendation).ToList() ?? new List<CareerPathRecommendationDto>(),
                SkillDevelopmentRecommendations = report.SkillDevelopmentRecommendations?.Take(3).Select(SkillDevelopmentRecommendationDto.FromSkillDevelopmentRecommendation).ToList() ?? new List<SkillDevelopmentRecommendationDto>(),
                PerformanceInsight = report.PerformanceInsight != null ? CareerPerformanceInsightDto.FromCareerPerformanceInsight(report.PerformanceInsight) : null,
                PromotionReadiness = report.PromotionReadiness != null ? PromotionReadinessScoreDto.FromPromotionReadinessScore(report.PromotionReadiness) : null,
                CareerOpportunities = report.CareerOpportunities?.Take(5).Select(co => new CareerOpportunityDto
                {
                    Type = co.Type,
                    Title = co.Title,
                    Department = co.Department,
                    MatchScore = co.MatchScore,
                    Description = co.Description,
                    RecommendedAction = co.RecommendedAction,
                    Priority = co.Priority,
                    RelatedId = co.RelatedId
                }).ToList() ?? new List<CareerOpportunityDto>(),
                SmartInsights = report.SmartInsights?.Take(5).ToList() ?? new List<string>()
            };
        }
    }

    // weight main dashboard DTO
    public class IntelligentDashboardDto
    {
        public DateTime GeneratedDate { get; set; }
        public string UserRole { get; set; } = string.Empty;

        // Personal insights for employee
        public CareerIntelligenceReportDto? PersonalInsights { get; set; }
        public List<CareerOpportunityDto> CareerOpportunities { get; set; } = new List<CareerOpportunityDto>();
        public List<SkillDevelopmentRecommendationDto> SkillRecommendations { get; set; } = new List<SkillDevelopmentRecommendationDto>();

        // Organizational insights for HR/Admin (kept minimal)
        public List<string> OrganizationInsights { get; set; } = new List<string>(); // Just key insights as strings
        public List<TalentRiskDto> TalentRisks { get; set; } = new List<TalentRiskDto>();
        public List<AttritionRiskDto> AttritionRisks { get; set; } = new List<AttritionRiskDto>();

        // Team insights for managers
        public TeamDynamicsInsightDto? TeamInsights { get; set; }

        // Common elements
        public List<SmartRecommendationDto> SmartRecommendations { get; set; } = new List<SmartRecommendationDto>();
        public QuickStatsDto? QuickStats { get; set; }

        public static IntelligentDashboardDto FromIntelligentDashboard(IntelligentDashboard dashboard)
        {
            return new IntelligentDashboardDto
            {
                GeneratedDate = dashboard.GeneratedDate,
                UserRole = dashboard.UserRole,
                PersonalInsights = dashboard.PersonalInsights != null ? CareerIntelligenceReportDto.FromCareerIntelligenceReport(dashboard.PersonalInsights) : null,
                CareerOpportunities = dashboard.CareerOpportunities?.Take(3).Select(co => new CareerOpportunityDto
                {
                    Type = co.Type,
                    Title = co.Title,
                    Department = co.Department,
                    MatchScore = co.MatchScore,
                    Description = co.Description,
                    RecommendedAction = co.RecommendedAction,
                    Priority = co.Priority,
                    RelatedId = co.RelatedId
                }).ToList() ?? new List<CareerOpportunityDto>(),
                SkillRecommendations = dashboard.SkillRecommendations?.Take(3).Select(SkillDevelopmentRecommendationDto.FromSkillDevelopmentRecommendation).ToList() ?? new List<SkillDevelopmentRecommendationDto>(),
                OrganizationInsights = dashboard.OrganizationInsights?.StrategicRecommendations?.Take(5).ToList() ?? new List<string>(),
                TalentRisks = dashboard.TalentRisks?.Take(3).Select(TalentRiskDto.FromTalentRisk).ToList() ?? new List<TalentRiskDto>(),
                AttritionRisks = dashboard.AttritionRisks?.Take(3).Select(AttritionRiskDto.FromAttritionRisk).ToList() ?? new List<AttritionRiskDto>(),
                TeamInsights = dashboard.TeamInsights != null ? TeamDynamicsInsightDto.FromTeamDynamicsInsight(dashboard.TeamInsights) : null,
                SmartRecommendations = dashboard.SmartRecommendations?.Take(5).Select(sr => new SmartRecommendationDto
                {
                    Type = sr.Type,
                    Title = sr.Title,
                    Description = sr.Description,
                    Priority = sr.Priority,
                    ActionUrl = sr.ActionUrl
                }).ToList() ?? new List<SmartRecommendationDto>(),
                QuickStats = dashboard.QuickStats != null ? QuickStatsDto.FromQuickStats(dashboard.QuickStats) : null
            };
        }
    }

    public class RegistrationRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Employee";

        // Employee fields
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime? HireDate { get; set; }
    }
    public class CreateEmployeeRequestDto
    {
        [Required]
        public string RequestType { get; set; } = string.Empty;

        public int RequesterId { get; set; } // 0 means current user
        public int? TargetEmployeeId { get; set; }
        public DateTime? EffectiveDate { get; set; }
        public string? Notes { get; set; }

        // Promotion fields
        public int? NewPositionId { get; set; }
        public decimal? ProposedSalary { get; set; }
        public string? Justification { get; set; }

        // Department/Transfer fields
        public int? NewDepartmentId { get; set; }
        public int? NewManagerId { get; set; }
        public string? Reason { get; set; }
    }

    public class EmployeeRequestDto
    {
        public int Id { get; set; }
        public int RequesterId { get; set; }
        public string RequesterName { get; set; } = string.Empty;
        public int? TargetEmployeeId { get; set; }
        public string? TargetEmployeeName { get; set; }

        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        public DateTime RequestDate { get; set; }
        public DateTime? EffectiveDate { get; set; }
        public DateTime? ProcessedDate { get; set; }

        public string? ApprovedByManagerName { get; set; }
        public string? ApprovedByHRName { get; set; }
        public DateTime? ManagerApprovalDate { get; set; }
        public DateTime? HRApprovalDate { get; set; }

        public string? RejectionReason { get; set; }
        public string? Notes { get; set; }

        // Request-specific data
        public Dictionary<string, object?> RequestData { get; set; } = new();

        // Helper method to populate request-specific data
        public static EmployeeRequestDto FromEntity(EmployeeRequest request)
        {
            var dto = new EmployeeRequestDto
            {
                Id = request.Id,
                RequesterId = request.RequesterId,
                RequesterName = $"{request.Requester.FirstName} {request.Requester.LastName}",
                TargetEmployeeId = request.TargetEmployeeId,
                TargetEmployeeName = request.TargetEmployee != null
                    ? $"{request.TargetEmployee.FirstName} {request.TargetEmployee.LastName}"
                    : null,
                RequestType = request.RequestType,
                Status = request.Status,
                RequestDate = request.RequestDate,
                EffectiveDate = request.EffectiveDate,
                ProcessedDate = request.ProcessedDate,
                ApprovedByManagerName = request.ApprovedByManager != null
                    ? $"{request.ApprovedByManager.FirstName}   {request.ApprovedByManager.LastName}"
                    : null,
                ApprovedByHRName = request.ApprovedByHR != null
                    ? $"{request.ApprovedByHR.FirstName}   {request.ApprovedByHR.LastName}"
                    : null,
                ManagerApprovalDate = request.ManagerApprovalDate,
                HRApprovalDate = request.HRApprovalDate,
                RejectionReason = request.RejectionReason,
                Notes = request.Notes
            };

            // Populate request-specific data based on type
            switch (request.RequestType)
            {
                case "PositionChange":
                    dto.RequestData["careerPathId"] = request.NewPositionId;
                    dto.RequestData["proposedSalary"] = request.ProposedSalary;
                    dto.RequestData["justification"] = request.Justification;
                    dto.RequestData["newManagerId"] = request.NewManagerId;
                    break;

                case "DepartmentChange":
                case "Transfer":
                    dto.RequestData["newDepartmentId"] = request.NewDepartmentId;
                    dto.RequestData["newManagerId"] = request.NewManagerId;
                    dto.RequestData["reason"] = request.Reason;
                    break;
            }

            return dto;
        }
    }

    public class ApprovalDto
    {
        public string? Notes { get; set; }
    }

    public class RejectionDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }
    public class CreatePerformanceReviewDto
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public int ReviewerId { get; set; }

        [Required]
        public DateTime ReviewPeriodStart { get; set; }

        [Required]
        public DateTime ReviewPeriodEnd { get; set; }

        public string? Strengths { get; set; }
        public string? AreasForImprovement { get; set; }
        public string? Goals { get; set; }
    }
    public class UpdatePerformanceReviewDto
    {
        [Required]
        public DateTime ReviewPeriodStart { get; set; }

        [Required]
        public DateTime ReviewPeriodEnd { get; set; }

        [Required]
        [Range(1.0, 5.0, ErrorMessage = "Overall rating must be between 1.0 and 5.0")]
        public decimal OverallRating { get; set; }

        public string? Strengths { get; set; }
        public string? AreasForImprovement { get; set; }
        public string? Goals { get; set; }

        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
