// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://localhost:7049/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // Employee endpoints
  getEmployees(params?: { department?: string; role?: string; page?: number; pageSize?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/Employees`, { headers: this.getHeaders(), params: httpParams });
  }

  getEmployee(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Employees/${id}`, { headers: this.getHeaders() });
  }

  getCurrentEmployee(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Employees/me`, { headers: this.getHeaders() });
  }

  updateEmployee(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/Employees/${id}`, data, { headers: this.getHeaders() });
  }

  searchEmployees(searchTerm: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/Employees/search?searchTerm=${searchTerm}`, { headers: this.getHeaders() });
  }

  getOrgChart(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Employees/org-chart`, { headers: this.getHeaders() });
  }

  getDirectReports(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Employees/${id}/direct-reports`, { headers: this.getHeaders() });
  }

  changeDepartment(id: number, departmentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Employees/${id}/department`, { newDepartmentId: departmentId }, { headers: this.getHeaders() });
  }

  changeManager(id: number, managerId: number | null): Observable<any> {
    return this.http.put(`${this.apiUrl}/Employees/${id}/manager`, { newManagerId: managerId }, { headers: this.getHeaders() });
  }

  // Department endpoints
  getDepartments(includeInactive = false): Observable<any> {
    return this.http.get(`${this.apiUrl}/Departments?includeInactive=${includeInactive}`, { headers: this.getHeaders() });
  }

  getDepartment(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Departments/${id}`, { headers: this.getHeaders() });
  }

  createDepartment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Departments`, data, { headers: this.getHeaders() });
  }

  updateDepartment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/Departments/${id}`, data, { headers: this.getHeaders() });
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Departments/${id}`, { headers: this.getHeaders() });
  }

  getDepartmentEmployees(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Departments/${id}/employees`, { headers: this.getHeaders() });
  }

  assignDepartmentHead(id: number, employeeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Departments/${id}/head`, { employeeId }, { headers: this.getHeaders() });
  }

  getDepartmentsWithStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Departments/with-stats`, { headers: this.getHeaders() });
  }

  // Position endpoints
  getPositions(includeInactive = false, departmentId?: number): Observable<any> {
    let params = new HttpParams().set('includeInactive', includeInactive.toString());
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    return this.http.get(`${this.apiUrl}/Positions`, { headers: this.getHeaders(), params });
  }

  getPosition(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Positions/${id}`, { headers: this.getHeaders() });
  }

  createPosition(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Positions`, data, { headers: this.getHeaders() });
  }

  updatePosition(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/Positions/${id}`, data, { headers: this.getHeaders() });
  }

  deletePosition(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Positions/${id}`, { headers: this.getHeaders() });
  }

  getPositionEmployees(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Positions/${id}/employees`, { headers: this.getHeaders() });
  }

  getVacantKeyPositions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Positions/vacant-key-positions`, { headers: this.getHeaders() });
  }

  getPositionsByDepartment(departmentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Positions/by-department/${departmentId}`, { headers: this.getHeaders() });
  }

  // Skills endpoints
  getSkills(includeInactive = false, category?: string): Observable<any> {
    let params = new HttpParams().set('includeInactive', includeInactive.toString());
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get(`${this.apiUrl}/Skills`, { headers: this.getHeaders(), params });
  }

  getSkill(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Skills/${id}`, { headers: this.getHeaders() });
  }

  createSkill(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Skills`, data, { headers: this.getHeaders() });
  }

  updateSkill(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/Skills/${id}`, data, { headers: this.getHeaders() });
  }

  deleteSkill(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Skills/${id}`, { headers: this.getHeaders() });
  }

  getSkillCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Skills/categories`, { headers: this.getHeaders() });
  }

  getEmployeeSkills(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Skills/employee/${employeeId}`, { headers: this.getHeaders() });
  }

  addEmployeeSkill(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Skills/employee`, data, { headers: this.getHeaders() });
  }

  updateEmployeeSkill(employeeId: number, skillId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/Skills/employee/${employeeId}/skill/${skillId}`, data, { headers: this.getHeaders() });
  }

  deleteEmployeeSkill(employeeId: number, skillId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Skills/employee/${employeeId}/skill/${skillId}`, { headers: this.getHeaders() });
  }

  getSkillGapAnalysis(employeeId: number, targetPositionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Skills/employee/${employeeId}/gap-analysis/${targetPositionId}`, { headers: this.getHeaders() });
  }

  getProficiencyLevels(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Skills/proficiency-levels`, { headers: this.getHeaders() });
  }

  // Performance Review endpoints
  getPerformanceReviews(params?: { status?: string; employeeId?: number; reviewerId?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/PerformanceReview`, { headers: this.getHeaders(), params: httpParams });
  }

  getPerformanceReview(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/PerformanceReview/${id}`, { headers: this.getHeaders() });
  }

  createPerformanceReview(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/PerformanceReview`, data, { headers: this.getHeaders() });
  }

  updatePerformanceReview(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/PerformanceReview/${id}`, data, { headers: this.getHeaders() });
  }

  deletePerformanceReview(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/PerformanceReview/${id}`, { headers: this.getHeaders() });
  }

  submitPerformanceReview(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/PerformanceReview/${id}/submit`, {}, { headers: this.getHeaders() });
  }

  approvePerformanceReview(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/PerformanceReview/${id}/approve`, {}, { headers: this.getHeaders() });
  }

  getEmployeePerformanceHistory(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/PerformanceReview/employee/${employeeId}/history`, { headers: this.getHeaders() });
  }

  getPendingReviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/PerformanceReview/pending`, { headers: this.getHeaders() });
  }

  getEmployeeAverageRating(employeeId: number, lastNReviews?: number): Observable<any> {
    let params = new HttpParams();
    if (lastNReviews) {
      params = params.set('lastNReviews', lastNReviews.toString());
    }
    return this.http.get(`${this.apiUrl}/PerformanceReview/employee/${employeeId}/average-rating`, { headers: this.getHeaders(), params });
  }

  getEmployeePerformanceAnalytics(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/PerformanceReview/employee/${employeeId}/analytics`, { headers: this.getHeaders() });
  }

  // Career Path endpoints
  getCareerPaths(includeInactive = false): Observable<any> {
    return this.http.get(`${this.apiUrl}/CareerPath?includeInactive=${includeInactive}`, { headers: this.getHeaders() });
  }

  getCareerPath(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/CareerPath/${id}`, { headers: this.getHeaders() });
  }

  createCareerPath(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/CareerPath`, data, { headers: this.getHeaders() });
  }

  updateCareerPath(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/CareerPath/${id}`, data, { headers: this.getHeaders() });
  }

  deleteCareerPath(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/CareerPath/${id}`, { headers: this.getHeaders() });
  }

  getCareerPathRecommendations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/CareerPath/recommendations`, { headers: this.getHeaders() });
  }

  getEmployeeCareerPathRecommendations(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/CareerPath/employee/${employeeId}/recommendations`, { headers: this.getHeaders() });
  }

  getCareerPathsFromPosition(positionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/CareerPath/from-position/${positionId}`, { headers: this.getHeaders() });
  }

  getCareerPathsToPosition(positionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/CareerPath/to-position/${positionId}`, { headers: this.getHeaders() });
  }

  analyzeCareerPath(careerPathId: number, employeeId?: number): Observable<any> {
    const url = employeeId 
      ? `${this.apiUrl}/CareerPath/${careerPathId}/analyze/${employeeId}`
      : `${this.apiUrl}/CareerPath/${careerPathId}/analyze`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getCareerPathSkillGaps(careerPathId: number, employeeId?: number): Observable<any> {
    const url = employeeId 
      ? `${this.apiUrl}/CareerPath/${careerPathId}/skill-gaps/${employeeId}`
      : `${this.apiUrl}/CareerPath/${careerPathId}/skill-gaps`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getCareerRoadmap(targetPositionId: number, employeeId?: number): Observable<any> {
    const url = employeeId 
      ? `${this.apiUrl}/CareerPath/roadmap/${employeeId}/to-position/${targetPositionId}`
      : `${this.apiUrl}/CareerPath/roadmap/to-position/${targetPositionId}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  // Employee Requests endpoints
  createRequest(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/EmployeeRequests`, data, { headers: this.getHeaders() });
  }

  getRequest(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/EmployeeRequests/${id}`, { headers: this.getHeaders() });
  }

  getMyRequests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/EmployeeRequests/my-requests`, { headers: this.getHeaders() });
  }

  getPendingRequests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/EmployeeRequests/pending`, { headers: this.getHeaders() });
  }

  approveRequest(id: number, notes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/EmployeeRequests/${id}/approve`, { notes }, { headers: this.getHeaders() });
  }

  rejectRequest(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/EmployeeRequests/${id}/reject`, { reason }, { headers: this.getHeaders() });
  }

  getRequestTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/EmployeeRequests/types`, { headers: this.getHeaders() });
  }

  // Succession Planning endpoints
  getSuccessionPlans(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get(`${this.apiUrl}/SuccessionPlanning/plans`, { headers: this.getHeaders(), params });
  }

  getSuccessionPlan(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/SuccessionPlanning/plans/${id}`, { headers: this.getHeaders() });
  }

  createSuccessionPlan(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/SuccessionPlanning/plans`, data, { headers: this.getHeaders() });
  }

  updateSuccessionPlan(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/SuccessionPlanning/plans/${id}`, data, { headers: this.getHeaders() });
  }

  deleteSuccessionPlan(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/SuccessionPlanning/plans/${id}`, { headers: this.getHeaders() });
  }

  getSuccessionPlanByPosition(positionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/SuccessionPlanning/plans/position/${positionId}`, { headers: this.getHeaders() });
  }

  getSmartCandidates(positionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/SuccessionPlanning/positions/${positionId}/smart-candidates`, { headers: this.getHeaders() });
  }

  analyzeCandidates(positionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/SuccessionPlanning/positions/${positionId}/analyze-candidates`, { headers: this.getHeaders() });
  }

  addSuccessionCandidate(planId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/SuccessionPlanning/plans/${planId}/candidates`, data, { headers: this.getHeaders() });
  }

  getSuccessionCandidates(planId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/SuccessionPlanning/plans/${planId}/candidates`, { headers: this.getHeaders() });
  }

  updateSuccessionCandidate(candidateId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/SuccessionPlanning/candidates/${candidateId}`, data, { headers: this.getHeaders() });
  }

  deleteSuccessionCandidate(candidateId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/SuccessionPlanning/candidates/${candidateId}`, { headers: this.getHeaders() });
  }

  getSuccessionDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/SuccessionPlanning/dashboard`, { headers: this.getHeaders() });
  }

  // Notifications endpoints
  getMyNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Notifications/me`, { headers: this.getHeaders() });
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Notifications/${id}/mark-read`, {}, { headers: this.getHeaders() });
  }
}