import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee } from './employee.service';
import { Department } from './department.service';
import { SuccessionPlan } from './succession-planning.service';
import { AuthService } from './auth.service';

// Interfaces
export interface Position {
  id: number;
  title: string;
  departmentId: number;
  description: string;
  minSalary?: number;
  maxSalary?: number;
  level: string; // Junior, Mid, Senior, Lead, Manager, Director
  isKeyPosition: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department?: Department;
  currentEmployees?: Employee[];
  successionPlans?: SuccessionPlan[];
  fromCareerPaths?: CareerPath[];
  toCareerPaths?: CareerPath[];
}

export interface CareerPath {
  id: number;
  fromPositionId: number;
  toPositionId: number;
  // Add other career path properties as needed
}

export interface CreatePositionDto {
  title: string;
  departmentId: number;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  level?: string;
  isKeyPosition?: boolean;
}

export interface UpdatePositionDto {
  title?: string;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  level?: string;
  isKeyPosition?: boolean;
  isActive?: boolean;
}

export interface PositionWithStats extends Position {
  employeeCount: number;
  vacancyCount: number;
  averageTenure?: number;
  stats?: {
    totalAssigned: number;
    currentVacancies: number;
    averagePerformance: number;
    turnoverRate: number;
    timeToFill: number;
  };
}

export interface VacantKeyPosition extends Position {
  vacancySince?: Date;
  impact: string; // High, Medium, Low
  urgency: string; // Urgent, High, Medium, Low
  successorCandidates?: Employee[];
}

@Injectable({
  providedIn: 'root'
})
export class PositionService extends BaseApiService {
  private readonly endpoint = '/Positions';

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  // Get all positions with optional filters
  getAllPositions(includeInactive: boolean = false, departmentId?: number): Observable<Position[]> {
    let params = new HttpParams();
    
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    const url = params.toString() ? `${this.endpoint}?${params.toString()}` : this.endpoint;
    return this.get<Position[]>(url);
  }

  // Get position by ID
  getPositionById(id: number): Observable<Position> {
    return this.get<Position>(`${this.endpoint}/${id}`);
  }

  // Create new position (HR/Admin only)
  createPosition(dto: CreatePositionDto): Observable<Position> {
    return this.post<Position>(this.endpoint, dto);
  }

  // Update existing position (HR/Admin only)
  updatePosition(id: number, dto: UpdatePositionDto): Observable<Position> {
    return this.put<Position>(`${this.endpoint}/${id}`, dto);
  }

  // Deactivate position (HR/Admin only)
  deactivatePosition(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

  // Get employees in a position
  getPositionEmployees(id: number): Observable<Employee[]> {
    return this.get<Employee[]>(`${this.endpoint}/${id}/employees`);
  }

  // Get vacant key positions (HR/Admin/Manager only)
  getVacantKeyPositions(): Observable<VacantKeyPosition[]> {
    return this.get<VacantKeyPosition[]>(`${this.endpoint}/vacant-key-positions`);
  }

  // Get positions by department
  getPositionsByDepartment(departmentId: number): Observable<Position[]> {
    return this.get<Position[]>(`${this.endpoint}/by-department/${departmentId}`);
  }

  // Helper methods for common operations
  getActivePositions(): Observable<Position[]> {
    return this.getAllPositions(false);
  }

  getAllPositionsIncludingInactive(): Observable<Position[]> {
    return this.getAllPositions(true);
  }

  getPositionsByLevel(level: string): Observable<Position[]> {
    // This would need backend support for level filtering
    // For now, get all positions and filter client-side
    return this.getAllPositions();
  }

  getKeyPositions(): Observable<Position[]> {
    // This would need backend support for key position filtering
    // For now, get all positions and filter client-side
    return this.getAllPositions();
  }

  // Department-specific helpers
  getActivePositionsByDepartment(departmentId: number): Observable<Position[]> {
    return this.getPositionsByDepartment(departmentId);
  }

  getVacantPositionsByDepartment(departmentId: number): Observable<Position[]> {
    // This would filter positions with no current employees
    return this.getPositionsByDepartment(departmentId);
  }

  // Salary and compensation helpers
  getPositionsBySalaryRange(minSalary?: number, maxSalary?: number): Observable<Position[]> {
    // This would need backend support for salary filtering
    return this.getAllPositions();
  }

  updatePositionSalaryRange(id: number, minSalary?: number, maxSalary?: number): Observable<Position> {
    const dto: UpdatePositionDto = { minSalary, maxSalary };
    return this.updatePosition(id, dto);
  }

  // Position hierarchy and career path helpers
  getPositionCareerPaths(id: number): Observable<{ from: CareerPath[]; to: CareerPath[] }> {
    // This would get career paths leading from and to this position
    return this.getPositionById(id) as any; // Placeholder
  }

  getPositionSuccessionPlans(id: number): Observable<SuccessionPlan[]> {
    // This would get succession plans for the position
    return this.getPositionById(id) as any; // Placeholder
  }

  // Analytics and reporting
  getPositionAnalytics(id: number): Observable<PositionWithStats> {
    // This would provide detailed analytics for a position
    return this.getPositionById(id) as any; // Placeholder
  }

  getPositionTurnoverRate(id: number, timeframe?: string): Observable<{ rate: number; period: string }> {
    // This would calculate turnover rate for the position
    return this.get<{ rate: number; period: string }>(`${this.endpoint}/${id}/turnover`);
  }

  getPositionFillRate(departmentId?: number): Observable<{ filled: number; total: number; rate: number }> {
    // This would show position fill rates
    const url = departmentId 
      ? `${this.endpoint}/fill-rate?departmentId=${departmentId}`
      : `${this.endpoint}/fill-rate`;
    return this.get<{ filled: number; total: number; rate: number }>(url);
  }

  // Bulk operations
  bulkUpdatePositions(updates: { id: number; dto: UpdatePositionDto }[]): Observable<Position[]> {
    // This would need backend support for bulk updates
    return this.post<Position[]>(`${this.endpoint}/bulk-update`, updates);
  }

  bulkDeactivatePositions(positionIds: number[]): Observable<{ message: string; deactivated: number }> {
    return this.post<{ message: string; deactivated: number }>(`${this.endpoint}/bulk-deactivate`, { ids: positionIds });
  }

  // Search and filtering
  searchPositions(searchTerm: string, departmentId?: number, level?: string): Observable<Position[]> {
    let params = new HttpParams().set('search', searchTerm);
    
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    if (level) {
      params = params.set('level', level);
    }

    return this.get<Position[]>(`${this.endpoint}/search?${params.toString()}`);
  }

  filterPositions(filters: {
    departmentId?: number;
    level?: string;
    salaryMin?: number;
    salaryMax?: number;
    isKeyPosition?: boolean;
    isActive?: boolean;
  }): Observable<Position[]> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.get<Position[]>(`${this.endpoint}/filter?${params.toString()}`);
  }

