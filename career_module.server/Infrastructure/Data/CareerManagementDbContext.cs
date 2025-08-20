using career_module.server.Entities;
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
        public DbSet<Position> Positions { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<EmployeeSkill> EmployeeSkills { get; set; }
        public DbSet<PositionSkill> PositionSkills { get; set; }
        public DbSet<SuccessionPlan> SuccessionPlans { get; set; }
        public DbSet<SuccessionCandidate> SuccessionCandidates { get; set; }
        public DbSet<CareerGoal> CareerGoals { get; set; }
        public DbSet<DevelopmentAction> DevelopmentActions { get; set; }
        public DbSet<PerformanceReview> PerformanceReviews { get; set; }

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
            });

            // Employee Configuration
            modelBuilder.Entity<Employee>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.Department).HasMaxLength(100);

                // Fix decimal precision for Salary
                entity.Property(e => e.Salary).HasPrecision(18, 2);

                // Self-referencing relationship for Manager
                entity.HasOne(e => e.Manager)
                      .WithMany(e => e.DirectReports)
                      .HasForeignKey(e => e.ManagerId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relationship with User
                entity.HasOne(e => e.User)
                      .WithOne(u => u.Employee)
                      .HasForeignKey<Employee>(e => e.UserId)
                      .OnDelete(DeleteBehavior.SetNull);

                // Relationship with Position
                entity.HasOne(e => e.CurrentPosition)
                      .WithMany(p => p.CurrentEmployees)
                      .HasForeignKey(e => e.CurrentPositionId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Position Configuration
            modelBuilder.Entity<Position>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).HasMaxLength(200);
                entity.Property(e => e.Department).HasMaxLength(100);
                entity.Property(e => e.Level).HasMaxLength(50);
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");

                // Fix decimal precision for salary ranges
                entity.Property(e => e.MinSalary).HasPrecision(18, 2);
                entity.Property(e => e.MaxSalary).HasPrecision(18, 2);
            });

            // Skill Configuration
            modelBuilder.Entity<Skill>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Category).HasMaxLength(50);
                entity.HasIndex(e => e.Name).IsUnique();
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

            // PositionSkill Junction Table Configuration
            modelBuilder.Entity<PositionSkill>(entity =>
            {
                entity.HasKey(e => new { e.PositionId, e.SkillId });

                entity.HasOne(e => e.Position)
                      .WithMany(p => p.RequiredSkills)
                      .HasForeignKey(e => e.PositionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Skill)
                      .WithMany(s => s.PositionSkills)
                      .HasForeignKey(e => e.SkillId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // SuccessionPlan Configuration
            modelBuilder.Entity<SuccessionPlan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasMaxLength(50);

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

                entity.HasOne(e => e.SuccessionPlan)
                      .WithMany(sp => sp.Candidates)
                      .HasForeignKey(e => e.SuccessionPlanId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Employee)
                      .WithMany(emp => emp.SuccessionCandidates)
                      .HasForeignKey(e => e.EmployeeId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // CareerGoal Configuration
            modelBuilder.Entity<CareerGoal>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Priority).HasMaxLength(50);

                entity.HasOne(e => e.Employee)
                      .WithMany(emp => emp.CareerGoals)
                      .HasForeignKey(e => e.EmployeeId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.TargetPosition)
                      .WithMany(p => p.TargetCareerGoals)
                      .HasForeignKey(e => e.TargetPositionId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Performance Review Configuration
            modelBuilder.Entity<PerformanceReview>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.OverallRating).HasPrecision(3, 2);

                entity.HasOne(e => e.Employee)
                      .WithMany(emp => emp.PerformanceReviews)
                      .HasForeignKey(e => e.EmployeeId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Reviewer)
                      .WithMany()
                      .HasForeignKey(e => e.ReviewerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Seed Data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // We use a static date for seeding to ensure consistency across different environments
            var staticDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "admin", Email = "admin@company.com", PasswordHash = "$2a$11$example", Role = "Admin", CreatedAt = staticDate },
                new User { Id = 2, Username = "hr_manager", Email = "hr@company.com", PasswordHash = "$2a$11$example", Role = "HR", CreatedAt = staticDate },
                new User { Id = 3, Username = "john.doe", Email = "john.doe@company.com", PasswordHash = "$2a$11$example", Role = "Employee", CreatedAt = staticDate },
                new User { Id = 4, Username = "jane.smith", Email = "jane.smith@company.com", PasswordHash = "$2a$11$example", Role = "Manager", CreatedAt = staticDate }
            );

            // Seed Skills
            modelBuilder.Entity<Skill>().HasData(
                new Skill { Id = 1, Name = "C# Programming", Category = "Technical" },
                new Skill { Id = 2, Name = "JavaScript", Category = "Technical" },
                new Skill { Id = 3, Name = "Leadership", Category = "Soft Skills" },
                new Skill { Id = 4, Name = "Project Management", Category = "Management" },
                new Skill { Id = 5, Name = "SQL Database", Category = "Technical" },
                new Skill { Id = 6, Name = "Angular", Category = "Technical" },
                new Skill { Id = 7, Name = "Communication", Category = "Soft Skills" },
                new Skill { Id = 8, Name = "Problem Solving", Category = "Soft Skills" }
            );

            // Seed Positions
            modelBuilder.Entity<Position>().HasData(
                new Position { Id = 1, Title = "Software Developer", Department = "IT", Level = "Mid", MinYearsExperience = 2, IsKeyPosition = false, CreatedAt = staticDate },
                new Position { Id = 2, Title = "Senior Developer", Department = "IT", Level = "Senior", MinYearsExperience = 5, IsKeyPosition = true, CreatedAt = staticDate },
                new Position { Id = 3, Title = "Team Lead", Department = "IT", Level = "Lead", MinYearsExperience = 7, IsKeyPosition = true, CreatedAt = staticDate },
                new Position { Id = 4, Title = "HR Specialist", Department = "HR", Level = "Mid", MinYearsExperience = 3, IsKeyPosition = false, CreatedAt = staticDate }
            );
        }
    }
}
