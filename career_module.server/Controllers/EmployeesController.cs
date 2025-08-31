using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using career_module.server.Infrastructure.Data;
using career_module.server.Models.Entities;
using career_module.server.Models.DTOs;

namespace career_module.server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly CareerManagementDbContext _context;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(CareerManagementDbContext context, ILogger<EmployeesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/employees
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees(
            [FromQuery] string? department = null,
            [FromQuery] int? managerId = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Employees
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Manager)
                    .Include(e => e.EmployeeSkills)
                        .ThenInclude(es => es.Skill)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(department))
                {
                    query = query.Where(e => e.Department.Contains(department));
                }

                if (managerId.HasValue)
                {
                    query = query.Where(e => e.ManagerId == managerId);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(s => s.FirstName.Contains(search) ||
                                        s.LastName.Contains(search) ||
                                        s.Email.Contains(search));
                }

                var totalCount = await query.CountAsync();
                var employees = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(e => new EmployeeDto
                    {
                        Id = e.Id,
                        FirstName = e.FirstName,
                        LastName = e.LastName,
                        Email = e.Email,
                        Phone = e.Phone,
                        Department = e.Department,
                        HireDate = e.HireDate,
                        Salary = e.Salary,
                        ManagerId = e.ManagerId,
                        ManagerName = e.Manager != null ? $"{e.Manager.FirstName} {e.Manager.LastName}" : null,
                        CurrentPositionId = e.CurrentPositionId,
                        CurrentPositionTitle = e.CurrentPosition != null ? e.CurrentPosition.Title : null,
                        Skills = e.EmployeeSkills.Select(es => new EmployeeSkillDto
                        {
                            SkillId = es.SkillId,
                            SkillName = es.Skill.Name,
                            ProficiencyLevel = es.ProficiencyLevel,
                            AcquiredDate = es.AcquiredDate
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Data = employees,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employees");
                return StatusCode(500, "Internal server error");
            }
        }
        // GET: api/employees/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDetailDto>> GetEmployee(int id)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.CurrentPosition)
                    .Include(e => e.Manager)
                    .Include(e => e.DirectReports)
                    .Include(e => e.EmployeeSkills)
                        .ThenInclude(es => es.Skill)
                    .Include(e => e.CareerGoals)
                        .ThenInclude(cg => cg.TargetPosition)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (employee == null)
                {
                    return NotFound($"Employee with ID {id} not found");
                }

                var employeeDto = new EmployeeDetailDto
                {
                    Id = employee.Id,
                    FirstName = employee.FirstName,
                    LastName = employee.LastName,
                    Email = employee.Email,
                    Phone = employee.Phone,
                    Department = employee.Department,
                    HireDate = employee.HireDate,
                    Salary = employee.Salary,
                    ManagerId = employee.ManagerId,
                    ManagerName = employee.Manager != null ? $"{employee.Manager.FirstName} {employee.Manager.LastName}" : null,
                    CurrentPositionId = employee.CurrentPositionId,
                    CurrentPositionTitle = employee.CurrentPosition?.Title,
                    DirectReports = employee.DirectReports.Select(dr => new EmployeeSummaryDto
                    {
                        Id = dr.Id,
                        FirstName = dr.FirstName,
                        LastName = dr.LastName,
                        Email = dr.Email,
                        Department = dr.Department
                    }).ToList(),
                    Skills = employee.EmployeeSkills.Select(es => new EmployeeSkillDto
                    {
                        SkillId = es.SkillId,
                        SkillName = es.Skill.Name,
                        SkillCategory = es.Skill.Category,
                        ProficiencyLevel = es.ProficiencyLevel,
                        AcquiredDate = es.AcquiredDate,
                        LastAssessedDate = es.LastAssessedDate,
                        Notes = es.Notes
                    }).ToList(),
                    CareerGoals = employee.CareerGoals.Select(cg => new CareerGoalSummaryDto
                    {
                        Id = cg.Id,
                        GoalDescription = cg.GoalDescription,
                        TargetDate = cg.TargetDate,
                        Status = cg.Status,
                        Priority = cg.Priority,
                        TargetPositionTitle = cg.TargetPosition?.Title
                    }).ToList()
                };

                return Ok(employeeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee {EmployeeId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/employees
        [HttpPost]
        public async Task<ActionResult<EmployeeDto>> CreateEmployee(CreateEmployeeDto createEmployeeDto)
        {
            try
            {
                // Validate manager exists if provided
                if (createEmployeeDto.ManagerId.HasValue)
                {
                    var managerExists = await _context.Employees.AnyAsync(e => e.Id == createEmployeeDto.ManagerId);
                    if (!managerExists)
                    {
                        return BadRequest($"Manager with ID {createEmployeeDto.ManagerId} not found");
                    }
                }

                // Validate position exists if provided
                if (createEmployeeDto.CurrentPositionId.HasValue)
                {
                    var positionExists = await _context.Positions.AnyAsync(p => p.Id == createEmployeeDto.CurrentPositionId);
                    if (!positionExists)
                    {
                        return BadRequest($"Position with ID {createEmployeeDto.CurrentPositionId} not found");
                    }
                }

                var employee = new Employee
                {
                    FirstName = createEmployeeDto.FirstName,
                    LastName = createEmployeeDto.LastName,
                    Email = createEmployeeDto.Email,
                    Phone = createEmployeeDto.Phone,
                    Department = createEmployeeDto.Department,
                    HireDate = createEmployeeDto.HireDate,
                    Salary = createEmployeeDto.Salary,
                    ManagerId = createEmployeeDto.ManagerId,
                    CurrentPositionId = createEmployeeDto.CurrentPositionId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                // Load related data for response
                await _context.Entry(employee)
                    .Reference(e => e.CurrentPosition)
                    .LoadAsync();

                await _context.Entry(employee)
                    .Reference(e => e.Manager)
                    .LoadAsync();

                var employeeDto = new EmployeeDto
                {
                    Id = employee.Id,
                    FirstName = employee.FirstName,
                    LastName = employee.LastName,
                    Email = employee.Email,
                    Phone = employee.Phone,
                    Department = employee.Department,
                    HireDate = employee.HireDate,
                    Salary = employee.Salary,
                    ManagerId = employee.ManagerId,
                    ManagerName = employee.Manager != null ? $"{employee.Manager.FirstName} {employee.Manager.LastName}" : null,
                    CurrentPositionId = employee.CurrentPositionId,
                    CurrentPositionTitle = employee.CurrentPosition?.Title,
                    Skills = new List<EmployeeSkillDto>()
                };

                return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, employeeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/employees/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, UpdateEmployeeDto updateEmployeeDto)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound($"Employee with ID {id} not found");
                }

                // Validate manager exists if provided
                if (updateEmployeeDto.ManagerId.HasValue && updateEmployeeDto.ManagerId != id)
                {
                    var managerExists = await _context.Employees.AnyAsync(e => e.Id == updateEmployeeDto.ManagerId);
                    if (!managerExists)
                    {
                        return BadRequest($"Manager with ID {updateEmployeeDto.ManagerId} not found");
                    }
                }

                // Validate position exists if provided
                if (updateEmployeeDto.CurrentPositionId.HasValue)
                {
                    var positionExists = await _context.Positions.AnyAsync(p => p.Id == updateEmployeeDto.CurrentPositionId);
                    if (!positionExists)
                    {
                        return BadRequest($"Position with ID {updateEmployeeDto.CurrentPositionId} not found");
                    }
                }

                // Update properties
                employee.FirstName = updateEmployeeDto.FirstName;
                employee.LastName = updateEmployeeDto.LastName;
                employee.Email = updateEmployeeDto.Email;
                employee.Phone = updateEmployeeDto.Phone;
                employee.Department = updateEmployeeDto.Department;
                employee.Salary = updateEmployeeDto.Salary;
                employee.ManagerId = updateEmployeeDto.ManagerId;
                employee.CurrentPositionId = updateEmployeeDto.CurrentPositionId;
                employee.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee {EmployeeId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/employees/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            try
            {
                var employee = await _context.Employees
                    .Include(e => e.DirectReports)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (employee == null)
                {
                    return NotFound($"Employee with ID {id} not found");
                }

                // Check if employee has direct reports
                if (employee.DirectReports.Any())
                {
                    return BadRequest("Cannot delete employee who has direct reports. Please reassign or remove direct reports first.");
                }

                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting employee {EmployeeId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/employees/{id}/skills
        [HttpPost("{id}/skills")]
        public async Task<IActionResult> AddEmployeeSkill(int id, AddEmployeeSkillDto addSkillDto)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound($"Employee with ID {id} not found");
                }

                var skill = await _context.Skills.FindAsync(addSkillDto.SkillId);
                if (skill == null)
                {
                    return BadRequest($"Skill with ID {addSkillDto.SkillId} not found");
                }

                var existingSkill = await _context.EmployeeSkills
                    .FirstOrDefaultAsync(es => es.EmployeeId == id && es.SkillId == addSkillDto.SkillId);

                if (existingSkill != null)
                {
                    return BadRequest("Employee already has this skill");
                }

                var employeeSkill = new EmployeeSkill
                {
                    EmployeeId = id,
                    SkillId = addSkillDto.SkillId,
                    ProficiencyLevel = addSkillDto.ProficiencyLevel,
                    AcquiredDate = addSkillDto.AcquiredDate,
                    Notes = addSkillDto.Notes
                };

                _context.EmployeeSkills.Add(employeeSkill);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding skill to employee {EmployeeId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/employees/{employeeId}/skills/{skillId}
        [HttpPut("{employeeId}/skills/{skillId}")]
        public async Task<IActionResult> UpdateEmployeeSkill(int employeeId, int skillId, UpdateEmployeeSkillDto updateSkillDto)
        {
            try
            {
                var employeeSkill = await _context.EmployeeSkills
                    .FirstOrDefaultAsync(es => es.EmployeeId == employeeId && es.SkillId == skillId);

                if (employeeSkill == null)
                {
                    return NotFound("Employee skill not found");
                }

                employeeSkill.ProficiencyLevel = updateSkillDto.ProficiencyLevel;
                employeeSkill.LastAssessedDate = DateTime.UtcNow;
                employeeSkill.Notes = updateSkillDto.Notes;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee skill");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/employees/{employeeId}/skills/{skillId}
        [HttpDelete("{employeeId}/skills/{skillId}")]
        public async Task<IActionResult> RemoveEmployeeSkill(int employeeId, int skillId)
        {
            try
            {
                var employeeSkill = await _context.EmployeeSkills
                    .FirstOrDefaultAsync(es => es.EmployeeId == employeeId && es.SkillId == skillId);

                if (employeeSkill == null)
                {
                    return NotFound("Employee skill not found");
                }

                _context.EmployeeSkills.Remove(employeeSkill);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing employee skill");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
