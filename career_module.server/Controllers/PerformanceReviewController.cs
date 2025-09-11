using career_module.server.Infrastructure.Data;
using career_module.server.Models.DTOs;
using career_module.server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PerformanceReviewController : BaseController
    {
        private readonly IPerformanceReviewService _performanceReviewService;

        public PerformanceReviewController(
            CareerManagementDbContext context,
            IPerformanceReviewService performanceReviewService) : base(context)
        {
            _performanceReviewService = performanceReviewService;
        }

        [HttpGet]
        public async Task<IActionResult> GetReviews(
            [FromQuery] string? status = null,
            [FromQuery] int? employeeId = null,
            [FromQuery] int? reviewerId = null)
        {
            var currentUserRole = GetCurrentUserRole();
            var currentUserId = GetCurrentUserId();

            // Apply role-based filtering
            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var currentEmployeeId = GetCurrentEmployeeId();

                if (currentUserRole == "Manager")
                {
                    // Managers can see reviews for their direct reports and reviews they're assigned to conduct
                    if (employeeId.HasValue)
                    {
                        var employee = await _context.Employees.FindAsync(employeeId.Value);
                        if (employee == null || (employee.ManagerId != currentEmployeeId && employee.Id != currentEmployeeId))
                            return Forbid("You can only view reviews for your direct reports or yourself");
                    }

                    if (reviewerId.HasValue && reviewerId.Value != currentEmployeeId)
                        return Forbid("You can only view reviews you're assigned to conduct");
                }
                else
                {
                    // Regular employees can only see their own reviews or reviews they're conducting
                    if (employeeId.HasValue && employeeId.Value != currentEmployeeId)
                        return Forbid("You can only view your own reviews");

                    if (reviewerId.HasValue && reviewerId.Value != currentEmployeeId)
                        return Forbid("You can only view reviews you're assigned to conduct");
                }
            }

            var result = await _performanceReviewService.GetReviewsAsync(status, employeeId, reviewerId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReviewById(int id)
        {
            var result = await _performanceReviewService.GetReviewByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(new { message = result.ErrorMessage });

            // Check permissions
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();
            var review = result.Data;

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                var hasAccess = review.EmployeeId == currentEmployeeId || // Employee's own review
                               review.ReviewerId == currentEmployeeId || // Reviewer
                               (currentUserRole == "Manager" && review.Employee?.ManagerId == currentEmployeeId); // Manager of employee

                if (!hasAccess)
                    return Forbid("You don't have permission to view this review");
            }

            return Ok(review);
        }

        [HttpPost]
        [Authorize(Roles = "HR,Admin,Manager")]
        public async Task<IActionResult> CreateReview([FromBody] CreatePerformanceReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.ReviewPeriodStart >= dto.ReviewPeriodEnd)
                return BadRequest(new { message = "Review period start must be before end date" });

            var currentUserId = GetCurrentUserId();
            var result = await _performanceReviewService.CreateReviewAsync(dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return CreatedAtAction(nameof(GetReviewById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdatePerformanceReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.OverallRating < 1 || dto.OverallRating > 5)
                return BadRequest(new { message = "Overall rating must be between 1 and 5" });

            var currentUserId = GetCurrentUserId();
            var result = await _performanceReviewService.UpdateReviewAsync(id, dto, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitReview(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _performanceReviewService.SubmitReviewAsync(id, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Review submitted successfully", review = result.Data });
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> ApproveReview(int id)
        {
            var currentUserId = GetCurrentUserId();
            var result = await _performanceReviewService.ApproveReviewAsync(id, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Review approved successfully", review = result.Data });
        }

        [HttpGet("employee/{employeeId}/history")]
        public async Task<IActionResult> GetEmployeeReviewHistory(int employeeId)
        {
            // Check permissions
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                if (employeeId != currentEmployeeId)
                {
                    // Check if current user is the employee's manager
                    var employee = await _context.Employees.FindAsync(employeeId);
                    if (employee == null || employee.ManagerId != currentEmployeeId)
                        return Forbid("You can only view your own review history or your direct reports'");
                }
            }

            var result = await _performanceReviewService.GetEmployeeReviewHistoryAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingReviews()
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            var result = await _performanceReviewService.GetPendingReviewsAsync(currentUserId, currentUserRole);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("employee/{employeeId}/average-rating")]
        public async Task<IActionResult> GetEmployeeAverageRating(int employeeId, [FromQuery] int? lastNReviews = null)
        {
            // Check permissions
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                if (employeeId != currentEmployeeId)
                {
                    // Check if current user is the employee's manager
                    var employee = await _context.Employees.FindAsync(employeeId);
                    if (employee == null || employee.ManagerId != currentEmployeeId)
                        return Forbid("You can only view your own performance metrics or your direct reports'");
                }
            }

            var result = await _performanceReviewService.GetEmployeeAverageRatingAsync(employeeId, lastNReviews);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { employeeId, averageRating = result.Data, reviewCount = lastNReviews ?? 0 });
        }

        [HttpGet("employee/{employeeId}/analytics")]
        public async Task<IActionResult> GetPerformanceAnalytics(int employeeId)
        {
            // Check permissions
            var currentUserRole = GetCurrentUserRole();
            var currentEmployeeId = GetCurrentEmployeeId();

            if (currentUserRole != "HR" && currentUserRole != "Admin")
            {
                if (employeeId != currentEmployeeId)
                {
                    // Check if current user is the employee's manager
                    var employee = await _context.Employees.FindAsync(employeeId);
                    if (employee == null || employee.ManagerId != currentEmployeeId)
                        return Forbid("You can only view your own analytics or your direct reports'");
                }
            }

            var result = await _performanceReviewService.GetPerformanceAnalyticsAsync(employeeId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Data);
        }

        [HttpGet("templates")]
        public IActionResult GetReviewTemplates()
        {
            var templates = new[]
            {
                new {
                    Id = "quarterly",
                    Name = "Quarterly Review",
                    Description = "Standard quarterly performance review",
                    Sections = new[] { "Goals Achievement", "Core Competencies", "Leadership", "Areas for Improvement" }
                },
                new {
                    Id = "annual",
                    Name = "Annual Review",
                    Description = "Comprehensive annual performance review",
                    Sections = new[] { "Yearly Achievements", "Skill Development", "Leadership Growth", "Career Goals", "360 Feedback" }
                },
                new {
                    Id = "probation",
                    Name = "Probation Review",
                    Description = "New employee probation period review",
                    Sections = new[] { "Job Performance", "Cultural Fit", "Training Progress", "Recommendation" }
                }
            };

            return Ok(templates);
        }

        [HttpGet("rating-scale")]
        public IActionResult GetRatingScale()
        {
            var ratingScale = new[]
            {
                new { Value = 1, Label = "Below Expectations", Description = "Performance consistently falls short of requirements", Color = "#dc3545" },
                new { Value = 2, Label = "Partially Meets Expectations", Description = "Performance meets some but not all requirements", Color = "#fd7e14" },
                new { Value = 3, Label = "Meets Expectations", Description = "Performance consistently meets job requirements", Color = "#ffc107" },
                new { Value = 4, Label = "Exceeds Expectations", Description = "Performance consistently exceeds requirements", Color = "#28a745" },
                new { Value = 5, Label = "Outstanding", Description = "Performance significantly exceeds all expectations", Color = "#007bff" }
            };

            return Ok(ratingScale);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "HR,Admin")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            // Get the review first to check if it can be deleted
            var reviewResult = await _performanceReviewService.GetReviewByIdAsync(id);
            if (!reviewResult.IsSuccess)
                return NotFound(new { message = reviewResult.ErrorMessage });

            var review = reviewResult.Data;

            // Only allow deletion of draft reviews
            if (review.Status != "Draft")
                return BadRequest(new { message = "Only draft reviews can be deleted" });

            try
            {
                _context.PerformanceReviews.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Review deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to delete review: {ex.Message}" });
            }
        }
    }
}