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
import { ChartModule } from 'primeng/chart';
import { AccordionModule } from 'primeng/accordion';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { DataViewModule } from 'primeng/dataview';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CheckboxModule } from 'primeng/checkbox';
import { StepperModule } from 'primeng/stepper';
import { MenuModule } from 'primeng/menu';
import { TimelineModule } from 'primeng/timeline';
import { KnobModule } from 'primeng/knob';
import { InputNumberModule } from 'primeng/inputnumber';

// Services
import { CareerPathService, CareerPath, CareerPathRecommendation, CareerRoadmap, CareerPathAnalysis, SkillGapAnalysis } from '../service/career-path.service';
import { IntelligenceService, CareerOpportunity } from '../service/intelligence.service';
import { PositionService, Position } from '../service/position.service';
import { EmployeeRequestService, CreatePromotionRequestDto } from '../service/employee-request.service';
import { EmployeeService, Employee } from '../service/employee.service';
import { AuthService } from '../service/auth.service';
import { Skill, SkillsService } from '../service/skills.service';

interface CareerPathWithAnalysis extends CareerPath {
  analysis?: CareerPathAnalysis;
  readinessScore?: number;
  skillGaps?: SkillGapAnalysis[];
}

interface RoadmapVisualization {
  steps: {
    position: Position;
    currentStep: boolean;
    completed: boolean;
    estimatedMonths: number;
    careerPath?: CareerPath;
  }[];
  totalDuration: number;
  currentStepIndex: number;
}

