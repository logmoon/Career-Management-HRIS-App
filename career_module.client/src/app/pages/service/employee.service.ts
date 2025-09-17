import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { User } from './auth.service';
import { Department } from './department.service';
import { Position } from './position.service';

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
  user: User;
  department: Department;
  currentPosition?: Position;
  manager?: Employee;
  directReports: Employee[];
  employeeSkills?: any[];
  employeeExperiences?: EmployeeExperience[];
  employeeEducations?: EmployeeEducation[];
}

export interface EmployeeExperience {
  id: number;
  employeeId: number;
  jobTitle: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  createdAt: Date;
}

export interface EmployeeEducation {
  id: number;
  employeeId: number;
  degree: string;
  institution: string;
  graduationYear?: number;
  fieldOfStudy: string;
  createdAt: Date;
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

export interface CreateExperienceDto {
  jobTitle: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface UpdateExperienceDto {
  jobTitle?: string;
  company?: string;
  startDate?: Date;
  endDate?: Date;
  clearEndDate?: boolean;
  description?: string;
}

export interface CreateEducationDto {
  degree: string;
  institution: string;
  graduationYear?: number;
  fieldOfStudy?: string;
}

export interface UpdateEducationDto {
  degree?: string;
  institution?: string;
  graduationYear?: number;
  fieldOfStudy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService extends BaseApiService {
  // Employee Basic Operations
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

  // Employee Experience Operations
  getEmployeeExperiences(employeeId: number): Observable<EmployeeExperience[]> {
    return this.get<EmployeeExperience[]>(`/employees/${employeeId}/experiences`);
  }

  addEmployeeExperience(employeeId: number, dto: CreateExperienceDto): Observable<EmployeeExperience> {
    return this.post<EmployeeExperience>(`/employees/${employeeId}/experiences`, dto);
  }

  updateEmployeeExperience(experienceId: number, dto: UpdateExperienceDto): Observable<EmployeeExperience> {
    return this.put<EmployeeExperience>(`/employees/experiences/${experienceId}`, dto);
  }

  deleteEmployeeExperience(experienceId: number): Observable<void> {
    return this.delete<void>(`/employees/experiences/${experienceId}`);
  }

  // Employee Education Operations
  getEmployeeEducations(employeeId: number): Observable<EmployeeEducation[]> {
    return this.get<EmployeeEducation[]>(`/employees/${employeeId}/educations`);
  }

  addEmployeeEducation(employeeId: number, dto: CreateEducationDto): Observable<EmployeeEducation> {
    return this.post<EmployeeEducation>(`/employees/${employeeId}/educations`, dto);
  }

  updateEmployeeEducation(educationId: number, dto: UpdateEducationDto): Observable<EmployeeEducation> {
    return this.put<EmployeeEducation>(`/employees/educations/${educationId}`, dto);
  }

  deleteEmployeeEducation(educationId: number): Observable<void> {
    return this.delete<void>(`/employees/educations/${educationId}`);
  }
}