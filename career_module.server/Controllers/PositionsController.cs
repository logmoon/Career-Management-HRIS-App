using career_module.server.Infrastructure.Data;
using career_module.server.Models.DTOs;
using career_module.server.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PositionsController : ControllerBase
    {
        private readonly CareerManagementDbContext _context;
        private readonly ILogger<PositionsController> _logger;

        public PositionsController(CareerManagementDbContext context, ILogger<PositionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/positions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PositionDto>>> GetPositions(
            [FromQuery] string? department = null,
            [FromQuery] string? level = null,
            [FromQuery] bool? isKeyPosition = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Positions
                    .Include(p => p.CurrentEmployees)
                    .Include(p => p.RequiredSkills)
                        .ThenInclude(ps => ps.Skill)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(department))
                {
                    query = query.Where(p => p.Department.Contains(department));
                }

                if (!string.IsNullOrEmpty(level))
                {
                    query = query.Where(p => p.Level == level);
                }

                if (isKeyPosition.HasValue)
                {
                    query = query.Where(p => p.IsKeyPosition == isKeyPosition.Value);
                }

                if (isActive.HasValue)
                {
                    query = query.Where(p => p.IsActive == isActive.Value);
                }

                var totalCount = await query.CountAsync();
                var positions = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new PositionDto
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Department = p.Department,
                        Description = p.Description,
                        Level = p.Level,
                        MinSalary = p.MinSalary,
                        MaxSalary = p.MaxSalary,
                        MinYearsExperience = p.MinYearsExperience,
                        IsKeyPosition = p.IsKeyPosition,
                        IsActive = p.IsActive,
                        CurrentEmployeeCount = p.CurrentEmployees.Count,
                        RequiredSkillsCount = p.RequiredSkills.Count,
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = positions,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving positions");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/positions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PositionDetailDto>> GetPosition(int id)
        {
            try
            {
                var position = await _context.Positions
                    .Include(p => p.CurrentEmployees)
                        .ThenInclude(e => e.Manager)
                    .Include(p => p.RequiredSkills)
                        .ThenInclude(ps => ps.Skill)
                    .Include(p => p.SuccessionPlans)
                        .ThenInclude(sp => sp.Candidates)
                            .ThenInclude(sc => sc.Employee)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (position == null)
                {
                    return NotFound($"Position with ID {id} not found");
                }

                var positionDto = new PositionDetailDto
                {
                    Id = position.Id,
                    Title = position.Title,
                    Department = position.Department,
                    Description = position.Description,
                    Level = position.Level,
                    MinSalary = position.MinSalary,
                    MaxSalary = position.MaxSalary,
                    MinYearsExperience = position.MinYearsExperience,
                    IsKeyPosition = position.IsKeyPosition,
                    IsActive = position.IsActive,
                    CreatedAt = position.CreatedAt,
                    CurrentEmployees = position.CurrentEmployees.Select(e => new EmployeeSummaryDto
                    {
                        Id = e.Id,
                        FirstName = e.FirstName,
                        LastName = e.LastName,
                        Email = e.Email,
                        Department = e.Department
                    }).ToList(),
                    RequiredSkills = position.RequiredSkills.Select(ps => new PositionSkillDto
                    {
                        SkillId = ps.SkillId,
                        SkillName = ps.Skill.Name,
                        SkillCategory = ps.Skill.Category,
                        RequiredLevel = ps.RequiredLevel,
                        IsMandatory = ps.IsMandatory,
                        Weight = ps.Weight
                    }).ToList(),
                    HasSuccessionPlan = position.SuccessionPlans.Any(sp => sp.Status == "Active"),
                    SuccessionCandidatesCount = position.SuccessionPlans
                        .Where(sp => sp.Status == "Active")
                        .Sum(sp => sp.Candidates.Count)
                };

                return Ok(positionDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving position {PositionId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/positions
        [HttpPost]
        public async Task<ActionResult<PositionDto>> CreatePosition(CreatePositionDto createPositionDto)
        {
            try
            {
                var position = new Position
                {
                    Title = createPositionDto.Title,
                    Department = createPositionDto.Department,
                    Description = createPositionDto.Description,
                    Level = createPositionDto.Level,
                    MinSalary = createPositionDto.MinSalary,
                    MaxSalary = createPositionDto.MaxSalary,
                    MinYearsExperience = createPositionDto.MinYearsExperience,
                    IsKeyPosition = createPositionDto.IsKeyPosition,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Positions.Add(position);
                await _context.SaveChangesAsync();

                var positionDto = new PositionDto
                {
                    Id = position.Id,
                    Title = position.Title,
                    Department = position.Department,
                    Description = position.Description,
                    Level = position.Level,
                    MinSalary = position.MinSalary,
                    MaxSalary = position.MaxSalary,
                    MinYearsExperience = position.MinYearsExperience,
                    IsKeyPosition = position.IsKeyPosition,
                    IsActive = position.IsActive,
                    CurrentEmployeeCount = 0,
                    RequiredSkillsCount = 0,
                    CreatedAt = position.CreatedAt
                };

                return CreatedAtAction(nameof(GetPosition), new { id = position.Id }, positionDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating position");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/positions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePosition(int id, UpdatePositionDto updatePositionDto)
        {
            try
            {
                var position = await _context.Positions.FindAsync(id);
                if (position == null)
                {
                    return NotFound($"Position with ID {id} not found");
                }

                position.Title = updatePositionDto.Title;
                position.Department = updatePositionDto.Department;
                position.Description = updatePositionDto.Description;
                position.Level = updatePositionDto.Level;
                position.MinSalary = updatePositionDto.MinSalary;
                position.MaxSalary = updatePositionDto.MaxSalary;
                position.MinYearsExperience = updatePositionDto.MinYearsExperience;
                position.IsKeyPosition = updatePositionDto.IsKeyPosition;
                position.IsActive = updatePositionDto.IsActive;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating position {PositionId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/positions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePosition(int id)
        {
            try
            {
                var position = await _context.Positions
                    .Include(p => p.CurrentEmployees)
                    .Include(p => p.SuccessionPlans)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (position == null)
                {
                    return NotFound($"Position with ID {id} not found");
                }

                // Check if position has current employees
                if (position.CurrentEmployees.Any())
                {
                    return BadRequest("Cannot delete position that has current employees assigned. Please reassign employees first.");
                }

                // Check if position has active succession plans
                if (position.SuccessionPlans.Any(sp => sp.Status == "Active"))
                {
                    return BadRequest("Cannot delete position that has active succession plans. Please complete or cancel succession plans first.");
                }

                _context.Positions.Remove(position);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting position {PositionId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/positions/{id}/skills
        [HttpPost("{id}/skills")]
        public async Task<IActionResult> AddPositionSkill(int id, AddPositionSkillDto addSkillDto)
        {
            try
            {
                var position = await _context.Positions.FindAsync(id);
                if (position == null)
                {
                    return NotFound($"Position with ID {id} not found");
                }

                var skill = await _context.Skills.FindAsync(addSkillDto.SkillId);
                if (skill == null)
                {
                    return BadRequest($"Skill with ID {addSkillDto.SkillId} not found");
                }

                var existingSkill = await _context.PositionSkills
                    .FirstOrDefaultAsync(ps => ps.PositionId == id && ps.SkillId == addSkillDto.SkillId);

                if (existingSkill != null)
                {
                    return BadRequest("Position already has this skill requirement");
                }

                var positionSkill = new PositionSkill
                {
                    PositionId = id,
                    SkillId = addSkillDto.SkillId,
                    RequiredLevel = addSkillDto.RequiredLevel,
                    IsMandatory = addSkillDto.IsMandatory,
                    Weight = addSkillDto.Weight
                };

                _context.PositionSkills.Add(positionSkill);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding skill to position {PositionId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/positions/{positionId}/skills/{skillId}
        [HttpPut("{positionId}/skills/{skillId}")]
        public async Task<IActionResult> UpdatePositionSkill(int positionId, int skillId, UpdatePositionSkillDto updateSkillDto)
        {
            try
            {
                var positionSkill = await _context.PositionSkills
                    .FirstOrDefaultAsync(ps => ps.PositionId == positionId && ps.SkillId == skillId);

                if (positionSkill == null)
                {
                    return NotFound("Position skill requirement not found");
                }

                positionSkill.RequiredLevel = updateSkillDto.RequiredLevel;
                positionSkill.IsMandatory = updateSkillDto.IsMandatory;
                positionSkill.Weight = updateSkillDto.Weight;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating position skill requirement");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/positions/{positionId}/skills/{skillId}
        [HttpDelete("{positionId}/skills/{skillId}")]
        public async Task<IActionResult> RemovePositionSkill(int positionId, int skillId)
        {
            try
            {
                var positionSkill = await _context.PositionSkills
                    .FirstOrDefaultAsync(ps => ps.PositionId == positionId && ps.SkillId == skillId);

                if (positionSkill == null)
                {
                    return NotFound("Position skill requirement not found");
                }

                _context.PositionSkills.Remove(positionSkill);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing position skill requirement");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/positions/levels
        [HttpGet("levels")]
        public async Task<ActionResult<IEnumerable<string>>> GetPositionLevels()
        {
            try
            {
                var levels = await _context.Positions
                    .Where(p => p.IsActive && !string.IsNullOrEmpty(p.Level))
                    .Select(p => p.Level)
                    .Distinct()
                    .OrderBy(l => l)
                    .ToListAsync();

                return Ok(levels);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving position levels");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/positions/departments
        [HttpGet("departments")]
        public async Task<ActionResult<IEnumerable<string>>> GetDepartments()
        {
            try
            {
                var departments = await _context.Positions
                    .Where(p => p.IsActive && !string.IsNullOrEmpty(p.Department))
                    .Select(p => p.Department)
                    .Distinct()
                    .OrderBy(d => d)
                    .ToListAsync();

                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving departments");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/positions/{id}/candidates
        [HttpGet("{id}/candidates")]
        public async Task<ActionResult<IEnumerable<CandidateMatchDto>>> GetPositionCandidates(int id)
        {
            try
            {
                var position = await _context.Positions
                    .Include(p => p.RequiredSkills)
                        .ThenInclude(ps => ps.Skill)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (position == null)
                {
                    return NotFound($"Position with ID {id} not found");
                }

                var employees = await _context.Employees
                    .Include(e => e.EmployeeSkills)
                        .ThenInclude(es => es.Skill)
                    .Include(e => e.CurrentPosition)
                    .Where(e => e.Id != id) // Exclude current position holders if any
                    .ToListAsync();

                var candidates = employees.Select(e => new CandidateMatchDto
                {
                    EmployeeId = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    CurrentPositionTitle = e.CurrentPosition?.Title,
                    Department = e.Department,
                    MatchScore = CalculateMatchScore(e, position),
                    SkillMatches = CalculateSkillMatches(e, position)
                })
                .OrderByDescending(c => c.MatchScore)
                .ToList();

                return Ok(candidates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving candidates for position {PositionId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        private decimal CalculateMatchScore(Employee employee, Position position)
        {
            if (!position.RequiredSkills.Any())
                return 0;

            var totalWeight = position.RequiredSkills.Sum(ps => ps.Weight);
            if (totalWeight == 0)
                return 0;

            decimal weightedScore = 0;

            foreach (var requiredSkill in position.RequiredSkills)
            {
                var employeeSkill = employee.EmployeeSkills
                    .FirstOrDefault(es => es.SkillId == requiredSkill.SkillId);

                if (employeeSkill != null)
                {
                    var skillScore = Math.Min((decimal)employeeSkill.ProficiencyLevel / requiredSkill.RequiredLevel, 1.0m);
                    weightedScore += skillScore * requiredSkill.Weight;
                }
                else if (requiredSkill.IsMandatory)
                {
                    // Heavily penalize missing mandatory skills
                    weightedScore -= requiredSkill.Weight * 0.5m;
                }
            }

            return Math.Max(0, Math.Min(100, (weightedScore / totalWeight) * 100));
        }

        private List<SkillMatchDto> CalculateSkillMatches(Employee employee, Position position)
        {
            return position.RequiredSkills.Select(ps => new SkillMatchDto
            {
                SkillName = ps.Skill.Name,
                RequiredLevel = ps.RequiredLevel,
                EmployeeLevel = employee.EmployeeSkills
                    .FirstOrDefault(es => es.SkillId == ps.SkillId)?.ProficiencyLevel ?? 0,
                IsMandatory = ps.IsMandatory,
                Gap = Math.Max(0, ps.RequiredLevel - (employee.EmployeeSkills
                    .FirstOrDefault(es => es.SkillId == ps.SkillId)?.ProficiencyLevel ?? 0))
            }).ToList();
        }
    }
}
