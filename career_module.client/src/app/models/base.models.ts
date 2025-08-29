// All the base models used across the application here

// Employee Models
export interface EmployeeDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  hireDate: string;
  salary?: number;
  managerId?: number;
  managerName?: string;
  currentPositionId?: number;
  currentPositionTitle?: string;
  skills?: EmployeeSkillDto[];
}

export interface EmployeeDetailDto extends EmployeeDto {
  directReports?: EmployeeSummaryDto[];
  careerGoals?: CareerGoalSummaryDto[];
}

export interface EmployeeSummaryDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  hireDate: string;
  salary?: number;
  managerId?: number;
  currentPositionId?: number;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  salary?: number;
  managerId?: number;
  currentPositionId?: number;
}

// Position Models
export interface PositionDto {
  id: number;
  title: string;
  department: string;
  description: string;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  minYearsExperience: number;
  isKeyPosition: boolean;
  isActive: boolean;
  currentEmployeeCount: number;
  requiredSkillsCount: number;
  createdAt: string;
}

export interface PositionDetailDto extends PositionDto {
  currentEmployees?: EmployeeSummaryDto[];
  requiredSkills?: PositionSkillDto[];
  hasSuccessionPlan: boolean;
  successionCandidatesCount: number;
}

export interface CreatePositionDto {
  title: string;
  department: string;
  description: string;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  minYearsExperience: number;
  isKeyPosition: boolean;
}

export interface UpdatePositionDto {
  title?: string;
  department?: string;
  description?: string;
  level?: string;
  minSalary?: number;
  maxSalary?: number;
  minYearsExperience?: number;
  isKeyPosition?: boolean;
  isActive?: boolean;
}

// Skill Models
export interface SkillDto {
  id: number;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  employeeCount: number;
  positionCount: number;
}

export interface EmployeeSkillSummaryDto {
  employeeId: number;
  employeeName: string;
  department: string;
  proficiencyLevel: number;
  acquiredDate: Date;
  lastAssessedDate?: Date;
}

export interface CreateSkillDto {
  name: string;
  category: string;
  description: string;
}

export interface UpdateSkillDto {
  name: string;
  category: string;
  description: string;
  isActive: boolean;
}

export interface SkillSummaryDto {
  id: number;
  name: string;
  category: string;
  description: string;
}

export interface CategoryStatsDto {
  category: string;
  skillCount: number;
  employeeCount: number;
  positionCount: number;
}

export interface SkillGapAnalysisDto {
  skillId: number;
  skillName: string;
  totalEmployeesWithSkill: number;
  averageProficiencyLevel: number;
  positionsRequiringSkill: number;
  averageRequiredLevel: number;
  gapsByDepartment?: DepartmentGapDto[];
  gapsByLevel?: { [key: number]: number };
  criticalGaps?: CriticalGapDto[];
}

export interface DepartmentGapDto {
  department: string;
  employeeCount: number;
  averageProficiency: number;
  maxProficiency: number;
  minProficiency: number;
}

export interface CriticalGapDto {
  positionTitle: string;
  requiredLevel: number;
  employeesAtLevel: number;
  gap: number;
}

export interface SkillDetailDto extends SkillDto {
  employeesWithSkill?: EmployeeSkillSummaryDto[];
  positionsRequiring?: PositionSkillSummaryDto[];
  proficiencyDistribution?: { [key: number]: number };
}

export interface PositionSkillSummaryDto {
  positionId: number;
  positionTitle: string;
  department: string;
  requiredLevel: number;
  isMandatory: boolean;
  weight: number;
}

export interface EmployeeSkillDto {
  skillId: number;
  skillName: string;
  skillCategory: string;
  proficiencyLevel: number;
  acquiredDate: string;
  lastAssessedDate?: string;
  notes?: string;
}

export interface PositionSkillDto {
  skillId: number;
  skillName: string;
  skillCategory: string;
  requiredLevel: number;
  isMandatory: boolean;
  weight: number;
}

export interface AddEmployeeSkillDto {
  skillId: number;
  proficiencyLevel: number;
  acquiredDate: Date;
  notes?: string;
}

export interface AddPositionSkillDto {
  skillId: number;
  requiredLevel: number;
  isMandatory: boolean;
  weight: number;
}

export interface UpdatePositionSkillDto {
  requiredLevel: number;
  isMandatory: boolean;
  weight: number;
}

// Career Goals
export interface CareerGoalSummaryDto {
  id: number;
  goalDescription: string;
  targetDate: string;
  status: string;
  priority: string;
  targetPositionTitle?: string;
}

// Candidate Matching
export interface CandidateMatchDto {
  employeeId: number;
  firstName: string;
  lastName: string;
  currentPositionTitle?: string;
  department: string;
  matchScore: number;
  skillMatches?: SkillMatchDto[];
}

export interface SkillMatchDto {
  skillName: string;
  requiredLevel: number;
  employeeLevel: number;
  isMandatory: boolean;
  gap: number;
}

// Common Types
export interface PaginatedResponse<T> {
  data: T;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface EmployeeFilters extends PaginationParams {
  department?: string;
  managerId?: number;
}

export interface PositionFilters extends PaginationParams {
  department?: string;
  level?: string;
  isKeyPosition?: boolean;
  isActive?: boolean;
}