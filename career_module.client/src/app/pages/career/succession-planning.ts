import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { RatingModule } from 'primeng/rating';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { FluidModule } from 'primeng/fluid';
import { AccordionModule } from 'primeng/accordion';
import { AvatarModule } from 'primeng/avatar';
import { DataViewModule } from 'primeng/dataview';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { TimelineModule } from 'primeng/timeline';
import { KnobModule } from 'primeng/knob';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SplitterModule } from 'primeng/splitter';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

// Services
import { 
  SuccessionPlanningService, 
  SuccessionPlan, 
  SuccessionCandidate,
  SuccessionDashboard,
  SuccessionReadinessReport,
  SuccessionRisk,
  SuccessionCandidateAnalysis,
  CreateSuccessionPlanDto,
  AddSuccessionCandidateDto
} from '../service/succession-planning.service';
import { PositionService, Position } from '../service/position.service';
import { EmployeeService, Employee } from '../service/employee.service';
import { EmployeeRequestService } from '../service/employee-request.service';
import { AuthService } from '../service/auth.service';

interface SuccessionPlanWithAnalysis extends SuccessionPlan {
  candidateAnalyses?: SuccessionCandidateAnalysis[];
  smartCandidates?: SuccessionCandidate[];
  expanded?: boolean;
}

