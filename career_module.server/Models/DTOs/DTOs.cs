using career_module.server.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace career_module.server.Models.DTOs
{
    // DTO : Data Transfer Object, quite the chill concept!

    #region DTO Translator
    // Dunno what to call these functions, I'm sure the concept already exists, but I'm too lazy to search for it
    public static class DtoTranslator
    {
        public static EmployeeSkillDto ToEmployeeSkillDto(EmployeeSkill es)
        {
            return new EmployeeSkillDto
            {
                SkillId = es.SkillId,
                SkillName = es.Skill.Name,
                SkillCategory = es.Skill.Category,
                ProficiencyLevel = es.ProficiencyLevel,
                AcquiredDate = es.AcquiredDate,
                LastAssessedDate = es.LastAssessedDate,
                Notes = es.Notes
            };
        }
        public static DepartmentDto ToDepartmentDto(Department department)
        {
            return new DepartmentDto
            {
                // Id = department.Id,
                // Name = department.Name
            };
        }
        public static EmployeeDto ToEmployeeDto(Employee employee)
        {
            return new EmployeeDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                Phone = employee.Phone,
                Department = ToDepartmentDto(employee.Department),
                HireDate = employee.HireDate,
                Salary = employee.Salary,
                ManagerId = employee.ManagerId,
                ManagerName = employee.Manager != null ? $"{employee.Manager.FirstName} {employee.Manager.LastName}" : null,
                CurrentPositionId = employee.CurrentPositionId,
                CurrentPositionTitle = employee.CurrentPosition != null ? employee.CurrentPosition.Title : null,
                Skills = employee.EmployeeSkills.Select(es => ToEmployeeSkillDto(es)).ToList()
            };
        }
        public static UserDto ToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                Employee = user.Employee != null ? ToEmployeeDto(user.Employee) : null
            };
        }
    }
    #endregion


    public class CreateRequestDto
    {
        public int RequesterId { get; set; }
        public int? TargetEmployeeId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    #region Auth API
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public EmployeeDto? Employee { get; set; } = new();
    }
    public class LoginRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
    public class AuthResultDto
    {
        public bool Success { get; set; }
        public string Token { get; set; } = string.Empty;
        public UserDto? User { get; set; }
        public string Message { get; set; } = string.Empty;
    }
    public class RegistrationResultDto
    {
        public bool Success { get; set; }
        public UserDto? User { get; set; }
        public string Message { get; set; } = string.Empty;
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
    #endregion

    #region Employee API
    public class EmployeeDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DepartmentDto Department { get; set; } = new();
        public DateTime HireDate { get; set; }
        public decimal? Salary { get; set; }
        public int? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public int? CurrentPositionId { get; set; }
        public string? CurrentPositionTitle { get; set; }
        public List<EmployeeSkillDto> Skills { get; set; } = new();
    }

    public class DepartmentDto
    {
    }

    public class EmployeeDetailDto : EmployeeDto
    {
        public List<EmployeeSummaryDto> DirectReports { get; set; } = new();
        public List<CareerGoalSummaryDto> CareerGoals { get; set; } = new();
    }

    public class EmployeeSummaryDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
    }

    public class CreateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public DateTime HireDate { get; set; }
        public decimal? Salary { get; set; }
        public int? ManagerId { get; set; }
        public int? CurrentPositionId { get; set; }
    }

    public class UpdateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public decimal? Salary { get; set; }
        public int? ManagerId { get; set; }
        public int? CurrentPositionId { get; set; }
    }

    public class EmployeeSkillDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string? SkillCategory { get; set; }
        public int ProficiencyLevel { get; set; }
        public DateTime AcquiredDate { get; set; }
        public DateTime? LastAssessedDate { get; set; }
        public string? Notes { get; set; }
    }

    public class AddEmployeeSkillDto
    {
        public int SkillId { get; set; }
        public int ProficiencyLevel { get; set; }
        public DateTime AcquiredDate { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }
    }

    public class UpdateEmployeeSkillDto
    {
        public int ProficiencyLevel { get; set; }
        public string? Notes { get; set; }
    }

    public class CareerGoalSummaryDto
    {
        public int Id { get; set; }
        public string GoalDescription { get; set; } = string.Empty;
        public DateTime TargetDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string? TargetPositionTitle { get; set; }
    }
    #endregion

    #region Position API
    public class PositionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
        public int MinYearsExperience { get; set; }
        public bool IsKeyPosition { get; set; }
        public bool IsActive { get; set; }
        public int CurrentEmployeeCount { get; set; }
        public int RequiredSkillsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PositionDetailDto : PositionDto
    {
        public List<EmployeeSummaryDto> CurrentEmployees { get; set; } = new();
        public List<PositionSkillDto> RequiredSkills { get; set; } = new();
        public bool HasSuccessionPlan { get; set; }
        public int SuccessionCandidatesCount { get; set; }
    }

    public class CreatePositionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
        public int MinYearsExperience { get; set; }
        public bool IsKeyPosition { get; set; }
    }

    public class UpdatePositionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
        public int MinYearsExperience { get; set; }
        public bool IsKeyPosition { get; set; }
        public bool IsActive { get; set; }
    }

    public class PositionSkillDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string? SkillCategory { get; set; }
        public int RequiredLevel { get; set; }
        public bool IsMandatory { get; set; }
        public int Weight { get; set; }
    }

    public class AddPositionSkillDto
    {
        public int SkillId { get; set; }
        public int RequiredLevel { get; set; }
        public bool IsMandatory { get; set; } = true;
        public int Weight { get; set; } = 1;
    }

    public class UpdatePositionSkillDto
    {
        public int RequiredLevel { get; set; }
        public bool IsMandatory { get; set; }
        public int Weight { get; set; }
    }

    public class CandidateMatchDto
    {
        public int EmployeeId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? CurrentPositionTitle { get; set; }
        public string Department { get; set; } = string.Empty;
        public decimal MatchScore { get; set; }
        public List<SkillMatchDto> SkillMatches { get; set; } = new();
    }

    public class SkillMatchDto
    {
        public string SkillName { get; set; } = string.Empty;
        public int RequiredLevel { get; set; }
        public int EmployeeLevel { get; set; }
        public bool IsMandatory { get; set; }
        public int Gap { get; set; }
    }
    #endregion

    #region Skill API
    public class SkillDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int EmployeeCount { get; set; }
        public int PositionCount { get; set; }
    }

    public class SkillDetailDto : SkillDto
    {
        public List<EmployeeSkillSummaryDto> EmployeesWithSkill { get; set; } = new();
        public List<PositionSkillSummaryDto> PositionsRequiring { get; set; } = new();
        public Dictionary<int, int> ProficiencyDistribution { get; set; } = new();
    }

    public class CreateSkillDto
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateSkillDto
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class SkillSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class EmployeeSkillSummaryDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int ProficiencyLevel { get; set; }
        public DateTime AcquiredDate { get; set; }
        public DateTime? LastAssessedDate { get; set; }
    }

    public class PositionSkillSummaryDto
    {
        public int PositionId { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int RequiredLevel { get; set; }
        public bool IsMandatory { get; set; }
        public int Weight { get; set; }
    }

    public class CategoryStatsDto
    {
        public string Category { get; set; } = string.Empty;
        public int SkillCount { get; set; }
        public int EmployeeCount { get; set; }
        public int PositionCount { get; set; }
    }

    public class SkillGapAnalysisDto
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public int TotalEmployeesWithSkill { get; set; }
        public double AverageProficiencyLevel { get; set; }
        public int PositionsRequiringSkill { get; set; }
        public double AverageRequiredLevel { get; set; }
        public List<DepartmentGapDto> GapsByDepartment { get; set; } = new();
        public Dictionary<int, int> GapsByLevel { get; set; } = new();
        public List<CriticalGapDto> CriticalGaps { get; set; } = new();
    }

    public class DepartmentGapDto
    {
        public string Department { get; set; } = string.Empty;
        public int EmployeeCount { get; set; }
        public double AverageProficiency { get; set; }
        public int MaxProficiency { get; set; }
        public int MinProficiency { get; set; }
    }

    public class CriticalGapDto
    {
        public string PositionTitle { get; set; } = string.Empty;
        public int RequiredLevel { get; set; }
        public int EmployeesAtLevel { get; set; }
        public int Gap { get; set; }
    }
    #endregion

    #region SuccessionPlan API

    public class SuccessionPlanDto
    {
        public int Id { get; set; }
        public int PositionId { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime? ReviewDate { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public int CandidateCount { get; set; }
        public string? Notes { get; set; }
    }

    public class SuccessionPlanDetailDto
    {
        public int Id { get; set; }
        public int PositionId { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string PositionLevel { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime? ReviewDate { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<SuccessionCandidateDto> Candidates { get; set; } = new List<SuccessionCandidateDto>();
        public List<PositionSkillDto> RequiredSkills { get; set; } = new List<PositionSkillDto>();
    }

    public class CreateSuccessionPlanDto
    {
        [Required]
        public int PositionId { get; set; }
        public DateTime? ReviewDate { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateSuccessionPlanDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
        public DateTime? ReviewDate { get; set; }
        public string? Notes { get; set; }
    }

    #endregion

    #region SuccessionCandidate API
    public class SuccessionCandidateDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string CurrentPositionTitle { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int Priority { get; set; }
        public decimal MatchScore { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AddedDate { get; set; }
        public string? Notes { get; set; }
        public List<SkillMatchDto> SkillMatches { get; set; } = new List<SkillMatchDto>();
    }

    public class AddSuccessionCandidateDto
    {
        [Required]
        public int EmployeeId { get; set; }
        public int Priority { get; set; } = 1;
        public string? Notes { get; set; }
    }

    public class UpdateSuccessionCandidateDto
    {
        public int Priority { get; set; }
        [Required]
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class CandidateSuggestionDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string CurrentPositionTitle { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public decimal MatchScore { get; set; }
        public List<SkillMatchDto> SkillMatches { get; set; } = new List<SkillMatchDto>();
        public bool IsAlreadyCandidate { get; set; }
    }
    #endregion

    #region CarrerGoal API
    public class CareerGoalDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int? TargetPositionId { get; set; }
        public string? TargetPositionTitle { get; set; }
        public string GoalDescription { get; set; } = string.Empty;
        public DateTime TargetDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public int DevelopmentActionCount { get; set; }
        public int CompletedActionCount { get; set; }
    }

    public class CareerGoalDetailDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int? TargetPositionId { get; set; }
        public string? TargetPositionTitle { get; set; }
        public string? TargetPositionDepartment { get; set; }
        public string GoalDescription { get; set; } = string.Empty;
        public DateTime TargetDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public List<DevelopmentActionDto> DevelopmentActions { get; set; } = new List<DevelopmentActionDto>();
        public List<SkillMatchDto>? SkillGaps { get; set; } = new List<SkillMatchDto>();
        public decimal? MatchScore { get; set; }
    }

    public class CreateCareerGoalDto
    {
        [Required]
        public int? TargetPositionId { get; set; }
        [Required]
        public string GoalDescription { get; set; } = string.Empty;
        [Required]
        public DateTime TargetDate { get; set; }
        public string Priority { get; set; } = "Medium";
    }

    public class UpdateCareerGoalDto
    {
        public int? TargetPositionId { get; set; }
        [Required]
        public string GoalDescription { get; set; } = string.Empty;
        [Required]
        public DateTime TargetDate { get; set; }
        [Required]
        public string Status { get; set; } = string.Empty;
        [Required]
        public string Priority { get; set; } = string.Empty;
    }
    #endregion

    #region DevelopmentAction API
    public class DevelopmentActionDto
    {
        public int Id { get; set; }
        public int CareerGoalId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public bool IsOverdue => DueDate.HasValue && DueDate.Value < DateTime.UtcNow && Status != "Completed";
    }

    public class DevelopmentActionDetailDto
    {
        public int Id { get; set; }
        public int CareerGoalId { get; set; }
        public string CareerGoalDescription { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public bool IsOverdue => DueDate.HasValue && DueDate.Value < DateTime.UtcNow && Status != "Completed";
    }

    public class CreateDevelopmentActionDto
    {
        [Required]
        public string ActionType { get; set; } = string.Empty;
        [Required]
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
    }

    public class UpdateDevelopmentActionDto
    {
        [Required]
        public string ActionType { get; set; } = string.Empty;
        [Required]
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        [Required]
        public string Status { get; set; } = string.Empty;
    }
    #endregion

    #region PerformanceReview API
    public class PerformanceReviewDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string? EmployeeDepartment { get; set; }
        public int ReviewerId { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public DateTime ReviewPeriodStart { get; set; }
        public DateTime ReviewPeriodEnd { get; set; }
        public decimal OverallRating { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }

    public class PerformanceReviewDetailDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string? EmployeeDepartment { get; set; }
        public string? EmployeePosition { get; set; }
        public string? EmployeeManager { get; set; }
        public int ReviewerId { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public DateTime ReviewPeriodStart { get; set; }
        public DateTime ReviewPeriodEnd { get; set; }
        public decimal OverallRating { get; set; }
        public string? Strengths { get; set; }
        public string? AreasForImprovement { get; set; }
        public string? Goals { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
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

        [Required]
        [Range(1.0, 5.0, ErrorMessage = "Overall rating must be between 1.0 and 5.0")]
        public decimal OverallRating { get; set; }

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

    public class ReviewAnalyticsDto
    {
        public int TotalReviews { get; set; }
        public decimal AverageRating { get; set; }
        public Dictionary<string, int> StatusDistribution { get; set; } = new();
        public Dictionary<string, int> RatingDistribution { get; set; } = new();
        public Dictionary<string, decimal> DepartmentAverages { get; set; } = new();
        public Dictionary<string, int> ReviewsByMonth { get; set; } = new();
    }
    #endregion
}
