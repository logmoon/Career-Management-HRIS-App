import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee } from './employee.service';
import { AuthService } from './auth.service';

// Interfaces
export interface Department {
  id: number;
  name: string;
  description: string;
  headOfDepartmentId?: number;
  isActive: boolean;
  createdAt: Date;
  headOfDepartment?: Employee;
  employees?: Employee[];
  positions?: Position[];
}

export interface Position {
  id: number;
  title: string;
  departmentId: number;
  // Add other position properties as needed
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  headOfDepartmentId?: number;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AssignHeadDto {
  employeeId: number;
}

export interface DepartmentWithStats extends Department {
  employeeCount: number;
  activeEmployeeCount: number;
  averagePerformance?: number;
  positionCount: number;
  stats?: {
    totalEmployees: number;
    activeEmployees: number;
    managerCount: number;
    averageTenure: number;
    performanceScore: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService extends BaseApiService {
  private readonly endpoint = '/Departments';

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  // Get all departments
  getAllDepartments(includeInactive: boolean = false): Observable<Department[]> {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }

    const url = params.toString() ? `${this.endpoint}?${params.toString()}` : this.endpoint;
    return this.get<Department[]>(url);
  }

  // Get department by ID
  getDepartmentById(id: number): Observable<Department> {
    return this.get<Department>(`${this.endpoint}/${id}`);
  }

  // Create new department (HR/Admin only)
  createDepartment(dto: CreateDepartmentDto): Observable<Department> {
    return this.post<Department>(this.endpoint, dto);
  }

  // Update existing department (HR/Admin only)
  updateDepartment(id: number, dto: UpdateDepartmentDto): Observable<Department> {
    return this.put<Department>(`${this.endpoint}/${id}`, dto);
  }

  // Deactivate department (Admin only)
  deactivateDepartment(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

  // Get employees in a department
  getDepartmentEmployees(id: number): Observable<Employee[]> {
    return this.get<Employee[]>(`${this.endpoint}/${id}/employees`);
  }

  // Assign head of department (HR/Admin only)
  assignHeadOfDepartment(departmentId: number, employeeId: number): Observable<Department> {
    const dto: AssignHeadDto = { employeeId };
    return this.put<Department>(`${this.endpoint}/${departmentId}/head`, dto);
  }

  // Get departments with statistics (HR/Admin/Manager only)
  getDepartmentsWithStats(): Observable<DepartmentWithStats[]> {
    return this.get<DepartmentWithStats[]>(`${this.endpoint}/with-stats`);
  }

  // Helper methods for common operations
  getActiveDepartments(): Observable<Department[]> {
    return this.getAllDepartments(false);
  }

  getAllDepartmentsIncludingInactive(): Observable<Department[]> {
    return this.getAllDepartments(true);
  }

  getDepartmentsByStatus(isActive: boolean): Observable<Department[]> {
    return this.getAllDepartments(!isActive);
  }

  // Search departments by name
  searchDepartments(searchTerm: string, includeInactive: boolean = false): Observable<Department[]> {
    // Note: This would need backend support for search functionality
    // For now, get all departments and filter client-side
    return this.getAllDepartments(includeInactive);
  }

  // Get department hierarchy/structure
  getDepartmentHierarchy(): Observable<Department[]> {
    return this.getDepartmentsWithStats();
  }

  // Bulk operations
  updateDepartmentStatus(departmentIds: number[], isActive: boolean): Observable<any> {
    // This would need backend support for bulk operations
    // For now, you'd need to call updateDepartment for each department
    const updates = departmentIds.map(id => 
      this.updateDepartment(id, { isActive })
    );
    
    // Return combined observable if needed
    return this.get<any[]>('/bulk-update'); // Placeholder
  }

  // Analytics and reporting helpers
  getDepartmentPerformanceMetrics(departmentId: number): Observable<any> {
    // This could be combined with intelligence service or separate analytics
    return this.getDepartmentById(departmentId);
  }

  getDepartmentGrowthStats(departmentId: number): Observable<any> {
    // This would combine historical data about department growth
    return this.getDepartmentById(departmentId);
  }

  // Validation helpers
  validateDepartmentName(name: string, excludeId?: number): Observable<{ isValid: boolean; message?: string }> {
    // This would need backend validation endpoint
    // For now, basic client-side validation
    if (!name || name.trim().length === 0) {
      return new Observable(observer => {
        observer.next({ isValid: false, message: 'Department name is required' });
        observer.complete();
      });
    }

    if (name.length > 100) {
      return new Observable(observer => {
        observer.next({ isValid: false, message: 'Department name is too long' });
        observer.complete();
      });
    }

    return new Observable(observer => {
      observer.next({ isValid: true });
      observer.complete();
    });
  }

  // Employee assignment helpers
  transferEmployeeToDepartment(employeeId: number, newDepartmentId: number): Observable<any> {
    // This would need to be handled by employee service or separate transfer endpoint
    return this.get<any>(`/employee-transfer/${employeeId}/${newDepartmentId}`);
  }

  removeEmployeeFromDepartment(employeeId: number): Observable<any> {
    // This would need backend support
    return this.put<any>(`/remove-employee/${employeeId}`, {});
  }

  // Head of department management
  removeHeadOfDepartment(departmentId: number): Observable<Department> {
    return this.put<Department>(`${this.endpoint}/${departmentId}/head`, { employeeId: null });
  }

  getEligibleHeadCandidates(departmentId: number): Observable<Employee[]> {
    // This would return employees who could be head of department
    return this.getDepartmentEmployees(departmentId);
  }

  // Reporting and export functions
  exportDepartmentData(departmentId?: number): Observable<Blob> {
    const url = departmentId 
      ? `${this.endpoint}/${departmentId}/export` 
      : `${this.endpoint}/export`;
    
    return this.get<Blob>(url);
  }

  generateDepartmentReport(departmentId: number, reportType: string = 'summary'): Observable<any> {
    return this.get<any>(`${this.endpoint}/${departmentId}/report?type=${reportType}`);
  }

  // Integration with other services
  getDepartmentCareerPaths(departmentId: number): Observable<any[]> {
    // This would integrate with career path service
    return this.get<any[]>(`${this.endpoint}/${departmentId}/career-paths`);
  }

  getDepartmentSkillRequirements(departmentId: number): Observable<any[]> {
    // This would integrate with skills service
    return this.get<any[]>(`${this.endpoint}/${departmentId}/skills`);
  }

  getDepartmentPositions(departmentId: number): Observable<Position[]> {
    // This would get all positions within a department
    return this.get<Position[]>(`${this.endpoint}/${departmentId}/positions`);
  }
}