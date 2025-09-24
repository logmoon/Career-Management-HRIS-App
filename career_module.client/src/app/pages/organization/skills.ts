import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
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

// Services
import { SkillsService, Skill, CreateSkill, UpdateSkill, EmployeeSkill, SkillRecommendation, SkillGap } from '../service/skills.service';
import { IntelligenceService, SkillsIntelligence } from '../service/intelligence.service';
import { EmployeeService, Employee } from '../service/employee.service';
import { DepartmentService, Department } from '../service/department.service';
import { AuthService } from '../service/auth.service';
import { Position, PositionService } from '../service/position.service';

interface SkillMatrix {
  skill: Skill;
  employees: EmployeeSkill[];
  averageLevel: number;
  totalEmployees: number;
  levels: {
    1: number; // Beginner
    2: number; // Novice
    3: number; // Intermediate
    4: number; // Advanced
    5: number; // Expert
  };
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
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
    MenuModule
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Skills Management</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Manage organizational skills, track proficiency, and identify development opportunities
            </p>
          </div>
          <div class="flex gap-2">
            <p-button 
              *ngIf="canManageSkills()"
              label="Add Skill" 
              icon="pi pi-plus"
              (click)="showAddSkillDialog = true"
              pTooltip="Add New Skill">
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
      <div *ngIf="isLoading() && !skills().length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading skills data...</span>
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
      <div *ngIf="!isLoading() || skills().length" class="px-6">
        <p-fluid>
          <p-tabs value="overview">
            <p-tablist>
              <p-tab value="overview">Overview</p-tab>
              <p-tab value="management">Skills Management</p-tab>
              <p-tab value="gaps">Skills Gap Analysis</p-tab>
              <p-tab value="recommendations">Recommendations</p-tab>
              <p-tab value="intelligence">Intelligence</p-tab>
            </p-tablist>

            <!-- Overview Tab -->
            <p-tabpanel value="overview" header="Skills Overview" leftIcon="pi pi-chart-pie">

              <!-- Charts Section -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Skills by Category Chart -->
                <p-card header="Skills Distribution by Category">
                  <div class="flex items-center justify-center h-96">
                    <p-chart 
                      *ngIf="skillsCategoryChart().data && skillsCategoryChart().data.labels?.length"
                      type="doughnut" 
                      [data]="skillsCategoryChart().data" 
                      [options]="skillsCategoryChart().options"
                      class="w-full h-full">
                    </p-chart>
                    <div *ngIf="!skillsCategoryChart().data || !skillsCategoryChart().data.labels?.length" 
                         class="flex items-center justify-center h-full text-surface-500">
                      <div class="text-center">
                        <i class="pi pi-chart-pie text-6xl mb-4 block opacity-30"></i>
                        <p>No data available</p>
                      </div>
                    </div>
                  </div>
                </p-card>

                <!-- Proficiency Levels Chart -->
                <p-card header="Proficiency Levels Distribution">
                  <div class="h-96">
                    <p-chart 
                      *ngIf="proficiencyChart().data && proficiencyChart().data.labels?.length"
                      type="bar" 
                      [data]="proficiencyChart().data" 
                      [options]="proficiencyChart().options"
                      styleClass="w-full h-full">
                    </p-chart>
                    <div *ngIf="!proficiencyChart().data || !proficiencyChart().data.labels?.length" 
                         class="flex items-center justify-center h-full text-surface-500">
                      <div class="text-center">
                        <i class="pi pi-chart-bar text-6xl mb-4 block opacity-30"></i>
                        <p>No data available</p>
                      </div>
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- Top Skills and Categories -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Top Skills -->
                <p-card header="Most Popular Skills">
                  <div *ngIf="skillsIntelligence()?.mostCommonSkills?.length; else noTopSkills" class="space-y-3">
                    <div *ngFor="let topSkill of skillsIntelligence()!.mostCommonSkills.slice(0, 10)" 
                         class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                      <div>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">
                          {{ topSkill.skill.name }}
                        </div>
                        <p-tag 
                          *ngIf="topSkill.skill.category" 
                          [value]="topSkill.skill.category" 
                          severity="secondary"
                          styleClass="text-xs mt-1">
                        </p-tag>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-primary">{{ topSkill.employeeCount }}</div>
                        <div class="text-xs text-surface-600 dark:text-surface-300">employees</div>
                      </div>
                    </div>
                  </div>
                  <ng-template #noTopSkills>
                    <div class="text-center py-8 text-surface-500 dark:text-surface-400">
                      <i class="pi pi-star text-4xl mb-3 block opacity-30"></i>
                      <p>No skill data available</p>
                    </div>
                  </ng-template>
                </p-card>

