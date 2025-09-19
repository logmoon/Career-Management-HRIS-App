using career_module.server.Infrastructure.Data;
using career_module.server.Services;
using System.ComponentModel.DataAnnotations;

namespace career_module.server.Models.Entities
{
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
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Employee? Employee { get; set; }
    }

    // Core Employee Entity
    public class Employee
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
        public string Email => User?.Email ?? string.Empty;

        // Navigation Properties
        public User User { get; set; } = null!;
        public Employee? Manager { get; set; }
        public Position? CurrentPosition { get; set; }
        public Department Department { get; set; } = null!;

        public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();
        public ICollection<EmployeeSkill> EmployeeSkills { get; set; } = new List<EmployeeSkill>();
        public ICollection<EmployeeExperience> EmployeeExperiences { get; set; } = new List<EmployeeExperience>();
        public ICollection<EmployeeEducation> EmployeeEducations { get; set; } = new List<EmployeeEducation>();
        public ICollection<PerformanceReview> PerformanceReviews { get; set; } = new List<PerformanceReview>();
        public ICollection<SuccessionCandidate> SuccessionCandidates { get; set; } = new List<SuccessionCandidate>();

        // Requests
        public ICollection<EmployeeRequest> RequestsMade { get; set; } = new List<EmployeeRequest>();
        public ICollection<EmployeeRequest> RequestsForMe { get; set; } = new List<EmployeeRequest>();
        public ICollection<EmployeeRequest> RequestsIApprovedAsManager { get; set; } = new List<EmployeeRequest>();
        public ICollection<EmployeeRequest> RequestsIApprovedAsHR { get; set; } = new List<EmployeeRequest>();
    }

    // Department Entity
    public class Department
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? HeadOfDepartmentId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Employee? HeadOfDepartment { get; set; }
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public ICollection<Position> Positions { get; set; } = new List<Position>();
    }

    // Position/Job Entity
    public class Position
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string Description { get; set; } = string.Empty;
        [Range(0, double.MaxValue)]
        public decimal? MinSalary { get; set; }
        [Range(0, double.MaxValue)]
        public decimal? MaxSalary { get; set; }
        public string Level { get; set; } = string.Empty; // Junior, Mid, Senior, Lead, Manager, Director
        public bool IsKeyPosition { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Department Department { get; set; } = null!;
        public ICollection<Employee> CurrentEmployees { get; set; } = new List<Employee>();
        public ICollection<SuccessionPlan> SuccessionPlans { get; set; } = new List<SuccessionPlan>();
        public ICollection<CareerPath> FromCareerPaths { get; set; } = new List<CareerPath>();
        public ICollection<CareerPath> ToCareerPaths { get; set; } = new List<CareerPath>();
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public ICollection<EmployeeSkill> EmployeeSkills { get; set; } = new List<EmployeeSkill>();
        public ICollection<CareerPathSkill> CareerPathSkills { get; set; } = new List<CareerPathSkill>();
    }

    public class EmployeeSkill
    {
        public int EmployeeId { get; set; }
        public int SkillId { get; set; }
        [Range(1, 5)]
        public int ProficiencyLevel { get; set; } // 1-5 scale
        public DateTime AcquiredDate { get; set; }
        public DateTime? LastAssessedDate { get; set; }
        public string? Notes { get; set; }

        // Navigation Properties
        public Employee Employee { get; set; } = null!;
        public Skill Skill { get; set; } = null!;
    }

    public class EmployeeExperience
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        [Required]
        public string JobTitle { get; set; } = string.Empty;
        [Required]
        public string Company { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Employee Employee { get; set; } = null!;
    }

    public class EmployeeEducation
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        [Required]
        public string Degree { get; set; } = string.Empty;
        [Required]
        public string Level { get; set; } = string.Empty;
        [Required]
        public string Institution { get; set; } = string.Empty;
        public int? GraduationYear { get; set; }
        public string FieldOfStudy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Employee Employee { get; set; } = null!;
    }

    public abstract class EmployeeRequest
    {
        public int Id { get; set; }
        public int RequesterId { get; set; }
        public int? TargetEmployeeId { get; set; }
        private string _requestType = string.Empty;
        public virtual string RequestType
        {
            get => _requestType;
            protected set => _requestType = value;
        }
        public string Status { get; set; } = "Pending"; // Pending, ManagerApproved, HRApproved, Rejected, AutoApproved, Canceled
        public int? ApprovedByManagerId { get; set; }
        public int? ApprovedByHRId { get; set; }
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        public DateTime? ManagerApprovalDate { get; set; }
        public DateTime? HRApprovalDate { get; set; }
        public DateTime? ProcessedDate { get; set; }
        public string? RejectionReason { get; set; }
        public string? Notes { get; set; }

        // Navigation
        public Employee Requester { get; set; } = null!;
        public Employee? TargetEmployee { get; set; }
        public Employee? ApprovedByManager { get; set; }
        public Employee? ApprovedByHR { get; set; }

        public void SetInitialStatus()
        {
            var requesterRole = Requester.User.Role;
            if (RequesterId == TargetEmployee?.Id)
            {
                Status = "Pending";
            }
            else
            {
                Status = requesterRole switch
                {
                    "Admin" => "AutoApproved",
                    "HR" => "AutoApproved",
                    "Manager" => "ManagerApproved",
                    _ => "Pending"
                };
            }

            if (Status == "AutoApproved")
            {
                ApprovedByHRId = RequesterId;
                HRApprovalDate = DateTime.UtcNow;
            }
            else if (Status == "ManagerApproved")
            {
                ApprovedByManagerId = RequesterId;
                ManagerApprovalDate = DateTime.UtcNow;
            }
        }

        public bool CanApproveAsManager(int managerId)
        {
            if (Status == "Canceled") return false;

            return Status == "Pending" &&
                   (TargetEmployee?.ManagerId == managerId || Requester.ManagerId == managerId) &&
                   RequesterId != TargetEmployee?.Id;
        }

        public bool CanApproveAsHR(string userRole)
        {
            if (Status == "Canceled") return false;

            return (Status == "ManagerApproved" || Status == "Pending") &&
                   (userRole == "HR" || userRole == "Admin") && RequesterId != TargetEmployee?.Id;
        }

        public abstract Task<bool> ExecuteRequestAsync(IServiceProvider serviceProvider, int approverId);
    }

    // Promotion Request
    public class PromotionRequest : EmployeeRequest
    {
        public PromotionRequest()
        {
            RequestType = "Promotion";
        }

        [Required]
        public int CareerPathId { get; set; }
        public int? NewManagerId { get; set; }
        public decimal? ProposedSalary { get; set; }
        public string? Justification { get; set; }
        public DateTime? EffectiveDate { get; set; }

        // Navigation
        public CareerPath CareerPath { get; set; }
        public Employee? NewManager { get; set; }

        public override async Task<bool> ExecuteRequestAsync(IServiceProvider serviceProvider, int approverId)
        {
            var context = serviceProvider.GetRequiredService<CareerManagementDbContext>();
            var employeeService = serviceProvider.GetRequiredService<EmployeeService>();
            var careerPathService = serviceProvider.GetRequiredService<CareerPathService>();
            var employeeRequestService = serviceProvider.GetRequiredService<EmployeeRequestService>();
            var targetEmployee = TargetEmployee ?? Requester;

            // Set employee's current position
            targetEmployee.CurrentPositionId = CareerPath.ToPositionId;

            // Change department
            await employeeService.ChangeDepartmentAsync(targetEmployee.Id, CareerPath.ToPosition.DepartmentId, approverId);

            // If a manager was provided, set it
            if (NewManagerId.HasValue)
            {
                await employeeService.ChangeManagerAsync(targetEmployee.Id, NewManagerId, approverId);
            }

            // If a salary was provided, set it
            if (ProposedSalary.HasValue)
                targetEmployee.Salary = ProposedSalary.Value;

            ProcessedDate = DateTime.UtcNow;
            await context.SaveChangesAsync();
            return true;
        }
    }

    // Department Change Request
    public class DepartmentChangeRequest : EmployeeRequest
    {
        public DepartmentChangeRequest()
        {
            RequestType = "DepartmentChange";
        }

        [Required]
        public int NewDepartmentId { get; set; }
        public int? NewManagerId { get; set; }
        public string? Reason { get; set; }
        public DateTime? EffectiveDate { get; set; }

        // Navigation
        public Department NewDepartment { get; set; } = null!;
        public Employee? NewManager { get; set; }

        public override async Task<bool> ExecuteRequestAsync(IServiceProvider serviceProvider, int approverId)
        {
            var context = serviceProvider.GetRequiredService<CareerManagementDbContext>();
            var employeeService = serviceProvider.GetRequiredService<EmployeeService>();
            var targetEmployee = TargetEmployee ?? Requester;

            await employeeService.ChangeDepartmentAsync(targetEmployee.Id, NewDepartmentId, approverId);
            if (NewManagerId.HasValue)
            {
                await employeeService.ChangeManagerAsync(targetEmployee.Id, NewManagerId, approverId);
            }

            ProcessedDate = DateTime.UtcNow;
            await context.SaveChangesAsync();
            return true;
        }
    }

    // Performance Management
    public class PerformanceReview
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public int ReviewerId { get; set; }
        public DateTime ReviewPeriodStart { get; set; }
        public DateTime ReviewPeriodEnd { get; set; }
        [Range(1, 5)]
        public decimal OverallRating { get; set; } // 1-5 scale
        public string? Strengths { get; set; }
        public string? AreasForImprovement { get; set; }
        public string? Goals { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Completed, Approved
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Employee Employee { get; set; } = null!;
        public Employee Reviewer { get; set; } = null!;
    }

    // Succession Planning
    public class SuccessionPlan
    {
        public int Id { get; set; }
        public int PositionId { get; set; }
        public string Status { get; set; } = "Active"; // Active, Completed, OnHold
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewDate { get; set; }
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
        [Range(1, int.MaxValue)]
        public int Priority { get; set; } // 1 = highest priority
        [Range(0, 100)]
        public decimal MatchScore { get; set; } // 0-100 compatibility score
        public string Status { get; set; } = "UnderReview"; // UnderReview, Approved, InTraining, Ready, NotSuitable
        public string? Notes { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public SuccessionPlan SuccessionPlan { get; set; } = null!;
        public Employee Employee { get; set; } = null!;
    }

    // Career Path Management
    public class CareerPath
    {
        public int Id { get; set; }
        public int? FromPositionId { get; set; }
        public int ToPositionId { get; set; }
        [Range(0, 50)]
        public int MinYearsInCurrentRole { get; set; } = 1;
        [Range(0, 50)]
        public int MinTotalExperience { get; set; } = 0;
        [Range(1, 5)]
        public decimal? MinPerformanceRating { get; set; } // 1-5 scale
        public string? RequiredCertifications { get; set; }
        public string? RequiredEducationLevel { get; set; } // Bachelor, Master, PhD, etc.
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Position? FromPosition { get; set; } = null!;
        public Position ToPosition { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
        public ICollection<CareerPathSkill> RequiredSkills { get; set; } = new List<CareerPathSkill>();
    }

    public class CareerPathSkill
    {
        public int Id { get; set; }
        public int CareerPathId { get; set; }
        public int SkillId { get; set; }
        [Range(1, 5)]
        public int MinProficiencyLevel { get; set; }
        public bool IsMandatory { get; set; } = true;

        // Navigation Properties
        public CareerPath CareerPath { get; set; } = null!;
        public Skill Skill { get; set; } = null!;
    }
}
