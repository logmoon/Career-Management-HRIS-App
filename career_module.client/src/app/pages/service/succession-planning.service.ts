import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee } from './employee.service';
import { Position } from './position.service';
import { AuthService, User } from './auth.service';

export interface SuccessionPlan {
  id: number;
  positionId: number;
  status: string; // Active, Completed, OnHold
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
  reviewDate?: Date;
  notes?: string;
  position: Position;
  createdBy: User;
  candidates: SuccessionCandidate[];
}

export interface SuccessionCandidate {
  id: number;
  successionPlanId: number;
  employeeId: number;
  priority: number; // 1 = highest priority
  matchScore: number; // 0-100 compatibility score
  status: string; // UnderReview, Approved, InTraining, Ready, NotSuitable
  notes?: string;
  addedAt: Date;
  updatedAt: Date;
  successionPlan: SuccessionPlan;
  employee: Employee;
}

// DTO Interfaces
export interface CreateSuccessionPlanDto {
  positionId: number;
  reviewDate?: Date;
  notes?: string;
  autoDiscoverCandidates?: boolean;
}

export interface UpdateSuccessionPlanDto {
  status?: string;
  reviewDate?: Date;
  notes?: string;
}

export interface UpdateSuccessionCandidateDto {
  priority?: number;
  matchScore?: number;
  status?: string;
  notes?: string;
}

export interface AddSuccessionCandidateDto {
  employeeId: number;
  priority: number;
}

export interface RetirementPlanningDto {
  employeeId: number;
  expectedRetirementDate: Date;
}

// Analysis and Reporting Interfaces
export interface SuccessionCandidateAnalysis {
  employeeId: number;
  employee: Employee;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
}

export interface PositionSuccessionReadiness {
  position: Position;
  isKeyPosition: boolean;
  hasSuccessionPlan: boolean;
  readyCandidatesCount: number;
  totalCandidatesCount: number;
  riskLevel: string; // Low, Medium, High
}

export interface SuccessionReadinessReport {
  generatedDate: Date;
  departmentId?: number;
  positionReadiness: PositionSuccessionReadiness[];
  totalPositions: number;
  positionsWithPlans: number;
  keyPositionsAtRisk: number;
  overallReadinessPercentage: number;
}

export interface SuccessionRisk {
  riskType: string;
  position: Position;
  employee?: Employee;
  riskLevel: string;
  description: string;
  recommendedAction: string;
}

export interface SuccessionMetrics {
  calculatedDate: Date;
  totalSuccessionPlans: number;
  activeSuccessionPlans: number;
  totalCandidates: number;
  readyCandidates: number;
  keyPositionsWithPlans: number;
  keyPositionsCoverage: number;
  averageCandidateMatchScore: number;
}

export interface SuccessionRecommendation {
  type: string;
  priority: string;
  description: string;
  positionId?: number;
  successionPlanId?: number;
}

export interface SuccessionDashboard {
  metrics?: SuccessionMetrics;
  topRisks: SuccessionRisk[];
  recommendations: SuccessionRecommendation[];
}

@Injectable({
  providedIn: 'root'
})
export class SuccessionPlanningService extends BaseApiService {
  private readonly endpoint = '/SuccessionPlanning';

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  // Succession Plan CRUD Operations
  createSuccessionPlan(dto: CreateSuccessionPlanDto): Observable<SuccessionPlan> {
    return this.post<SuccessionPlan>(`${this.endpoint}/plans`, dto);
  }

  getSuccessionPlan(id: number): Observable<SuccessionPlan> {
    return this.get<SuccessionPlan>(`${this.endpoint}/plans/${id}`);
  }

  getAllSuccessionPlans(status?: string): Observable<SuccessionPlan[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    const url = params.toString() ? `${this.endpoint}/plans?${params.toString()}` : `${this.endpoint}/plans`;
    return this.get<SuccessionPlan[]>(url);
  }

  updateSuccessionPlan(id: number, dto: UpdateSuccessionPlanDto): Observable<SuccessionPlan> {
    return this.put<SuccessionPlan>(`${this.endpoint}/plans/${id}`, dto);
  }