                <!-- Skills Categories Overview -->
                <p-card header="Skills by Category">
                  <div *ngIf="skillCategories().length; else noCategories" class="space-y-3">
                    <div *ngFor="let category of skillCategories()" 
                         class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                      <div class="flex justify-between items-center mb-2">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                          {{ category.name || 'Uncategorized' }}
                        </h6>
                        <p-badge [value]="category.count"></p-badge>
                      </div>
                      <p-progressBar 
                        [value]="(category.count / skills().length) * 100" 
                        [showValue]="false">
                      </p-progressBar>
                      <div class="text-xs text-surface-600 dark:text-surface-300 mt-1">
                        {{ ((category.count / skills().length) * 100).toFixed(1) }}% of total skills
                      </div>
                    </div>
                  </div>
                  <ng-template #noCategories>
                    <div class="text-center py-8 text-surface-500 dark:text-surface-400">
                      <i class="pi pi-tags text-4xl mb-3 block opacity-30"></i>
                      <p>No categories available</p>
                    </div>
                  </ng-template>
                </p-card>
              </div>
            </p-tabpanel>

            <!-- Skills Management Tab -->
            <p-tabpanel value="management" header="Skills Management" leftIcon="pi pi-cog">
              <div class="mb-4">
                <div class="flex flex-wrap gap-4 items-center">
                  <div class="flex-1 min-w-0">
                    <span class="p-input-icon-left w-full">
                      <input 
                        pInputText 
                        type="text" 
                        [(ngModel)]="managementSearchTerm"
                        (input)="filterSkills()"
                        placeholder="Search skills..." 
                        class="w-full">
                    </span>
                  </div>
                  <p-select
                    [(ngModel)]="selectedManagementCategory"
                    [options]="categoryOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="All Categories"
                    (onChange)="filterSkills()"
                    [showClear]="true">
                  </p-select>
                  <p-toggleButton
                    [(ngModel)]="showInactiveSkills"
                    onLabel="Hide Inactive"
                    offLabel="Show Inactive"
                    onIcon="pi pi-eye-slash"
                    offIcon="pi pi-eye"
                    (onChange)="filterSkills()">
                  </p-toggleButton>
                </div>
              </div>

              <!-- Skills Table -->
              <p-card>
                <p-table 
                  [value]="filteredSkills()" 
                  [loading]="skillsLoading()"
                  [paginator]="true" 
                  [rows]="10"
                  [rowHover]="true"
                  styleClass="p-datatable-gridlines">
                  
                  <ng-template pTemplate="header">
                    <tr>
                      <th pSortableColumn="name">
                        Skill Name <p-sortIcon field="name"></p-sortIcon>
                      </th>
                      <th pSortableColumn="category">
                        Category <p-sortIcon field="category"></p-sortIcon>
                      </th>
                      <th>Description</th>
                      <th pSortableColumn="isActive">
                        Status <p-sortIcon field="isActive"></p-sortIcon>
                      </th>
                      <th>Employee Count</th>
                      <th>Actions</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-skill>
                    <tr>
                      <td>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">
                          {{ skill.name }}
                        </div>
                      </td>
                      <td>
                        <p-tag 
                          *ngIf="skill.category; else noCategory" 
                          [value]="skill.category" 
                          severity="secondary">
                        </p-tag>
                        <ng-template #noCategory>
                          <span class="text-surface-400">No category</span>
                        </ng-template>
                      </td>
                      <td>
                        <span class="text-surface-600 dark:text-surface-300">
                          {{ skill.description || 'No description' }}
                        </span>
                      </td>
                      <td>
                        <p-tag 
                          [value]="skill.isActive ? 'Active' : 'Inactive'"
                          [severity]="skill.isActive ? 'success' : 'danger'">
                        </p-tag>
                      </td>
                      <td>
                        <p-badge [value]="getSkillEmployeeCount(skill.id)"></p-badge>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <p-button 
                            icon="pi pi-eye"
                            size="small"
                            severity="secondary"
                            [text]="true"
                            (click)="viewSkillDetails(skill)"
                            pTooltip="View Details">
                          </p-button>
                          <p-button 
                            *ngIf="canManageSkills()"
                            icon="pi pi-pencil"
                            size="small"
                            severity="secondary"
                            [text]="true"
                            (click)="editSkill(skill)"
                            pTooltip="Edit Skill">
                          </p-button>
                          <p-button 
                            *ngIf="canManageSkills()"
                            icon="pi pi-trash"
                            size="small"
                            severity="danger"
                            [text]="true"
                            (click)="deleteSkill(skill)"
                            pTooltip="Deactivate Skill">
                          </p-button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="6" class="text-center py-8">
                        <div class="text-surface-500 dark:text-surface-400">
                          <i class="pi pi-star text-4xl mb-3 block"></i>
                          No skills found
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            </p-tabpanel>

            <!-- Skills Gap Analysis Tab -->
            <p-tabpanel value="gaps" header="Skills Gap Analysis" leftIcon="pi pi-chart-line">
              <div class="mb-4">
                <div class="flex flex-wrap gap-4 items-center">
                  <p-select
                    [(ngModel)]="selectedGapEmployee"
                    [options]="employeeOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Employee"
                    (onChange)="loadSkillGaps()"
                    [showClear]="true"
                    class="min-w-64">
                  </p-select>
                  <p-select
                    [(ngModel)]="selectedTargetPosition"
                    [options]="positionOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Target Position"
                    (onChange)="loadSkillGaps()"
                    [showClear]="true"
                    class="min-w-64">
                  </p-select>
                  <p-button 
                    label="Analyze Gaps"
                    icon="pi pi-chart-line"
                    (click)="loadSkillGaps()"
                    [disabled]="!selectedGapEmployee || !selectedTargetPosition"
                    [loading]="gapsLoading()">
                  </p-button>
                </div>
              </div>

