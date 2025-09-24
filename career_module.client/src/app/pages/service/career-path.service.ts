import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Position } from './position.service';
import { AuthService, User } from './auth.service';
import { Skill } from './skills.service';


export interface CareerPath {
  id: number;
  fromPositionId?: number;
  toPositionId: number;
  minYearsInCurrentRole: number;
  minTotalExperience: number;
  minPerformanceRating?: number; // 1-5 scale
  requiredCertifications?: string;
  requiredEducationLevel?: string; // Bachelor, Master, PhD, etc.
  description?: string;
  isActive: boolean;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
  fromPosition: Position;
  toPosition: Position;
  createdBy: User;
  requiredSkills: CareerPathSkill[];
}

export interface CareerPathSkill {
  id: number;
  careerPathId: number;
  skillId: number;
  minProficiencyLevel: number; // 1-5
  isMandatory: boolean;
  careerPath: CareerPath;
  skill: Skill;
}

// DTO Interfaces
export interface CreateCareerPathSkillDto {
  skillId: number;
  minProficiencyLevel: number;
  isMandatory?: boolean;
}

export interface CreateCareerPathDto {
  fromPositionId?: number;
  toPositionId: number;
  minYearsInCurrentRole?: number;
  minTotalExperience?: number;
  minPerformanceRating?: number;
  requiredCertifications?: string;
  requiredEducationLevel?: string;
  description?: string;
  requiredSkills?: CreateCareerPathSkillDto[];
}

export interface UpdateCareerPathDto {
  minYearsInCurrentRole?: number;
  minTotalExperience?: number;
  minPerformanceRating?: number;
  requiredCertifications?: string;
  requiredEducationLevel?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddCareerPathSkillDto {
  skillId: number;
  minProficiencyLevel: number;
  isMandatory: boolean;
}

// Analysis Interfaces
export interface SkillGapAnalysis {
  skill: Skill;
  requiredProficiency: number;
  currentProficiency: number;
  gap: number;
  isMandatory: boolean;
  priority: number;
}

export interface CareerPathAnalysis {
  employeeId: number;
  careerPathId: number;
  analysisDate: Date;
  yearsInCurrentRole: number;
  totalExperience: number;
  currentPerformanceRating: number;
  meetsExperienceRequirement: boolean;
  meetsTotalExperienceRequirement: boolean;
  meetsPerformanceRequirement: boolean;
  meetsEducationRequirement: boolean;
  meetsFromPositionRequirement: boolean;
  skillGaps: SkillGapAnalysis[];
  skillCompletionPercentage: number;
  readinessPercentage: number;
  recommendations: string[];
}

export interface CareerPathRecommendation {
  careerPath: CareerPath;
  readinessScore: number;
  analysis: CareerPathAnalysis;
  priority: number;
}

export interface RoadmapStep {
  order: number;
  fromPositionId: number;
  toPositionId: number;
  careerPathId: number;
  estimatedTimeMonths: number;
}

export interface CareerRoadmap {
  employeeId: number;
  currentPositionId: number;
  targetPositionId: number;
  generatedDate: Date;
  steps: RoadmapStep[];
  estimatedTotalTimeMonths: number;
}

@Injectable({
  providedIn: 'root'
})
export class CareerPathService extends BaseApiService {
  private readonly endpoint = '/CareerPath';

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  // Career Path CRUD Operations
  createCareerPath(dto: CreateCareerPathDto): Observable<CareerPath> {
    return this.post<CareerPath>(this.endpoint, dto);
  }

  getCareerPath(id: number): Observable<CareerPath> {
    return this.get<CareerPath>(`${this.endpoint}/${id}`);
  }

  getAllCareerPaths(includeInactive: boolean = false): Observable<CareerPath[]> {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }

    const url = params.toString() ? `${this.endpoint}?${params.toString()}` : this.endpoint;
    return this.get<CareerPath[]>(url);
  }

  updateCareerPath(id: number, dto: UpdateCareerPathDto): Observable<CareerPath> {
    return this.put<CareerPath>(`${this.endpoint}/${id}`, dto);
  }