  deleteSuccessionPlan(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/plans/${id}`);
  }

  getSuccessionPlansForPosition(positionId: number): Observable<SuccessionPlan[]> {
    return this.get<SuccessionPlan[]>(`${this.endpoint}/plans/position/${positionId}`);
  }

  // Smart Candidate Discovery
  getSmartCandidatesForPosition(positionId: number): Observable<SuccessionCandidate[]> {
    return this.get<SuccessionCandidate[]>(`${this.endpoint}/positions/${positionId}/smart-candidates`);
  }

  analyzePotentialCandidates(positionId: number): Observable<SuccessionCandidateAnalysis[]> {
    return this.get<SuccessionCandidateAnalysis[]>(`${this.endpoint}/positions/${positionId}/analyze-candidates`);
  }

  addCandidateToSuccessionPlan(successionPlanId: number, dto: AddSuccessionCandidateDto): Observable<SuccessionCandidate> {
    return this.post<SuccessionCandidate>(`${this.endpoint}/plans/${successionPlanId}/candidates`, dto);
  }

  // Candidate Management
  getCandidatesForPlan(successionPlanId: number): Observable<SuccessionCandidate[]> {
    return this.get<SuccessionCandidate[]>(`${this.endpoint}/plans/${successionPlanId}/candidates`);
  }

  updateCandidate(candidateId: number, dto: UpdateSuccessionCandidateDto): Observable<SuccessionCandidate> {
    return this.put<SuccessionCandidate>(`${this.endpoint}/candidates/${candidateId}`, dto);
  }

  removeCandidate(candidateId: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/candidates/${candidateId}`);
  }

  // Succession Analytics
  getSuccessionReadinessReport(departmentId?: number): Observable<SuccessionReadinessReport> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    const url = params.toString() 
      ? `${this.endpoint}/reports/readiness?${params.toString()}` 
      : `${this.endpoint}/reports/readiness`;
    
    return this.get<SuccessionReadinessReport>(url);
  }

  getSuccessionRisks(): Observable<SuccessionRisk[]> {
    return this.get<SuccessionRisk[]>(`${this.endpoint}/reports/risks`);
  }

  getSuccessionMetrics(): Observable<SuccessionMetrics> {
    return this.get<SuccessionMetrics>(`${this.endpoint}/reports/metrics`);
  }

  getSuccessionRecommendations(): Observable<SuccessionRecommendation[]> {
    return this.get<SuccessionRecommendation[]>(`${this.endpoint}/recommendations`);
  }

  // Integration Features
  processRetirementPlanning(dto: RetirementPlanningDto): Observable<{ message: string }> {
    return this.post<{ message: string }>(`${this.endpoint}/retirement-planning`, dto);
  }

  getSuccessionDashboard(): Observable<SuccessionDashboard> {
    return this.get<SuccessionDashboard>(`${this.endpoint}/dashboard`);
  }

  // Helper Methods for Common Operations
  getActiveSuccessionPlans(): Observable<SuccessionPlan[]> {
    return this.getAllSuccessionPlans('Active');
  }

  getCompletedSuccessionPlans(): Observable<SuccessionPlan[]> {
    return this.getAllSuccessionPlans('Completed');
  }

  getOnHoldSuccessionPlans(): Observable<SuccessionPlan[]> {
    return this.getAllSuccessionPlans('OnHold');
  }

  // Candidate Status Management
  getCandidatesByStatus(status: string): Observable<SuccessionCandidate[]> {
    // This would need backend support for filtering by status across all plans
    return this.get<SuccessionCandidate[]>(`${this.endpoint}/candidates/status/${status}`);
  }

  getReadyCandidates(): Observable<SuccessionCandidate[]> {
    return this.getCandidatesByStatus('Ready');
  }

  getCandidatesInTraining(): Observable<SuccessionCandidate[]> {
    return this.getCandidatesByStatus('InTraining');
  }

  getCandidatesUnderReview(): Observable<SuccessionCandidate[]> {
    return this.getCandidatesByStatus('UnderReview');
  }

  // Bulk Operations
  bulkUpdateCandidateStatus(candidateIds: number[], status: string): Observable<{ updated: number; message: string }> {
    return this.post<{ updated: number; message: string }>(`${this.endpoint}/candidates/bulk-update-status`, {
      candidateIds,
      status
    });
  }

  bulkAddCandidates(successionPlanId: number, candidates: AddSuccessionCandidateDto[]): Observable<SuccessionCandidate[]> {
    return this.post<SuccessionCandidate[]>(`${this.endpoint}/plans/${successionPlanId}/candidates/bulk`, {
      candidates
    });
  }

  // Advanced Analytics
  getPositionRiskAnalysis(positionId: number): Observable<{
    riskLevel: string;
    factors: string[];
    recommendations: string[];
    timeline: string;
  }> {
    return this.get<any>(`${this.endpoint}/positions/${positionId}/risk-analysis`);
  }

  getCandidateReadinessTimeline(candidateId: number): Observable<{
    currentReadiness: number;
    projectedReadiness: { months: number; readiness: number }[];
    recommendedActions: string[];
  }> {
    return this.get<any>(`${this.endpoint}/candidates/${candidateId}/readiness-timeline`);
  }

  getDepartmentSuccessionCoverage(departmentId: number): Observable<{
    totalPositions: number;
    coveredPositions: number;
    coveragePercentage: number;
    keyPositionsCovered: number;
    gaps: string[];
  }> {
    return this.get<any>(`${this.endpoint}/departments/${departmentId}/succession-coverage`);
  }

  // Search and Discovery
  searchSuccessionPlans(query: string, filters?: {
    status?: string;
    departmentId?: number;
    positionLevel?: string;
  }): Observable<SuccessionPlan[]> {
    let params = new HttpParams().set('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.get<SuccessionPlan[]>(`${this.endpoint}/search?${params.toString()}`);
  }

  findCandidatesForPosition(positionId: number, filters?: {
    minScore?: number;
    department?: number;
    experience?: string;
  }): Observable<SuccessionCandidateAnalysis[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }

    const url = params.toString() 
      ? `${this.endpoint}/positions/${positionId}/find-candidates?${params.toString()}`
      : `${this.endpoint}/positions/${positionId}/find-candidates`;
    
    return this.get<SuccessionCandidateAnalysis[]>(url);
  }

  // Reporting and Export
  exportSuccessionData(format: 'xlsx' | 'csv' | 'pdf' = 'xlsx', departmentId?: number): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    return this.get<Blob>(`${this.endpoint}/export?${params.toString()}`);
  }

  generateSuccessionReport(type: 'readiness' | 'risks' | 'gaps' | 'comprehensive', departmentId?: number): Observable<any> {
    let params = new HttpParams().set('type', type);
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    return this.get<any>(`${this.endpoint}/reports/generate?${params.toString()}`);
  }

  // Validation Helpers
  validateSuccessionPlan(dto: CreateSuccessionPlanDto): Observable<{ isValid: boolean; errors: string[] }> {
    return this.post<{ isValid: boolean; errors: string[] }>(`${this.endpoint}/validate-plan`, dto);
  }

  validateCandidate(employeeId: number, positionId: number): Observable<{
    isEligible: boolean;
    score: number;
    qualifications: string[];
    gaps: string[];
  }> {
    return this.get<any>(`${this.endpoint}/validate-candidate/${employeeId}/${positionId}`);
  }

  // Notification and Alert Helpers
  getUpcomingReviews(): Observable<SuccessionPlan[]> {
    return this.get<SuccessionPlan[]>(`${this.endpoint}/upcoming-reviews`);
  }

  getOverdueReviews(): Observable<SuccessionPlan[]> {
    return this.get<SuccessionPlan[]>(`${this.endpoint}/overdue-reviews`);
  }

  getHighRiskPositions(): Observable<Position[]> {
    return this.get<Position[]>(`${this.endpoint}/high-risk-positions`);
  }

  // Integration with Other Services
  syncWithPerformanceReviews(): Observable<{ synced: number; message: string }> {
    return this.post<{ synced: number; message: string }>(`${this.endpoint}/sync-performance`, {});
  }

  syncWithCareerPlanning(): Observable<{ synced: number; message: string }> {
    return this.post<{ synced: number; message: string }>(`${this.endpoint}/sync-career-planning`, {});
  }
}