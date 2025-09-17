import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee } from './employee.service';
import { Skill, SkillGap } from './skills.service';
import { CareerPathRecommendation } from './career-path.service';

// Core Interfaces
export interface QuickInsight {
  type: string;
  title: string;
  message: string;
  priority: string;
  actionUrl: string;
}

export interface SmartRecommendation {
  type: string;
  title: string;
  description: string;
  priority: number;
  actionUrl: string;
}

export interface CareerOpportunity {
  type: string;
  title: string;
  department: string;
  matchScore: number;
  description: string;
  recommendedAction: string;
  priority: string;
  relatedId: number;
}

export interface SkillDevelopmentRecommendation {
  skill: Skill;
  currentLevel: number;
  recommendedLevel: number;
  gap: number;
  priority: string;
  reason: string;
  suggestedActions: string[];
}

export interface TalentRisk {
  employee: Employee;
  riskType: string;
  riskLevel: string;
  description: string;
  impact: string;
  recommendedAction: string;
}

export interface AttritionRisk {
  employee: Employee;
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
  recommendedActions: string[];
}

export interface PromotionReadinessScore {
  employeeId: number;
  readinessScore: number; // 0-100
  readinessLevel: string; // "Ready", "Near Ready", "Developing", "Not Ready"
  strengths: string[];
  areasForDevelopment: string[];
  timeToReadiness: string;
  recommendedActions: string[];
  assessmentDate: Date;
}

export interface CareerPerformanceInsight {
  employeeId: number;
  analysisDate: Date;
  performanceTrend: string; // "Improving", "Stable", "Declining"
  averageRating: number;
  ratingTrend: number; // positive or negative change
  keyStrengths: string[];
  developmentAreas: string[];
  careerTrajectory: string;
  insights: string[];
}

export interface TeamDevelopmentOpportunity {
    type: string;
    description: string;
    benefits: string;
}


export interface TeamDynamicsInsight {
  managerId: number;
  teamSize: number;
  analysisDate: Date;
  averageTeamPerformance: number;
  performanceVariation: number;
  highPerformerCount: number;
  lowPerformerCount: number;
  developmentOpportunities: TeamDevelopmentOpportunity[];
  insights: string[];
}

export interface QuickStats {
  totalEmployees: number;
  activeCareerPaths: number;
  pendingRequests: number;
  successionPlansActive: number;
  myDirectReports: number;
  myPendingRequests: number;
  careerOpportunities: number;
}

export interface CareerIntelligenceReport {
  employeeId: number;
  employee: Employee;
  generatedDate: Date;
  careerPathRecommendations: CareerPathRecommendation[];
  skillDevelopmentRecommendations: SkillDevelopmentRecommendation[];
  performanceInsight: CareerPerformanceInsight;
  promotionReadiness: PromotionReadinessScore;
  careerOpportunities: CareerOpportunity[];
  smartInsights: string[];
}

export interface DepartmentIntelligence {
  departmentId: number;
  departmentName: string;
  analysisDate: Date;
  totalEmployees: number;
  averagePerformance: number;
  skillsOverview: any[];
  talentRisks: TalentRisk[];
  careerOpportunities: CareerOpportunity[];
  insights: string[];
  recommendations: string[];
}

export interface SkillStatistics {
  skill: Skill;
  employeeCount: number;
  averageProficiency: number;
  highProficiencyCount: number;
}

export interface SkillsIntelligence {
  analysisDate: Date;
  departmentId?: number;
  mostCommonSkills: SkillStatistics[];
  skillGaps: SkillGap[];
  emergingSkills: SkillStatistics[];
  recommendations: SkillDevelopmentRecommendation[];
}

export interface OrganizationIntelligenceReport {
  generatedDate: Date;
  talentRisks: TalentRisk[];
  attritionRisks: AttritionRisk[];
  departmentInsights: DepartmentIntelligence[];
  organizationSkillGaps: any[];
  careerPathUtilization: any;
  performanceTrends: any;
  strategicRecommendations: string[];
}

export interface IntelligentDashboard {
  generatedDate: Date;
  userRole: string;
  personalInsights: CareerIntelligenceReport | null;
  careerOpportunities: CareerOpportunity[];
  skillRecommendations: SkillDevelopmentRecommendation[];
  organizationInsights: OrganizationIntelligenceReport | null;
  talentRisks: TalentRisk[];
  attritionRisks: AttritionRisk[];
  teamInsights: TeamDynamicsInsight | null;
  smartRecommendations: SmartRecommendation[];
  quickStats: QuickStats | null;
}