              <!-- Skill Gaps Loading -->
              <div *ngIf="gapsLoading()" class="text-center py-8">
                <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                <p class="text-surface-600 dark:text-surface-300 mt-2">Analyzing skill gaps...</p>
              </div>

              <!-- Skill Gaps Results -->
              <div *ngIf="!gapsLoading() && skillGaps().length" class="space-y-4">
                <p-card header="Skills Gap Analysis Results">
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <!-- Gap Summary -->
                    <p-card>
                      <div class="text-center">
                        <div class="text-3xl font-bold text-red-500">{{ getTotalGap() }}</div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Total Gap Points</div>
                      </div>
                    </p-card>
                    <p-card>
                      <div class="text-center">
                        <div class="text-3xl font-bold text-orange-500">{{ getMandatoryGaps() }}</div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Mandatory Skills Missing</div>
                      </div>
                    </p-card>
                    <p-card>
                      <div class="text-center">
                        <div class="text-3xl font-bold text-green-500">{{ getReadinessPercentage() }}%</div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">Skills Readiness</div>
                      </div>
                    </p-card>
                  </div>

                  <!-- Gap Details -->
                  <div class="space-y-3">
				  <div *ngFor="let gap of skillGaps(); trackBy: trackByGapId" 
                         class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg"
                         [ngClass]="{
                           'border-red-300 bg-red-50 dark:bg-red-900/20': gap.isMandatory && gap.gap > 0,
                           'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20': !gap.isMandatory && gap.gap > 2,
                           'border-green-300 bg-green-50 dark:bg-green-900/20': gap.gap === 0
                         }">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                            {{ gap.skillName }}
                          </h6>
                          <div class="flex items-center gap-2">
                            <p-tag 
                              *ngIf="gap.category" 
                              [value]="gap.category" 
                              severity="secondary"
                              styleClass="text-xs">
                            </p-tag>
                            <p-tag 
                              *ngIf="gap.isMandatory"
                              value="Mandatory"
                              severity="danger"
                              styleClass="text-xs">
                            </p-tag>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-lg font-bold" 
                               [ngClass]="{
                                 'text-red-500': gap.gap > 2,
                                 'text-orange-500': gap.gap > 0 && gap.gap <= 2,
                                 'text-green-500': gap.gap === 0
                               }">
                            {{ gap.gap === 0 ? '✓' : '+' + gap.gap }}
                          </div>
                          <div class="text-xs text-surface-600 dark:text-surface-300">
                            {{ gap.gap === 0 ? 'Met' : 'Gap' }}
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-4">
                          <div class="text-center">
                            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Current</div>
                            <p-rating 
                              [ngModel]="gap.currentLevel"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                          </div>
                          <i class="pi pi-arrow-right text-surface-400"></i>
                          <div class="text-center">
                            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Required</div>
                            <p-rating 
                              [ngModel]="gap.requiredLevel"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                          </div>
                        </div>
                      </div>

                      <div class="text-sm text-surface-600 dark:text-surface-300">
                        {{ getGapMessage(gap) }}
                      </div>
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- No Gap Data -->
              <div *ngIf="!gapsLoading() && !skillGaps().length && (selectedGapEmployee && selectedTargetPosition)" class="text-center py-12">
                <i class="pi pi-check-circle text-6xl text-green-500 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">No Skills Gaps Found</h3>
                <p class="text-surface-500 dark:text-surface-400">The selected employee meets all skill requirements for the target position</p>
              </div>

              <!-- Gap Analysis Instructions -->
              <div *ngIf="!gapsLoading() && !skillGaps().length && (!selectedGapEmployee || !selectedTargetPosition)" class="text-center py-12">
                <i class="pi pi-chart-line text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">Skills Gap Analysis</h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  Select an employee and target position to analyze skill gaps
                </p>
              </div>
            </p-tabpanel>

            <!-- Recommendations Tab -->
            <p-tabpanel value="recommendations" header="Skill Recommendations" leftIcon="pi pi-lightbulb">
              <div class="mb-4">
                <div class="flex flex-wrap gap-4 items-center">
                  <p-select
                    [(ngModel)]="selectedRecommendationEmployee"
                    [options]="employeeOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Employee"
                    (onChange)="loadSkillRecommendations()"
                    [showClear]="true"
                    class="min-w-64">
                  </p-select>
                  <p-button 
                    label="Get Recommendations"
                    icon="pi pi-lightbulb"
                    (click)="loadSkillRecommendations()"
                    [disabled]="!selectedRecommendationEmployee"
                    [loading]="recommendationsLoading()">
                  </p-button>
                </div>
              </div>

              <!-- Recommendations Loading -->
              <div *ngIf="recommendationsLoading()" class="text-center py-8">
                <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                <p class="text-surface-600 dark:text-surface-300 mt-2">Loading skill recommendations...</p>
              </div>

              <!-- Skill Recommendations -->
              <div *ngIf="!recommendationsLoading() && skillRecommendations().length" class="space-y-4">
                <div *ngFor="let recommendation of skillRecommendations()" 
                     class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                        {{ recommendation.skillName }}
                      </h5>
                      <p class="text-sm text-surface-600 dark:text-surface-300 m-0 mb-2">
                        {{ recommendation.category }}
                      </p>
                      <div class="flex items-center gap-2">
                        <p-chip 
                          *ngFor="let path of recommendation.careerPaths" 
                          [label]="path"
                          styleClass="text-xs">
                        </p-chip>
                      </div>
                    </div>
                    <p-tag 
                      [value]="recommendation.priority" 
                      [severity]="getPrioritySeverity(recommendation.priority)">
                    </p-tag>
                  </div>
                  
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-4">
                      <div class="text-center">
                        <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Current</div>
                        <p-rating 
                          [ngModel]="recommendation.currentLevel"
                          [readonly]="true"
                          [stars]="5">
                        </p-rating>
                      </div>
                      <i class="pi pi-arrow-right text-surface-400"></i>
                      <div class="text-center">
                        <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Recommended</div>
                        <p-rating 
                          [ngModel]="recommendation.recommendedLevel"
                          [readonly]="true"
                          [stars]="5">
                        </p-rating>
                      </div>
                    </div>
                  </div>

                  <p class="text-sm text-surface-700 dark:text-surface-200 mb-3">
                    <strong>Reason:</strong> {{ recommendation.reason }}
                  </p>
                </div>
              </div>

              <!-- No Recommendations -->
              <div *ngIf="!recommendationsLoading() && !skillRecommendations().length && selectedRecommendationEmployee" class="text-center py-12">
                <i class="pi pi-lightbulb text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">No Recommendations Available</h3>
                <p class="text-surface-500 dark:text-surface-400">No skill recommendations found for the selected employee</p>
              </div>

              <!-- Recommendations Instructions -->
              <div *ngIf="!recommendationsLoading() && !skillRecommendations().length && !selectedRecommendationEmployee" class="text-center py-12">
                <i class="pi pi-lightbulb text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">Skill Recommendations</h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  Select an employee to get personalized skill development recommendations
                </p>
              </div>
            </p-tabpanel>

            <!-- Intelligence Tab -->
            <p-tabpanel value="intelligence" header="Skills Intelligence" leftIcon="pi pi-brain">
              <!-- Intelligence Loading -->
              <div *ngIf="intelligenceLoading()" class="text-center py-8">
                <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                <p class="text-surface-600 dark:text-surface-300 mt-2">Loading skills intelligence...</p>
              </div>

              <!-- Skills Intelligence Content -->
              <div *ngIf="!intelligenceLoading() && skillsIntelligence()" class="space-y-6">
                <!-- Top Skills Analysis -->
                <p-card *ngIf="skillsIntelligence()?.mostCommonSkills?.length" header="Top Skills in Organization">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div *ngFor="let topSkill of skillsIntelligence()!.mostCommonSkills.slice(0, 9)" 
                         class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                      <div class="flex justify-between items-start mb-2">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                          {{ topSkill.skill.name }}
                        </h6>
                        <p-badge [value]="topSkill.employeeCount" severity="info"></p-badge>
                      </div>
                      <div class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                        {{ topSkill.skill.category || 'Uncategorized' }}
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-surface-500 dark:text-surface-400">Avg Level:</span>
                        <p-rating 
                          [ngModel]="Math.round(topSkill.averageProficiency)"
                          [readonly]="true"
                          [stars]="5">
                        </p-rating>
                      </div>
                    </div>
                  </div>
                </p-card>

                <!-- Skills Gaps Analysis -->
                <p-card *ngIf="skillsIntelligence()?.skillGaps?.length" header="Organization-wide Skill Gaps">
                  <div class="space-y-3">
                    <div *ngFor="let gap of skillsIntelligence()!.skillGaps.slice(0, 10)" 
                         class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                      <div>
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                          {{ gap.skill.name }}
                        </h6>
                        <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                          {{ gap.skill.category || 'Uncategorized' }}
                        </p>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-red-500">{{ gap.gap }}</div>
                        <div class="text-xs text-surface-600 dark:text-surface-300">Gap Size</div>
                      </div>
                    </div>
                  </div>
                </p-card>

                <!-- Emerging Skills -->
                <p-card *ngIf="skillsIntelligence()?.emergingSkills?.length" header="Emerging Skills">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div *ngFor="let emergingSkill of skillsIntelligence()!.emergingSkills.slice(0, 6)" 
                         class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      <div class="flex items-center gap-2 mb-2">
                        <i class="pi pi-trending-up text-blue-500"></i>
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                          {{ emergingSkill.skill.name }}
                        </h6>
                      </div>
                      <p-tag 
                        value="Trending"
                        severity="info"
                        styleClass="text-xs">
                      </p-tag>
                    </div>
                  </div>
                </p-card>

                <!-- Intelligence Recommendations -->
                <p-card *ngIf="skillsIntelligence()?.recommendations?.length" header="AI Recommendations">
                  <div class="space-y-3">
                    <div *ngFor="let recommendation of skillsIntelligence()!.recommendations" 
                         class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <i class="pi pi-lightbulb text-blue-500 mt-0.5"></i>
                      <span class="text-sm text-surface-700 dark:text-surface-200">{{ recommendation }}</span>
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- No Intelligence Data -->
              <div *ngIf="!intelligenceLoading() && !skillsIntelligence()" class="text-center py-12">
                <i class="pi pi-brain text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  Skills Intelligence Loading
                </h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  Our AI is analyzing your organization's skills data
                </p>
                <p-button 
                  label="Request Analysis" 
                  icon="pi pi-refresh"
                  severity="secondary"
                  [outlined]="true"
                  (click)="loadSkillsIntelligence()">
                </p-button>
              </div>
            </p-tabpanel>
          </p-tabs>
        </p-fluid>
      </div>

      <!-- Add Skill Dialog -->
      <p-dialog 
        header="Add New Skill" 
        [(visible)]="showAddSkillDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Skill Name *
            </label>
            <input 
              pInputText 
              [(ngModel)]="newSkill.name"
              class="w-full"
              placeholder="e.g. JavaScript Programming">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Category
            </label>
            <input 
              pInputText 
              [(ngModel)]="newSkill.category"
              class="w-full"
              placeholder="e.g. Programming Languages">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Description
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="newSkill.description"
              rows="3"
              class="w-full"
              placeholder="Describe this skill...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelAddSkill()">
          </p-button>
          <p-button 
            label="Create Skill" 
            (click)="addSkill()"
            [disabled]="!newSkill.name"
            [loading]="isAddingSkill()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Edit Skill Dialog -->
      <p-dialog 
        header="Edit Skill" 
        [(visible)]="showEditSkillDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div class="space-y-4" *ngIf="editingSkill">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Skill Name *
            </label>
            <input 
              pInputText 
              [(ngModel)]="editingSkill.name"
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Category
            </label>
            <input 
              pInputText 
              [(ngModel)]="editingSkill.category"
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Description
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="editingSkill.description"
              rows="3"
              class="w-full">
            </textarea>
          </div>
          <div class="flex items-center">
            <p-checkbox [(ngModel)]="editingSkill.isActive" [binary]="true"/>
            <label class="ml-2">Active</label>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelEditSkill()">
          </p-button>
          <p-button 
            label="Update Skill" 
            (click)="updateSkill()"
            [loading]="isUpdatingSkill()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- View Skill Details Dialog -->
      <p-dialog 
        header="Skill Details" 
        [(visible)]="showSkillDetailsDialog" 
        [modal]="true"
        styleClass="w-full max-w-2xl">
        <div *ngIf="selectedSkillForDetails" class="space-y-4">
          <!-- Basic Info -->
          <p-card header="Basic Information">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Skill Name
                </label>
                <div class="text-surface-900 dark:text-surface-0 font-medium">
                  {{ selectedSkillForDetails.name }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Category
                </label>
                <div class="text-surface-900 dark:text-surface-0 font-medium">
                  {{ selectedSkillForDetails.category || 'No category' }}
                </div>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Description
                </label>
                <div class="text-surface-900 dark:text-surface-0">
                  {{ selectedSkillForDetails.description || 'No description provided' }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Status
                </label>
                <p-tag 
                  [value]="selectedSkillForDetails.isActive ? 'Active' : 'Inactive'"
                  [severity]="selectedSkillForDetails.isActive ? 'success' : 'danger'">
                </p-tag>
              </div>
            </div>
          </p-card>

          <!-- Employees with this skill -->
          <p-card *ngIf="skillEmployees().length" header="Employees with this Skill">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              <div *ngFor="let emp of skillEmployees()" 
                   class="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800"
                   (click)="navigateToEmployee(emp.employeeId)">
                <p-avatar 
                  [label]="getEmployeeInitials(getEmployeeName(emp.employeeId))"
                  shape="circle"
                  size="normal">
                </p-avatar>
                <div class="flex-1">
                  <div class="font-medium text-surface-900 dark:text-surface-0">
                    {{ getEmployeeName(emp.employeeId) }}
                  </div>
                  <div class="flex items-center gap-2">
                    <p-rating 
                      [ngModel]="emp.proficiencyLevel"
                      [readonly]="true"
                      [stars]="5">
                    </p-rating>
                    <span class="text-xs text-surface-600 dark:text-surface-300">
                      ({{ getProficiencyLabel(emp.proficiencyLevel) }})
                    </span>
                  </div>
                  <div *ngIf="emp.acquiredDate" class="text-xs text-surface-500 dark:text-surface-400">
                    Acquired: {{ emp.acquiredDate | date:'mediumDate' }}
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>
      </p-dialog>
    </div>
  `,
})
export class Skills implements OnInit {
  // Signals for reactive state management
  skills = signal<Skill[]>([]);
  filteredSkills = signal<Skill[]>([]);
  skillMatrix = signal<SkillMatrix[]>([]);
  filteredMatrix = signal<SkillMatrix[]>([]);
  skillGaps = signal<SkillGap[]>([]);
  skillRecommendations = signal<SkillRecommendation[]>([]);
  skillsIntelligence = signal<SkillsIntelligence | null>(null);
  skillEmployees = signal<EmployeeSkill[]>([]);
  employees = signal<Employee[]>([]);
  departments = signal<Department[]>([]);
  positions = signal<Position[]>([]);

  Math = Math;

  // Loading states
  isLoading = signal<boolean>(false);
  skillsLoading = signal<boolean>(false);
  matrixLoading = signal<boolean>(false);
  gapsLoading = signal<boolean>(false);
  recommendationsLoading = signal<boolean>(false);
  intelligenceLoading = signal<boolean>(false);
  isAddingSkill = signal<boolean>(false);
  isUpdatingSkill = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Dialog states
  showAddSkillDialog = false;
  showEditSkillDialog = false;
  showSkillDetailsDialog = false;

  // Filter states
  managementSearchTerm = '';
  matrixSearchTerm = '';
  selectedManagementCategory: string | null = null;
  selectedMatrixCategory: string | null = null;
  selectedGapEmployee: number | null = null;
  selectedTargetPosition: number | null = null;
  selectedRecommendationEmployee: number | null = null;
  showInactiveSkills = true;
  showMatrixDetails = true;

  // Chart data
  skillsCategoryChart = signal<any>({ data: null, options: {} });
  proficiencyChart = signal<any>({ data: null, options: {} });

  // Forms
  newSkill: CreateSkill = {
    name: '',
    category: '',
    description: ''
  };

  editingSkill: Skill | null = null;
  selectedSkillForDetails: Skill | null = null;

  // Computed properties
  skillCategories = computed(() => {
    const skills = this.skills();
    const categories = new Map<string, number>();
    
    skills.forEach(skill => {
      const category = skill.category || 'Uncategorized';
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    return Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
  });

  categoryOptions = computed(() => [
    { label: 'All Categories', value: null },
    ...this.skillCategories().map(cat => ({ label: cat.name, value: cat.name }))
  ]);

  employeeOptions = computed(() => 
    this.employees().map(emp => ({ 
      label: emp.fullName, 
      value: emp.id 
    }))
  );

  positionOptions = computed(() => 
    this.positions().map(pos => ({ 
      label: pos.title, 
      value: pos.id 
    }))
  );

  constructor(
    private skillsService: SkillsService,
    private intelligenceService: IntelligenceService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private positionService: PositionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {
    this.initChartOptions();
  }

  ngOnInit() {
  this.initChartOptions();
  
  // Add a small delay to ensure DOM is ready
  setTimeout(() => {
    this.loadData();
  }, 100);
  }

  async loadData() {
  this.isLoading.set(true);
  this.errorMessage.set('');

  try {
    // Load dependencies first
    await Promise.all([
      this.loadPositions(),
      this.loadEmployees(),
      this.loadDepartments()
    ]);

    // Load skills and wait for completion
    await this.loadSkills();
    
    // Only build matrix after skills are loaded
    if (this.skills().length > 0) {
      await this.buildSkillMatrix();
    }

    // Load intelligence data last
    await this.loadSkillsIntelligence();
    
  } catch (error) {
    console.error('Error loading data:', error);
    this.errorMessage.set('Failed to load data. Please try again.');
  } finally {
    this.isLoading.set(false);
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

  async loadSkills() {
    try {
      this.skillsLoading.set(true);
      const skills = await this.skillsService.getAllSkills(true).toPromise();
      if (skills) {
        this.skills.set(skills);
		this.filteredSkills.set(skills);
        this.updateChartsData();
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      this.skillsLoading.set(false);
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

  async loadDepartments() {
    try {
      const departments = await this.departmentService.getAllDepartments().toPromise();
      if (departments) {
        this.departments.set(departments);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  async loadSkillsIntelligence() {
    try {
      this.intelligenceLoading.set(true);
      const intelligence = await this.intelligenceService.getSkillsIntelligence().toPromise();
      if (intelligence) {
        this.skillsIntelligence.set(intelligence);
      }
    } catch (error) {
      console.error('Error loading skills intelligence:', error);
    } finally {
      this.intelligenceLoading.set(false);
    }
  }

  async buildSkillMatrix() {
  try {
    this.matrixLoading.set(true);
    const skills = this.skills();
    
    console.log('Building matrix for skills:', skills.length);
    
    if (skills.length === 0) {
      this.skillMatrix.set([]);
      this.filteredMatrix.set([]);
      return;
    }

    // Fix: Use Promise.allSettled to handle partial failures
    const matrixPromises = skills.map(async (skill) => {
      try {
        const employees = await this.skillsService.getEmployeeSkills(skill.id).toPromise();
        
        const safeEmployees = employees || [];
        const levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalLevel = 0;

        safeEmployees.forEach(emp => {
          const level = emp.proficiencyLevel as 1 | 2 | 3 | 4 | 5;
          if (level >= 1 && level <= 5) {
            levels[level]++;
            totalLevel += level;
          }
        });

        return {
          skill,
          employees: safeEmployees,
          averageLevel: safeEmployees.length > 0 ? totalLevel / safeEmployees.length : 0,
          totalEmployees: safeEmployees.length,
          levels
        };
      } catch (error) {
        console.error(`Error loading employees for skill ${skill.name}:`, error);
        return {
          skill,
          employees: [],
          averageLevel: 0,
          totalEmployees: 0,
          levels: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }
    });

    const results = await Promise.allSettled(matrixPromises);
    const matrix = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    console.log('Built matrix:', matrix.length, matrix);
    
    this.skillMatrix.set(matrix);
    this.filteredMatrix.set([...matrix]);

  } catch (error) {
    console.error('Error building skill matrix:', error);
    this.skillMatrix.set([]);
    this.filteredMatrix.set([]);
  } finally {
    this.matrixLoading.set(false);
  }
}

  loadSkillGaps() {
    if (!this.selectedGapEmployee || !this.selectedTargetPosition) return;

    this.gapsLoading.set(true);
    this.skillsService.getSkillGaps(this.selectedGapEmployee, this.selectedTargetPosition).subscribe({
      next: (gaps) => {
        this.skillGaps.set(gaps);
        this.gapsLoading.set(false);
      },
      error: (error) => {
        this.gapsLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load skill gaps'
        });
        console.error('Error loading skill gaps:', error);
      }
    });
  }

  loadSkillRecommendations() {
    if (!this.selectedRecommendationEmployee) return;

    this.recommendationsLoading.set(true);
    this.intelligenceService.getSkillDevelopmentRecommendations(this.selectedRecommendationEmployee).subscribe({
      next: (recommendations) => {
        // Convert to SkillRecommendation format
        const skillRecs: SkillRecommendation[] = recommendations.map(rec => ({
          skillId: rec.skill.id,
          skillName: rec.skill.name,
          category: rec.skill.category || 'Other',
          currentLevel: rec.currentLevel,
          recommendedLevel: rec.recommendedLevel,
          priority: rec.priority,
          reason: rec.reason,
          careerPaths: [] // This would need to be populated from the rec data
        }));
        
        this.skillRecommendations.set(skillRecs);
        this.recommendationsLoading.set(false);
      },
      error: (error) => {
        this.recommendationsLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load skill recommendations'
        });
        console.error('Error loading skill recommendations:', error);
      }
    });
  }

  refreshData() {
    this.loadData();
  }

  // Skills Management
  addSkill() {
    if (!this.newSkill.name.trim()) return;

    this.isAddingSkill.set(true);
    this.skillsService.createSkill(this.newSkill).subscribe({
      next: (skill) => {
        const currentSkills = this.skills();
        this.skills.set([...currentSkills, skill]);
        this.filteredSkills.set([...this.filteredSkills(), skill]);
        this.updateChartsData();
        this.cancelAddSkill();
        this.isAddingSkill.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill added successfully'
        });
      },
      error: (error) => {
        this.isAddingSkill.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add skill'
        });
        console.error('Error adding skill:', error);
      }
    });
  }

  editSkill(skill: Skill) {
    this.editingSkill = { ...skill };
    this.showEditSkillDialog = true;
  }

  updateSkill() {
    if (!this.editingSkill) return;

    this.isUpdatingSkill.set(true);
    const updateDto: UpdateSkill = {
      name: this.editingSkill.name,
      category: this.editingSkill.category,
      description: this.editingSkill.description,
      isActive: this.editingSkill.isActive
    };

    this.skillsService.updateSkill(this.editingSkill.id, updateDto).subscribe({
      next: (updatedSkill) => {
        const skills = [...this.skills()];
        const index = skills.findIndex(s => s.id === updatedSkill.id);
        if (index !== -1) {
          skills[index] = updatedSkill;
          this.skills.set(skills);
          this.filterSkills();
          this.updateChartsData();
        }
        this.cancelEditSkill();
        this.isUpdatingSkill.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill updated successfully'
        });
      },
      error: (error) => {
        this.isUpdatingSkill.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update skill'
        });
        console.error('Error updating skill:', error);
      }
    });
  }

  deleteSkill(skill: Skill) {
    this.confirmationService.confirm({
      message: `Are you sure you want to deactivate the skill "${skill.name}"? This will not delete existing employee skills.`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.skillsService.deactivateSkill(skill.id).subscribe({
          next: () => {
            const skills = [...this.skills()];
            const index = skills.findIndex(s => s.id === skill.id);
            if (index !== -1) {
              skills[index] = { ...skills[index], isActive: false };
              this.skills.set(skills);
              this.filterSkills();
              this.updateChartsData();
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Skill deactivated successfully'
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to deactivate skill'
            });
            console.error('Error deactivating skill:', error);
          }
        });
      }
    });
  }

  viewSkillDetails(skill: Skill) {
    this.selectedSkillForDetails = skill;
    this.showSkillDetailsDialog = true;
    
    // Load employees with this skill
    this.skillsService.getEmployeeSkills(skill.id).subscribe({
      next: (employees) => {
        this.skillEmployees.set(employees);
      },
      error: (error) => {
        console.error('Error loading skill employees:', error);
      }
    });
  }

  // Filter methods
  filterSkills() {
    let filtered = this.skills();

    // Filter by search term
    if (this.managementSearchTerm.trim()) {
      const term = this.managementSearchTerm.toLowerCase();
      filtered = filtered.filter(skill => 
        skill.name.toLowerCase().includes(term) ||
        (skill.category?.toLowerCase().includes(term)) ||
        (skill.description?.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (this.selectedManagementCategory) {
      filtered = filtered.filter(skill => skill.category === this.selectedManagementCategory);
    }

    // Filter by active status
    if (!this.showInactiveSkills) {
      filtered = filtered.filter(skill => skill.isActive);
    }

    this.filteredSkills.set(filtered);
  }

  filterMatrix() {
  const baseMatrix = this.skillMatrix();
  console.log('Filtering matrix, base count:', baseMatrix.length);
  
  let filtered = [...baseMatrix]; // Create a copy

  // Filter by search term
  if (this.matrixSearchTerm.trim()) {
    const term = this.matrixSearchTerm.toLowerCase();
    filtered = filtered.filter(matrix => 
      matrix.skill.name.toLowerCase().includes(term) ||
      (matrix.skill.category?.toLowerCase().includes(term))
    );
  }

  // Filter by category
  if (this.selectedMatrixCategory) {
    filtered = filtered.filter(matrix => matrix.skill.category === this.selectedMatrixCategory);
  }

  console.log('Filtered matrix count:', filtered.length);
  this.filteredMatrix.set(filtered);
  }

  // Dialog management
  cancelAddSkill() {
    this.showAddSkillDialog = false;
    this.newSkill = {
      name: '',
      category: '',
      description: ''
    };
  }

  cancelEditSkill() {
    this.showEditSkillDialog = false;
    this.editingSkill = null;
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    const commonOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };

    this.proficiencyChart.update(current => ({
      ...current,
      options: commonOptions
    }));
  }

  updateChartsData() {
    // Skills by Category Chart
    const categories = this.skillCategories();
    if (categories.length > 0) {
      this.skillsCategoryChart.set({
        data: {
          labels: categories.map(c => c.name),
          datasets: [{
            data: categories.map(c => c.count),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
              '#FF6384',
              '#C9CBCF'
            ]
          }]
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }

    // Proficiency Levels Chart
    const matrix = this.skillMatrix();
    if (matrix.length > 0) {
      const proficiencyData = [1, 2, 3, 4, 5].map(level => 
        matrix.reduce((sum, m) => sum + m.levels[level as keyof typeof m.levels], 0)
      );

      this.proficiencyChart.set({
        data: {
          labels: ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'],
          datasets: [{
            label: 'Number of Skills',
            data: proficiencyData,
            backgroundColor: ['#FF6B6B', '#FFB347', '#87CEEB', '#98FB98', '#DDA0DD']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  }

  // Navigation
  navigateToEmployee(employeeId: number) {
    this.router.navigate(['/employee-detail', employeeId]);
  }

  // Permission checks
  canManageSkills(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin';
  }

  // Utility methods
  getProficiencyLabel(level: number): string {
    const labels: { [key: number]: string } = {
      1: 'Beginner',
      2: 'Novice',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert'
    };
    return labels[level] || 'Unknown';
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  }

  getEmployeeName(employeeId: number): string {
    const emp = this.employees().find(e => e.id === employeeId);
    return emp ? emp.fullName : 'Unknown Employee';
  }

  getEmployeeInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getSkillEmployeeCount(skillId: number): number {
    const matrix = this.skillMatrix().find(m => m.skill.id === skillId);
    return matrix?.totalEmployees || 0;
  }

  getTotalGap(): number {
    return this.skillGaps().reduce((sum, gap) => sum + gap.gap, 0);
  }

  getMandatoryGaps(): number {
    return this.skillGaps().filter(gap => gap.isMandatory && gap.gap > 0).length;
  }

  getReadinessPercentage(): number {
    const gaps = this.skillGaps();
    if (gaps.length === 0) return 100;
    
    const metRequirements = gaps.filter(gap => gap.gap === 0).length;
    return Math.round((metRequirements / gaps.length) * 100);
  }

  getGapMessage(gap: SkillGap): string {
    if (gap.gap === 0) {
      return `✓ Meets the required level for ${gap.skillName}`;
    }
    return `Needs ${gap.gap} more level${gap.gap > 1 ? 's' : ''} in ${gap.skillName}`;
  }

  getLevelCount(matrix: SkillMatrix, level: number): number {
    return matrix.levels[level as 1 | 2 | 3 | 4 | 5];
  }

  // TrackBy functions for performance
  trackBySkillId(index: number, skill: Skill): number {
    return skill.id;
  }

  trackByMatrixId(index: number, matrix: SkillMatrix): number {
    return matrix.skill.id;
  }

  trackByGapId(index: number, gap: SkillGap): number {
    return gap.skillId;
  }

  trackByRecommendationId(index: number, rec: SkillRecommendation): number {
    return rec.skillId;
  }
}