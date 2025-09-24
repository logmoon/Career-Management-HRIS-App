using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Infrastructure.Data
{
    public class CareerManagementDbContext : DbContext
    {
        public CareerManagementDbContext(DbContextOptions<CareerManagementDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<EmployeeExperience> EmployeeExperiences { get; set; }
        public DbSet<EmployeeEducation> EmployeeEducations { get; set; }
        public DbSet<EmployeeSkill> EmployeeSkills { get; set; }
        public DbSet<PerformanceReview> PerformanceReviews { get; set; }
        public DbSet<SuccessionPlan> SuccessionPlans { get; set; }
        public DbSet<SuccessionCandidate> SuccessionCandidates { get; set; }
        public DbSet<CareerPath> CareerPaths { get; set; }
        public DbSet<CareerPathSkill> CareerPathSkills { get; set; }

        // Employee Request DbSets - using Table Per Hierarchy (TPH)
        public DbSet<EmployeeRequest> EmployeeRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.Role).HasMaxLength(50);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();

                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Department Configuration
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(d => d.HeadOfDepartment)
                      .WithMany()
                      .HasForeignKey(d => d.HeadOfDepartmentId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Employee Configuration
            modelBuilder.Entity<Employee>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);

                // Remove Email property since it's computed from User
                entity.Ignore(e => e.Email);
                entity.Ignore(e => e.FullName);

                entity.Property(e => e.Salary).HasPrecision(18, 2);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Self-referencing relationship for Manager
                entity.HasOne(e => e.Manager)
                      .WithMany(e => e.DirectReports)
                      .HasForeignKey(e => e.ManagerId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relationship with User (One-to-One)
                entity.Property(e => e.UserId).IsRequired();
                entity.HasOne(e => e.User)
                      .WithOne(u => u.Employee)
                      .HasForeignKey<Employee>(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Relationship with Position
                entity.HasOne(e => e.CurrentPosition)
                      .WithMany(p => p.CurrentEmployees)
                      .HasForeignKey(e => e.CurrentPositionId)
                      .OnDelete(DeleteBehavior.SetNull);

                // Relationship with Department
                entity.HasOne(e => e.Department)
                      .WithMany(d => d.Employees)
                      .HasForeignKey(e => e.DepartmentId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relationships with requests
                entity.HasMany(e => e.RequestsMade)
                      .WithOne(r => r.Requester)
                      .HasForeignKey(r => r.RequesterId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.RequestsForMe)
                      .WithOne(r => r.TargetEmployee)
                      .HasForeignKey(r => r.TargetEmployeeId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.RequestsIApprovedAsManager)
                      .WithOne(r => r.ApprovedByManager)
                      .HasForeignKey(r => r.ApprovedByManagerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.RequestsIApprovedAsHR)
                      .WithOne(r => r.ApprovedByHR)
                      .HasForeignKey(r => r.ApprovedByHRId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Position Configuration
            modelBuilder.Entity<Position>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).HasMaxLength(200);
                entity.Property(e => e.Level).HasMaxLength(50);
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");
                entity.Property(e => e.MinSalary).HasPrecision(18, 2);
                entity.Property(e => e.MaxSalary).HasPrecision(18, 2);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(p => p.Department)
                      .WithMany(d => d.Positions)
                      .HasForeignKey(p => p.DepartmentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Skill Configuration
            modelBuilder.Entity<Skill>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Category).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // EmployeeExperience Configuration
            modelBuilder.Entity<EmployeeExperience>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.JobTitle).HasMaxLength(200);
                entity.Property(e => e.Company).HasMaxLength(200);
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.Employee)
                      .WithMany(emp => emp.EmployeeExperiences)
                      .HasForeignKey(e => e.EmployeeId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // EmployeeEducation Configuration
            modelBuilder.Entity<EmployeeEducation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Degree).HasMaxLength(100);
                entity.Property(e => e.Institution).HasMaxLength(200);
                entity.Property(e => e.FieldOfStudy).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.Employee)
                      .WithMany(emp => emp.EmployeeEducations)
                      .HasForeignKey(e => e.EmployeeId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // EmployeeSkill Junction Table Configuration
            modelBuilder.Entity<EmployeeSkill>(entity =>
            {
                entity.HasKey(e => new { e.EmployeeId, e.SkillId });

                entity.HasOne(e => e.Employee)
                      .WithMany(emp => emp.EmployeeSkills)
                      .HasForeignKey(e => e.EmployeeId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Skill)
                      .WithMany(s => s.EmployeeSkills)
                      .HasForeignKey(e => e.SkillId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // PerformanceReview Configuration
            modelBuilder.Entity<PerformanceReview>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OverallRating).HasPrecision(3, 2);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Strengths).HasColumnType("nvarchar(max)");
                entity.Property(e => e.AreasForImprovement).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Goals).HasColumnType("nvarchar(max)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(pr => pr.Employee)
                      .WithMany(e => e.PerformanceReviews)
                      .HasForeignKey(pr => pr.EmployeeId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pr => pr.Reviewer)
                      .WithMany()
                      .HasForeignKey(pr => pr.ReviewerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<EmployeeRequest>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Basic properties
                entity.Property(e => e.RequestType)
                      .HasMaxLength(50)
                      .IsRequired();

                entity.Property(e => e.Status)
                      .HasMaxLength(50)
                      .HasDefaultValue("Pending");

                entity.Property(e => e.RequestDate)
                      .HasDefaultValueSql("GETUTCDATE()");

                // Text fields
                entity.Property(e => e.RejectionReason)
                      .HasColumnType("nvarchar(max)");

                entity.Property(e => e.Notes)
                      .HasColumnType("nvarchar(max)");

                entity.Property(e => e.Justification)
                      .HasColumnType("nvarchar(max)");

                entity.Property(e => e.Reason)
                      .HasColumnType("nvarchar(max)");

                // Decimal precision for salary
                entity.Property(e => e.ProposedSalary)
                      .HasPrecision(18, 2);

                // Relationships
                entity.HasOne(r => r.Requester)
                      .WithMany(e => e.RequestsMade)
                      .HasForeignKey(r => r.RequesterId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.TargetEmployee)
                      .WithMany(e => e.RequestsForMe)
                      .HasForeignKey(r => r.TargetEmployeeId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                entity.HasOne(r => r.ApprovedByManager)
                      .WithMany(e => e.RequestsIApprovedAsManager)
                      .HasForeignKey(r => r.ApprovedByManagerId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                entity.HasOne(r => r.ApprovedByHR)
                      .WithMany(e => e.RequestsIApprovedAsHR)
                      .HasForeignKey(r => r.ApprovedByHRId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                // Conditional relationships (nullable foreign keys)
                entity.HasOne(r => r.NewPosition)
                      .WithMany()
                      .HasForeignKey(r => r.NewPositionId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                entity.HasOne(r => r.NewDepartment)
                      .WithMany()
                      .HasForeignKey(r => r.NewDepartmentId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                entity.HasOne(r => r.NewManager)
                      .WithMany()
                      .HasForeignKey(r => r.NewManagerId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                // Indexes for performance
                entity.HasIndex(e => e.Status)
                      .HasDatabaseName("IX_EmployeeRequest_Status");

                entity.HasIndex(e => e.RequestType)
                      .HasDatabaseName("IX_EmployeeRequest_RequestType");

                entity.HasIndex(e => new { e.RequesterId, e.Status })
                      .HasDatabaseName("IX_EmployeeRequest_Requester_Status");

                entity.HasIndex(e => new { e.TargetEmployeeId, e.Status })
                      .HasDatabaseName("IX_EmployeeRequest_Target_Status");

                entity.HasIndex(e => e.RequestDate)
                      .HasDatabaseName("IX_EmployeeRequest_RequestDate");
            });

            // SuccessionPlan Configuration
            modelBuilder.Entity<SuccessionPlan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Notes).HasColumnType("nvarchar(max)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.Position)
                      .WithMany(p => p.SuccessionPlans)
                      .HasForeignKey(e => e.PositionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CreatedBy)
                      .WithMany()
                      .HasForeignKey(e => e.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // SuccessionCandidate Configuration
            modelBuilder.Entity<SuccessionCandidate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.MatchScore).HasPrecision(5, 2);
                entity.Property(e => e.Notes).HasColumnType("nvarchar(max)");
                entity.Property(e => e.AddedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.SuccessionPlan)
                      .WithMany(sp => sp.Candidates)
                      .HasForeignKey(e => e.SuccessionPlanId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Employee)
                      .WithMany(emp => emp.SuccessionCandidates)
                      .HasForeignKey(e => e.EmployeeId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Ensure unique priority within each succession plan
                entity.HasIndex(e => new { e.SuccessionPlanId, e.Priority })
                      .IsUnique()
                      .HasDatabaseName("IX_SuccessionCandidate_Plan_Priority");
            });

            // CareerPath Configuration
            modelBuilder.Entity<CareerPath>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.MinPerformanceRating).HasPrecision(3, 2);
                entity.Property(e => e.RequiredCertifications).HasColumnType("nvarchar(max)");
                entity.Property(e => e.RequiredEducationLevel).HasMaxLength(50);
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(cp => cp.FromPosition)
                      .WithMany(p => p.FromCareerPaths)
                      .HasForeignKey(cp => cp.FromPositionId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                entity.HasOne(cp => cp.ToPosition)
                      .WithMany(p => p.ToCareerPaths)
                      .HasForeignKey(cp => cp.ToPositionId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(cp => cp.CreatedBy)
                      .WithMany()
                      .HasForeignKey(cp => cp.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Prevent duplicate career paths
                entity.HasIndex(e => new { e.FromPositionId, e.ToPositionId })
                      .IsUnique()
                      .HasDatabaseName("IX_CareerPath_From_To");
            });

            // CareerPathSkill Configuration
            modelBuilder.Entity<CareerPathSkill>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(cps => cps.CareerPath)
                      .WithMany(cp => cp.RequiredSkills)
                      .HasForeignKey(cps => cps.CareerPathId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(cps => cps.Skill)
                      .WithMany(s => s.CareerPathSkills)
                      .HasForeignKey(cps => cps.SkillId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Prevent duplicate skills for same career path
                entity.HasIndex(e => new { e.CareerPathId, e.SkillId })
                      .IsUnique()
                      .HasDatabaseName("IX_CareerPathSkill_Path_Skill");
            });

            // Seed Data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            var staticDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            // ---------------- USERS ----------------
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "admin", Email = "admin@admin.admin", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "Admin", CreatedAt = staticDate, UpdatedAt = staticDate },
                new User { Id = 2, Username = "hr", Email = "hr@hr.hr", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "HR", CreatedAt = staticDate, UpdatedAt = staticDate },
                new User { Id = 3, Username = "employee", Email = "employee@employee.employee", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "Employee", CreatedAt = staticDate, UpdatedAt = staticDate },
                new User { Id = 4, Username = "manager", Email = "manager@manager.manager", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "Manager", CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            // ---------------- DEPARTMENTS ----------------
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "Administration", Description = "Administrative functions", CreatedAt = staticDate },
                new Department { Id = 2, Name = "Human Resources", Description = "HR and people management", CreatedAt = staticDate },
                new Department { Id = 3, Name = "Engineering", Description = "Software development and engineering", CreatedAt = staticDate },
                new Department { Id = 4, Name = "Sales", Description = "Sales and business development", CreatedAt = staticDate }
            );

            // ---------------- POSITIONS ----------------
            modelBuilder.Entity<Position>().HasData(
                new Position { Id = 1, Title = "Administrator", DepartmentId = 1, Level = "Senior", IsKeyPosition = true, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Position { Id = 2, Title = "HR Representative", DepartmentId = 2, Level = "Mid", IsKeyPosition = false, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Position { Id = 3, Title = "Software Developer", DepartmentId = 3, Level = "Mid", IsKeyPosition = false, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Position { Id = 4, Title = "Engineering Manager", DepartmentId = 3, Level = "Manager", IsKeyPosition = true, CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            // ---------------- EMPLOYEES ----------------
            modelBuilder.Entity<Employee>().HasData(
                new Employee { Id = 1, UserId = 1, FirstName = "Admin", LastName = "User", Phone = "555-0001", DepartmentId = 1, CurrentPositionId = 1, HireDate = staticDate, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Employee { Id = 2, UserId = 2, FirstName = "HR", LastName = "Representative", Phone = "555-0002", DepartmentId = 2, CurrentPositionId = 2, HireDate = staticDate, ManagerId = 1, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Employee { Id = 3, UserId = 3, FirstName = "John", LastName = "Employee", Phone = "555-0003", DepartmentId = 3, CurrentPositionId = 3, HireDate = staticDate, ManagerId = 4, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Employee { Id = 4, UserId = 4, FirstName = "Jane", LastName = "Manager", Phone = "555-0004", DepartmentId = 3, CurrentPositionId = 4, HireDate = staticDate, ManagerId = 1, CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            // ---------------- SKILLS ----------------
            modelBuilder.Entity<Skill>().HasData(
                new Skill { Id = 1, Name = "C# Programming", Category = "Technical", CreatedAt = staticDate },
                new Skill { Id = 2, Name = "JavaScript", Category = "Technical", CreatedAt = staticDate },
                new Skill { Id = 3, Name = "Leadership", Category = "Soft Skills", CreatedAt = staticDate },
                new Skill { Id = 4, Name = "Project Management", Category = "Management", CreatedAt = staticDate },
                new Skill { Id = 5, Name = "SQL Database", Category = "Technical", CreatedAt = staticDate },
                new Skill { Id = 6, Name = "Angular", Category = "Technical", CreatedAt = staticDate },
                new Skill { Id = 7, Name = "Communication", Category = "Soft Skills", CreatedAt = staticDate },
                new Skill { Id = 8, Name = "Problem Solving", Category = "Soft Skills", CreatedAt = staticDate }
            );

            // ---------------- EMPLOYEE SKILLS ----------------
            modelBuilder.Entity<EmployeeSkill>().HasData(
                new { EmployeeId = 3, SkillId = 1, ProficiencyLevel = 4, AcquiredDate = staticDate, LastAssessedDate = staticDate, Notes = "Strong backend skills" },
                new { EmployeeId = 3, SkillId = 2, ProficiencyLevel = 3, AcquiredDate = staticDate, LastAssessedDate = staticDate, Notes = "Frontend experience" },
                new { EmployeeId = 4, SkillId = 3, ProficiencyLevel = 5, AcquiredDate = staticDate, LastAssessedDate = staticDate, Notes = "Excellent leader" },
                new { EmployeeId = 2, SkillId = 7, ProficiencyLevel = 4, AcquiredDate = staticDate, LastAssessedDate = staticDate, Notes = "Strong HR communication" }
            );

            // ---------------- EDUCATION ----------------
            modelBuilder.Entity<EmployeeEducation>().HasData(
                new EmployeeEducation { Id = 1, EmployeeId = 3, Degree = "BSc Computer Science", Level = "Bachelor", Institution = "Tech University", GraduationYear = 2020, FieldOfStudy = "Software Engineering", CreatedAt = staticDate },
                new EmployeeEducation { Id = 2, EmployeeId = 2, Degree = "MSc Human Resources", Level = "Master", Institution = "Business School", GraduationYear = 2018, FieldOfStudy = "HR Management", CreatedAt = staticDate }
            );

            // ---------------- EXPERIENCES ----------------
            modelBuilder.Entity<EmployeeExperience>().HasData(
                new EmployeeExperience { Id = 1, EmployeeId = 3, JobTitle = "Intern Developer", Company = "Startup Inc.", StartDate = new DateTime(2019, 6, 1), EndDate = new DateTime(2019, 12, 1), Description = "Worked on internal tools", CreatedAt = staticDate },
                new EmployeeExperience { Id = 2, EmployeeId = 4, JobTitle = "Senior Developer", Company = "BigCorp", StartDate = new DateTime(2015, 1, 1), EndDate = new DateTime(2019, 12, 31), Description = "Led development team", CreatedAt = staticDate }
            );

            // ---------------- PERFORMANCE REVIEWS ----------------
            modelBuilder.Entity<PerformanceReview>().HasData(
                new PerformanceReview { Id = 1, EmployeeId = 3, ReviewerId = 4, ReviewPeriodStart = new DateTime(2023, 1, 1), ReviewPeriodEnd = new DateTime(2023, 12, 31), OverallRating = 4.2m, Strengths = "Great coding ability", AreasForImprovement = "Improve communication", Goals = "Lead a project in 2024", Status = "Completed", CreatedAt = staticDate, UpdatedAt = staticDate },
                new PerformanceReview { Id = 2, EmployeeId = 4, ReviewerId = 2, ReviewPeriodStart = new DateTime(2023, 1, 1), ReviewPeriodEnd = new DateTime(2023, 12, 31), OverallRating = 4.5m, Strengths = "Strong leadership", AreasForImprovement = "Delegate more", Goals = "Mentor junior staff", Status = "Completed", CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            // ---------------- EMPLOYEE REQUESTS ----------------
            modelBuilder.Entity<EmployeeRequest>().HasData(
                new EmployeeRequest { Id = 1, RequesterId = 3, RequestType = "PositionChange", Status = "Pending", NewPositionId = 4, ProposedSalary = 60000, Justification = "Consistently exceeding expectations", RequestDate = staticDate },
                new EmployeeRequest { Id = 2, RequesterId = 2, TargetEmployeeId = 3, RequestType = "DepartmentChange", Status = "ManagerApproved", NewDepartmentId = 2, Reason = "Employee requested HR rotation", ApprovedByManagerId = 4, ManagerApprovalDate = staticDate, RequestDate = staticDate }
            );

            // ---------------- SUCCESSION PLANS ----------------
            modelBuilder.Entity<SuccessionPlan>().HasData(
                new SuccessionPlan { Id = 1, PositionId = 4, CreatedByUserId = 1, Status = "Active", Notes = "Potential successors for Engineering Manager", CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            modelBuilder.Entity<SuccessionCandidate>().HasData(
                new SuccessionCandidate { Id = 1, SuccessionPlanId = 1, EmployeeId = 3, Priority = 1, MatchScore = 85, Status = "UnderReview", Notes = "Promising candidate", AddedAt = staticDate, UpdatedAt = staticDate }
            );

            // ---------------- CAREER PATHS ----------------
            modelBuilder.Entity<CareerPath>().HasData(
                new CareerPath { Id = 1, FromPositionId = 3, ToPositionId = 4, MinYearsInCurrentRole = 2, MinPerformanceRating = 4, Description = "Path from Developer to Manager", CreatedByUserId = 1, CreatedAt = staticDate, UpdatedAt = staticDate },
                new CareerPath { Id = 2, FromPositionId = 2, ToPositionId = 1, MinYearsInCurrentRole = 3, MinPerformanceRating = 3, Description = "Path from HR Rep to Administrator", CreatedByUserId = 1, CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            modelBuilder.Entity<CareerPathSkill>().HasData(
                new CareerPathSkill { Id = 1, CareerPathId = 1, SkillId = 3, MinProficiencyLevel = 3, IsMandatory = true },
                new CareerPathSkill { Id = 2, CareerPathId = 1, SkillId = 4, MinProficiencyLevel = 3, IsMandatory = true },
                new CareerPathSkill { Id = 3, CareerPathId = 2, SkillId = 7, MinProficiencyLevel = 4, IsMandatory = true }
            );
        }
    }
}