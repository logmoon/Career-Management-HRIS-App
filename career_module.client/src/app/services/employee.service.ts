import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  EmployeeDto, 
  EmployeeDetailDto, 
  CreateEmployeeDto, 
  UpdateEmployeeDto,
  EmployeeFilters,
  AddEmployeeSkillDto
} from '../models/base.models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = '/api/Employees';

  constructor(private http: HttpClient) {}

  getEmployees(filters?: EmployeeFilters): Observable<EmployeeDto[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.department) params = params.set('department', filters.department);
      if (filters.managerId) params = params.set('managerId', filters.managerId.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    }

    return this.http.get<EmployeeDto[]>(this.apiUrl, { params });
  }

  getEmployee(id: number): Observable<EmployeeDetailDto> {
    return this.http.get<EmployeeDetailDto>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employee: CreateEmployeeDto): Observable<EmployeeDto> {
    return this.http.post<EmployeeDto>(this.apiUrl, employee);
  }

  updateEmployee(id: number, employee: UpdateEmployeeDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addEmployeeSkill(employeeId: number, skill: AddEmployeeSkillDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${employeeId}/skills`, skill);
  }

  removeEmployeeSkill(employeeId: number, skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${employeeId}/skills/${skillId}`);
  }
}