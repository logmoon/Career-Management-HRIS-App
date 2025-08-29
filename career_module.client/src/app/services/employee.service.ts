import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { 
  EmployeeDto, 
  EmployeeDetailDto, 
  CreateEmployeeDto, 
  UpdateEmployeeDto,
  EmployeeFilters,
  AddEmployeeSkillDto,
  PaginatedResponse
} from '../models/base.models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly API_EMPLOYEES_URL = 'https://localhost:7130/api/Employees';

  constructor(private http: HttpClient) {}

  getEmployees(filters?: EmployeeFilters): Observable<EmployeeDto[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.department) params = params.set('department', filters.department);
      if (filters.managerId) params = params.set('managerId', filters.managerId.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    }

    console.log('Fetching employees with params:', params.toString());

    return this.http.get<PaginatedResponse<EmployeeDto[]>>(this.API_EMPLOYEES_URL, { params })
    .pipe(
      map(response => response.data || [])
    );
 }

  getEmployee(id: number): Observable<EmployeeDetailDto> {
    return this.http.get<EmployeeDetailDto>(`${this.API_EMPLOYEES_URL}/${id}`);
  }

  createEmployee(employee: CreateEmployeeDto): Observable<EmployeeDto> {
    return this.http.post<EmployeeDto>(this.API_EMPLOYEES_URL, employee);
  }

  updateEmployee(id: number, employee: UpdateEmployeeDto): Observable<void> {
    return this.http.put<void>(`${this.API_EMPLOYEES_URL}/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_EMPLOYEES_URL}/${id}`);
  }

  addEmployeeSkill(employeeId: number, skill: AddEmployeeSkillDto): Observable<void> {
    return this.http.post<void>(`${this.API_EMPLOYEES_URL}/${employeeId}/skills`, skill);
  }

  removeEmployeeSkill(employeeId: number, skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_EMPLOYEES_URL}/${employeeId}/skills/${skillId}`);
  }
}