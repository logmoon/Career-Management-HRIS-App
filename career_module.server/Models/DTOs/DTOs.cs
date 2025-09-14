using career_module.server.Models.Entities;
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
    public class CreateRequestDto
    {
        public int RequesterId { get; set; }
        public int? TargetEmployeeId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string? Notes { get; set; }
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
}
