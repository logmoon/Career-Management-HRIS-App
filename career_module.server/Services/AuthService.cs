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
        Task<AuthResultDto> LoginAsync(string username, string password);
        Task<RegistrationResultDto> RegisterAsync(string username, string email, string password, string role = "Employee");
    }

    public class AuthService : IAuthService
    {
        private readonly CareerManagementDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(CareerManagementDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResultDto> LoginAsync(string username, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username && u.IsActive);

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return new AuthResultDto { Success = false, Message = "Invalid credentials" };
            }

            var token = GenerateJwtToken(user);
            return new AuthResultDto
            {
                Success = true,
                Token = token,
                User = DtoTranslator.ToUserDto(user),
                Message = "Login successful"
            };
        }

        public async Task<RegistrationResultDto> RegisterAsync(string username, string email, string password, string role = "Employee")
        {
            if (await _context.Users.AnyAsync(u => u.Username == username || u.Email == email))
                return new RegistrationResultDto { Success = false, Message = "Username or email already exists" };

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new RegistrationResultDto { Success = true, User = DtoTranslator.ToUserDto(user), Message = "User registered successfully" };
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

    }
}
