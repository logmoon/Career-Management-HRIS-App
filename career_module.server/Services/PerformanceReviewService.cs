using career_module.server.Infrastructure.Data;
using career_module.server.Models.DTOs;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Services
{
    public interface IPerformanceReviewService
    {
        Task<ServiceResult<List<PerformanceReview>>> GetReviewsAsync(string? status = null, int? employeeId = null, int? reviewerId = null);
        Task<ServiceResult<PerformanceReview>> GetReviewByIdAsync(int id);
        Task<ServiceResult<PerformanceReview>> CreateReviewAsync(CreatePerformanceReviewDto dto, int createdByUserId);
        Task<ServiceResult<PerformanceReview>> UpdateReviewAsync(int id, UpdatePerformanceReviewDto dto, int updatedByUserId);
        Task<ServiceResult<PerformanceReview>> SubmitReviewAsync(int id, int submittedByUserId);
        Task<ServiceResult<PerformanceReview>> ApproveReviewAsync(int id, int approvedByUserId);
        Task<ServiceResult<List<PerformanceReview>>> GetEmployeeReviewHistoryAsync(int employeeId);
        Task<ServiceResult<List<PerformanceReview>>> GetPendingReviewsAsync(int userId, string userRole);
        Task<ServiceResult<decimal>> GetEmployeeAverageRatingAsync(int employeeId, int? lastNReviews = null);
        Task<ServiceResult<PerformanceAnalyticsDto>> GetPerformanceAnalyticsAsync(int employeeId);
    }

    public class PerformanceReviewService : IPerformanceReviewService
    {
        private readonly CareerManagementDbContext _context;

        public PerformanceReviewService(CareerManagementDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<List<PerformanceReview>>> GetReviewsAsync(string? status = null, int? employeeId = null, int? reviewerId = null)
        {
            try
            {
                var query = _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .ThenInclude(e => e.User)
                    .Include(pr => pr.Employee.Department)
                    .Include(pr => pr.Reviewer)
                    .ThenInclude(r => r.User)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(pr => pr.Status.ToLower() == status.ToLower());
                }

                if (employeeId.HasValue)
                {
                    query = query.Where(pr => pr.EmployeeId == employeeId.Value);
                }

                if (reviewerId.HasValue)
                {
                    query = query.Where(pr => pr.ReviewerId == reviewerId.Value);
                }

                var reviews = await query
                    .OrderByDescending(pr => pr.ReviewPeriodEnd)
                    .ToListAsync();

                return ServiceResult<List<PerformanceReview>>.Success(reviews);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<PerformanceReview>>.Failure($"Failed to get reviews: {ex.Message}");
            }
        }

        public async Task<ServiceResult<PerformanceReview>> GetReviewByIdAsync(int id)
        {
            try
            {
                var review = await _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .ThenInclude(e => e.User)
                    .Include(pr => pr.Employee.Department)
                    .Include(pr => pr.Employee.CurrentPosition)
                    .Include(pr => pr.Reviewer)
                    .ThenInclude(r => r.User)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (review == null)
                    return ServiceResult<PerformanceReview>.Failure("Performance review not found");

                return ServiceResult<PerformanceReview>.Success(review);
            }
            catch (Exception ex)
            {
                return ServiceResult<PerformanceReview>.Failure($"Failed to get review: {ex.Message}");
            }
        }

        public async Task<ServiceResult<PerformanceReview>> CreateReviewAsync(CreatePerformanceReviewDto dto, int createdByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate creator
                var creator = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == createdByUserId);

                if (creator == null)
                    return ServiceResult<PerformanceReview>.Failure("Creator not found");

                // Validate employee exists
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Manager)
                    .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId);

                if (employee == null)
                    return ServiceResult<PerformanceReview>.Failure("Employee not found");

                // Validate reviewer exists
                var reviewer = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.Id == dto.ReviewerId);

                if (reviewer == null)
                    return ServiceResult<PerformanceReview>.Failure("Reviewer not found");

                // Validate permissions: HR, Admin, or the designated reviewer can create reviews
                var canCreate = creator.User.Role == "HR" || creator.User.Role == "Admin" || creator.Id == dto.ReviewerId;

                if (!canCreate)
                    return ServiceResult<PerformanceReview>.Failure("Insufficient permissions to create review");

                // Validate dates
                if (dto.ReviewPeriodStart >= dto.ReviewPeriodEnd)
                    return ServiceResult<PerformanceReview>.Failure("Review period start must be before end date");

                // Check for overlapping reviews for the same employee
                var overlappingReview = await _context.PerformanceReviews
                    .AnyAsync(pr => pr.EmployeeId == dto.EmployeeId &&
                                   pr.Status != "Draft" &&
                                   ((dto.ReviewPeriodStart >= pr.ReviewPeriodStart && dto.ReviewPeriodStart <= pr.ReviewPeriodEnd) ||
                                    (dto.ReviewPeriodEnd >= pr.ReviewPeriodStart && dto.ReviewPeriodEnd <= pr.ReviewPeriodEnd)));

                if (overlappingReview)
                    return ServiceResult<PerformanceReview>.Failure("There is already a review for this employee covering this time period");

                var review = new PerformanceReview
                {
                    EmployeeId = dto.EmployeeId,
                    ReviewerId = dto.ReviewerId,
                    ReviewPeriodStart = dto.ReviewPeriodStart,
                    ReviewPeriodEnd = dto.ReviewPeriodEnd,
                    OverallRating = 0, // Will be set when review is completed
                    Status = "Draft"
                };

                _context.PerformanceReviews.Add(review);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Reload with includes
                var createdReview = await GetReviewByIdAsync(review.Id);
                return createdReview;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<PerformanceReview>.Failure($"Failed to create review: {ex.Message}");
            }
        }

        public async Task<ServiceResult<PerformanceReview>> UpdateReviewAsync(int id, UpdatePerformanceReviewDto dto, int updatedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var review = await _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .Include(pr => pr.Reviewer)
                    .ThenInclude(r => r.User)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (review == null)
                    return ServiceResult<PerformanceReview>.Failure("Performance review not found");

                // Validate permissions
                var updater = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == updatedByUserId);

                if (updater == null)
                    return ServiceResult<PerformanceReview>.Failure("User not found");

                var canUpdate = updater.User.Role == "HR" || updater.User.Role == "Admin" || updater.Id == review.ReviewerId;

                if (!canUpdate)
                    return ServiceResult<PerformanceReview>.Failure("You can only update reviews assigned to you");

                // Can't update completed or approved reviews
                if (review.Status == "Completed" || review.Status == "Approved")
                    return ServiceResult<PerformanceReview>.Failure("Cannot update completed or approved reviews");

                // Update fields
                if (dto.OverallRating < 1 || dto.OverallRating > 5)
                    return ServiceResult<PerformanceReview>.Failure("Overall rating must be between 1 and 5");

                review.OverallRating = dto.OverallRating;

                if (dto.Strengths != null)
                    review.Strengths = dto.Strengths;

                if (dto.AreasForImprovement != null)
                    review.AreasForImprovement = dto.AreasForImprovement;

                if (dto.Goals != null)
                    review.Goals = dto.Goals;

                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Reload with includes
                var updatedReview = await GetReviewByIdAsync(id);
                return updatedReview;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<PerformanceReview>.Failure($"Failed to update review: {ex.Message}");
            }
        }

        public async Task<ServiceResult<PerformanceReview>> SubmitReviewAsync(int id, int submittedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var review = await _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .ThenInclude(e => e.User)
                    .Include(pr => pr.Employee.Manager)
                    .ThenInclude(m => m.User)
                    .Include(pr => pr.Reviewer)
                    .ThenInclude(r => r.User)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (review == null)
                    return ServiceResult<PerformanceReview>.Failure("Performance review not found");

                // Validate permissions
                var submitter = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == submittedByUserId);

                if (submitter == null)
                    return ServiceResult<PerformanceReview>.Failure("User not found");

                var canSubmit = submitter.User.Role == "HR" ||
                               submitter.User.Role == "Admin" ||
                               submitter.Id == review.ReviewerId;

                if (!canSubmit)
                    return ServiceResult<PerformanceReview>.Failure("Only the assigned reviewer can submit this review");

                if (review.Status != "Draft")
                    return ServiceResult<PerformanceReview>.Failure("Only draft reviews can be submitted");

                // Validate required fields are filled
                if (review.OverallRating == 0)
                    return ServiceResult<PerformanceReview>.Failure("Overall rating must be provided");

                if (string.IsNullOrWhiteSpace(review.Strengths))
                    return ServiceResult<PerformanceReview>.Failure("Strengths section must be completed");

                if (string.IsNullOrWhiteSpace(review.AreasForImprovement))
                    return ServiceResult<PerformanceReview>.Failure("Areas for improvement must be provided");

                // Update status
                review.Status = "Completed";
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Notify HR
                var hrUsers = await _context.Users
                    .Where(u => u.Role == "HR" && u.IsActive)
                    .ToListAsync();

                await transaction.CommitAsync();

                var updatedReview = await GetReviewByIdAsync(id);
                return updatedReview;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<PerformanceReview>.Failure($"Failed to submit review: {ex.Message}");
            }
        }

        public async Task<ServiceResult<PerformanceReview>> ApproveReviewAsync(int id, int approvedByUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var review = await _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .ThenInclude(e => e.User)
                    .Include(pr => pr.Reviewer)
                    .ThenInclude(r => r.User)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (review == null)
                    return ServiceResult<PerformanceReview>.Failure("Performance review not found");

                // Validate permissions - only HR and Admin can approve
                var approver = await _context.Employees
                    .Include(e => e.User)
                    .FirstOrDefaultAsync(e => e.UserId == approvedByUserId);

                if (approver == null)
                    return ServiceResult<PerformanceReview>.Failure("User not found");

                if (approver.User.Role != "HR" && approver.User.Role != "Admin")
                    return ServiceResult<PerformanceReview>.Failure("Only HR and Admin users can approve reviews");

                if (review.Status != "Completed")
                    return ServiceResult<PerformanceReview>.Failure("Only completed reviews can be approved");

                // Update status
                review.Status = "Approved";
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                var updatedReview = await GetReviewByIdAsync(id);
                return updatedReview;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<PerformanceReview>.Failure($"Failed to approve review: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<PerformanceReview>>> GetEmployeeReviewHistoryAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(employeeId);
                if (employee == null)
                    return ServiceResult<List<PerformanceReview>>.Failure("Employee not found");

                var reviews = await _context.PerformanceReviews
                    .Include(pr => pr.Reviewer)
                    .ThenInclude(r => r.User)
                    .Where(pr => pr.EmployeeId == employeeId)
                    .OrderByDescending(pr => pr.ReviewPeriodEnd)
                    .ToListAsync();

                return ServiceResult<List<PerformanceReview>>.Success(reviews);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<PerformanceReview>>.Failure($"Failed to get employee review history: {ex.Message}");
            }
        }

        public async Task<ServiceResult<List<PerformanceReview>>> GetPendingReviewsAsync(int userId, string userRole)
        {
            try
            {
                var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
                if (employee == null)
                    return ServiceResult<List<PerformanceReview>>.Failure("Employee not found");

                var query = _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .ThenInclude(e => e.User)
                    .Include(pr => pr.Employee.Department)
                    .Include(pr => pr.Reviewer)
                    .ThenInclude(r => r.User)
                    .AsQueryable();

                if (userRole == "HR" || userRole == "Admin")
                {
                    // HR and Admin can see all pending reviews
                    query = query.Where(pr => pr.Status == "Draft" || pr.Status == "Completed");
                }
                else if (userRole == "Manager")
                {
                    // Managers can see reviews for their direct reports and reviews assigned to them
                    query = query.Where(pr =>
                        (pr.Status == "Draft" || pr.Status == "Completed") &&
                        (pr.ReviewerId == employee.Id || pr.Employee.ManagerId == employee.Id));
                }
                else
                {
                    // Regular employees can only see reviews assigned to them
                    query = query.Where(pr => pr.ReviewerId == employee.Id && pr.Status == "Draft");
                }

                var pendingReviews = await query
                    .OrderBy(pr => pr.ReviewPeriodEnd)
                    .ToListAsync();

                return ServiceResult<List<PerformanceReview>>.Success(pendingReviews);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<PerformanceReview>>.Failure($"Failed to get pending reviews: {ex.Message}");
            }
        }

        public async Task<ServiceResult<decimal>> GetEmployeeAverageRatingAsync(int employeeId, int? lastNReviews = null)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(employeeId);
                if (employee == null)
                    return ServiceResult<decimal>.Failure("Employee not found");

                var query = _context.PerformanceReviews
                    .Where(pr => pr.EmployeeId == employeeId &&
                                (pr.Status == "Completed" || pr.Status == "Approved") &&
                                pr.OverallRating > 0)
                    .OrderByDescending(pr => pr.ReviewPeriodEnd);

                if (lastNReviews.HasValue && lastNReviews.Value > 0)
                {
                    query = (IOrderedQueryable<PerformanceReview>)query.Take(lastNReviews.Value);
                }

                var ratings = await query.Select(pr => pr.OverallRating).ToListAsync();

                if (!ratings.Any())
                    return ServiceResult<decimal>.Failure("No completed performance reviews found");

                var average = ratings.Average();
                return ServiceResult<decimal>.Success(Math.Round(average, 2));
            }
            catch (Exception ex)
            {
                return ServiceResult<decimal>.Failure($"Failed to calculate average rating: {ex.Message}");
            }
        }

        public async Task<ServiceResult<PerformanceAnalyticsDto>> GetPerformanceAnalyticsAsync(int employeeId)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.User)
                    .Include(e => e.Department)
                    .Include(e => e.CurrentPosition)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);

                if (employee == null)
                    return ServiceResult<PerformanceAnalyticsDto>.Failure("Employee not found");

                var reviews = await _context.PerformanceReviews
                    .Where(pr => pr.EmployeeId == employeeId &&
                                (pr.Status == "Completed" || pr.Status == "Approved") &&
                                pr.OverallRating > 0)
                    .OrderBy(pr => pr.ReviewPeriodEnd)
                    .ToListAsync();

                if (!reviews.Any())
                    return ServiceResult<PerformanceAnalyticsDto>.Failure("No performance data available");

                var analytics = new PerformanceAnalyticsDto
                {
                    EmployeeId = employeeId,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}",
                    TotalReviews = reviews.Count,
                    AverageRating = Math.Round(reviews.Average(r => r.OverallRating), 2),
                    LatestRating = reviews.Last().OverallRating,
                    RatingTrend = CalculateRatingTrend(reviews),
                    PerformanceHistory = reviews.Select(r => new PerformanceHistoryDto
                    {
                        ReviewId = r.Id,
                        ReviewPeriodStart = r.ReviewPeriodStart,
                        ReviewPeriodEnd = r.ReviewPeriodEnd,
                        Rating = r.OverallRating,
                        Status = r.Status
                    }).ToList()
                };

                // Department average for comparison
                var departmentAverage = await _context.PerformanceReviews
                    .Where(pr => pr.Employee.DepartmentId == employee.DepartmentId &&
                                (pr.Status == "Completed" || pr.Status == "Approved") &&
                                pr.OverallRating > 0 &&
                                pr.ReviewPeriodEnd >= DateTime.UtcNow.AddYears(-1))
                    .AverageAsync(pr => pr.OverallRating);

                analytics.DepartmentAverage = Math.Round(departmentAverage, 2);

                return ServiceResult<PerformanceAnalyticsDto>.Success(analytics);
            }
            catch (Exception ex)
            {
                return ServiceResult<PerformanceAnalyticsDto>.Failure($"Failed to get performance analytics: {ex.Message}");
            }
        }

        private string CalculateRatingTrend(List<PerformanceReview> reviews)
        {
            if (reviews.Count < 2) return "Insufficient Data";

            var recent = reviews.TakeLast(3).ToList();
            if (recent.Count < 2) return "Insufficient Data";

            var firstRating = recent.First().OverallRating;
            var lastRating = recent.Last().OverallRating;

            var difference = lastRating - firstRating;

            return difference switch
            {
                > 0.5m => "Improving",
                < -0.5m => "Declining",
                _ => "Stable"
            };
        }
    }

    public class PerformanceAnalyticsDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int TotalReviews { get; set; }
        public decimal AverageRating { get; set; }
        public decimal LatestRating { get; set; }
        public decimal DepartmentAverage { get; set; }
        public string RatingTrend { get; set; } = string.Empty; // Improving, Declining, Stable
        public List<PerformanceHistoryDto> PerformanceHistory { get; set; } = new();
    }

    public class PerformanceHistoryDto
    {
        public int ReviewId { get; set; }
        public DateTime ReviewPeriodStart { get; set; }
        public DateTime ReviewPeriodEnd { get; set; }
        public decimal Rating { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}