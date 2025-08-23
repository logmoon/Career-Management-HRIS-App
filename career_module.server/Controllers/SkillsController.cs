using career_module.server.Infrastructure.Data;
using career_module.server.Models.DTOs;
using career_module.server.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SkillsController : ControllerBase
    {
        private readonly CareerManagementDbContext _context;
        private readonly ILogger<SkillsController> _logger;

        public SkillsController(CareerManagementDbContext context, ILogger<SkillsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/skills
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SkillDto>>> GetSkills(
            [FromQuery] string? category = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var query = _context.Skills.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(s => s.Category.Contains(category));
                }

                if (isActive.HasValue)
                {
                    query = query.Where(s => s.IsActive == isActive.Value);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(s => s.Name.Contains(search) || s.Description.Contains(search));
                }

                var totalCount = await query.CountAsync();
                var skills = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new SkillDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Category = s.Category,
                        Description = s.Description,
                        IsActive = s.IsActive,
                        EmployeeCount = s.EmployeeSkills.Count,
                        PositionCount = s.PositionSkills.Count
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = skills,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skills");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/skills/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<SkillDetailDto>> GetSkill(int id)
        {
            try
            {
                var skill = await _context.Skills
                    .Include(s => s.EmployeeSkills)
                        .ThenInclude(es => es.Employee)
                    .Include(s => s.PositionSkills)
                        .ThenInclude(ps => ps.Position)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (skill == null)
                {
                    return NotFound($"Skill with ID {id} not found");
                }

                var skillDto = new SkillDetailDto
                {
                    Id = skill.Id,
                    Name = skill.Name,
                    Category = skill.Category,
                    Description = skill.Description,
                    IsActive = skill.IsActive,
                    EmployeeCount = skill.EmployeeSkills.Count,
                    PositionCount = skill.PositionSkills.Count,
                    EmployeesWithSkill = skill.EmployeeSkills.Select(es => new EmployeeSkillSummaryDto
                    {
                        EmployeeId = es.EmployeeId,
                        EmployeeName = $"{es.Employee.FirstName} {es.Employee.LastName}",
                        Department = es.Employee.Department,
                        ProficiencyLevel = es.ProficiencyLevel,
                        AcquiredDate = es.AcquiredDate,
                        LastAssessedDate = es.LastAssessedDate
                    }).OrderByDescending(e => e.ProficiencyLevel).ToList(),
                    PositionsRequiring = skill.PositionSkills.Select(ps => new PositionSkillSummaryDto
                    {
                        PositionId = ps.PositionId,
                        PositionTitle = ps.Position.Title,
                        Department = ps.Position.Department,
                        RequiredLevel = ps.RequiredLevel,
                        IsMandatory = ps.IsMandatory,
                        Weight = ps.Weight
                    }).OrderByDescending(p => p.RequiredLevel).ToList(),
                    ProficiencyDistribution = GetProficiencyDistribution(skill.EmployeeSkills.ToList())
                };

                return Ok(skillDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skill {SkillId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/skills
        [HttpPost]
        public async Task<ActionResult<SkillDto>> CreateSkill(CreateSkillDto createSkillDto)
        {
            try
            {
                // Check if skill with same name already exists
                var existingSkill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.Name.ToLower() == createSkillDto.Name.ToLower());

                if (existingSkill != null)
                {
                    return BadRequest($"Skill with name '{createSkillDto.Name}' already exists");
                }

                var skill = new Skill
                {
                    Name = createSkillDto.Name,
                    Category = createSkillDto.Category,
                    Description = createSkillDto.Description,
                    IsActive = true
                };

                _context.Skills.Add(skill);
                await _context.SaveChangesAsync();

                var skillDto = new SkillDto
                {
                    Id = skill.Id,
                    Name = skill.Name,
                    Category = skill.Category,
                    Description = skill.Description,
                    IsActive = skill.IsActive,
                    EmployeeCount = 0,
                    PositionCount = 0
                };

                return CreatedAtAction(nameof(GetSkill), new { id = skill.Id }, skillDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating skill");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/skills/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSkill(int id, UpdateSkillDto updateSkillDto)
        {
            try
            {
                var skill = await _context.Skills.FindAsync(id);
                if (skill == null)
                {
                    return NotFound($"Skill with ID {id} not found");
                }

                // Check if another skill with same name exists
                var existingSkill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.Id != id && s.Name.ToLower() == updateSkillDto.Name.ToLower());

                if (existingSkill != null)
                {
                    return BadRequest($"Another skill with name '{updateSkillDto.Name}' already exists");
                }

                skill.Name = updateSkillDto.Name;
                skill.Category = updateSkillDto.Category;
                skill.Description = updateSkillDto.Description;
                skill.IsActive = updateSkillDto.IsActive;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating skill {SkillId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/skills/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSkill(int id)
        {
            try
            {
                var skill = await _context.Skills
                    .Include(s => s.EmployeeSkills)
                    .Include(s => s.PositionSkills)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (skill == null)
                {
                    return NotFound($"Skill with ID {id} not found");
                }

                // Check if skill is in use
                if (skill.EmployeeSkills.Any() || skill.PositionSkills.Any())
                {
                    return BadRequest("Cannot delete skill that is assigned to employees or required by positions. Consider deactivating it instead.");
                }

                _context.Skills.Remove(skill);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting skill {SkillId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/skills/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<CategoryStatsDto>>> GetSkillCategories()
        {
            try
            {
                var categories = await _context.Skills
                    .Where(s => s.IsActive && !string.IsNullOrEmpty(s.Category))
                    .GroupBy(s => s.Category)
                    .Select(g => new CategoryStatsDto
                    {
                        Category = g.Key,
                        SkillCount = g.Count(),
                        EmployeeCount = g.Sum(s => s.EmployeeSkills.Count),
                        PositionCount = g.Sum(s => s.PositionSkills.Count)
                    })
                    .OrderBy(c => c.Category)
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skill categories");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/skills/{id}/gap-analysis
        [HttpGet("{id}/gap-analysis")]
        public async Task<ActionResult<SkillGapAnalysisDto>> GetSkillGapAnalysis(int id)
        {
            try
            {
                var skill = await _context.Skills
                    .Include(s => s.EmployeeSkills)
                        .ThenInclude(es => es.Employee)
                    .Include(s => s.PositionSkills)
                        .ThenInclude(ps => ps.Position)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (skill == null)
                {
                    return NotFound($"Skill with ID {id} not found");
                }

                var gapAnalysis = new SkillGapAnalysisDto
                {
                    SkillId = skill.Id,
                    SkillName = skill.Name,
                    TotalEmployeesWithSkill = skill.EmployeeSkills.Count,
                    AverageProficiencyLevel = skill.EmployeeSkills.Any()
                        ? skill.EmployeeSkills.Average(es => es.ProficiencyLevel)
                        : 0,
                    PositionsRequiringSkill = skill.PositionSkills.Count,
                    AverageRequiredLevel = skill.PositionSkills.Any()
                        ? skill.PositionSkills.Average(ps => ps.RequiredLevel)
                        : 0,
                    GapsByDepartment = GetGapsByDepartment(skill),
                    GapsByLevel = GetGapsByLevel(skill),
                    CriticalGaps = GetCriticalGaps(skill)
                };

                return Ok(gapAnalysis);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skill gap analysis for skill {SkillId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/skills/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<SkillSummaryDto>>> SearchSkills([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrEmpty(query) || query.Length < 2)
                {
                    return BadRequest("Search query must be at least 2 characters long");
                }

                var skills = await _context.Skills
                    .Where(s => s.IsActive && (s.Name.Contains(query) || s.Description.Contains(query)))
                    .Select(s => new SkillSummaryDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Category = s.Category,
                        Description = s.Description
                    })
                    .Take(20)
                    .ToListAsync();

                return Ok(skills);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching skills");
                return StatusCode(500, "Internal server error");
            }
        }

        // Helper methods
        private Dictionary<int, int> GetProficiencyDistribution(List<EmployeeSkill> employeeSkills)
        {
            var distribution = new Dictionary<int, int>();
            for (int i = 1; i <= 5; i++)
            {
                distribution[i] = employeeSkills.Count(es => es.ProficiencyLevel == i);
            }
            return distribution;
        }

        private List<DepartmentGapDto> GetGapsByDepartment(Skill skill)
        {
            var departmentGroups = skill.EmployeeSkills
                .GroupBy(es => es.Employee.Department)
                .Select(g => new DepartmentGapDto
                {
                    Department = g.Key,
                    EmployeeCount = g.Count(),
                    AverageProficiency = g.Average(es => es.ProficiencyLevel),
                    MaxProficiency = g.Max(es => es.ProficiencyLevel),
                    MinProficiency = g.Min(es => es.ProficiencyLevel)
                })
                .ToList();

            return departmentGroups;
        }

        private Dictionary<int, int> GetGapsByLevel(Skill skill)
        {
            var levelDistribution = new Dictionary<int, int>();
            for (int i = 1; i <= 5; i++)
            {
                levelDistribution[i] = skill.EmployeeSkills.Count(es => es.ProficiencyLevel == i);
            }
            return levelDistribution;
        }

        private List<CriticalGapDto> GetCriticalGaps(Skill skill)
        {
            return skill.PositionSkills
                .Where(ps => ps.IsMandatory)
                .Select(ps => new CriticalGapDto
                {
                    PositionTitle = ps.Position.Title,
                    RequiredLevel = ps.RequiredLevel,
                    EmployeesAtLevel = skill.EmployeeSkills.Count(es => es.ProficiencyLevel >= ps.RequiredLevel),
                    Gap = Math.Max(0, ps.RequiredLevel - (skill.EmployeeSkills.Any()
                        ? skill.EmployeeSkills.Max(es => es.ProficiencyLevel)
                        : 0))
                })
                .Where(cg => cg.Gap > 0)
                .OrderByDescending(cg => cg.Gap)
                .ToList();
        }
    }
}
