import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface Employee {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  hireDate: Date;
  managerId?: number;
  currentPositionId?: number;
  departmentId: number;
  salary?: number;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  email: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  department: {
    id: number;
    name: string;
    description: string;
  };
  currentPosition?: {
    id: number;
    title: string;
    description: string;
  };
  manager?: Employee;
  directReports: Employee[];
  employeeSkills?: any[];
  employeeExperiences?: any[];
  employeeEducations?: any[];
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  salary?: number;
  hireDate?: Date;
}

export interface ChangeDepartmentDto {
  newDepartmentId: number;
}

export interface ChangeManagerDto {
  newManagerId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService extends BaseApiService {
  
  getAllEmployees(department?: string, role?: string, page = 1, pageSize = 50): Observable<Employee[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (department) params = params.set('department', department);
    if (role) params = params.set('role', role);
    return this.get<Employee[]>(`/employees?${params.toString()}`);
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.get<Employee>(`/employees/${id}`);
  }

  getMyProfile(): Observable<Employee> {
    return this.get<Employee>('/employees/me');
  }

  updateEmployee(id: number, dto: UpdateEmployeeDto): Observable<Employee> {
    return this.put<Employee>(`/employees/${id}`, dto);
  }

  changeDepartment(id: number, dto: ChangeDepartmentDto): Observable<Employee> {
    return this.put<Employee>(`/employees/${id}/department`, dto);
  }

  changeManager(id: number, dto: ChangeManagerDto): Observable<Employee> {
    return this.put<Employee>(`/employees/${id}/manager`, dto);
  }

  getDirectReports(id: number): Observable<Employee[]> {
    return this.get<Employee[]>(`/employees/${id}/direct-reports`);
  }

  getOrganizationChart(): Observable<Employee[]> {
    return this.get<Employee[]>('/employees/org-chart');
  }

  searchEmployees(searchTerm: string): Observable<Employee[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.get<Employee[]>(`/employees/search?${params.toString()}`);
  }
}