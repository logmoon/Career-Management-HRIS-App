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
        public DbSet<PromotionRequest> PromotionRequests { get; set; }
        public DbSet<DepartmentChangeRequest> DepartmentChangeRequests { get; set; }

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

            #region Employee Requests
            // Configure inheritance for EmployeeRequest using Table Per Hierarchy (TPH)
            modelBuilder.Entity<EmployeeRequest>()
                .HasDiscriminator<string>("RequestType")
                .HasValue<PromotionRequest>("Promotion")
                .HasValue<DepartmentChangeRequest>("DepartmentChange");

            // Configure base EmployeeRequest
            modelBuilder.Entity<EmployeeRequest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.RequestDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.RejectionReason).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Notes).HasColumnType("nvarchar(max)");

                // Relationships
                entity.HasOne(r => r.Requester)
                      .WithMany(e => e.RequestsMade)
                      .HasForeignKey(r => r.RequesterId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.TargetEmployee)
                      .WithMany(e => e.RequestsForMe)
                      .HasForeignKey(r => r.TargetEmployeeId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.ApprovedByManager)
                      .WithMany(e => e.RequestsIApprovedAsManager)
                      .HasForeignKey(r => r.ApprovedByManagerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.ApprovedByHR)
                      .WithMany(e => e.RequestsIApprovedAsHR)
                      .HasForeignKey(r => r.ApprovedByHRId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Indexes
                entity.HasIndex(e => e.Status)
                      .HasDatabaseName("IX_EmployeeRequest_Status");

                entity.HasIndex(e => new { e.RequesterId, e.Status })
                      .HasDatabaseName("IX_EmployeeRequest_Requester_Status");
            });

            // Configure specific request types
            modelBuilder.Entity<PromotionRequest>(entity =>
            {
                entity.Property(e => e.Justification).HasColumnType("nvarchar(max)");
                entity.Property(e => e.ProposedSalary).HasPrecision(18, 2);

                entity.HasOne(p => p.CareerPath)
                      .WithMany()
                      .HasForeignKey(p => p.CareerPathId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.NewManager)
                      .WithMany()
                      .HasForeignKey(d => d.NewManagerId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);
            });

            modelBuilder.Entity<DepartmentChangeRequest>(entity =>
            {
                entity.Property(e => e.Reason).HasColumnType("nvarchar(max)");

                entity.HasOne(d => d.NewDepartment)
                      .WithMany()
                      .HasForeignKey(d => d.NewDepartmentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.NewManager)
                      .WithMany()
                      .HasForeignKey(d => d.NewManagerId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);
            });
            #endregion

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

            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "admin", Email = "admin@admin.admin", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "Admin", CreatedAt = staticDate, UpdatedAt = staticDate },
                new User { Id = 2, Username = "hr", Email = "hr@hr.hr", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "HR", CreatedAt = staticDate, UpdatedAt = staticDate },
                new User { Id = 3, Username = "employee", Email = "employee@employee.employee", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "Employee", CreatedAt = staticDate, UpdatedAt = staticDate },
                new User { Id = 4, Username = "manager", Email = "manager@manager.manager", PasswordHash = "$2a$11$H49nhtoaRIX.J7mm3rd9H.ew4v69KgMHzCfELwyZbEEkwsfepb4OO", Role = "Manager", CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            // Seed Departments
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "Administration", Description = "Administrative functions", CreatedAt = staticDate },
                new Department { Id = 2, Name = "Human Resources", Description = "HR and people management", CreatedAt = staticDate },
                new Department { Id = 3, Name = "Engineering", Description = "Software development and engineering", CreatedAt = staticDate },
                new Department { Id = 4, Name = "Sales", Description = "Sales and business development", CreatedAt = staticDate }
            );

            // Seed Positions
            modelBuilder.Entity<Position>().HasData(
                new Position { Id = 1, Title = "Administrator", DepartmentId = 1, Level = "Senior", IsKeyPosition = true, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Position { Id = 2, Title = "HR Representative", DepartmentId = 2, Level = "Mid", IsKeyPosition = false, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Position { Id = 3, Title = "Software Developer", DepartmentId = 3, Level = "Mid", IsKeyPosition = false, CreatedAt = staticDate, UpdatedAt = staticDate },
                new Position { Id = 4, Title = "Engineering Manager", DepartmentId = 3, Level = "Manager", IsKeyPosition = true, CreatedAt = staticDate, UpdatedAt = staticDate }
            );

            // Seed Employees
            modelBuilder.Entity<Employee>().HasData(
                new Employee
                {
                    Id = 1,
                    UserId = 1,
                    FirstName = "Admin",
                    LastName = "User",
                    Phone = "555-0001",
                    DepartmentId = 1,
                    CurrentPositionId = 1,
                    HireDate = staticDate,
                    CreatedAt = staticDate,
                    UpdatedAt = staticDate
                },
                new Employee
                {
                    Id = 2,
                    UserId = 2,
                    FirstName = "HR",
                    LastName = "Representative",
                    Phone = "555-0002",
                    DepartmentId = 2,
                    CurrentPositionId = 2,
                    HireDate = staticDate,
                    ManagerId = 1,
                    CreatedAt = staticDate,
                    UpdatedAt = staticDate
                },
                new Employee
                {
                    Id = 3,
                    UserId = 3,
                    FirstName = "John",
                    LastName = "Employee",
                    Phone = "555-0003",
                    DepartmentId = 3,
                    CurrentPositionId = 3,
                    HireDate = staticDate,
                    ManagerId = 4,
                    CreatedAt = staticDate,
                    UpdatedAt = staticDate
                },
                new Employee
                {
                    Id = 4,
                    UserId = 4,
                    FirstName = "Jane",
                    LastName = "Manager",
                    Phone = "555-0004",
                    DepartmentId = 3,
                    CurrentPositionId = 4,
                    HireDate = staticDate,
                    ManagerId = 1,
                    CreatedAt = staticDate,
                    UpdatedAt = staticDate
                }
            );

            // Seed Skills
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
        }
    }
}