export interface IntelligenceSearchResult {
  type: string;
  title: string;
  summary: string;
  url: string;
  relevanceScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class IntelligenceService extends BaseApiService {
  private readonly endpoint = '/intelligence';

  // Smart Dashboard - The New Central Hub
  getDashboard(): Observable<IntelligentDashboard> {
    return this.get<IntelligentDashboard>(`${this.endpoint}/dashboard`);
  }

  getSmartRecommendations(): Observable<SmartRecommendation[]> {
    return this.get<SmartRecommendation[]>(`${this.endpoint}/recommendations`);
  }

  // Employee Intelligence & Career Insights
  getEmployeeCareerIntelligence(employeeId: number): Observable<CareerIntelligenceReport> {
    return this.get<CareerIntelligenceReport>(`${this.endpoint}/employee/${employeeId}/career-intelligence`);
  }

  getMyCareerIntelligence(): Observable<CareerIntelligenceReport> {
    return this.get<CareerIntelligenceReport>(`${this.endpoint}/my-career-intelligence`);
  }

  getCareerOpportunities(employeeId: number): Observable<CareerOpportunity[]> {
    return this.get<CareerOpportunity[]>(`${this.endpoint}/employee/${employeeId}/opportunities`);
  }

  getSkillDevelopmentRecommendations(employeeId: number): Observable<SkillDevelopmentRecommendation[]> {
    return this.get<SkillDevelopmentRecommendation[]>(`${this.endpoint}/employee/${employeeId}/skill-recommendations`);
  }

  getPromotionReadiness(employeeId: number): Observable<PromotionReadinessScore> {
    return this.get<PromotionReadinessScore>(`${this.endpoint}/employee/${employeeId}/promotion-readiness`);
  }

  getPerformanceInsights(employeeId: number): Observable<CareerPerformanceInsight> {
    return this.get<CareerPerformanceInsight>(`${this.endpoint}/employee/${employeeId}/performance-insights`);
  }

  // Organizational Intelligence & Analytics
  getOrganizationIntelligence(): Observable<OrganizationIntelligenceReport> {
    return this.get<OrganizationIntelligenceReport>(`${this.endpoint}/organization`);
  }

  getDepartmentIntelligence(departmentId: number): Observable<DepartmentIntelligence> {
    return this.get<DepartmentIntelligence>(`${this.endpoint}/department/${departmentId}`);
  }

  getSkillsIntelligence(departmentId?: number): Observable<SkillsIntelligence> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    const url = params.toString() ? `${this.endpoint}/skills?${params.toString()}` : `${this.endpoint}/skills`;
    return this.get<SkillsIntelligence>(url);
  }

  getTalentRisks(): Observable<TalentRisk[]> {
    return this.get<TalentRisk[]>(`${this.endpoint}/talent-risks`);
  }

  getAttritionRisks(): Observable<AttritionRisk[]> {
    return this.get<AttritionRisk[]>(`${this.endpoint}/attrition-risks`);
  }

  // Team Intelligence (for Managers)
  getMyTeamDynamics(): Observable<TeamDynamicsInsight> {
    return this.get<TeamDynamicsInsight>(`${this.endpoint}/my-team`);
  }

  getTeamDynamics(managerId: number): Observable<TeamDynamicsInsight> {
    return this.get<TeamDynamicsInsight>(`${this.endpoint}/team/${managerId}`);
  }

  // Integration & Event Processing
  processPerformanceReviewCompletion(reviewId: number): Observable<{ message: string; triggered_intelligence_update: boolean }> {
    return this.post<{ message: string; triggered_intelligence_update: boolean }>(
      `${this.endpoint}/process/performance-review/${reviewId}`, 
      {}
    );
  }

  processEmployeeRequestCompletion(requestId: number): Observable<{ message: string; triggered_intelligence_update: boolean }> {
    return this.post<{ message: string; triggered_intelligence_update: boolean }>(
      `${this.endpoint}/process/employee-request/${requestId}`, 
      {}
    );
  }

  // Quick Actions & Insights
  getQuickInsights(): Observable<QuickInsight[]> {
    return this.get<QuickInsight[]>(`${this.endpoint}/quick-insights`);
  }

  searchIntelligence(query: string, type?: string): Observable<IntelligenceSearchResult[]> {
    let params = new HttpParams().set('query', query);
    if (type) {
      params = params.set('type', type);
    }

    return this.get<IntelligenceSearchResult[]>(`${this.endpoint}/search?${params.toString()}`);
  }

  // Helper methods for common operations
  getMyCareerOpportunities(): Observable<CareerOpportunity[]> {
    // This would need to get current employee ID first, simplified for now
    return this.get<CareerOpportunity[]>(`${this.endpoint}/my-career-intelligence`);
  }

  getMySkillRecommendations(): Observable<SkillDevelopmentRecommendation[]> {
    // This would need to get current employee ID first, simplified for now  
    return this.get<SkillDevelopmentRecommendation[]>(`${this.endpoint}/my-career-intelligence`);
  }

  // Dashboard specific methods for different user roles
  getHRDashboard(): Observable<IntelligentDashboard> {
    return this.getDashboard();
  }

  getManagerDashboard(): Observable<IntelligentDashboard> {
    return this.getDashboard();
  }

  getEmployeeDashboard(): Observable<IntelligentDashboard> {
    return this.getDashboard();
  }

  // Notification/Alert related methods
  getActionableInsights(): Observable<QuickInsight[]> {
    return this.getQuickInsights();
  }

  getHighPriorityRecommendations(): Observable<SmartRecommendation[]> {
    return this.getSmartRecommendations();
  }

  // Analytics aggregation methods
  getEmployeeAnalyticsSummary(employeeId: number): Observable<any> {
    // Combines multiple intelligence endpoints into one call
    return this.getEmployeeCareerIntelligence(employeeId);
  }

  getOrganizationalHealthScore(): Observable<any> {
    // Could combine organization intelligence with talent risks
    return this.getOrganizationIntelligence();
  }

  // Search and discovery methods
  findCareerOpportunitiesForEmployee(employeeId: number): Observable<CareerOpportunity[]> {
    return this.getCareerOpportunities(employeeId);
  }

  findSkillGapsInDepartment(departmentId: number): Observable<SkillsIntelligence> {
    return this.getSkillsIntelligence(departmentId);
  }

  identifyTopTalentRisks(): Observable<TalentRisk[]> {
    return this.getTalentRisks();
  }
}