@Component({
  selector: 'app-succession-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    MessageModule,
    TagModule,
    BadgeModule,
    ChipModule,
    RatingModule,
    ProgressBarModule,
    TooltipModule,
    ConfirmDialogModule,
    PanelModule,
    DividerModule,
    TextareaModule,
    FluidModule,
    AccordionModule,
    AvatarModule,
    DataViewModule,
    ToggleButtonModule,
    CheckboxModule,
    MenuModule,
    TimelineModule,
    KnobModule,
    InputNumberModule,
    DatePickerModule,
    SplitterModule,
    OverlayBadgeModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <!-- Header -->
      <div class="bg-surface-0 dark:bg-surface-900 shadow-sm border-b border-surface-200 dark:border-surface-700 px-6 py-4 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Succession Planning</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Manage organizational continuity and leadership pipeline
            </p>
          </div>
          <div class="flex gap-2">
            <p-button 
              *ngIf="canCreatePlans()"
              label="Create Plan" 
              icon="pi pi-plus"
              (click)="showCreatePlanDialog = true"
              pTooltip="Create New Succession Plan">
            </p-button>
            <p-button 
              icon="pi pi-refresh" 
              severity="secondary" 
              [outlined]="true"
              (click)="refreshData()"
              [loading]="isLoading()"
              pTooltip="Refresh Data">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading() && !dashboardData()" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading succession planning data...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage()" class="px-6 mb-6">
        <p-message severity="error" [text]="errorMessage()" styleClass="w-full">
          <ng-template pTemplate="content">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ errorMessage() }}</span>
              <p-button 
                label="Retry" 
                size="small" 
                severity="danger" 
                [outlined]="true"
                (click)="loadData()"
                class="ml-auto">
              </p-button>
            </div>
          </ng-template>
        </p-message>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading() || dashboardData()" class="px-6">
        <p-fluid>
          <p-tabs value="dashboard">
            <p-tablist>
              <p-tab value="dashboard">Dashboard</p-tab>
              <p-tab value="plans">Succession Plans</p-tab>
              <p-tab value="readiness">Readiness Assessment</p-tab>
            </p-tablist>

            <!-- Dashboard Tab -->
            <p-tabpanel value="dashboard" header="Dashboard" leftIcon="pi pi-chart-bar">
              <div *ngIf="dashboardData()" class="space-y-6">
                <!-- Key Metrics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <!-- Total Plans -->
                  <p-card styleClass="text-center">
                    <div class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <i class="pi pi-sitemap text-2xl"></i>
                    </div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Total Plans</h6>
                    <p class="text-2xl font-bold text-blue-500 m-0">
                      {{ dashboardData()?.metrics?.totalSuccessionPlans || 0 }}
                    </p>
                    <small class="text-surface-500 dark:text-surface-400">
                      {{ dashboardData()?.metrics?.activeSuccessionPlans || 0 }} active
                    </small>
                  </p-card>

                  <!-- Ready Candidates -->
                  <p-card styleClass="text-center">
                    <div class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <i class="pi pi-users text-2xl"></i>
                    </div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Ready Candidates</h6>
                    <p class="text-2xl font-bold text-green-500 m-0">
                      {{ dashboardData()?.metrics?.readyCandidates || 0 }}
                    </p>
                    <small class="text-surface-500 dark:text-surface-400">
                      of {{ dashboardData()?.metrics?.totalCandidates || 0 }} total
                    </small>
                  </p-card>

                  <!-- Key Position Coverage -->
                  <p-card styleClass="text-center">
                    <div class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <i class="pi pi-shield text-2xl"></i>
                    </div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Key Position Coverage</h6>
                    <p class="text-2xl font-bold text-purple-500 m-0">
                      {{ dashboardData()?.metrics?.keyPositionsCoverage || 0 }}%
                    </p>
                    <small class="text-surface-500 dark:text-surface-400">
                      {{ dashboardData()?.metrics?.keyPositionsWithPlans || 0 }} covered
                    </small>
                  </p-card>

                  <!-- Average Match Score -->
                  <p-card styleClass="text-center">
                    <div class="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <i class="pi pi-star text-2xl"></i>
                    </div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Avg Match Score</h6>
                    <p class="text-2xl font-bold text-orange-500 m-0">
                      {{ dashboardData()?.metrics?.averageCandidateMatchScore || 0 }}%
                    </p>
                    <small class="text-surface-500 dark:text-surface-400">candidate fit</small>
                  </p-card>
                </div>

                <!-- Risk Indicators & Recommendations -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Top Risks -->
                  <p-card header="Top Succession Risks" *ngIf="dashboardData()?.topRisks?.length">
                    <div class="space-y-4">
                      <div *ngFor="let risk of dashboardData()?.topRisks?.slice(0, 5); trackBy: trackByRiskId" 
                           class="flex items-start gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                        <div class="flex-shrink-0">
                          <div 
                            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            [ngClass]="{
                              'bg-red-500': risk.riskLevel === 'High',
                              'bg-orange-500': risk.riskLevel === 'Medium',
                              'bg-yellow-500': risk.riskLevel === 'Low'
                            }">
                            !
                          </div>
                        </div>
                        <div class="flex-1">
                          <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                            {{ risk.position.title }}
                          </h6>
                          <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                            {{ risk.description }}
                          </p>
                          <div class="flex items-center justify-between">
                            <p-tag 
                              [value]="risk.riskLevel + ' Risk'" 
                              [severity]="getRiskSeverity(risk.riskLevel)">
                            </p-tag>
                            <p-chip 
                              [label]="risk.position.department?.name || 'Unknown Dept'" 
                              styleClass="text-xs">
                            </p-chip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </p-card>

                  <!-- Recommendations -->
                  <p-card header="Recommendations" *ngIf="dashboardData()?.recommendations?.length">
                    <div class="space-y-4">
                      <div *ngFor="let rec of dashboardData()?.recommendations?.slice(0, 5); trackBy: trackByRecommendationId" 
                           class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <i class="pi pi-lightbulb text-blue-500 mt-0.5"></i>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-2">
                            <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0">
                              {{ rec.type }}
                            </h6>
                            <p-tag 
                              [value]="rec.priority" 
                              [severity]="getPrioritySeverity(rec.priority)">
                            </p-tag>
                          </div>
                          <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                            {{ rec.description }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </p-card>
                </div>
              </div>

              <!-- No Dashboard Data -->
              <div *ngIf="!dashboardData() && !isLoading()" class="text-center py-12">
                <i class="pi pi-chart-bar text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  No Dashboard Data
                </h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  Dashboard data is not available at this time
                </p>
              </div>
            </p-tabpanel>

            <!-- Succession Plans Tab -->
            <p-tabpanel value="plans" header="Plans" leftIcon="pi pi-sitemap">
              <!-- Filters -->
              <div class="mb-6">
                <div class="flex flex-wrap gap-4 items-center">
                  <div class="flex-1 min-w-0">
                    <span class="p-input-icon-left w-full">
                      <input 
                        pInputText 
                        type="text" 
                        [(ngModel)]="plansSearchTerm"
                        (input)="filterPlans()"
                        placeholder="Search succession plans..." 
                        class="w-full">
                    </span>
                  </div>
                  <p-select
                    [(ngModel)]="selectedPlanStatus"
                    [options]="planStatusOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="All Statuses"
                    (onChange)="filterPlans()"
                    [showClear]="true"
                    class="min-w-48">
                  </p-select>
                  <p-select
                    [(ngModel)]="selectedDepartment"
                    [options]="departmentOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="All Departments"
                    (onChange)="filterPlans()"
                    [showClear]="true"
                    class="min-w-48">
                  </p-select>
                  <p-toggleButton
                    [(ngModel)]="showKeyPositionsOnly"
                    onLabel="All Positions"
                    offLabel="Key Positions Only"
                    onIcon="pi pi-globe"
                    offIcon="pi pi-shield"
                    (onChange)="filterPlans()">
                  </p-toggleButton>
                </div>
              </div>

              <!-- Succession Plans List -->
              <div *ngIf="filteredPlans().length" class="space-y-4">
                <div *ngFor="let plan of filteredPlans(); trackBy: trackByPlanId">
                  <p-card styleClass="relative">
                    <!-- Plan Header -->
                    <ng-template pTemplate="header">
                      <div class="p-4 pb-2">
                        <div class="flex justify-between items-start">
                          <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                              <h5 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
                                {{ plan.position.title }}
                              </h5>
                              <p-tag 
                                *ngIf="plan.position.isKeyPosition"
                                value="Key Position" 
                                severity="warning"
                                icon="pi pi-shield"
                                styleClass="text-xs">
                              </p-tag>
                            </div>
                            <div class="flex items-center gap-4 mb-2">
                              <p-chip 
                                [label]="plan.position.department?.name || 'Unknown Dept'" 
                                styleClass="text-sm">
                              </p-chip>
                              <div class="text-sm text-surface-600 dark:text-surface-300">
                                Created: {{ plan.createdAt | date:'mediumDate' }}
                              </div>
                            </div>
                          </div>
                          <div class="flex items-center gap-2">
                            <p-tag 
                              [value]="plan.status" 
                              [severity]="getStatusSeverity(plan.status)">
                            </p-tag>
                            <p-button 
                              [icon]="plan.expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                              severity="secondary"
                              [text]="true"
                              (click)="togglePlanDetails(plan)"
                              pTooltip="Toggle Details">
                            </p-button>
                          </div>
                        </div>
                      </div>
                    </ng-template>

                    <!-- Basic Plan Info -->
                    <div class="mb-4">
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-4">
                          <div class="text-center">
                            <div class="text-2xl font-bold text-primary mb-1">
                              {{ plan.candidates?.length || 0 }}
                            </div>
                            <div class="text-xs text-surface-600 dark:text-surface-300">Candidates</div>
                          </div>
                          <div class="text-center">
                            <div class="text-2xl font-bold text-green-500 mb-1">
                              {{ getReadyCandidatesCount(plan) }}
                            </div>
                            <div class="text-xs text-surface-600 dark:text-surface-300">Ready</div>
                          </div>
                          <div class="text-center" *ngIf="plan.reviewDate">
                            <div class="text-sm font-medium text-surface-900 dark:text-surface-0 mb-1">
                              {{ plan.reviewDate | date:'MMM dd' }}
                            </div>
                            <div class="text-xs text-surface-600 dark:text-surface-300">Next Review</div>
                          </div>
                        </div>
                        <div class="flex gap-2">
                          <p-button 
                            icon="pi pi-users"
                            label="Candidates"
                            severity="secondary"
                            [outlined]="true"
                            size="small"
                            (click)="viewPlanCandidates(plan)">
                          </p-button>
                          <p-button 
                            icon="pi pi-chart-line"
                            label="Analyze"
                            severity="secondary"
                            size="small"
                            (click)="analyzePlanCandidates(plan)"
                            [loading]="analysisLoading().has(plan.id)">
                          </p-button>
                        </div>
                      </div>

                      <!-- Plan Description -->
                      <div *ngIf="plan.notes" class="text-sm text-surface-600 dark:text-surface-300 mb-3">
                        {{ plan.notes }}
                      </div>
                    </div>

                    <!-- Expanded Details -->
                    <div *ngIf="plan.expanded" class="border-t border-surface-200 dark:border-surface-700 pt-4">
                      <!-- Candidates List -->
                      <div *ngIf="plan.candidates?.length" class="mb-4">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Current Candidates</h6>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div *ngFor="let candidate of plan.candidates; trackBy: trackByCandidateId" 
                               class="border border-surface-200 dark:border-surface-700 rounded-lg p-3">
                            <div class="flex items-center justify-between mb-2">
                              <div class="flex items-center gap-3">
                                <p-avatar 
                                  [label]="getInitials(candidate.employee.fullName)"
                                  shape="circle">
                                </p-avatar>
                                <div>
                                  <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0">
                                    {{ candidate.employee.fullName }}
                                  </h6>
                                  <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                                    {{ candidate.employee.currentPosition?.title || 'No Position' }}
                                  </p>
                                </div>
                              </div>
                              <p-badge [value]="candidate.priority" severity="info" size="small"></p-badge>
                            </div>
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <span class="text-sm text-surface-600 dark:text-surface-300">Match:</span>
                                <p-progressBar 
                                  [value]="candidate.matchScore" 
                                  [showValue]="false"
                                  styleClass="w-16 h-2">
                                </p-progressBar>
                                <span class="text-sm font-medium">{{ candidate.matchScore }}%</span>
                              </div>
                              <p-tag 
                                [value]="candidate.status" 
                                [severity]="getCandidateStatusSeverity(candidate.status)">
                              </p-tag>
                            </div>
                            <div *ngIf="canAssignToPosition()" class="mt-2 flex justify-end">
                              <p-button 
                                label="Assign to Position"
                                icon="pi pi-send"
                                size="small"
                                severity="success"
                                [outlined]="true"
                                (click)="assignToPosition(plan.position, candidate.employee)"
                                pTooltip="Send assignment request">
                              </p-button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Smart Candidates (if loaded) -->
                      <div *ngIf="plan.smartCandidates?.length" class="mb-4">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">
                          AI-Suggested Candidates
                        </h6>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div *ngFor="let candidate of plan.smartCandidates?.slice(0, 4); trackBy: trackByCandidateId" 
                               class="border-2 border-dashed border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-900/20">
                            <div class="flex items-center justify-between mb-2">
                              <div class="flex items-center gap-3">
                                <p-avatar 
                                  [label]="getInitials(candidate.employee.fullName)"
                                  shape="circle">
                                </p-avatar>
                                <div>
                                  <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0">
                                    {{ candidate.employee.fullName }}
                                  </h6>
                                  <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                                    {{ candidate.employee.currentPosition?.title || 'No Position' }}
                                  </p>
                                </div>
                              </div>
                              <p-chip label="Suggested" styleClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"></p-chip>
                            </div>
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <span class="text-sm text-surface-600 dark:text-surface-300">Match:</span>
                                <p-progressBar 
                                  [value]="candidate.matchScore" 
                                  [showValue]="false"
                                  styleClass="w-16 h-2">
                                </p-progressBar>
                                <span class="text-sm font-medium">{{ candidate.matchScore }}%</span>
                              </div>
                              <p-button 
                                label="Add"
                                icon="pi pi-plus"
                                size="small"
                                severity="secondary"
                                [outlined]="true"
                                (click)="addCandidateToSuccessionPlan(plan, candidate.employee)">
                              </p-button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Candidate Analysis (if loaded) -->
                      <div *ngIf="plan.candidateAnalyses?.length" class="mb-4">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Detailed Analysis</h6>
                        <p-accordion value="0">
                          <p-accordion-panel value="0" *ngFor="let analysis of plan.candidateAnalyses; trackBy: trackByAnalysisId">
                            <p-accordion-header>{{analysis.employee.fullName}}</p-accordion-header>
                            <p-accordion-content>
                            <div class="space-y-4">
                              <div class="flex items-center justify-between">
                                <div>
                                  <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0 mb-1">
                                    Overall Score: {{ analysis.overallScore }}%
                                  </h6>
                                  <p-progressBar 
                                    [value]="analysis.overallScore" 
                                    styleClass="w-full h-3">
                                  </p-progressBar>
                                </div>
                              </div>

                              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div *ngIf="analysis.strengths?.length">
                                  <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2 text-sm">Strengths</h6>
                                  <div class="space-y-1">
                                    <div *ngFor="let strength of analysis.strengths" 
                                         class="flex items-center gap-2 text-sm">
                                      <i class="pi pi-check-circle text-green-500"></i>
                                      <span class="text-surface-700 dark:text-surface-200">{{ strength }}</span>
                                    </div>
                                  </div>
                                </div>

                                <div *ngIf="analysis.weaknesses?.length">
                                  <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2 text-sm">Areas for Development</h6>
                                  <div class="space-y-1">
                                    <div *ngFor="let weakness of analysis.weaknesses" 
                                         class="flex items-center gap-2 text-sm">
                                      <i class="pi pi-exclamation-circle text-orange-500"></i>
                                      <span class="text-surface-700 dark:text-surface-200">{{ weakness }}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </p-accordion-content>
                          </p-accordion-panel>
                        </p-accordion>
                      </div>
                    </div>
                  </p-card>
                </div>
              </div>

              <!-- No Plans Message -->
              <div *ngIf="!filteredPlans().length && !isLoading()" class="text-center py-12">
                <i class="pi pi-sitemap text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  No Succession Plans Found
                </h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  No succession plans match your current search criteria
                </p>
                <p-button 
                  *ngIf="canCreatePlans()"
                  label="Create First Plan" 
                  icon="pi pi-plus"
                  (click)="showCreatePlanDialog = true">
                </p-button>
              </div>
            </p-tabpanel>

            <!-- Readiness Assessment Tab -->
            <p-tabpanel value="readiness" header="Readiness" leftIcon="pi pi-chart-line">
              <div *ngIf="readinessReport()" class="space-y-6">
                <!-- Overall Readiness Summary -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <p-card styleClass="text-center">
                    <div class="mb-4">
                      <p-knob 
                        [(ngModel)]="readinessReport()!.overallReadinessPercentage" 
                        [readonly]="true"
                        [size]="100"
                        [strokeWidth]="10"
                        valueTemplate="{value}%">
                      </p-knob>
                    </div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Overall Readiness</h6>
                    <p class="text-surface-600 dark:text-surface-300 text-sm m-0">
                      Organization-wide succession readiness
                    </p>
                  </p-card>

                  <p-card styleClass="text-center">
                    <div class="text-3xl font-bold text-blue-500 mb-2">
                      {{ readinessReport()!.positionsWithPlans }}/{{ readinessReport()!.totalPositions }}
                    </div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Positions Covered</h6>
                    <p class="text-surface-600 dark:text-surface-300 text-sm m-0">
                      {{ Math.round((readinessReport()!.positionsWithPlans / readinessReport()!.totalPositions) * 100) }}% coverage
                    </p>
                  </p-card>

                  <p-card styleClass="text-center">
                    <div class="text-3xl font-bold text-red-500 mb-2">
                      {{ readinessReport()!.keyPositionsAtRisk }}
                    </div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">Key Positions at Risk</h6>
                    <p class="text-surface-600 dark:text-surface-300 text-sm m-0">
                      Require immediate attention
                    </p>
                  </p-card>
                </div>

                <!-- Position Readiness Details -->
                <p-card header="Position Readiness Details">
                  <div class="mb-4">
                    <div class="flex flex-wrap gap-4 items-center">
                      <p-select
                        [(ngModel)]="selectedRiskLevel"
                        [options]="riskLevelOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Risk Levels"
                        (onChange)="filterReadinessData()"
                        [showClear]="true">
                      </p-select>
                      <p-toggleButton
                        [(ngModel)]="showKeyPositionsOnlyReadiness"
                        onLabel="All Positions"
                        offLabel="Key Positions Only"
                        onIcon="pi pi-globe"
                        offIcon="pi pi-shield"
                        (onChange)="filterReadinessData()">
                      </p-toggleButton>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div *ngFor="let positionReadiness of filteredReadinessData(); trackBy: trackByPositionReadiness" 
                         class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <div class="flex items-center gap-2 mb-1">
                            <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                              {{ positionReadiness.position.title }}
                            </h6>
                            <p-tag 
                              *ngIf="positionReadiness.isKeyPosition"
                              value="Key" 
                              severity="warning"
                              icon="pi pi-shield"
                              styleClass="text-xs">
                            </p-tag>
                          </div>
                          <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                            {{ positionReadiness.position.department?.name || 'Unknown Department' }}
                          </p>
                        </div>
                        <p-tag 
                          [value]="positionReadiness.riskLevel" 
                          [severity]="getRiskSeverity(positionReadiness.riskLevel)">
                        </p-tag>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div class="text-center">
                          <div class="text-lg font-bold text-primary mb-1">
                            {{ positionReadiness.hasSuccessionPlan ? 'Yes' : 'No' }}
                          </div>
                          <div class="text-xs text-surface-600 dark:text-surface-300">Has Plan</div>
                        </div>
                        <div class="text-center">
                          <div class="text-lg font-bold text-blue-500 mb-1">
                            {{ positionReadiness.totalCandidatesCount }}
                          </div>
                          <div class="text-xs text-surface-600 dark:text-surface-300">Total Candidates</div>
                        </div>
                        <div class="text-center">
                          <div class="text-lg font-bold text-green-500 mb-1">
                            {{ positionReadiness.readyCandidatesCount }}
                          </div>
                          <div class="text-xs text-surface-600 dark:text-surface-300">Ready</div>
                        </div>
                        <div class="text-center">
                          <div class="text-lg font-bold" [ngClass]="{
                            'text-green-500': positionReadiness.readyCandidatesCount > 0,
                            'text-orange-500': positionReadiness.totalCandidatesCount > 0 && positionReadiness.readyCandidatesCount === 0,
                            'text-red-500': positionReadiness.totalCandidatesCount === 0
                          }">
                            {{ positionReadiness.readyCandidatesCount > 0 ? 
                                Math.round((positionReadiness.readyCandidatesCount / positionReadiness.totalCandidatesCount) * 100) + '%' :
                                '0%' }}
                          </div>
                          <div class="text-xs text-surface-600 dark:text-surface-300">Readiness</div>
                        </div>
                      </div>

                      <div class="flex gap-2">
                        <p-button 
                          *ngIf="!positionReadiness.hasSuccessionPlan && canCreatePlans()"
                          label="Create Plan"
                          icon="pi pi-plus"
                          size="small"
                          severity="primary"
                          (click)="createPlanForPosition(positionReadiness.position)">
                        </p-button>
                        <p-button 
                          *ngIf="positionReadiness.hasSuccessionPlan"
                          label="View Plan"
                          icon="pi pi-eye"
                          size="small"
                          severity="secondary"
                          [outlined]="true"
                          (click)="viewPositionPlan(positionReadiness.position)">
                        </p-button>
                        <p-button 
                          label="Analyze Candidates"
                          icon="pi pi-chart-line"
                          size="small"
                          severity="secondary"
                          [outlined]="true"
                          (click)="analyzePositionCandidates(positionReadiness.position)">
                        </p-button>
                      </div>
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- No Readiness Data -->
              <div *ngIf="!readinessReport() && !isLoading()" class="text-center py-12">
                <i class="pi pi-chart-line text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  No Readiness Data Available
                </h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  Readiness assessment data is not available at this time
                </p>
              </div>
            </p-tabpanel>
          </p-tabs>
        </p-fluid>
      </div>

      <!-- Create Succession Plan Dialog -->
      <p-dialog 
        header="Create Succession Plan" 
        [(visible)]="showCreatePlanDialog" 
        [modal]="true"
        styleClass="w-full max-w-2xl">
        <div class="space-y-6">
          <!-- Position Selection -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Position *
            </label>
            <p-select
              [(ngModel)]="newPlan.positionId"
              [options]="availablePositions()"
              optionLabel="label"
              optionValue="value"
              placeholder="Select position"
              class="w-full"
              [filter]="true"
              filterPlaceholder="Search positions...">
            </p-select>
          </div>

          <!-- Review Date -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Next Review Date
            </label>
            <p-datePicker
              [(ngModel)]="newPlan.reviewDate"
              [showIcon]="true"
              class="w-full">
            </p-datePicker>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Notes
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="newPlan.notes"
              rows="3"
              class="w-full"
              placeholder="Add any notes about this succession plan...">
            </textarea>
          </div>

          <!-- Auto-discover candidates option -->
          <div class="flex items-center gap-3">
            <p-checkbox 
              [(ngModel)]="newPlan.autoDiscoverCandidates"
              [binary]="true"
              inputId="auto-discover">
            </p-checkbox>
            <label for="auto-discover" class="text-sm text-surface-700 dark:text-surface-300">
              Automatically discover potential candidates using AI
            </label>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelCreatePlan()">
          </p-button>
          <p-button 
            label="Create Plan" 
            (click)="createPlan()"
            [disabled]="!newPlan.positionId"
            [loading]="isCreatingPlan()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- View Plan Candidates Dialog -->
      <p-dialog 
        header="Plan Candidates" 
        [(visible)]="showCandidatesDialog" 
        [modal]="true"
        styleClass="w-full max-w-4xl">
        <div *ngIf="selectedPlan" class="space-y-4">
          <div class="flex items-center justify-between mb-4">
            <h5 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
              {{ selectedPlan.position.title }} - Candidates
            </h5>
            <p-button 
              *ngIf="canCreatePlans()"
              label="Add Candidate"
              icon="pi pi-plus"
              size="small"
              (click)="showAddCandidateDialog = true">
            </p-button>
          </div>

          <!-- Current Candidates -->
          <div *ngIf="selectedPlan.candidates?.length" class="space-y-3">
            <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Current Candidates</h6>
            <div *ngFor="let candidate of selectedPlan.candidates; trackBy: trackByCandidateId" 
                 class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <p-avatar 
                    [label]="getInitials(candidate.employee.fullName)"
                    shape="circle"
                    size="large">
                  </p-avatar>
                  <div>
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                      {{ candidate.employee.fullName }}
                    </h6>
                    <p class="text-sm text-surface-600 dark:text-surface-300 m-0 mb-2">
                      {{ candidate.employee.currentPosition?.title || 'No Position' }} - 
                      {{ candidate.employee.department?.name || 'Unknown Dept' }}
                    </p>
                    <div class="flex items-center gap-4">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">Priority:</span>
                        <p-badge [value]="candidate.priority" severity="info"></p-badge>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">Match:</span>
                        <div class="flex items-center gap-2">
                          <p-progressBar 
                            [value]="candidate.matchScore" 
                            [showValue]="false"
                            styleClass="w-20 h-2">
                          </p-progressBar>
                          <span class="text-sm">{{ candidate.matchScore }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <p-tag 
                    [value]="candidate.status" 
                    [severity]="getCandidateStatusSeverity(candidate.status)">
                  </p-tag>
                  <p-button 
                    *ngIf="canAssignToPosition()"
                    label="Assign"
                    icon="pi pi-send"
                    size="small"
                    severity="success"
                    [outlined]="true"
                    (click)="assignToPosition(selectedPlan.position, candidate.employee)">
                  </p-button>
                </div>
              </div>
              <div *ngIf="candidate.notes" class="mt-3 text-sm text-surface-600 dark:text-surface-300">
                <strong>Notes:</strong> {{ candidate.notes }}
              </div>
            </div>
          </div>

          <!-- No Candidates -->
          <div *ngIf="!selectedPlan.candidates?.length" class="text-center py-8">
            <i class="pi pi-users text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
            <h6 class="font-semibold text-surface-700 dark:text-surface-200 mb-2">No Candidates</h6>
            <p class="text-surface-500 dark:text-surface-400 mb-4">
              This succession plan doesn't have any candidates yet
            </p>
            <p-button 
              *ngIf="canCreatePlans()"
              label="Add First Candidate"
              icon="pi pi-plus"
              (click)="showAddCandidateDialog = true">
            </p-button>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Close" 
            severity="secondary" 
            [outlined]="true"
            (click)="showCandidatesDialog = false">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Add Candidate Dialog -->
      <p-dialog 
        header="Add Candidate" 
        [(visible)]="showAddCandidateDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div class="space-y-4">
          <!-- Employee Selection -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Employee *
            </label>
            <p-select
              [(ngModel)]="newCandidate.employeeId"
              [options]="availableEmployees()"
              optionLabel="label"
              optionValue="value"
              placeholder="Select employee"
              class="w-full"
              [filter]="true"
              filterPlaceholder="Search employees...">
            </p-select>
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Priority *
            </label>
            <p-inputNumber
              [(ngModel)]="newCandidate.priority"
              [min]="1"
              [max]="10"
              class="w-full">
            </p-inputNumber>
            <small class="text-surface-500 dark:text-surface-400 mt-1 block">
              1 = Highest priority, 10 = Lowest priority
            </small>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="showAddCandidateDialog = false; resetNewCandidate()">
          </p-button>
          <p-button 
            label="Add Candidate" 
            (click)="addCandidate()"
            [disabled]="!newCandidate.employeeId || !newCandidate.priority">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Assignment Confirmation Dialog -->
      <p-dialog 
        header="Confirm Position Assignment" 
        [(visible)]="showAssignmentDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div *ngIf="assignmentData" class="space-y-4">
          <div class="text-center">
            <i class="pi pi-send text-4xl text-primary mb-3 block"></i>
            <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">
              Send Assignment Request
            </h5>
            <p class="text-surface-600 dark:text-surface-300">
              This will send a position assignment request for 
              <strong>{{ assignmentData.employee?.fullName }}</strong> 
              to the <strong>{{ assignmentData.position?.title }}</strong> position.
            </p>
          </div>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0 mb-1">Assignment Details</h6>
            <div class="text-sm text-surface-600 dark:text-surface-300">
              <div><strong>Employee:</strong> {{ assignmentData.employee?.fullName }}</div>
              <div><strong>Current Position:</strong> {{ assignmentData.employee?.currentPosition?.title || 'None' }}</div>
              <div><strong>Target Position:</strong> {{ assignmentData.position?.title }}</div>
              <div><strong>Department:</strong> {{ assignmentData.position?.department?.name }}</div>
            </div>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="showAssignmentDialog = false">
          </p-button>
          <p-button 
            label="Send Request" 
            icon="pi pi-send"
            (click)="confirmAssignment()"
            [loading]="isAssigning()">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class SuccessionPlanning implements OnInit {
  // Signals for reactive state management
  dashboardData = signal<SuccessionDashboard | null>(null);
  successionPlans = signal<SuccessionPlan[]>([]);
  filteredPlans = signal<SuccessionPlanWithAnalysis[]>([]);
  readinessReport = signal<SuccessionReadinessReport | null>(null);
  filteredReadinessData = signal<any[]>([]);
  positions = signal<Position[]>([]);
  employees = signal<Employee[]>([]);
  selectedPlan: SuccessionPlan | null = null;

  // Loading states
  isLoading = signal<boolean>(false);
  analysisLoading = signal<Map<number, boolean>>(new Map());
  isCreatingPlan = signal<boolean>(false);
  isAssigning = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Dialog states
  showCreatePlanDialog = false;
  showCandidatesDialog = false;
  showAddCandidateDialog = false;
  showAssignmentDialog = false;

  // Filter states
  plansSearchTerm = '';
  selectedPlanStatus: string | null = null;
  selectedDepartment: string | null = null;
  showKeyPositionsOnly = false;
  selectedRiskLevel: string | null = null;
  showKeyPositionsOnlyReadiness = false;

  // Forms
  newPlan: CreateSuccessionPlanDto = {
    positionId: 0,
    reviewDate: undefined,
    notes: '',
    autoDiscoverCandidates: true
  };

  newCandidate: AddSuccessionCandidateDto = {
    employeeId: 0,
    priority: 1
  };

  assignmentData: {
    position: Position | null;
    employee: Employee | null;
  } = {
    position: null,
    employee: null
  };

  // Computed properties
  availablePositions = computed(() => 
    this.positions().map(pos => ({ 
      label: `${pos.title} - ${pos.department?.name || 'Unknown Dept'}`, 
      value: pos.id 
    }))
  );

  availableEmployees = computed(() => 
    this.employees().map(emp => ({ 
      label: `${emp.fullName} - ${emp.currentPosition?.title || 'No Position'}`, 
      value: emp.id 
    }))
  );

  planStatusOptions = computed(() => [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'Active' },
    { label: 'Completed', value: 'Completed' },
    { label: 'On Hold', value: 'OnHold' }
  ]);

  departmentOptions = computed(() => {
    const departments = new Set<string>();
    this.positions().forEach(pos => {
      if (pos.department?.name) {
        departments.add(pos.department.name);
      }
    });
    return [
      { label: 'All Departments', value: null },
      ...Array.from(departments).map(name => ({ label: name, value: name }))
    ];
  });

  riskLevelOptions = computed(() => [
    { label: 'All Risk Levels', value: null },
    { label: 'High Risk', value: 'High' },
    { label: 'Medium Risk', value: 'Medium' },
    { label: 'Low Risk', value: 'Low' }
  ]);

  constructor(
    private successionPlanningService: SuccessionPlanningService,
    private positionService: PositionService,
    private employeeService: EmployeeService,
    private employeeRequestService: EmployeeRequestService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await Promise.all([
        this.loadDashboard(),
        this.loadSuccessionPlans(),
        this.loadReadinessReport(),
        this.loadPositions(),
        this.loadEmployees()
      ]);
    } catch (error) {
      console.error('Error loading succession planning data:', error);
      this.errorMessage.set('Failed to load succession planning data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadDashboard() {
    try {
      const dashboard = await this.successionPlanningService.getSuccessionDashboard().toPromise();
      if (dashboard) {
        this.dashboardData.set(dashboard);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  async loadSuccessionPlans() {
    try {
      const plans = await this.successionPlanningService.getAllSuccessionPlans().toPromise();
      if (plans) {
        this.successionPlans.set(plans);
        this.filterPlans();
      }
    } catch (error) {
      console.error('Error loading succession plans:', error);
    }
  }

  async loadReadinessReport() {
    try {
      const report = await this.successionPlanningService.getSuccessionReadinessReport().toPromise();
      if (report) {
        this.readinessReport.set(report);
        this.filteredReadinessData.set(report.positionReadiness || []);
      }
    } catch (error) {
      console.error('Error loading readiness report:', error);
    }
  }

  async loadPositions() {
    try {
      const positions = await this.positionService.getActivePositions().toPromise();
      if (positions) {
        this.positions.set(positions);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  }

  async loadEmployees() {
    try {
      const employees = await this.employeeService.getAllEmployees().toPromise();
      if (employees) {
        this.employees.set(employees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }

  // Filtering methods
  filterPlans() {
    let filtered = this.successionPlans().map(plan => ({ ...plan, expanded: false } as SuccessionPlanWithAnalysis));

    // Search filter
    if (this.plansSearchTerm.trim()) {
      const term = this.plansSearchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.position.title.toLowerCase().includes(term) ||
        plan.position.department?.name.toLowerCase().includes(term) ||
        plan.notes?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.selectedPlanStatus) {
      filtered = filtered.filter(plan => plan.status === this.selectedPlanStatus);
    }

    // Department filter
    if (this.selectedDepartment) {
      filtered = filtered.filter(plan => plan.position.department?.name === this.selectedDepartment);
    }

    // Key positions filter
    if (this.showKeyPositionsOnly) {
      filtered = filtered.filter(plan => plan.position.isKeyPosition);
    }

    this.filteredPlans.set(filtered);
  }

  filterReadinessData() {
    const report = this.readinessReport();
    if (!report) return;

    let filtered = report.positionReadiness || [];

    // Risk level filter
    if (this.selectedRiskLevel) {
      filtered = filtered.filter(pos => pos.riskLevel === this.selectedRiskLevel);
    }

    // Key positions filter
    if (this.showKeyPositionsOnlyReadiness) {
      filtered = filtered.filter(pos => pos.isKeyPosition);
    }

    this.filteredReadinessData.set(filtered);
  }

  // Plan management
  togglePlanDetails(plan: SuccessionPlanWithAnalysis) {
    plan.expanded = !plan.expanded;
    
    // Load additional data when expanding
    if (plan.expanded && !plan.smartCandidates) {
      this.loadSmartCandidates(plan);
    }
  }

  async loadSmartCandidates(plan: SuccessionPlanWithAnalysis) {
    try {
      const smartCandidates = await this.successionPlanningService.getSmartCandidatesForPosition(plan.positionId).toPromise();
      if (smartCandidates) {
        plan.smartCandidates = smartCandidates;
        this.updatePlanInFilteredList(plan);
      }
    } catch (error) {
      console.error('Error loading smart candidates:', error);
    }
  }

  async analyzePlanCandidates(plan: SuccessionPlan) {
    const loadingMap = new Map(this.analysisLoading());
    loadingMap.set(plan.id, true);
    this.analysisLoading.set(loadingMap);

    try {
      const analyses = await this.successionPlanningService.analyzePotentialCandidates(plan.positionId).toPromise();
      if (analyses) {
        const updatedPlan = this.filteredPlans().find(p => p.id === plan.id);
        if (updatedPlan) {
          updatedPlan.candidateAnalyses = analyses;
          this.updatePlanInFilteredList(updatedPlan);
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: `Analyzed ${analyses.length} potential candidates`
        });
      }
    } catch (error) {
      console.error('Error analyzing candidates:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Analysis Failed',
        detail: 'Unable to analyze potential candidates'
      });
    } finally {
      const loadingMap = new Map(this.analysisLoading());
      loadingMap.delete(plan.id);
      this.analysisLoading.set(loadingMap);
    }
  }

  private updatePlanInFilteredList(updatedPlan: SuccessionPlanWithAnalysis) {
    const filtered = this.filteredPlans();
    const index = filtered.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
      filtered[index] = updatedPlan;
      this.filteredPlans.set([...filtered]);
    }
  }

  // Plan creation
  async createPlan() {
    if (!this.newPlan.positionId) return;

    this.isCreatingPlan.set(true);

    try {
      const plan = await this.successionPlanningService.createSuccessionPlan(this.newPlan).toPromise();
      if (plan) {
        this.messageService.add({
          severity: 'success',
          summary: 'Plan Created',
          detail: 'Succession plan has been created successfully'
        });
        this.cancelCreatePlan();
        await this.loadSuccessionPlans();
      }
    } catch (error) {
      console.error('Error creating succession plan:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Creation Failed',
        detail: 'Unable to create succession plan'
      });
    } finally {
      this.isCreatingPlan.set(false);
    }
  }

  cancelCreatePlan() {
    this.showCreatePlanDialog = false;
    this.newPlan = {
      positionId: 0,
      reviewDate: undefined,
      notes: '',
      autoDiscoverCandidates: true
    };
  }

  createPlanForPosition(position: Position) {
    this.newPlan.positionId = position.id;
    this.showCreatePlanDialog = true;
  }

  // Candidate management
  viewPlanCandidates(plan: SuccessionPlan) {
    this.selectedPlan = plan;
    this.showCandidatesDialog = true;
  }

  async addCandidate() {
    if (!this.selectedPlan || !this.newCandidate.employeeId || !this.newCandidate.priority) {
      return;
    }

    try {
      const candidate = await this.successionPlanningService.addCandidateToSuccessionPlan(
        this.selectedPlan.id, 
        this.newCandidate
      ).toPromise();
      
      if (candidate) {
        this.messageService.add({
          severity: 'success',
          summary: 'Candidate Added',
          detail: 'Employee has been added to the succession plan'
        });
        
        // Update local data
        if (!this.selectedPlan.candidates) {
          this.selectedPlan.candidates = [];
        }
        this.selectedPlan.candidates.push(candidate);
        
        // Update in the filtered plans list
        const planInList = this.filteredPlans().find(p => p.id === this.selectedPlan!.id);
        if (planInList) {
          if (!planInList.candidates) planInList.candidates = [];
          planInList.candidates.push(candidate);
          this.updatePlanInFilteredList(planInList);
        }
        
        this.resetNewCandidate();
        this.showAddCandidateDialog = false;
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to Add Candidate',
        detail: 'Unable to add candidate to succession plan'
      });
    }
  }

  async addCandidateToSuccessionPlan(plan: SuccessionPlan, employee: Employee) {
    // Find the highest priority + 1 for new candidate
    const maxPriority = Math.max(0, ...(plan.candidates?.map(c => c.priority) || []));
    const candidateDto: AddSuccessionCandidateDto = {
      employeeId: employee.id,
      priority: maxPriority + 1
    };

    try {
      const candidate = await this.successionPlanningService.addCandidateToSuccessionPlan(plan.id, candidateDto).toPromise();
      if (candidate) {
        this.messageService.add({
          severity: 'success',
          summary: 'Candidate Added',
          detail: `${employee.fullName} has been added to the succession plan`
        });
        
        // Update local data
        const planInList = this.filteredPlans().find(p => p.id === plan.id);
        if (planInList) {
          if (!planInList.candidates) planInList.candidates = [];
          planInList.candidates.push(candidate);
          this.updatePlanInFilteredList(planInList);
        }
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Failed to Add Candidate',
        detail: 'Unable to add candidate to succession plan'
      });
    }
  }

  resetNewCandidate() {
    this.newCandidate = {
      employeeId: 0,
      priority: 1
    };
  }

  // Position assignment
  assignToPosition(position: Position, employee: Employee) {
    this.assignmentData = { position, employee };
    this.showAssignmentDialog = true;
  }

  async confirmAssignment() {
    if (!this.assignmentData.position || !this.assignmentData.employee) {
      return;
    }

    this.isAssigning.set(true);

    try {
      // Using the employee request service to create an assignment request
      const requestData = {
        requestType: 'PositionAssignment',
        targetEmployeeId: this.assignmentData.employee.id,
        newPositionId: this.assignmentData.position.id,
        justification: `Succession planning candidate assignment to ${this.assignmentData.position.title}`
      };

      const request = await this.employeeRequestService.createRequest(requestData).toPromise();
      if (request) {
        this.messageService.add({
          severity: 'success',
          summary: 'Assignment Request Sent',
          detail: `Position assignment request has been sent for ${this.assignmentData.employee.fullName}`
        });
        this.showAssignmentDialog = false;
        this.assignmentData = { position: null, employee: null };
      }
    } catch (error) {
      console.error('Error sending assignment request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Request Failed',
        detail: 'Unable to send position assignment request'
      });
    } finally {
      this.isAssigning.set(false);
    }
  }

  // Position and readiness management
  viewPositionPlan(position: Position) {
    const plan = this.successionPlans().find(p => p.positionId === position.id);
    if (plan) {
      this.viewPlanCandidates(plan);
    }
  }

  async analyzePositionCandidates(position: Position) {
    try {
      const analyses = await this.successionPlanningService.analyzePotentialCandidates(position.id).toPromise();
      if (analyses) {
        this.messageService.add({
          severity: 'info',
          summary: 'Analysis Complete',
          detail: `Found ${analyses.length} potential candidates for ${position.title}`
        });
        
        // You could show these in a dialog or navigate to a detailed view
        console.log('Position candidate analyses:', analyses);
      }
    } catch (error) {
      console.error('Error analyzing position candidates:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Analysis Failed',
        detail: 'Unable to analyze candidates for this position'
      });
    }
  }

  // Utility methods
  refreshData() {
    this.loadData();
  }

  getReadyCandidatesCount(plan: SuccessionPlan): number {
    return plan.candidates?.filter(c => c.status === 'Ready').length || 0;
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Severity helpers
  getRiskSeverity(riskLevel: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (riskLevel) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'secondary';
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'info';
      case 'OnHold': return 'warning';
      default: return 'secondary';
    }
  }

  getCandidateStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (status) {
      case 'Ready': return 'success';
      case 'InTraining': return 'info';
      case 'Approved': return 'info';
      case 'UnderReview': return 'warning';
      case 'NotSuitable': return 'danger';
      default: return 'secondary';
    }
  }

  // Permission checks
  canCreatePlans(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin' || user?.role === 'Manager';
  }

  canAssignToPosition(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin';
  }

  // TrackBy functions for performance
  trackByPlanId(index: number, plan: SuccessionPlan): number {
    return plan.id;
  }

  trackByCandidateId(index: number, candidate: SuccessionCandidate): number {
    return candidate.id;
  }

  trackByRiskId(index: number, risk: SuccessionRisk): string {
    return `${risk.position.id}-${risk.riskType}`;
  }

  trackByRecommendationId(index: number, rec: any): string {
    return `${rec.type}-${index}`;
  }

  trackByAnalysisId(index: number, analysis: SuccessionCandidateAnalysis): number {
    return analysis.employeeId;
  }

  trackByPositionReadiness(index: number, readiness: any): number {
    return readiness.position.id;
  }

  // Math utility
  Math = Math;
}