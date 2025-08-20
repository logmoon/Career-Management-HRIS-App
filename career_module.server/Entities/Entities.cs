using System.ComponentModel.DataAnnotations;

namespace career_module.server.Entities
{
    // User & Authentication
    public class User
    {
        public int Id { get; set; }
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Employee"; // Employee, Manager, HR, Admin
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        // Navigation
        public Employee? Employee { get; set; }
    }

    // Core Employee Entity
    public class Employee
    {
        public int Id { get; set; }
        [Required]
        public string FirstName { get; set; } = string.Empty;
        [Required]
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime HireDate { get; set; }
        public int? ManagerId { get; set; }
        public int? CurrentPositionId { get; set; }
        public string Department { get; set; } = string.Empty;
        public decimal? Salary { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public User? User { get; set; }
        public int? UserId { get; set; }
        public Employee? Manager { get; set; }
        public Position? CurrentPosition { get; set; }
        public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();
        public ICollection<EmployeeSkill> EmployeeSkills { get; set; } = new List<EmployeeSkill>();
        public ICollection<CareerGoal> CareerGoals { get; set; } = new List<CareerGoal>();
        public ICollection<SuccessionCandidate> SuccessionCandidates { get; set; } = new List<SuccessionCandidate>();
        public ICollection<PerformanceReview> PerformanceReviews { get; set; } = new List<PerformanceReview>();
    }

    // Position/Job Entity
    public class Position
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal? MinSalary { get; set; }
        public decimal? MaxSalary { get; set; }
        public string Level { get; set; } = string.Empty; // Junior, Mid, Senior, Lead, Manager, Director
        public int MinYearsExperience { get; set; }
        public bool IsKeyPosition { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public ICollection<Employee> CurrentEmployees { get; set; } = new List<Employee>();
        public ICollection<PositionSkill> RequiredSkills { get; set; } = new List<PositionSkill>();
        public ICollection<SuccessionPlan> SuccessionPlans { get; set; } = new List<SuccessionPlan>();
        public ICollection<CareerGoal> TargetCareerGoals { get; set; } = new List<CareerGoal>();
    }

    // Skills Management
    public class Skill
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Technical, Leadership, Communication, etc.
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;

        // Navigation Properties
        public ICollection<EmployeeSkill> EmployeeSkills { get; set; } = new List<EmployeeSkill>();
        public ICollection<PositionSkill> PositionSkills { get; set; } = new List<PositionSkill>();
    }

    // Employee-Skill Junction with Proficiency
    public class EmployeeSkill
    {
        public int EmployeeId { get; set; }
        public int SkillId { get; set; }
        public int ProficiencyLevel { get; set; } // 1-5 scale
        public DateTime AcquiredDate { get; set; }
        public DateTime? LastAssessedDate { get; set; }
        public string? Notes { get; set; }

        // Navigation Properties
        public Employee Employee { get; set; } = null!;
        public Skill Skill { get; set; } = null!;
    }

    // Position-Skill Requirements
    public class PositionSkill
    {
        public int PositionId { get; set; }
        public int SkillId { get; set; }
        public int RequiredLevel { get; set; } // 1-5 scale
        public bool IsMandatory { get; set; } = true;
        public int Weight { get; set; } = 1; // For scoring algorithm

        // Navigation Properties
        public Position Position { get; set; } = null!;
        public Skill Skill { get; set; } = null!;
    }

    // Succession Planning
    public class SuccessionPlan
    {
        public int Id { get; set; }
        public int PositionId { get; set; }
        public string Status { get; set; } = "Active"; // Active, Completed, On-Hold
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewDate { get; set; }
        public int CreatedByUserId { get; set; }
        public string? Notes { get; set; }

        // Navigation Properties
        public Position Position { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
        public ICollection<SuccessionCandidate> Candidates { get; set; } = new List<SuccessionCandidate>();
    }

    public class SuccessionCandidate
    {
        public int Id { get; set; }
        public int SuccessionPlanId { get; set; }
        public int EmployeeId { get; set; }
        public int Priority { get; set; } // 1 = highest priority
        public decimal MatchScore { get; set; } // Calculated compatibility score
        public string Status { get; set; } = "Under Review"; // Under Review, Approved, In Training, Ready
        public string? Notes { get; set; }
        public DateTime AddedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public SuccessionPlan SuccessionPlan { get; set; } = null!;
        public Employee Employee { get; set; } = null!;
    }

    // Career Goals & Development
    public class CareerGoal
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public int? TargetPositionId { get; set; }
        public string GoalDescription { get; set; } = string.Empty;
        public DateTime TargetDate { get; set; }
        public string Status { get; set; } = "Active"; // Active, Achieved, On-Hold, Cancelled
        public string Priority { get; set; } = "Medium"; // High, Medium, Low
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Employee Employee { get; set; } = null!;
        public Position? TargetPosition { get; set; }
        public ICollection<DevelopmentAction> DevelopmentActions { get; set; } = new List<DevelopmentAction>();
    }

    public class DevelopmentAction
    {
        public int Id { get; set; }
        public int CareerGoalId { get; set; }
        public string ActionType { get; set; } = string.Empty; // Training, Mentoring, Assignment, etc.
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public CareerGoal CareerGoal { get; set; } = null!;
    }

    // Performance Reviews
    public class PerformanceReview
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public int ReviewerId { get; set; }
        public DateTime ReviewPeriodStart { get; set; }
        public DateTime ReviewPeriodEnd { get; set; }
        public decimal OverallRating { get; set; } // 1-5 scale
        public string? Strengths { get; set; }
        public string? AreasForImprovement { get; set; }
        public string? Goals { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Submitted, Approved
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Employee Employee { get; set; } = null!;
        public Employee Reviewer { get; set; } = null!;
    }
}
