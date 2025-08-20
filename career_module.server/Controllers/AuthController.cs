using career_module.server.Services;
using Microsoft.AspNetCore.Mvc;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResult>> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request.Username, request.Password);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<ActionResult> Register([FromBody] RegisterRequest request)
        {
            var user = await _authService.RegisterAsync(request.Username, request.Email, request.Password, request.Role);

            if (user == null)
                return BadRequest("Username or email already exists");

            return Ok(new { message = "User registered successfully", userId = user.Id });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Employee";
    }
}
