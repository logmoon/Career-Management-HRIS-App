using career_module.server.Models.DTOs;
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
        public async Task<ActionResult<AuthResultDto>> Login([FromBody] LoginRequestDto request)
        {
            var result = await _authService.LoginAsync(request.Username, request.Password);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<ActionResult<RegistrationResultDto>> Register([FromBody] RegisterRequestDto request)
        {
            var result = await _authService.RegisterAsync(request.Username, request.Email, request.Password, request.Role);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