@Component({
  selector: 'app-career-development',
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
    ChartModule,
    AccordionModule,
    TreeModule,
    AvatarModule,
    DataViewModule,
    ToggleButtonModule,
    CheckboxModule,
    StepperModule,
    MenuModule,
    TimelineModule,
    KnobModule,
    InputNumberModule
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Career Development</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Explore career paths, track your journey, and discover opportunities
            </p>
          </div>
          <div class="flex gap-2">
            <p-button 
              *ngIf="canCreateCareerPath()"
              label="Create Path" 
              icon="pi pi-plus"
              (click)="showCreateCareerPathDialog = true"
              pTooltip="Create New Career Path">
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
      <div *ngIf="isLoading() && !careerPaths().length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading career development data...</span>
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
      <div *ngIf="!isLoading() || careerPaths().length" class="px-6">
        <p-fluid>
          <p-tabs value="available-paths">
            <p-tablist>
              <p-tab value="available-paths">Available Paths</p-tab>
              <p-tab value="my-journey">My Journey</p-tab>
              <p-tab value="opportunities">Opportunities</p-tab>
            </p-tablist>

            <!-- Available Paths Tab -->
            <p-tabpanel value="available-paths" header="Available Paths" leftIcon="pi pi-sitemap">
              <!-- Filters -->
              <div class="mb-6">
                <div class="flex flex-wrap gap-4 items-center">
                  <div class="flex-1 min-w-0">
                    <span class="p-input-icon-left w-full">
                      <input 
                        pInputText 
                        type="text" 
                        [(ngModel)]="pathSearchTerm"
                        (input)="filterCareerPaths()"
                        placeholder="Search career paths..." 
                        class="w-full">
                    </span>
                  </div>
                  <p-select
                    [(ngModel)]="selectedFromPosition"
                    [options]="positionOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="From Position"
                    (onChange)="filterCareerPaths()"
                    [showClear]="true"
                    class="min-w-48">
                  </p-select>
                  <p-select
                    [(ngModel)]="selectedToPosition"
                    [options]="positionOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="To Position"
                    (onChange)="filterCareerPaths()"
                    [showClear]="true"
                    class="min-w-48">
                  </p-select>
                  <p-toggleButton
                    [(ngModel)]="showMyEligibleOnly"
                    onLabel="All Paths"
                    offLabel="Eligible Only"
                    onIcon="pi pi-globe"
                    offIcon="pi pi-user"
                    (onChange)="filterCareerPaths()">
                  </p-toggleButton>
                </div>
              </div>

              <!-- Career Paths Grid -->
              <div *ngIf="filteredCareerPaths().length" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div *ngFor="let path of filteredCareerPaths(); trackBy: trackByPathId" class="h-fit">
                  <p-card styleClass="h-full">
                    <ng-template pTemplate="header">
                      <div class="p-4 pb-0">
                        <div class="flex justify-between items-start mb-3">
                          <div class="flex-1">
                            <h5 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">
                              {{ path.fromPosition.title }} → {{ path.toPosition.title }}
                            </h5>
                            <div class="flex items-center gap-2 mb-2">
                              <p-chip 
                                [label]="path.fromPosition.department?.name || 'Unknown Dept'" 
                                styleClass="text-xs">
                              </p-chip>
                              <i class="pi pi-arrow-right text-surface-400"></i>
                              <p-chip 
                                [label]="path.toPosition.department?.name || 'Unknown Dept'" 
                                styleClass="text-xs">
                              </p-chip>
                            </div>
                          </div>
                          <div *ngIf="path.readinessScore !== undefined" class="text-center">
                            <p-knob 
                              [(ngModel)]="path.readinessScore" 
                              [readonly]="true"
                              [size]="60"
                              [strokeWidth]="8"
                              valueTemplate="{value}%">
                            </p-knob>
                            <div class="text-xs text-surface-600 dark:text-surface-300 mt-1">
                              Readiness
                            </div>
                          </div>
                        </div>
                      </div>
                    </ng-template>

                    <!-- Path Details -->
                    <div class="space-y-4">
                      <!-- Requirements Overview -->
                      <div>
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Requirements</h6>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                          <div class="flex items-center gap-2">
                            <i class="pi pi-clock text-blue-500"></i>
                            <span>{{ path.minYearsInCurrentRole }}+ years in role</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <i class="pi pi-briefcase text-green-500"></i>
                            <span>{{ path.minTotalExperience }}+ total exp.</span>
                          </div>
                          <div class="flex items-center gap-2" *ngIf="path.minPerformanceRating">
                            <i class="pi pi-star text-yellow-500"></i>
                            <span>{{ path.minPerformanceRating }}/5 performance</span>
                          </div>
                          <div class="flex items-center gap-2" *ngIf="path.requiredEducationLevel">
                            <i class="pi pi-graduation-cap text-purple-500"></i>
                            <span>{{ path.requiredEducationLevel }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Required Skills -->
                      <div *ngIf="path.requiredSkills?.length">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Required Skills</h6>
                        <div class="flex flex-wrap gap-2">
                          <p-chip 
                            *ngFor="let skill of path.requiredSkills.slice(0, 6)" 
                            [label]="skill.skill.name"
                            [styleClass]="skill.isMandatory ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'">
                          </p-chip>
                          <p-chip 
                            *ngIf="path.requiredSkills.length > 6"
                            [label]="'+' + (path.requiredSkills.length - 6) + ' more'"
                            styleClass="bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                          </p-chip>
                        </div>
                      </div>

                      <!-- Skill Gaps (if analyzed) -->
                      <div *ngIf="path.skillGaps?.length" class="mt-4">
                        <div class="flex items-center justify-between mb-2">
                          <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Skill Gaps</h6>
                          <p-badge [value]="path.skillGaps?.length ?? ''" severity="warn"></p-badge>
                        </div>
                        <div class="space-y-2">
                          <div *ngFor="let gap of path.skillGaps?.slice(0, 3)" 
                               class="flex items-center justify-between p-2 border border-surface-200 dark:border-surface-700 rounded">
                            <span class="text-sm">{{ gap.skill.name }}</span>
                            <div class="flex items-center gap-2">
                              <span class="text-xs text-surface-600 dark:text-surface-300">
                                {{ gap.currentProficiency }}/{{ gap.requiredProficiency }}
                              </span>
                              <p-tag 
                                [value]="'+' + gap.gap" 
                                severity="warning"
                                styleClass="text-xs">
                              </p-tag>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Description -->
                      <div *ngIf="path.description">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Description</h6>
                        <p class="text-sm text-surface-600 dark:text-surface-300">{{ path.description }}</p>
                      </div>
                    </div>

                    <ng-template pTemplate="footer">
                      <div class="flex gap-2 pt-3">
                        <p-button 
                          label="Analyze Readiness"
                          icon="pi pi-chart-line"
                          severity="secondary"
                          [outlined]="true"
                          size="small"
                          (click)="analyzeCareerPath(path)"
                          [loading]="analysisLoading().has(path.id)">
                        </p-button>
                        <p-button 
                          label="View Details"
                          icon="pi pi-eye"
                          severity="secondary"
                          [text]="true"
                          size="small"
                          (click)="viewCareerPathDetails(path)">
                        </p-button>
                        <p-button 
                          *ngIf="canRequestPromotion()"
                          label="Request Promotion"
                          icon="pi pi-send"
                          size="small"
                          (click)="requestPromotion(path.id)"
                          class="ml-auto">
                        </p-button>
                      </div>
                    </ng-template>
                  </p-card>
                </div>
              </div>

              <!-- No Paths Message -->
              <div *ngIf="!filteredCareerPaths().length && !isLoading()" class="text-center py-12">
                <i class="pi pi-sitemap text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  {{ showMyEligibleOnly ? 'No Eligible Career Paths' : 'No Career Paths Found' }}
                </h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  {{ showMyEligibleOnly 
                    ? 'No career paths match your current qualifications and filters' 
                    : 'No career paths found matching your search criteria' 
                  }}
                </p>
                <p-button 
                  *ngIf="canCreateCareerPath()"
                  label="Create First Path" 
                  icon="pi pi-plus"
                  (click)="showCreateCareerPathDialog = true">
                </p-button>
              </div>
            </p-tabpanel>

            <!-- My Journey Tab -->
            <p-tabpanel value="my-journey" header="My Journey" leftIcon="pi pi-map">
              <div class="space-y-6">
                <!-- Current Position & Progress -->
                <p-card header="Career Progress" *ngIf="currentEmployee()">
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Current Position -->
                    <div class="text-center">
                      <div class="bg-primary text-primary-contrast rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <i class="pi pi-user text-2xl"></i>
                      </div>
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Current Position</h6>
                      <p class="text-surface-600 dark:text-surface-300 mt-1">
                        {{ currentEmployee()?.currentPosition?.title || 'No Position Assigned' }}
                      </p>
                      <p-chip 
                        [label]="currentEmployee()?.department?.name || 'No Department'" 
                        styleClass="mt-2">
                      </p-chip>
                    </div>

                    <!-- Years in Role -->
                    <div class="text-center">
                      <div class="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <i class="pi pi-calendar text-2xl"></i>
                      </div>
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Years in Role</h6>
                      <p class="text-2xl font-bold text-blue-500 mt-1">{{ getYearsInCurrentRole() }}</p>
                      <p class="text-xs text-surface-500 dark:text-surface-400">Since {{ currentEmployee()?.hireDate | date:'MMM yyyy' }}</p>
                    </div>

                    <!-- Active Paths -->
                    <div class="text-center">
                      <div class="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <i class="pi pi-sitemap text-2xl"></i>
                      </div>
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Available Paths</h6>
                      <p class="text-2xl font-bold text-green-500 mt-1">{{ availablePathsFromCurrent().length }}</p>
                      <p class="text-xs text-surface-500 dark:text-surface-400">From current position</p>
                    </div>
                  </div>
                </p-card>

                <!-- My Recommendations -->
                <p-card header="Personalized Recommendations" *ngIf="myRecommendations().length">
                  <div class="space-y-4">
                    <div *ngFor="let rec of myRecommendations(); trackBy: trackByRecommendationId" 
                         class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                            {{ rec.careerPath.fromPosition.title }} → {{ rec.careerPath.toPosition.title }}
                          </h6>
                          <div class="flex items-center gap-2">
                            <p-rating 
                              [ngModel]="rec.readinessScore / 20"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                            <span class="text-sm text-surface-600 dark:text-surface-300">
                              {{ rec.readinessScore }}% ready
                            </span>
                          </div>
                        </div>
                        <p-tag 
                          [value]="getPriorityLabel(rec.priority)" 
                          [severity]="getPrioritySeverity(rec.priority)">
                        </p-tag>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Strengths -->
                        <div *ngIf="rec.analysis?.skillGaps">
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2 text-sm">Key Requirements</h6>
                          <div class="space-y-1">
                            <div *ngFor="let gap of rec.analysis.skillGaps.slice(0, 3)" 
                                 class="flex items-center justify-between text-sm">
                              <span>{{ gap.skill.name }}</span>
                              <div class="flex items-center gap-2">
                                <div class="w-16 bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                  <div 
                                    class="h-2 rounded-full transition-all"
                                    [style.width.%]="(gap.currentProficiency / gap.requiredProficiency) * 100"
                                    [ngClass]="{
                                      'bg-green-500': gap.gap === 0,
                                      'bg-yellow-500': gap.gap <= 1,
                                      'bg-red-500': gap.gap > 1
                                    }">
                                  </div>
                                </div>
                                <span class="text-xs text-surface-500">{{ gap.currentProficiency }}/{{ gap.requiredProficiency }}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Actions -->
                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2 text-sm">Next Steps</h6>
                          <div class="space-y-2">
                            <p-button 
                              label="View Detailed Analysis"
                              icon="pi pi-chart-line"
                              severity="secondary"
                              [outlined]="true"
                              size="small"
                              (click)="viewDetailedAnalysis(rec)">
                            </p-button>
                            <p-button 
                              label="Create Roadmap"
                              icon="pi pi-map"
                              severity="secondary"
                              size="small"
                              (click)="createRoadmap(rec.careerPath.toPosition)">
                            </p-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </p-card>

                <!-- Career Roadmap -->
                <p-card header="My Career Roadmap" *ngIf="myRoadmap()">
                  <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                        Path to {{ getPositionName(myRoadmap()!.targetPositionId) }}
                      </h6>
                      <p-chip 
                        [label]="myRoadmap()!.estimatedTotalTimeMonths + ' months estimated'" 
                        styleClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      </p-chip>
                    </div>
                  </div>

                  <p-timeline 
                    [value]="roadmapVisualization().steps" 
                    align="alternate"
                    styleClass="customized-timeline">
                    <ng-template pTemplate="marker" let-step>
                      <div 
                        class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        [ngClass]="{
                          'bg-green-500': step.completed,
                          'bg-primary': step.currentStep,
                          'bg-surface-400': !step.completed && !step.currentStep
                        }">
                        <i 
                          [class]="step.completed ? 'pi pi-check' : (step.currentStep ? 'pi pi-user' : 'pi pi-circle')"
                          class="text-xs">
                        </i>
                      </div>
                    </ng-template>

                    <ng-template pTemplate="content" let-step let-i="index">
                      <p-card>
                        <div class="flex justify-between items-start">
                          <div>
                            <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                              {{ step.position.title }}
                            </h6>
                            <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                              {{ step.position.department?.name }}
                            </p>
                            <div class="flex items-center gap-2">
                              <i class="pi pi-clock text-surface-500"></i>
                              <span class="text-sm text-surface-600 dark:text-surface-300">
                                {{ step.estimatedMonths }} months
                              </span>
                            </div>
                          </div>
                          <p-tag 
                            [value]="step.completed ? 'Completed' : (step.currentStep ? 'Current' : 'Planned')"
                            [severity]="step.completed ? 'success' : (step.currentStep ? 'info' : 'secondary')">
                          </p-tag>
                        </div>
                      </p-card>
                    </ng-template>
                  </p-timeline>
                </p-card>

                <!-- No Journey Data -->
                <div *ngIf="!currentEmployee() || !myRecommendations().length" class="text-center py-12">
                  <i class="pi pi-map text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                  <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">Start Your Journey</h3>
                  <p class="text-surface-500 dark:text-surface-400 mb-4">
                    Explore available career paths to begin planning your professional development
                  </p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Opportunities Tab -->
            <p-tabpanel value="opportunities" header="Opportunities" leftIcon="pi pi-lightbulb">
              <div class="space-y-6">
                <!-- Opportunities Filters -->
                <div class="flex flex-wrap gap-4 items-center">
                  <p-select
                    [(ngModel)]="selectedOpportunityType"
                    [options]="opportunityTypeOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="All Types"
                    (onChange)="filterOpportunities()"
                    [showClear]="true">
                  </p-select>
                  <p-select
                    [(ngModel)]="selectedMatchScore"
                    [options]="matchScoreOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Any Match Score"
                    (onChange)="filterOpportunities()"
                    [showClear]="true">
                  </p-select>
                  <p-toggleButton
                    [(ngModel)]="showHighPriorityOnly"
                    onLabel="All Opportunities"
                    offLabel="High Priority Only"
                    onIcon="pi pi-globe"
                    offIcon="pi pi-star"
                    (onChange)="filterOpportunities()">
                  </p-toggleButton>
                </div>

                <!-- Career Opportunities Grid -->
                 <!-- Career Opportunities Grid -->
                <div *ngIf="filteredOpportunities().length" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div *ngFor="let opportunity of filteredOpportunities(); trackBy: trackByOpportunityId" class="h-fit">
                    <p-card styleClass="h-full">
                      <ng-template pTemplate="header">
                        <div class="p-4 pb-0">
                          <div class="flex justify-between items-start mb-3">
                            <div>
                              <h5 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                                {{ opportunity.title }}
                              </h5>
                              <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                                {{ opportunity.department }}
                              </p>
                            </div>
                            <div class="text-center">
                              <div class="text-2xl font-bold" [ngClass]="{
                                'text-green-500': opportunity.matchScore >= 80,
                                'text-blue-500': opportunity.matchScore >= 60,
                                'text-orange-500': opportunity.matchScore >= 40,
                                'text-red-500': opportunity.matchScore < 40
                              }">
                                {{ opportunity.matchScore }}%
                              </div>
                              <div class="text-xs text-surface-600 dark:text-surface-300">Match</div>
                            </div>
                          </div>
                        </div>
                      </ng-template>

                      <!-- Opportunity Details -->
                      <div class="space-y-4">
                        <!-- Type and Priority -->
                        <div class="flex items-center justify-between">
                          <p-chip 
                            [label]="opportunity.type" 
                            [styleClass]="getOpportunityTypeClass(opportunity.type)">
                          </p-chip>
                          <p-tag 
                            [value]="opportunity.priority" 
                            [severity]="getPrioritySeverity(opportunity.priority)">
                          </p-tag>
                        </div>

                        <!-- Description -->
                        <div>
                          <p class="text-sm text-surface-700 dark:text-surface-200">
                            {{ opportunity.description }}
                          </p>
                        </div>

                        <!-- Match Score Breakdown -->
                        <div>
                          <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-surface-700 dark:text-surface-200">
                              Compatibility Score
                            </span>
                            <span class="text-sm text-surface-600 dark:text-surface-300">
                              {{ opportunity.matchScore }}/100
                            </span>
                          </div>
                          <p-progressBar 
                            [value]="opportunity.matchScore" 
                            [showValue]="false"
                            styleClass="h-2">
                          </p-progressBar>
                        </div>

                        <!-- Recommended Action -->
                        <div *ngIf="opportunity.recommendedAction">
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2 text-sm">
                            Recommended Action
                          </h6>
                          <p class="text-sm text-surface-600 dark:text-surface-300">
                            {{ opportunity.recommendedAction }}
                          </p>
                        </div>
                      </div>

                      <ng-template pTemplate="footer">
                        <div class="flex gap-2 pt-3">
                          <p-button 
                            label="View Details"
                            icon="pi pi-eye"
                            severity="secondary"
                            [outlined]="true"
                            size="small"
                            (click)="viewOpportunityDetails(opportunity)">
                          </p-button>
                          <p-button 
                            *ngIf="canApplyForOpportunity(opportunity)"
                            label="Apply"
                            icon="pi pi-send"
                            size="small"
                            (click)="applyForOpportunity(opportunity)">
                          </p-button>
                        </div>
                      </ng-template>
                    </p-card>
                  </div>
                </div>

                <!-- No Opportunities Message -->
                <div *ngIf="!filteredOpportunities().length && !isLoading()" class="text-center py-12">
                  <i class="pi pi-lightbulb text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                  <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                    No Opportunities Found
                  </h3>
                  <p class="text-surface-500 dark:text-surface-400 mb-4">
                    No career opportunities match your current criteria. Try adjusting your filters or check back later.
                  </p>
                </div>
              </div>
            </p-tabpanel>
          </p-tabs>
        </p-fluid>
      </div>

        <!-- Create Career Path Dialog -->
        <p-dialog 
        header="Create Career Path" 
        [(visible)]="showCreateCareerPathDialog" 
        [modal]="true"
        styleClass="w-full max-w-4xl">
        <div class="space-y-6">
            <!-- Position Selection -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- From Position -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                From Position *
                </label>
                <p-select
                [(ngModel)]="newCareerPath.fromPositionId"
                [options]="positionOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select starting position"
                class="w-full"
                (onChange)="onFromPositionChange()">
                </p-select>
            </div>

            <!-- To Position -->
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                To Position *
                </label>
                <p-select
                [(ngModel)]="newCareerPath.toPositionId"
                [options]="getAvailableToPositions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select target position"
                class="w-full"
                [disabled]="!newCareerPath.fromPositionId">
                </p-select>
            </div>
            </div>

            <!-- Experience Requirements -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Minimum Years in Current Role
                </label>
                <p-inputNumber
                [(ngModel)]="newCareerPath.minYearsInCurrentRole"
                [min]="0"
                [max]="20"
                class="w-full">
                </p-inputNumber>
            </div>
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Minimum Total Experience
                </label>
                <p-inputNumber
                [(ngModel)]="newCareerPath.minTotalExperience"
                [min]="0"
                [max]="40"
                class="w-full">
                </p-inputNumber>
            </div>
            </div>

            <!-- Performance and Education -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Minimum Performance Rating
                </label>
                <p-select
                [(ngModel)]="newCareerPath.minPerformanceRating"
                [options]="performanceRatingOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Any rating"
                class="w-full">
                </p-select>
            </div>
            <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Required Education Level
                </label>
                <p-select
                [(ngModel)]="newCareerPath.requiredEducationLevel"
                [options]="educationLevelOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Any education level"
                class="w-full">
                </p-select>
            </div>
            </div>

            <!-- Required Skills Section -->
            <div>
            <div class="flex items-center justify-between mb-3">
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Required Skills
                </label>
                <p-button 
                label="Add Skill" 
                icon="pi pi-plus" 
                size="small"
                severity="secondary"
                [outlined]="true"
                (click)="showAddSkillDialog = true">
                </p-button>
            </div>

            <!-- Skills List -->
            <div *ngIf="selectedSkillsForPath.length > 0" class="space-y-2 mb-4">
                <div *ngFor="let skill of selectedSkillsForPath; let i = index" 
                    class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center gap-3">
                    <span class="font-medium text-surface-900 dark:text-surface-0">
                        {{ getSkillName(skill.skillId) }}
                    </span>
                    <p-tag 
                        [value]="skill.isMandatory ? 'Required' : 'Preferred'"
                        [severity]="skill.isMandatory ? 'danger' : 'info'"
                        styleClass="text-xs">
                    </p-tag>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                    <span class="text-sm text-surface-600 dark:text-surface-300">Min Level:</span>
                    <p-rating 
                        [ngModel]="skill.minProficiencyLevel"
                        [readonly]="true"
                        [stars]="5"
                        styleClass="text-sm">
                    </p-rating>
                    </div>
                </div>
                <p-button 
                    icon="pi pi-trash" 
                    severity="danger" 
                    [text]="true"
                    size="small"
                    (click)="removeSkillRequirement(i)"
                    pTooltip="Remove skill">
                </p-button>
                </div>
            </div>

            <!-- No Skills Message -->
            <div *ngIf="selectedSkillsForPath.length === 0" 
                class="text-center p-6 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg">
                <i class="pi pi-plus-circle text-3xl text-surface-300 dark:text-surface-600 mb-2 block"></i>
                <p class="text-surface-500 dark:text-surface-400 text-sm">
                No skills added yet. Click "Add Skill" to include skill requirements.
                </p>
            </div>
            </div>

            <!-- Certifications -->
            <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Required Certifications
            </label>
            <textarea 
                pTextarea 
                [(ngModel)]="newCareerPath.requiredCertifications"
                rows="2"
                class="w-full"
                placeholder="List any required certifications (optional)">
            </textarea>
            </div>

            <!-- Description -->
            <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Description
            </label>
            <textarea 
                pTextarea 
                [(ngModel)]="newCareerPath.description"
                rows="3"
                class="w-full"
                placeholder="Describe this career path...">
            </textarea>
            </div>
        </div>
        
        <ng-template pTemplate="footer">
            <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelCreateCareerPath()">
            </p-button>
            <p-button 
            label="Create Path" 
            (click)="createCareerPath()"
            [disabled]="!newCareerPath.fromPositionId || !newCareerPath.toPositionId"
            [loading]="isCreatingPath()">
            </p-button>
        </ng-template>
        </p-dialog>

        <!-- Add Skill Dialog -->
        <p-dialog 
        header="Add Skill Requirement" 
        [(visible)]="showAddSkillDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div class="space-y-4">
            <!-- Skill Selection -->
            <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Skill *
            </label>
            <p-select
                [(ngModel)]="newSkillRequirement.skillId"
                [options]="skillOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select skill"
                class="w-full"
                [filter]="true"
                filterPlaceholder="Search skills...">
            </p-select>
            </div>

            <!-- Proficiency Level -->
            <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Minimum Proficiency Level *
            </label>
            <div class="flex items-center gap-3">
                <p-rating 
                [(ngModel)]="newSkillRequirement.minProficiencyLevel"
                [stars]="5"
                class="flex-1">
                </p-rating>
                <span class="text-sm text-surface-600 dark:text-surface-300 min-w-0">
                {{ newSkillRequirement.minProficiencyLevel }}/5
                </span>
            </div>
            <small class="text-surface-500 dark:text-surface-400 mt-1 block">
                1 = Beginner, 3 = Intermediate, 5 = Expert
            </small>
            </div>

            <!-- Is Mandatory -->
            <div class="flex items-center gap-3">
            <p-checkbox 
                [(ngModel)]="newSkillRequirement.isMandatory"
                [binary]="true"
                inputId="mandatory-skill">
            </p-checkbox>
            <label for="mandatory-skill" class="text-sm font-medium text-surface-700 dark:text-surface-300">
                This skill is mandatory (required for eligibility)
            </label>
            </div>
        </div>
        
        <ng-template pTemplate="footer">
            <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="showAddSkillDialog = false; resetNewSkillRequirement()">
            </p-button>
            <p-button 
            label="Add Skill" 
            (click)="addSkillRequirement()"
            [disabled]="!newSkillRequirement.skillId">
            </p-button>
        </ng-template>
        </p-dialog>

      <!-- Career Path Details Dialog -->
      <p-dialog 
        header="Career Path Details" 
        [(visible)]="showCareerPathDetailsDialog" 
        [modal]="true"
        styleClass="w-full max-w-4xl">
        <div *ngIf="selectedCareerPath" class="space-y-6">
          <!-- Basic Info -->
          <p-card header="Path Overview">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Career Transition</h6>
                <div class="flex items-center gap-4">
                  <div class="text-center">
                    <div class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
                      <h6 class="font-semibold m-0">{{ selectedCareerPath.fromPosition.title }}</h6>
                      <p class="text-sm m-0 mt-1">{{ selectedCareerPath.fromPosition.department?.name }}</p>
                    </div>
                  </div>
                  <i class="pi pi-arrow-right text-2xl text-surface-400"></i>
                  <div class="text-center">
                    <div class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg">
                      <h6 class="font-semibold m-0">{{ selectedCareerPath.toPosition.title }}</h6>
                      <p class="text-sm m-0 mt-1">{{ selectedCareerPath.toPosition.department?.name }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Requirements</h6>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>Years in Current Role:</span>
                    <strong>{{ selectedCareerPath.minYearsInCurrentRole }}+</strong>
                  </div>
                  <div class="flex justify-between">
                    <span>Total Experience:</span>
                    <strong>{{ selectedCareerPath.minTotalExperience }}+</strong>
                  </div>
                  <div class="flex justify-between" *ngIf="selectedCareerPath.minPerformanceRating">
                    <span>Performance Rating:</span>
                    <strong>{{ selectedCareerPath.minPerformanceRating }}/5</strong>
                  </div>
                  <div class="flex justify-between" *ngIf="selectedCareerPath.requiredEducationLevel">
                    <span>Education:</span>
                    <strong>{{ selectedCareerPath.requiredEducationLevel }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="selectedCareerPath.description" class="mt-4">
              <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Description</h6>
              <p class="text-surface-600 dark:text-surface-300">{{ selectedCareerPath.description }}</p>
            </div>
          </p-card>

          <!-- Required Skills -->
          <p-card header="Required Skills" *ngIf="selectedCareerPath.requiredSkills?.length">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let skill of selectedCareerPath.requiredSkills" 
                   class="border border-surface-200 dark:border-surface-700 rounded-lg p-3">
                <div class="flex justify-between items-start mb-2">
                  <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0">
                    {{ skill.skill.name }}
                  </h6>
                  <p-tag 
                    [value]="skill.isMandatory ? 'Required' : 'Preferred'"
                    [severity]="skill.isMandatory ? 'danger' : 'info'"
                    styleClass="text-xs">
                  </p-tag>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-surface-600 dark:text-surface-300">Min Level:</span>
                  <p-rating 
                    [ngModel]="skill.minProficiencyLevel"
                    [readonly]="true"
                    [stars]="5"
                    styleClass="text-sm">
                  </p-rating>
                </div>
              </div>
            </div>
          </p-card>

          <!-- Personal Analysis (if available) -->
          <p-card header="Your Readiness Analysis" *ngIf="selectedCareerPathAnalysis">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div class="text-center">
                <p-knob 
                  [(ngModel)]="selectedCareerPathAnalysis.readinessPercentage" 
                  [readonly]="true"
                  [size]="80"
                  [strokeWidth]="8"
                  valueTemplate="{value}%">
                </p-knob>
                <h6 class="font-semibold text-surface-900 dark:text-surface-0 mt-2 mb-0">Overall Readiness</h6>
              </div>

              <div class="text-center">
                <div class="text-3xl font-bold mb-2" [ngClass]="{
                  'text-green-500': selectedCareerPathAnalysis.skillCompletionPercentage >= 80,
                  'text-blue-500': selectedCareerPathAnalysis.skillCompletionPercentage >= 60,
                  'text-orange-500': selectedCareerPathAnalysis.skillCompletionPercentage >= 40,
                  'text-red-500': selectedCareerPathAnalysis.skillCompletionPercentage < 40
                }">
                  {{ selectedCareerPathAnalysis.skillCompletionPercentage }}%
                </div>
                <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Skills Match</h6>
              </div>

              <div class="text-center">
                <div class="text-3xl font-bold mb-2" [ngClass]="{
                  'text-green-500': selectedCareerPathAnalysis.meetsExperienceRequirement,
                  'text-red-500': !selectedCareerPathAnalysis.meetsExperienceRequirement
                }">
                  {{ selectedCareerPathAnalysis.meetsExperienceRequirement ? '✓' : '✗' }}
                </div>
                <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">Experience</h6>
              </div>
            </div>

            <!-- Skill Gaps -->
            <div *ngIf="selectedCareerPathAnalysis.skillGaps?.length">
              <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Skills to Develop</h6>
              <div class="space-y-3">
                <div *ngFor="let gap of selectedCareerPathAnalysis.skillGaps" 
                     class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <div>
                    <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0 mb-1">
                      {{ gap.skill.name }}
                    </h6>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-surface-600 dark:text-surface-300">Current:</span>
                      <p-rating 
                        [ngModel]="gap.currentProficiency"
                        [readonly]="true"
                        [stars]="5"
                        styleClass="text-sm">
                      </p-rating>
                    </div>
                  </div>
                  <div class="text-right">
                    <p-tag 
                      [value]="'+' + gap.gap + ' levels'" 
                      [severity]="gap.gap > 2 ? 'danger' : (gap.gap > 1 ? 'warning' : 'info')">
                    </p-tag>
                    <div class="text-xs text-surface-600 dark:text-surface-300 mt-1">
                      Need: {{ gap.requiredProficiency }}/5
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recommendations -->
            <div *ngIf="selectedCareerPathAnalysis.recommendations?.length" class="mt-6">
              <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Recommendations</h6>
              <div class="space-y-2">
                <div *ngFor="let rec of selectedCareerPathAnalysis.recommendations" 
                     class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <i class="pi pi-lightbulb text-blue-500 mt-0.5"></i>
                  <span class="text-sm text-surface-700 dark:text-surface-200">{{ rec }}</span>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Close" 
            severity="secondary" 
            [outlined]="true"
            (click)="closeCareerPathDetails()">
          </p-button>
          <p-button 
            *ngIf="canRequestPromotion() && selectedCareerPath"
            label="Request Promotion" 
            icon="pi pi-send"
            (click)="requestPromotion(selectedCareerPath.id)">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Promotion Request Dialog -->
      <p-dialog 
        header="Request Promotion" 
        [(visible)]="showPromotionRequestDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div *ngIf="selectedPathForPromotion" class="space-y-4">
          <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-2">
              Promotion Request
            </h5>
            <div class="flex items-center justify-center gap-3">
              <span class="text-surface-600 dark:text-surface-300">
                {{ currentEmployee()?.currentPosition?.title || 'Current Position' }}
              </span>
              <i class="pi pi-arrow-right text-surface-400"></i>
              <span class="font-semibold text-primary">
                {{ selectedPathForPromotion.toPosition.title }}
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Target Employee *
            </label>
            <p-select
              [(ngModel)]="promotionRequest.targetEmployeeId"
              [options]="employeeOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="Select employee"
              class="w-full"
              [disabled]="!canSelectEmployeeForPromotion()">
            </p-select>
            <small class="text-surface-500 dark:text-surface-400" *ngIf="!canSelectEmployeeForPromotion()">
              You can only request promotions for yourself
            </small>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Proposed Salary (Optional)
            </label>
            <p-inputNumber
              [(ngModel)]="promotionRequest.proposedSalary"
              mode="currency"
              currency="USD"
              locale="en-US"
              class="w-full">
            </p-inputNumber>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Justification *
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="promotionRequest.justification"
              rows="4"
              class="w-full"
              placeholder="Explain why this promotion is warranted...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelPromotionRequest()">
          </p-button>
          <p-button 
            label="Submit Request" 
            (click)="submitPromotionRequest()"
            [disabled]="!promotionRequest.targetEmployeeId || !promotionRequest.justification"
            [loading]="isSubmittingPromotion()">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class CareerDevelopment implements OnInit {
    // Signals for reactive state management
  careerPaths = signal<CareerPath[]>([]);
  filteredCareerPaths = signal<CareerPathWithAnalysis[]>([]);
  myRecommendations = signal<CareerPathRecommendation[]>([]);
  careerOpportunities = signal<CareerOpportunity[]>([]);
  filteredOpportunities = signal<CareerOpportunity[]>([]);
  myRoadmap = signal<CareerRoadmap | null>(null);
  positions = signal<Position[]>([]);
  currentEmployee = signal<Employee | null>(null);
  selectedCareerPath: CareerPath | null = null;
  selectedCareerPathAnalysis: CareerPathAnalysis | null = null;

  // Loading states
  isLoading = signal<boolean>(false);
  analysisLoading = signal<Map<number, boolean>>(new Map());
  isCreatingPath = signal<boolean>(false);
  isSubmittingPromotion = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Dialog states
  showCreateCareerPathDialog = false;
  showCareerPathDetailsDialog = false;
  showPromotionRequestDialog = false;

  // Filter states
  pathSearchTerm = '';
  selectedFromPosition: number | null = null;
  selectedToPosition: number | null = null;
  showMyEligibleOnly = false;
  selectedOpportunityType: string | null = null;
  selectedMatchScore: number | null = null;
  showHighPriorityOnly = false;


  // Forms
  newCareerPath: any = {
    fromPositionId: null,
    toPositionId: null,
    minYearsInCurrentRole: 0,
    minTotalExperience: 0,
    minPerformanceRating: null,
    requiredEducationLevel: null,
    requiredCertifications: '',
    description: ''
  };

  selectedPathForPromotion: CareerPath | null = null;
  promotionRequest: CreatePromotionRequestDto = {
    targetEmployeeId: 0,
    careerPathId: 0,
    newManagerId: undefined,
    proposedSalary: undefined,
    justification: ''
  };
    selectedSkillsForPath: { skillId: number; minProficiencyLevel: number; isMandatory: boolean }[] = [];
    availableSkills = signal<Skill[]>([]);
        showAddSkillDialog = false;
        newSkillRequirement = {
        skillId: null as number | null,
        minProficiencyLevel: 1,
        isMandatory: false
    };

  // Computed properties
  positionOptions = computed(() => 
    this.positions().map(pos => ({ 
      label: `${pos.title} - ${pos.department?.name || 'Unknown Dept'}`, 
      value: pos.id 
    }))
  );

  getAvailableToPositions() {
  const fromPositionId = this.newCareerPath.fromPositionId;
  if (!fromPositionId) return [];
  
  return this.positionOptions().filter(pos => pos.value !== fromPositionId);
}

  employeeOptions = computed(() => {
    const current = this.currentEmployee();
    if (!current) return [];
    
    // If user is HR/Admin/Manager, they can select other employees
    if (this.canSelectEmployeeForPromotion()) {
      // For now, just return current employee - would need employee list
      return [{ label: current.fullName, value: current.id }];
    }
    
    return [{ label: current.fullName, value: current.id }];
  });

  availableToPositions = computed(() => {
  const fromPositionId = this.newCareerPath.fromPositionId;
  if (!fromPositionId) return [];
  
  return this.positionOptions().filter(pos => pos.value !== fromPositionId);
});

  availablePathsFromCurrent = computed(() => {
    const employee = this.currentEmployee();
    if (!employee?.currentPositionId) return [];
    
    return this.careerPaths().filter(path => 
      path.fromPositionId === employee.currentPositionId
    );
  });

  roadmapVisualization = computed(() => {
    const roadmap = this.myRoadmap();
    if (!roadmap) return { steps: [], totalDuration: 0, currentStepIndex: 0 };

    const currentEmployee = this.currentEmployee();
    const steps = roadmap.steps.map((step, index) => ({
      position: this.getPositionById(step.toPositionId) || {} as Position,
      currentStep: currentEmployee?.currentPositionId === step.fromPositionId,
      completed: index === 0, // First step is usually completed (current position)
      estimatedMonths: step.estimatedTimeMonths,
      careerPath: this.getCareerPathById(step.careerPathId)
    }));

    return {
      steps,
      totalDuration: roadmap.estimatedTotalTimeMonths,
      currentStepIndex: steps.findIndex(step => step.currentStep)
    };
  });

  opportunityTypeOptions = computed(() => [
    { label: 'All Types', value: null },
    { label: 'Vacant Position', value: 'Vacant Position' },
    { label: 'Succession Plan', value: 'Succession Plan' },
  ]);

  matchScoreOptions = computed(() => [
    { label: 'Any Score', value: null },
    { label: '80% and above', value: 80 },
    { label: '60% and above', value: 60 },
    { label: '40% and above', value: 40 }
  ]);

  performanceRatingOptions = computed(() => [
    { label: 'Any Rating', value: null },
    { label: '3/5 - Good', value: 3 },
    { label: '4/5 - Very Good', value: 4 },
    { label: '5/5 - Excellent', value: 5 }
  ]);

  educationLevelOptions = computed(() => [
    { label: 'Any Level', value: null },
    { label: 'High School', value: 'High School' },
    { label: 'Associate Degree', value: 'Associate' },
    { label: 'Bachelor Degree', value: 'Bachelor' },
    { label: 'Master Degree', value: 'Master' },
    { label: 'Doctoral Degree', value: 'PhD' }
  ]);

  constructor(
    private careerPathService: CareerPathService,
    private intelligenceService: IntelligenceService,
    private positionService: PositionService,
    private employeeRequestService: EmployeeRequestService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private skillsService: SkillsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadSkills();
  }

  async loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // Load basic data first
      await Promise.all([
        this.loadPositions(),
        this.loadCurrentEmployee(),
        this.loadCareerPaths()
      ]);

      // Load personalized data
      await Promise.all([
        this.loadMyRecommendations(),
        this.loadOpportunities()
      ]);

    } catch (error) {
      console.error('Error loading career development data:', error);
      this.errorMessage.set('Failed to load career development data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadSkills() {
    try {
        const skills = await this.skillsService.getAllSkills().toPromise();
        if (skills) {
         this.availableSkills.set(skills);
        }
    } catch (error) {
        console.error('Error loading skills:', error);
    }
    }
    skillOptions = computed(() => 
  this.availableSkills().map(skill => ({ 
    label: skill.name, 
    value: skill.id 
  }))
);

addSkillRequirement() {
  if (!this.newSkillRequirement.skillId) return;
  
  // Check if skill already added
  const exists = this.selectedSkillsForPath.some(s => s.skillId === this.newSkillRequirement.skillId);
  if (exists) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Skill Already Added',
      detail: 'This skill is already in the requirements list'
    });
    return;
  }
  
  this.selectedSkillsForPath.push({
    skillId: this.newSkillRequirement.skillId,
    minProficiencyLevel: this.newSkillRequirement.minProficiencyLevel,
    isMandatory: this.newSkillRequirement.isMandatory
  });
  
  this.resetNewSkillRequirement();
  this.showAddSkillDialog = false;
}

