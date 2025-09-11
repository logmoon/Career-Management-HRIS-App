using career_module.server.Infrastructure.Data;
using career_module.server.Models.DTOs;
using career_module.server.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace career_module.server.Services
{
    public interface IAuthService
    {
        Task<ServiceResult<AuthResultDto>> LoginAsync(string username, string password);
        Task<ServiceResult<RegistrationResultDto>> RegisterAsync(string username, string password, string email, string firstName, string lastName, string? role = null, string? phone = null, DateTime? hireDate = null);
        ServiceResult<bool> ValidateTokenAsync(string token);
    }

    public class AuthService : IAuthService
    {
        private readonly CareerManagementDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly INotificationService _notificationService;

        public AuthService(CareerManagementDbContext context, IConfiguration configuration, INotificationService notificationService)
        {
            _context = context;
            _configuration = configuration;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult<AuthResultDto>> LoginAsync(string username, string password)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                    return ServiceResult<AuthResultDto>.Failure("Username and password are required");

                var user = await _context.Users
                    .Include(u => u.Employee)
                    .ThenInclude(e => e.Department)
                    .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);

                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                {
                    return ServiceResult<AuthResultDto>.Failure("Invalid credentials");
                }

                var token = GenerateJwtToken(user);
                var authResult = new AuthResultDto
                {
                    Success = true,
                    Token = token,
                    User = DtoTranslator.ToUserDto(user),
                    Message = "Login successful"
                };

                return ServiceResult<AuthResultDto>.Success(authResult);
            }
            catch (Exception ex)
            {
                return ServiceResult<AuthResultDto>.Failure($"Login failed: {ex.Message}");
            }
        }

        public async Task<ServiceResult<RegistrationResultDto>> RegisterAsync(string username, string password, string email, string firstName, string lastName, string? role = null, string? phone = null, DateTime? hireDate = null)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(firstName) ||
                string.IsNullOrWhiteSpace(lastName))
            {
                return ServiceResult<RegistrationResultDto>.Failure("All required fields must be provided");
            }

            if (await _context.Users.AnyAsync(u => u.Username == username || u.Email == email))
                return ServiceResult<RegistrationResultDto>.Failure("Username or email already exists");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Get or create pending department
                var pendingDept = await GetOrCreatePendingDepartmentAsync();

                // Create User
                var user = new User
                {
                    Username = username,
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    Role = role ?? "Employee"
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create Employee record
                var employee = new Employee
                {
                    UserId = user.Id,
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = phone ?? string.Empty,
                    DepartmentId = pendingDept.Id,
                    HireDate = hireDate ?? DateTime.UtcNow
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Send notifications
                await SendRegistrationNotificationsAsync(employee);

                // Load the full user with employee for the response
                var userWithEmployee = await _context.Users
                    .Include(u => u.Employee)
                    .ThenInclude(e => e.Department)
                    .FirstAsync(u => u.Id == user.Id);

                var registrationResult = new RegistrationResultDto
                {
                    Success = true,
                    User = DtoTranslator.ToUserDto(userWithEmployee),
                    Message = "User and employee profile created successfully"
                };

                return ServiceResult<RegistrationResultDto>.Success(registrationResult);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return ServiceResult<RegistrationResultDto>.Failure($"Registration failed: {ex.Message}");
            }
        }

        public ServiceResult<bool> ValidateTokenAsync(string token)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(token))
                    return ServiceResult<bool>.Failure("Token is required");

                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong");

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "CareerManagement",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "CareerManagement",
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return ServiceResult<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Token validation failed: {ex.Message}");
            }
        }

        #region Private Methods

        private async Task<Department> GetOrCreatePendingDepartmentAsync()
        {
            var pendingDept = await _context.Departments
                .FirstOrDefaultAsync(d => d.Name == "Pending Assignment");

            if (pendingDept == null)
            {
                pendingDept = new Department
                {
                    Name = "Pending Assignment",
                    Description = "New employees awaiting department assignment",
                    IsActive = true
                };
                _context.Departments.Add(pendingDept);
                await _context.SaveChangesAsync();
            }

            return pendingDept;
        }

        private async Task SendRegistrationNotificationsAsync(Employee employee)
        {
            string employeeName = $"{employee.FirstName} {employee.LastName}";

            // Notify HR about new registration
            await _notificationService.NotifyHRAsync(
                "New Employee Registration",
                $"{employeeName} has registered and needs department assignment",
                "NewEmployeeRegistration",
                employee.Id
            );

            // Notify admins as well
            await _notificationService.NotifyRoleAsync(
                "Admin",
                "New Employee Registration",
                $"{employeeName} has registered and needs department assignment",
                "NewEmployeeRegistration",
                employee.Id
            );
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "CareerManagement",
                audience: _configuration["Jwt:Audience"] ?? "CareerManagement",
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        #endregion
    }
}