  // Validation helpers
  validatePositionTitle(title: string, departmentId: number, excludeId?: number): Observable<{ isValid: boolean; message?: string }> {
    if (!title || title.trim().length === 0) {
      return new Observable(observer => {
        observer.next({ isValid: false, message: 'Position title is required' });
        observer.complete();
      });
    }

    if (title.length > 100) {
      return new Observable(observer => {
        observer.next({ isValid: false, message: 'Position title is too long' });
        observer.complete();
      });
    }

    return new Observable(observer => {
      observer.next({ isValid: true });
      observer.complete();
    });
  }

  validateSalaryRange(minSalary?: number, maxSalary?: number): Observable<{ isValid: boolean; message?: string }> {
    if (minSalary && maxSalary && minSalary > maxSalary) {
      return new Observable(observer => {
        observer.next({ isValid: false, message: 'Minimum salary cannot be greater than maximum salary' });
        observer.complete();
      });
    }

    if (minSalary && minSalary < 0) {
      return new Observable(observer => {
        observer.next({ isValid: false, message: 'Salary cannot be negative' });
        observer.complete();
      });
    }

    return new Observable(observer => {
      observer.next({ isValid: true });
      observer.complete();
    });
  }

  // Employee assignment helpers
  assignEmployeeToPosition(employeeId: number, positionId: number): Observable<any> {
    // This would need to be handled by employee service
    return this.post<any>(`/employee-assignment`, { employeeId, positionId });
  }

  removeEmployeeFromPosition(employeeId: number): Observable<any> {
    // This would need to be handled by employee service
    return this.put<any>(`/remove-employee-position/${employeeId}`, {});
  }

  // Reporting and export
  exportPositionData(departmentId?: number): Observable<Blob> {
    const url = departmentId 
      ? `${this.endpoint}/export?departmentId=${departmentId}` 
      : `${this.endpoint}/export`;
    
    return this.get<Blob>(url);
  }

  generatePositionReport(positionId: number, reportType: string = 'summary'): Observable<any> {
    return this.get<any>(`${this.endpoint}/${positionId}/report?type=${reportType}`);
  }

  // Position comparison and benchmarking
  comparePositions(positionIds: number[]): Observable<any> {
    return this.post<any>(`${this.endpoint}/compare`, { positionIds });
  }

  getPositionBenchmarks(positionId: number): Observable<any> {
    return this.get<any>(`${this.endpoint}/${positionId}/benchmarks`);
  }

  // Level management
  getAvailableLevels(): Observable<string[]> {
    // This could return all available position levels
    return new Observable(observer => {
      observer.next(['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director']);
      observer.complete();
    });
  }

  getPositionsByLevelHierarchy(): Observable<{ [level: string]: Position[] }> {
    // This would group positions by level
    return this.getAllPositions() as any; // Placeholder
  }
}