removeSkillRequirement(index: number) {
  this.selectedSkillsForPath.splice(index, 1);
}

resetNewSkillRequirement() {
  this.newSkillRequirement = {
    skillId: null,
    minProficiencyLevel: 1,
    isMandatory: false
  };
}

getSkillName(skillId: number): string {
  const skill = this.availableSkills().find(s => s.id === skillId);
  return skill ? skill.name : 'Unknown Skill';
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

  async loadCurrentEmployee() {
    try {
      const employee = await this.employeeService.getMyProfile().toPromise();
      if (employee) {
        this.currentEmployee.set(employee);
        // Initialize promotion request with current employee
        this.promotionRequest.targetEmployeeId = employee.id;
      }
    } catch (error) {
      console.error('Error loading current employee:', error);
    }
  }

  async loadCareerPaths() {
    try {
      const paths = await this.careerPathService.getActiveCareerPaths().toPromise();
      if (paths) {
        this.careerPaths.set(paths);
        this.filterCareerPaths();
      }
    } catch (error) {
      console.error('Error loading career paths:', error);
    }
  }

  async loadMyRecommendations() {
    try {
      const recommendations = await this.careerPathService.getMyRecommendations().toPromise();
      if (recommendations) {
        this.myRecommendations.set(recommendations);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }

  async loadOpportunities() {
    try {
      const currentEmployee = this.currentEmployee();
      if (!currentEmployee) return;

      const opportunities = await this.intelligenceService.getCareerOpportunities(currentEmployee.id).toPromise();
      if (opportunities) {
        this.careerOpportunities.set(opportunities);
        this.filterOpportunities();
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
    }
  }

  // Filtering methods
  filterCareerPaths() {
    let filtered = this.careerPaths();

    // Search filter
    if (this.pathSearchTerm.trim()) {
      const term = this.pathSearchTerm.toLowerCase();
      filtered = filtered.filter(path => 
        path.fromPosition.title.toLowerCase().includes(term) ||
        path.toPosition.title.toLowerCase().includes(term) ||
        path.description?.toLowerCase().includes(term)
      );
    }

    // Position filters
    if (this.selectedFromPosition) {
      filtered = filtered.filter(path => path.fromPositionId === this.selectedFromPosition);
    }

    if (this.selectedToPosition) {
      filtered = filtered.filter(path => path.toPositionId === this.selectedToPosition);
    }

    // Eligibility filter
    if (this.showMyEligibleOnly) {
      const currentEmployee = this.currentEmployee();
      if (currentEmployee?.currentPositionId) {
        filtered = filtered.filter(path => 
          path.fromPositionId === currentEmployee.currentPositionId
        );
      }
    }

    this.filteredCareerPaths.set(filtered.map(path => ({ ...path } as CareerPathWithAnalysis)));
  }

  filterOpportunities() {
    let filtered = this.careerOpportunities();

    // Type filter
    if (this.selectedOpportunityType) {
      filtered = filtered.filter(opp => opp.type === this.selectedOpportunityType);
    }

    // Match score filter
    if (this.selectedMatchScore !== null) {
      filtered = filtered.filter(opp => opp.matchScore >= this.selectedMatchScore!);
    }

    // Priority filter
    if (this.showHighPriorityOnly) {
      filtered = filtered.filter(opp => opp.priority === 'High');
    }

    this.filteredOpportunities.set(filtered);
  }

  // Career Path Analysis
  async analyzeCareerPath(path: CareerPath) {
    const loadingMap = new Map(this.analysisLoading());
    loadingMap.set(path.id, true);
    this.analysisLoading.set(loadingMap);

    try {
      const analysis = await this.careerPathService.analyzeMyReadiness(path.id).toPromise();
      if (analysis) {
        // Update the filtered paths with analysis data
        const filtered = this.filteredCareerPaths().map(p => {
          if (p.id === path.id) {
            return {
              ...p,
              analysis,
              readinessScore: analysis.readinessPercentage,
              skillGaps: analysis.skillGaps
            };
          }
          return p;
        });
        this.filteredCareerPaths.set(filtered);

        this.messageService.add({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: `Your readiness for this career path is ${analysis.readinessPercentage}%`
        });
      }
    } catch (error) {
      console.error('Error analyzing career path:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Analysis Failed',
        detail: 'Unable to analyze career path readiness'
      });
    } finally {
      const loadingMap = new Map(this.analysisLoading());
      loadingMap.delete(path.id);
      this.analysisLoading.set(loadingMap);
    }
  }

  // Dialog management
  viewCareerPathDetails(path: CareerPath) {
    this.selectedCareerPath = path;
    this.selectedCareerPathAnalysis = null;
    this.showCareerPathDetailsDialog = true;

    // Load analysis if available
    const analyzedPath = this.filteredCareerPaths().find(p => p.id === path.id);
    if (analyzedPath?.analysis) {
      this.selectedCareerPathAnalysis = analyzedPath.analysis;
    }
  }

  closeCareerPathDetails() {
    this.showCareerPathDetailsDialog = false;
    this.selectedCareerPath = null;
    this.selectedCareerPathAnalysis = null;
  }

  requestPromotion(pathId: number) {
    const path = this.careerPaths().find(p => p.id === pathId);
    if (!path) return;
    this.selectedPathForPromotion = path;
    this.promotionRequest.careerPathId = path.id;
    this.showPromotionRequestDialog = true;
  }

  cancelPromotionRequest() {
    this.showPromotionRequestDialog = false;
    this.selectedPathForPromotion = null;
    this.promotionRequest = {
      targetEmployeeId: this.currentEmployee()?.id || 0,
      careerPathId: 0,
      newManagerId: undefined,
      proposedSalary: undefined,
      justification: ''
    };
  }

  async submitPromotionRequest() {
    if (!this.promotionRequest.targetEmployeeId || !this.promotionRequest.justification) {
      return;
    }

    this.isSubmittingPromotion.set(true);

    try {
      const request = await this.employeeRequestService.createPromotionRequest(this.promotionRequest).toPromise();
      if (request) {
        this.messageService.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: 'Your promotion request has been submitted for approval'
        });
        this.cancelPromotionRequest();
      }
    } catch (error) {
      console.error('Error submitting promotion request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Submission Failed',
        detail: 'Unable to submit promotion request'
      });
    } finally {
      this.isSubmittingPromotion.set(false);
    }
  }

  // Career Path Creation
  async createCareerPath() {
  if (!this.newCareerPath.fromPositionId || !this.newCareerPath.toPositionId) {
    return;
  }

  this.isCreatingPath.set(true);

  try {
    // Prepare the DTO with required skills
    const careerPathDto = {
      ...this.newCareerPath,
      requiredSkills: this.selectedSkillsForPath.map(skill => ({
        skillId: skill.skillId,
        minProficiencyLevel: skill.minProficiencyLevel,
        isMandatory: skill.isMandatory
      }))
    };

    const path = await this.careerPathService.createCareerPath(careerPathDto).toPromise();
    if (path) {
      this.messageService.add({
        severity: 'success',
        summary: 'Path Created',
        detail: 'New career path has been created successfully'
      });
      this.cancelCreateCareerPath();
      await this.loadCareerPaths(); // Reload paths
    }
  } catch (error) {
    console.error('Error creating career path:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Creation Failed',
      detail: 'Unable to create career path'
    });
  } finally {
    this.isCreatingPath.set(false);
  }
}
cancelCreateCareerPath() {
  this.showCreateCareerPathDialog = false;
  this.selectedSkillsForPath = [];
  this.resetNewSkillRequirement();
  this.newCareerPath = {
    fromPositionId: null,
    toPositionId: null,
    minYearsInCurrentRole: 0,
    minTotalExperience: 0,
    minPerformanceRating: null,
    requiredEducationLevel: null,
    requiredCertifications: '',
    description: ''
  };
}

  onFromPositionChange() {
    // Clear to position when from position changes
    this.newCareerPath.toPositionId = null;
  }

  // Roadmap management
  async createRoadmap(targetPosition: Position) {
    const currentEmployee = this.currentEmployee();
    if (!currentEmployee?.currentPositionId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Current Position',
        detail: 'Unable to create roadmap without a current position'
      });
      return;
    }

    try {
      const roadmap = await this.careerPathService.getMyCareerRoadmap(targetPosition.id).toPromise();
      if (roadmap) {
        this.myRoadmap.set(roadmap);
        this.messageService.add({
          severity: 'success',
          summary: 'Roadmap Created',
          detail: `Career roadmap to ${targetPosition.title} has been generated`
        });
        // Switch to My Journey tab
        // You might need to add tab switching logic here
      }
    } catch (error) {
      console.error('Error creating roadmap:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Roadmap Failed',
        detail: 'Unable to create career roadmap'
      });
    }
  }

  viewDetailedAnalysis(recommendation: CareerPathRecommendation) {
    this.viewCareerPathDetails(recommendation.careerPath);
  }

  // Opportunity management
  viewOpportunityDetails(opportunity: CareerOpportunity) {
    // Implementation depends on what details you want to show
    console.log('View opportunity details:', opportunity);
  }

  applyForOpportunity(opportunity: CareerOpportunity) {
    // This would depend on the opportunity type
    // For promotion opportunities, redirect to promotion request
    if (opportunity.type === 'Promotion' && opportunity.relatedId) {
      const position = this.positions().find(p => p.id === opportunity.relatedId);
      if (position) {
        this.requestPromotion(opportunity.relatedId);
      }
    }
  }

  // Utility methods
  refreshData() {
    this.loadData();
  }

  getYearsInCurrentRole(): number {
    const employee = this.currentEmployee();
    if (!employee?.hireDate) return 0;
    
    const hireDate = new Date(employee.hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  }

  getPositionById(id: number): Position | undefined {
    return this.positions().find(p => p.id === id);
  }

  getPositionName(id: number): string {
    const position = this.getPositionById(id);
    return position ? position.title : 'Unknown Position';
  }

  getCareerPathById(id: number): CareerPath | undefined {
    return this.careerPaths().find(p => p.id === id);
  }

  getPriorityLabel(priority: number): string {
    const labels: { [key: number]: string } = {
      1: 'High',
      2: 'Medium',
      3: 'Low'
    };
    return labels[priority] || 'Medium';
  }

  getPrioritySeverity(priority: number | string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    if (typeof priority === 'number') {
      switch (priority) {
        case 1: return 'danger';
        case 2: return 'warning';
        case 3: return 'info';
        default: return 'secondary';
      }
    } else {
      switch (priority?.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'secondary';
      }
    }
  }

  getOpportunityTypeClass(type: string): string {
    const typeClasses: { [key: string]: string } = {
      'Vacant Position': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Succession Plan': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return typeClasses[type] || 'bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-200';
  }

  switchToAvailablePaths() {
    // Implementation would depend on your tab switching mechanism
    // This is a placeholder
    console.log('Switch to available paths tab');
  }

  // Permission checks
  canCreateCareerPath(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin' || user?.role === 'Manager';
  }

  canRequestPromotion(): boolean {
    // Employees can request promotions for themselves
    // HR/Admin/Managers can request for others
    return true;
  }

  canSelectEmployeeForPromotion(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin' || user?.role === 'Manager';
  }

  canApplyForOpportunity(opportunity: CareerOpportunity): boolean {
    // Basic check - could be enhanced with more business logic
    return opportunity.matchScore >= 40;
  }

  // TrackBy functions for performance
  trackByPathId(index: number, path: CareerPath): number {
    return path.id;
  }

  trackByRecommendationId(index: number, rec: CareerPathRecommendation): number {
    return rec.careerPath.id;
  }

  trackByOpportunityId(index: number, opp: CareerOpportunity): number {
    return opp.relatedId || index;
  }
}