  deleteCareerPath(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

  // Smart Career Path Discovery
  getMyRecommendations(): Observable<CareerPathRecommendation[]> {
    return this.get<CareerPathRecommendation[]>(`${this.endpoint}/recommendations`);
  }

  getEmployeeRecommendations(employeeId: number): Observable<CareerPathRecommendation[]> {
    return this.get<CareerPathRecommendation[]>(`${this.endpoint}/employee/${employeeId}/recommendations`);
  }

  getPathsFromPosition(positionId: number): Observable<CareerPath[]> {
    return this.get<CareerPath[]>(`${this.endpoint}/from-position/${positionId}`);
  }

  getPathsToPosition(positionId: number): Observable<CareerPath[]> {
    return this.get<CareerPath[]>(`${this.endpoint}/to-position/${positionId}`);
  }

  // Career Path Analysis
  analyzeMyReadiness(careerPathId: number): Observable<CareerPathAnalysis> {
    return this.get<CareerPathAnalysis>(`${this.endpoint}/${careerPathId}/analyze`);
  }

  analyzeEmployeeReadiness(careerPathId: number, employeeId: number): Observable<CareerPathAnalysis> {
    return this.get<CareerPathAnalysis>(`${this.endpoint}/${careerPathId}/analyze/${employeeId}`);
  }

  getMySkillGaps(careerPathId: number): Observable<SkillGapAnalysis[]> {
    return this.get<SkillGapAnalysis[]>(`${this.endpoint}/${careerPathId}/skill-gaps`);
  }

  getEmployeeSkillGaps(careerPathId: number, employeeId: number): Observable<SkillGapAnalysis[]> {
    return this.get<SkillGapAnalysis[]>(`${this.endpoint}/${careerPathId}/skill-gaps/${employeeId}`);
  }

  getMyCareerRoadmap(targetPositionId: number): Observable<CareerRoadmap> {
    return this.get<CareerRoadmap>(`${this.endpoint}/roadmap/to-position/${targetPositionId}`);
  }

  getEmployeeCareerRoadmap(employeeId: number, targetPositionId: number): Observable<CareerRoadmap> {
    return this.get<CareerRoadmap>(`${this.endpoint}/roadmap/${employeeId}/to-position/${targetPositionId}`);
  }

  // Career Path Skills Management
  addRequiredSkill(careerPathId: number, dto: AddCareerPathSkillDto): Observable<CareerPathSkill> {
    return this.post<CareerPathSkill>(`${this.endpoint}/${careerPathId}/skills`, dto);
  }

  removeRequiredSkill(careerPathId: number, skillId: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/${careerPathId}/skills/${skillId}`);
  }

  getRequiredSkills(careerPathId: number): Observable<CareerPathSkill[]> {
    return this.get<CareerPathSkill[]>(`${this.endpoint}/${careerPathId}/skills`);
  }

  // Helper Methods for Common Operations
  getActiveCareerPaths(): Observable<CareerPath[]> {
    return this.getAllCareerPaths(false);
  }

  getAllCareerPathsIncludingInactive(): Observable<CareerPath[]> {
    return this.getAllCareerPaths(true);
  }

  // Department and Position specific paths
  getCareerPathsByDepartment(departmentId: number): Observable<CareerPath[]> {
    // This would need backend support for department filtering
    return this.get<CareerPath[]>(`${this.endpoint}/department/${departmentId}`);
  }

  getInternalCareerPaths(departmentId?: number): Observable<CareerPath[]> {
    // Paths within the same department
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    const url = params.toString() 
      ? `${this.endpoint}/internal?${params.toString()}`
      : `${this.endpoint}/internal`;
    
    return this.get<CareerPath[]>(url);
  }

  getCrossDepartmentCareerPaths(): Observable<CareerPath[]> {
    // Paths that cross department boundaries
    return this.get<CareerPath[]>(`${this.endpoint}/cross-department`);
  }

  // Advanced Analysis and Discovery
  findOptimalCareerPath(fromPositionId: number, toPositionId: number): Observable<CareerRoadmap> {
    return this.get<CareerRoadmap>(`${this.endpoint}/optimal-path/${fromPositionId}/to/${toPositionId}`);
  }

  getCareerPathSuccessRate(careerPathId: number): Observable<{
    pathId: number;
    totalAttempts: number;
    successfulTransitions: number;
    successRate: number;
    averageTimeToComplete: number;
  }> {
    return this.get<any>(`${this.endpoint}/${careerPathId}/success-rate`);
  }

  getPopularCareerPaths(limit: number = 10): Observable<{
    careerPath: CareerPath;
    usageCount: number;
    successRate: number;
  }[]> {
    return this.get<any[]>(`${this.endpoint}/popular?limit=${limit}`);
  }

  // Bulk Operations
  bulkCreateCareerPaths(careerPaths: CreateCareerPathDto[]): Observable<CareerPath[]> {
    return this.post<CareerPath[]>(`${this.endpoint}/bulk-create`, { careerPaths });
  }

  bulkUpdateCareerPaths(updates: { id: number; dto: UpdateCareerPathDto }[]): Observable<CareerPath[]> {
    return this.put<CareerPath[]>(`${this.endpoint}/bulk-update`, { updates });
  }

  bulkDeactivateCareerPaths(careerPathIds: number[]): Observable<{ deactivated: number; message: string }> {
    return this.post<{ deactivated: number; message: string }>(`${this.endpoint}/bulk-deactivate`, {
      ids: careerPathIds
    });
  }

  // Search and Filtering
  searchCareerPaths(query: string, filters?: {
    fromDepartmentId?: number;
    toDepartmentId?: number;
    minExperience?: number;
    maxExperience?: number;
    educationLevel?: string;
  }): Observable<CareerPath[]> {
    let params = new HttpParams().set('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.get<CareerPath[]>(`${this.endpoint}/search?${params.toString()}`);
  }

  filterCareerPaths(filters: {
    fromPositionId?: number;
    toPositionId?: number;
    departmentId?: number;
    minYears?: number;
    maxYears?: number;
    requiredEducation?: string;
    skillIds?: number[];
  }): Observable<CareerPath[]> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params = params.append(key, v.toString()));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.get<CareerPath[]>(`${this.endpoint}/filter?${params.toString()}`);
  }

  // Skills Analysis
  getSkillRequirementsAnalysis(skillId: number): Observable<{
    skill: Skill;
    careerPathsRequiring: CareerPath[];
    averageRequiredLevel: number;
    demandLevel: string;
  }> {
    return this.get<any>(`${this.endpoint}/skills/${skillId}/analysis`);
  }

  getMostDemandedSkills(limit: number = 20): Observable<{
    skill: Skill;
    demandCount: number;
    averageRequiredLevel: number;
    careerPaths: CareerPath[];
  }[]> {
    return this.get<any[]>(`${this.endpoint}/skills/most-demanded?limit=${limit}`);
  }

  // Validation and Quality Assurance
  validateCareerPath(dto: CreateCareerPathDto): Observable<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
    suggestions: string[];
  }> {
    return this.post<any>(`${this.endpoint}/validate`, dto);
  }

  checkForDuplicatePaths(fromPositionId: number, toPositionId: number): Observable<{
    duplicatesFound: boolean;
    existingPaths: CareerPath[];
  }> {
    return this.get<any>(`${this.endpoint}/check-duplicates/${fromPositionId}/${toPositionId}`);
  }

  // Analytics and Reporting
  getCareerPathAnalytics(careerPathId: number): Observable<{
    pathId: number;
    totalEmployeesEligible: number;
    totalEmployeesInProgress: number;
    averageReadinessScore: number;
    topSkillGaps: SkillGapAnalysis[];
    recommendedImprovements: string[];
  }> {
    return this.get<any>(`${this.endpoint}/${careerPathId}/analytics`);
  }

  generateCareerPathReport(reportType: 'usage' | 'effectiveness' | 'gaps' | 'skills', filters?: any): Observable<any> {
    let params = new HttpParams().set('type', reportType);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.get<any>(`${this.endpoint}/reports/generate?${params.toString()}`);
  }

  exportCareerPathData(format: 'xlsx' | 'csv' | 'json' = 'xlsx'): Observable<Blob> {
    return this.get<Blob>(`${this.endpoint}/export?format=${format}`);
  }

  // Employee Progress Tracking
  trackEmployeeProgress(employeeId: number, careerPathId: number): Observable<{
    employeeId: number;
    careerPathId: number;
    startDate: Date;
    progressPercentage: number;
    completedRequirements: string[];
    remainingRequirements: string[];
    estimatedCompletionDate: Date;
  }> {
    return this.get<any>(`${this.endpoint}/${careerPathId}/track-progress/${employeeId}`);
  }

  recordCareerPathProgress(employeeId: number, careerPathId: number, milestone: string): Observable<any> {
    return this.post<any>(`${this.endpoint}/${careerPathId}/progress/${employeeId}`, {
      milestone,
      recordedDate: new Date()
    });
  }

  // Integration with Other Services
  syncWithSuccessionPlanning(): Observable<{ synced: number; message: string }> {
    return this.post<{ synced: number; message: string }>(`${this.endpoint}/sync-succession-planning`, {});
  }

  syncWithPerformanceReviews(): Observable<{ synced: number; message: string }> {
    return this.post<{ synced: number; message: string }>(`${this.endpoint}/sync-performance-reviews`, {});
  }
}