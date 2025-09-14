import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { EmployeeService, Employee, UpdateEmployeeDto } from '../service/employee.service';
import { SkillsService, EmployeeSkill, AddEmployeeSkill, UpdateEmployeeSkill } from '../service/skills.service';
import { PerformanceReviewService, PerformanceAnalyticsDto } from '../service/performance-review.service';
import { IntelligenceService, CareerIntelligenceReport, CareerPerformanceInsight } from '../service/intelligence.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { PanelModule } from 'primeng/panel';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';
import { RatingModule } from 'primeng/rating';
import { ProgressBarModule } from 'primeng/progressbar';
import { TimelineModule } from 'primeng/timeline';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { DepartmentService } from '../service/department.service';
import { Checkbox } from "primeng/checkbox";

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProgressSpinnerModule,
    MessageModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DrawerModule,
    SelectModule,
    TabsModule,
    CardModule,
    AvatarModule,
    BadgeModule,
    ChipModule,
    TagModule,
    PaginatorModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    PanelModule,
    OrganizationChartModule,
    RatingModule,
    ProgressBarModule,
    TimelineModule,
    InputNumberModule,
    DatePickerModule,
    ToastModule,
    Checkbox
],
  providers: [MessageService],
  template: `
    <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
      <p-toast></p-toast>
      
      <!-- Header -->
      <div class="bg-surface-0 dark:bg-surface-900 shadow-sm border-b border-surface-200 dark:border-surface-700 px-6 py-4 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Employees</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Manage your organization's talent
            </p>
          </div>
          <div class="flex gap-2">
            <p-button 
              [icon]="viewMode === 'grid' ? 'pi pi-sitemap' : 'pi pi-table'"
              [label]="viewMode === 'grid' ? 'Org Chart' : 'Grid View'"
              severity="secondary" 
              [outlined]="true"
              (click)="toggleViewMode()"
              pTooltip="Toggle View Mode">
            </p-button>
            <p-button 
              icon="pi pi-refresh" 
              severity="secondary" 
              [outlined]="true"
              (click)="refreshData()"
              [loading]="isLoading"
              pTooltip="Refresh Data">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && !employees.length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading employees...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="px-6 mb-6">
        <p-message severity="error" [text]="errorMessage" styleClass="w-full">
          <ng-template pTemplate="content">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ errorMessage }}</span>
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

      <!-- Grid View -->
      <div *ngIf="!isLoading && viewMode === 'grid'" class="px-6">
        <p-card>
          <!-- Filters and Search -->
          <div class="flex flex-wrap gap-4 mb-4">
            <div class="flex-1 min-w-0">
              <span class="p-input-icon-left w-full">
                <input 
                  pInputText 
                  type="text" 
                  [(ngModel)]="searchTerm"
                  (input)="onSearch()"
                  placeholder="Search employees..." 
                  class="w-full">
              </span>
            </div>
            <p-select
              [(ngModel)]="selectedDepartment"
              [options]="departmentOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Departments"
              (onChange)="onFilterChange()"
              [showClear]="true">
            </p-select>
            <p-select 
              [(ngModel)]="selectedRole"
              [options]="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Roles"
              (onChange)="onFilterChange()"
              [showClear]="true">
            </p-select>
            <div *ngIf="userRole === 'Manager'" class="flex items-center">
              <p-checkbox [(ngModel)]="showTeamOnly" [binary]="true" (onChange)="onFilterChange()"/>
              <label for="ingredient1" class="ml-2"> Show Team Members Only </label>
            </div>
          </div>

          <!-- Employee Table -->
          <p-table 
            [value]="filteredEmployees" 
            [loading]="isLoading"
            [paginator]="true" 
            [rows]="pageSize"
            [totalRecords]="totalRecords"
            [lazy]="true"
            (onLazyLoad)="loadEmployeesLazy($event)"
            [rowHover]="true"
            styleClass="p-datatable-gridlines">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="fullName">
                  Employee <p-sortIcon field="fullName"></p-sortIcon>
                </th>
                <th pSortableColumn="department.name">
                  Department <p-sortIcon field="department.name"></p-sortIcon>
                </th>
                <th pSortableColumn="currentPosition.title">
                  Position <p-sortIcon field="currentPosition.title"></p-sortIcon>
                </th>
                <th pSortableColumn="user.role">
                  Role <p-sortIcon field="user.role"></p-sortIcon>
                </th>
                <th pSortableColumn="hireDate">
                  Hire Date <p-sortIcon field="hireDate"></p-sortIcon>
                </th>
                <th>Actions</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-employee>
              <tr (click)="openEmployeeProfile(employee)" class="cursor-pointer">
                <td>
                  <div class="flex items-center gap-3">
                    <p-avatar 
                      [label]="getInitials(employee.fullName)"
                      shape="circle"
                      size="normal">
                    </p-avatar>
                    <div>
                      <div class="font-semibold text-surface-900 dark:text-surface-0">
                        {{ employee.fullName }}
                      </div>
                      <div class="text-surface-600 dark:text-surface-300 text-sm">
                        {{ employee.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <p-tag [value]="employee.department.name" severity="info"></p-tag>
                </td>
                <td>
                  <span class="text-surface-700 dark:text-surface-200">
                    {{ employee.currentPosition?.title || 'No Position' }}
                  </span>
                </td>
                <td>
                  <p-tag 
                    [value]="employee.user.role" 
                    [severity]="getRoleSeverity(employee.user.role)">
                  </p-tag>
                </td>
                <td>
                  <span class="text-surface-600 dark:text-surface-300">
                    {{ employee.hireDate | date:'mediumDate' }}
                  </span>
                </td>
                <td>
                  <p-button 
                    icon="pi pi-eye"
                    size="small"
                    severity="secondary"
                    [outlined]="true"
                    (click)="openEmployeeProfile(employee); $event.stopPropagation()"
                    pTooltip="View Profile">
                  </p-button>
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="text-center py-8">
                  <div class="text-surface-500 dark:text-surface-400">
                    <i class="pi pi-users text-4xl mb-3 block"></i>
                    No employees found
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>

      <!-- Organization Chart View -->
      <div *ngIf="!isLoading && viewMode === 'orgchart'" class="px-6">
        <p-card>
          <div class="text-center mb-4">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
              Organization Chart
            </h3>
            <p class="text-surface-600 dark:text-surface-300">
              Click on any employee to view their profile
            </p>
          </div>
          <div class="org-chart-container overflow-auto">
            <p-organizationChart 
              [value]="orgChartData" 
              selectionMode="single"
              (onNodeSelect)="onOrgNodeSelect($event)">
              <ng-template let-node pTemplate="person">
                <div class="flex flex-col items-center p-3 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <p-avatar 
                    [label]="getInitials(node.label)"
                    shape="circle"
                    size="large"
                    styleClass="mb-2">
                  </p-avatar>
                  <div class="text-center">
                    <div class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                      {{ node.label }}
                    </div>
                    <div class="text-sm text-surface-600 dark:text-surface-300 mb-1">
                      {{ node.data?.position || 'No Position' }}
                    </div>
                    <p-tag 
                      [value]="node.data?.department" 
                      severity="info"
                      styleClass="text-xs">
                    </p-tag>
                  </div>
                </div>
              </ng-template>
            </p-organizationChart>
          </div>
        </p-card>
      </div>

      <!-- Employee Profile Sidebar -->
      <p-drawer
        [(visible)]="showProfileSidebar" 
        position="right" 
        styleClass="!w-full md:!w-150 lg:!w-[30rem]"
        [modal]="true">
        
        <ng-template pTemplate="header">
          <div class="flex items-center gap-3" *ngIf="selectedEmployee">
            <p-avatar 
              [label]="getInitials(selectedEmployee.fullName)"
              shape="circle"
              size="large">
            </p-avatar>
            <div>
              <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">
                {{ selectedEmployee.fullName }}
              </h3>
              <p class="text-surface-600 dark:text-surface-300 m-0">
                {{ selectedEmployee.currentPosition?.title || 'No Position' }}
              </p>
            </div>
          </div>
        </ng-template>

        <div *ngIf="selectedEmployee" class="h-full">
          <p-tabs>
            <!-- Profile Tab -->
            <p-tabpanel header="Profile" leftIcon="pi pi-user">
              <div class="space-y-4">
                <!-- Basic Info Card -->
                <p-card header="Basic Information">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        First Name
                      </label>
                      <input 
                        pInputText 
                        [(ngModel)]="editingEmployee.firstName"
                        [disabled]="!isEditingProfile"
                        class="w-full">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Last Name
                      </label>
                      <input 
                        pInputText 
                        [(ngModel)]="editingEmployee.lastName"
                        [disabled]="!isEditingProfile"
                        class="w-full">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Email
                      </label>
                      <input 
                        pInputText 
                        [value]="selectedEmployee.email"
                        disabled
                        class="w-full">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Phone
                      </label>
                      <input 
                        pInputText 
                        [(ngModel)]="editingEmployee.phone"
                        [disabled]="!isEditingProfile"
                        class="w-full">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Hire Date
                      </label>
                      <p-datepicker
                        [(ngModel)]="editingEmployee.hireDate"
                        [disabled]="!isEditingProfile"
                        dateFormat="dd/mm/yy"
                        [showIcon]="true"
                        styleClass="w-full">
                      </p-datepicker>
                    </div>
                    <div *ngIf="userRole === 'HR' || userRole === 'Admin'">
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Salary
                      </label>
                      <p-inputNumber 
                        [(ngModel)]="editingEmployee.salary"
                        [disabled]="!isEditingProfile"
                        mode="currency" 
                        currency="TND"
                        styleClass="w-full">
                      </p-inputNumber>
                    </div>
                  </div>

                  <!-- Edit Actions -->
                  <div class="flex gap-2 mt-4" *ngIf="canEditEmployee()">
                    <p-button 
                      *ngIf="!isEditingProfile"
                      label="Edit" 
                      icon="pi pi-pencil"
                      size="small"
                      (click)="startEditingProfile()">
                    </p-button>
                    <p-button 
                      *ngIf="isEditingProfile"
                      label="Save" 
                      icon="pi pi-check"
                      size="small"
                      (click)="saveEmployeeProfile()"
                      [loading]="isSavingProfile">
                    </p-button>
                    <p-button 
                      *ngIf="isEditingProfile"
                      label="Cancel" 
                      icon="pi pi-times"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      (click)="cancelEditingProfile()">
                    </p-button>
                  </div>
                </p-card>

                <!-- Department & Role Card -->
                <p-card header="Department & Role">
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="font-medium">Department:</span>
                      <p-tag [value]="selectedEmployee.department.name" severity="info"></p-tag>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="font-medium">Role:</span>
                      <p-tag 
                        [value]="selectedEmployee.user.role" 
                        [severity]="getRoleSeverity(selectedEmployee.user.role)">
                      </p-tag>
                    </div>
                    <div class="flex justify-between items-center" *ngIf="selectedEmployee.manager">
                      <span class="font-medium">Manager:</span>
                      <span class="text-primary cursor-pointer hover:underline" 
                            (click)="openEmployeeProfile(selectedEmployee.manager!)">
                        {{ selectedEmployee.manager.fullName }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center" *ngIf="selectedEmployee.directReports?.length">
                      <span class="font-medium">Direct Reports:</span>
                      <p-badge [value]="selectedEmployee.directReports.length"></p-badge>
                    </div>
                  </div>
                </p-card>
              </div>
            </p-tabpanel>

            <!-- Skills Tab -->
            <p-tabpanel header="Skills" leftIcon="pi pi-star">
              <div class="space-y-4">
                <!-- Skills Loading -->
                <div *ngIf="loadingSkills" class="text-center py-8">
                  <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                  <p class="text-surface-600 dark:text-surface-300 mt-2">Loading skills...</p>
                </div>

                <!-- Skills List -->
                <div *ngIf="!loadingSkills && employeeSkills.length" class="space-y-3">
                  <div class="flex justify-between items-center">
                    <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
                      Skills ({{ employeeSkills.length }})
                    </h4>
                    <p-button 
                      icon="pi pi-plus"
                      size="small"
                      severity="secondary"
                      [outlined]="true"
                      (click)="showAddSkillDialog = true"
                      pTooltip="Add Skill">
                    </p-button>
                  </div>

                  <div *ngFor="let skill of employeeSkills" 
                       class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                          {{ skill.skill.name }}
                        </h5>
                        <p-tag 
                          *ngIf="skill.skill.category" 
                          [value]="skill.skill.category" 
                          severity="secondary"
                          styleClass="text-xs">
                        </p-tag>
                      </div>
                      <div class="flex items-center gap-2">
                        <p-rating 
                          [(ngModel)]="skill.proficiencyLevel"
                          [readonly]="true"
                          [stars]="5">
                        </p-rating>
                        <span class="text-sm text-surface-600 dark:text-surface-300">
                          ({{ skillsService.getProficiencyLabel(skill.proficiencyLevel) }})
                        </span>
                      </div>
                    </div>
                    
                    <div *ngIf="skill.notes" class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                      {{ skill.notes }}
                    </div>

                    <div class="flex justify-between items-center text-xs text-surface-500 dark:text-surface-400">
                      <span *ngIf="skill.acquiredDate">
                        Acquired: {{ skill.acquiredDate | date:'mediumDate' }}
                      </span>
                      <div class="flex gap-1" *ngIf="canEditEmployee()">
                        <p-button 
                          icon="pi pi-pencil"
                          size="small"
                          severity="secondary"
                          [text]="true"
                          (click)="editSkill(skill)">
                        </p-button>
                        <p-button 
                          icon="pi pi-trash"
                          size="small"
                          severity="danger"
                          [text]="true"
                          (click)="deleteSkill(skill)">
                        </p-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- No Skills -->
                <div *ngIf="!loadingSkills && !employeeSkills.length" class="text-center py-8">
                  <i class="pi pi-star text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
                  <p class="text-surface-500 dark:text-surface-400 mb-3">No skills recorded yet</p>
                  <p-button 
                    *ngIf="canEditEmployee()"
                    label="Add First Skill"
                    icon="pi pi-plus"
                    size="small"
                    (click)="showAddSkillDialog = true">
                  </p-button>
                </div>
              </div>
            </p-tabpanel>

            <!-- Performance Tab -->
            <p-tabpanel header="Performance" leftIcon="pi pi-chart-line">
              <div class="space-y-4">
                <!-- Performance Loading -->
                <div *ngIf="loadingPerformance" class="text-center py-8">
                  <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                  <p class="text-surface-600 dark:text-surface-300 mt-2">Loading performance data...</p>
                </div>

                <!-- Performance Overview -->
                <div *ngIf="!loadingPerformance && performanceAnalytics">
                  <p-card header="Performance Overview">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-primary">
                          {{ performanceAnalytics.totalReviews }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Total Reviews
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-primary">
                          {{ performanceAnalytics.averageRating | number:'1.1-1' }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Average Rating
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-primary">
                          {{ performanceAnalytics.latestRating | number:'1.1-1' }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Latest Rating
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold" 
                             [ngClass]="{
                               'text-green-500': performanceAnalytics.ratingTrend === 'Improving',
                               'text-yellow-500': performanceAnalytics.ratingTrend === 'Stable',
                               'text-red-500': performanceAnalytics.ratingTrend === 'Declining'
                             }">
                          {{ performanceAnalytics.ratingTrend }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Trend
                        </div>
                      </div>
                    </div>

                    <!-- Performance Progress -->
                    <div class="mb-4">
                      <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">Performance vs Department Average</span>
                        <span class="text-sm text-surface-600 dark:text-surface-300">
                          {{ performanceAnalytics.departmentAverage | number:'1.1-1' }} dept avg
                        </span>
                      </div>
                      <p-progressBar 
                        [value]="(performanceAnalytics.averageRating / 5) * 100"
                        [showValue]="false">
                      </p-progressBar>
                    </div>
                  </p-card>

                  <!-- Performance History -->
                  <p-card header="Performance History" *ngIf="performanceAnalytics.performanceHistory?.length">
                    <p-timeline 
                      [value]="performanceAnalytics.performanceHistory"
                      layout="vertical"
                      align="alternate">
                      <ng-template pTemplate="content" let-item>
                        <p-card styleClass="shadow-sm">
                          <div class="flex justify-between items-start mb-2">
                            <div>
                              <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                                {{ item.reviewPeriodStart | date:'MMM yyyy' }} - 
                                {{ item.reviewPeriodEnd | date:'MMM yyyy' }}
                              </h6>
                              <p-tag 
                                [value]="item.status" 
                                [severity]="getStatusSeverity(item.status)">
                              </p-tag>
                            </div>
                            <div class="text-right">
                              <p-rating 
                                [ngModel]="item.rating"
                                [readonly]="true"
                                [stars]="5">
                              </p-rating>
                              <div class="text-sm text-surface-600 dark:text-surface-300">
                                {{ item.rating }}/5
                              </div>
                            </div>
                          </div>
                        </p-card>
                      </ng-template>
                    </p-timeline>
                  </p-card>
                </div>

                <!-- No Performance Data -->
                <div *ngIf="!loadingPerformance && !performanceAnalytics" class="text-center py-8">
                  <i class="pi pi-chart-line text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
                  <p class="text-surface-500 dark:text-surface-400">No performance data available</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Career Intelligence Tab -->
            <p-tabpanel header="Career Intelligence" leftIcon="pi pi-lightbulb">
              <div class="space-y-4">
                <!-- Career Intelligence Loading -->
                <div *ngIf="loadingCareerIntelligence" class="text-center py-8">
                  <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                  <p class="text-surface-600 dark:text-surface-300 mt-2">Loading career insights...</p>
                </div>

                <!-- Career Intelligence Content -->
                <div *ngIf="!loadingCareerIntelligence && careerIntelligence">
                  <!-- Career Opportunities -->
                  <p-card header="Career Opportunities" *ngIf="careerIntelligence.careerOpportunities?.length">
                    <div class="space-y-3">
                      <div *ngFor="let opportunity of careerIntelligence.careerOpportunities"
                           class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                        <div class="flex justify-between items-start mb-2">
                          <div>
                            <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                              {{ opportunity.title }}
                            </h6>
                            <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                              {{ opportunity.department }}
                            </p>
                          </div>
                          <div class="text-right">
                            <div class="text-sm font-semibold text-primary">
                              {{ opportunity.matchScore }}% match
                            </div>
                            <p-tag 
                              [value]="opportunity.priority" 
                              [severity]="getPrioritySeverity(opportunity.priority)">
                            </p-tag>
                          </div>
                        </div>
                        <p class="text-sm text-surface-700 dark:text-surface-200 mb-2">
                          {{ opportunity.description }}
                        </p>
                        <div class="text-xs text-surface-500 dark:text-surface-400">
                          <strong>Recommended Action:</strong> {{ opportunity.recommendedAction }}
                        </div>
                      </div>
                    </div>
                  </p-card>

                  <!-- Skill Development Recommendations -->
                  <p-card header="Skill Development" *ngIf="careerIntelligence.skillDevelopmentRecommendations?.length">
                    <div class="space-y-3">
                      <div *ngFor="let skillRec of careerIntelligence.skillDevelopmentRecommendations"
                           class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                        <div class="flex justify-between items-start mb-2">
                          <div>
                            <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                              {{ skillRec.skill.name }}
                            </h6>
                            <p-tag 
                              *ngIf="skillRec.skill.category" 
                              [value]="skillRec.skill.category" 
                              severity="secondary"
                              styleClass="text-xs mt-1">
                            </p-tag>
                          </div>
                          <p-tag 
                            [value]="skillRec.priority" 
                            [severity]="getPrioritySeverity(skillRec.priority)">
                          </p-tag>
                        </div>
                        
                        <div class="flex items-center gap-4 mb-2">
                          <div class="text-center">
                            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Current</div>
                            <p-rating 
                              [ngModel]="skillRec.currentLevel"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                          </div>
                          <i class="pi pi-arrow-right text-surface-400"></i>
                          <div class="text-center">
                            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Target</div>
                            <p-rating 
                              [ngModel]="skillRec.recommendedLevel"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                          </div>
                          <div class="ml-auto text-center">
                            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Gap</div>
                            <p-badge [value]="skillRec.gap" severity="warn"></p-badge>
                          </div>
                        </div>

                        <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                          <strong>Reason:</strong> {{ skillRec.reason }}
                        </p>

                        <div *ngIf="skillRec.suggestedActions?.length" class="text-xs">
                          <strong class="text-surface-700 dark:text-surface-200">Suggested Actions:</strong>
                          <ul class="list-disc list-inside mt-1 text-surface-600 dark:text-surface-300">
                            <li *ngFor="let action of skillRec.suggestedActions">{{ action }}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </p-card>

                  <!-- Performance Insights -->
                  <p-card header="Performance Insights" *ngIf="performanceInsights">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Key Strengths -->
                      <div>
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Key Strengths</h6>
                        <div class="space-y-1">
                          <p-chip 
                            *ngFor="let strength of performanceInsights.keyStrengths"
                            [label]="strength"
                            styleClass="mr-1 mb-1">
                          </p-chip>
                        </div>
                      </div>

                      <!-- Development Areas -->
                      <div>
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Development Areas</h6>
                        <div class="space-y-1">
                          <p-chip 
                            *ngFor="let area of performanceInsights.developmentAreas"
                            [label]="area"
                            styleClass="mr-1 mb-1"
                            [removable]="false">
                          </p-chip>
                        </div>
                      </div>
                    </div>

                    <div class="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Career Trajectory</h6>
                      <p class="text-surface-700 dark:text-surface-200 m-0">
                        {{ performanceInsights.careerTrajectory }}
                      </p>
                    </div>

                    <div *ngIf="performanceInsights.insights?.length" class="mt-4">
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Insights</h6>
                      <ul class="list-disc list-inside space-y-1 text-surface-600 dark:text-surface-300">
                        <li *ngFor="let insight of performanceInsights.insights">{{ insight }}</li>
                      </ul>
                    </div>
                  </p-card>

                  <!-- Career Path Recommendations -->
                  <p-card header="Career Path Recommendations" *ngIf="careerIntelligence.careerPathRecommendations?.length">
                    <div class="space-y-3">
                      <div *ngFor="let pathRec of careerIntelligence.careerPathRecommendations"
                           class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                        <p class="text-sm text-surface-600 dark:text-surface-300">
                          {{ pathRec.careerPath.description }}
                        </p>
                      </div>
                    </div>
                  </p-card>

                  <!-- Smart Insights -->
                  <p-card header="Smart Insights" *ngIf="careerIntelligence.smartInsights?.length">
                    <div class="space-y-2">
                      <div *ngFor="let insight of careerIntelligence.smartInsights"
                           class="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <i class="pi pi-lightbulb text-blue-500 mt-0.5"></i>
                        <span class="text-sm text-surface-700 dark:text-surface-200">{{ insight }}</span>
                      </div>
                    </div>
                  </p-card>
                </div>

                <!-- No Career Intelligence Data -->
                <div *ngIf="!loadingCareerIntelligence && !careerIntelligence" class="text-center py-8">
                  <i class="pi pi-lightbulb text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
                  <p class="text-surface-500 dark:text-surface-400">No career intelligence data available</p>
                </div>
              </div>
            </p-tabpanel>
          </p-tabs>
        </div>
      </p-drawer>

      <!-- Add Skill Dialog -->
      <p-dialog 
        header="Add Skill" 
        [(visible)]="showAddSkillDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Skill
            </label>
            <p-select
              [(ngModel)]="newSkill.skillId"
              [options]="availableSkills"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a skill"
              [filter]="true"
              filterBy="name"
              styleClass="w-full">
            </p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Proficiency Level
            </label>
            <p-rating 
              [(ngModel)]="newSkill.proficiencyLevel"
              [stars]="5">
            </p-rating>
            <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
              {{ skillsService.getProficiencyLabel(newSkill.proficiencyLevel) }}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Acquired Date (Optional)
            </label>
            <p-datepicker
              [(ngModel)]="newSkill.acquiredDate"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              styleClass="w-full">
            </p-datepicker>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Notes (Optional)
            </label>
            <textarea 
              pInputTextarea 
              [(ngModel)]="newSkill.notes"
              rows="3"
              class="w-full"
              placeholder="Add any notes about this skill...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="showAddSkillDialog = false">
          </p-button>
          <p-button 
            label="Add Skill" 
            (click)="addSkill()"
            [disabled]="!newSkill.skillId || !newSkill.proficiencyLevel"
            [loading]="isAddingSkill">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Edit Skill Dialog -->
      <p-dialog 
        header="Edit Skill" 
        [(visible)]="showEditSkillDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div class="space-y-4" *ngIf="editingSkill">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Skill
            </label>
            <input 
              pInputText 
              [value]="editingSkill.skill.name"
              disabled
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Proficiency Level
            </label>
            <p-rating 
              [(ngModel)]="editingSkill.proficiencyLevel"
              [stars]="5">
            </p-rating>
            <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
              {{ skillsService.getProficiencyLabel(editingSkill.proficiencyLevel) }}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Acquired Date (Optional)
            </label>
            <p-datepicker
              [(ngModel)]="editingSkill.acquiredDate"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              styleClass="w-full">
            </p-datepicker>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Notes (Optional)
            </label>
            <textarea 
              pInputTextarea 
              [(ngModel)]="editingSkill.notes"
              rows="3"
              class="w-full"
              placeholder="Add any notes about this skill...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="showEditSkillDialog = false">
          </p-button>
          <p-button 
            label="Update Skill" 
            (click)="updateSkill()"
            [loading]="isUpdatingSkill">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class Employees implements OnInit {
  // Loading states
  isLoading = false;
  loadingSkills = false;
  loadingPerformance = false;
  loadingCareerIntelligence = false;
  isSavingProfile = false;
  isAddingSkill = false;
  isUpdatingSkill = false;

  // Error handling
  errorMessage = '';

  // User info
  userRole = '';

  // View mode
  viewMode: 'grid' | 'orgchart' = 'grid';

  // Employee data
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  totalRecords = 0;
  pageSize = 10;

  // Organization chart
  orgChartData: TreeNode[] = [];

  // Search and filters
  searchTerm = '';
  selectedDepartment: string | null = null;
  selectedRole: string | null = null;
  showTeamOnly: boolean = false;
  departmentOptions: any[] = [];
  roleOptions: any[] = [
    { label: 'Employee', value: 'Employee' },
    { label: 'Manager', value: 'Manager' },
    { label: 'HR', value: 'HR' },
    { label: 'Admin', value: 'Admin' }
  ];

  // Profile sidebar
  showProfileSidebar = false;
  selectedEmployee: Employee | null = null;
  isEditingProfile = false;
  editingEmployee: any = {};

  // Skills management
  employeeSkills: EmployeeSkill[] = [];
  availableSkills: any[] = [];
  showAddSkillDialog = false;
  showEditSkillDialog = false;
  newSkill: AddEmployeeSkill = {
    employeeId: 0,
    skillId: 0,
    proficiencyLevel: 1
  };
  editingSkill: EmployeeSkill | null = null;

  // Performance data
  performanceAnalytics: PerformanceAnalyticsDto | null = null;

  // Career intelligence
  careerIntelligence: CareerIntelligenceReport | null = null;
  performanceInsights: CareerPerformanceInsight | null = null;

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    public skillsService: SkillsService,
    private performanceService: PerformanceReviewService,
    private intelligenceService: IntelligenceService,
    private messageService: MessageService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role || 'Employee';
    this.loadData();
    this.loadDepartmentOptions();
    this.loadAvailableSkills();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.employeeService.getAllEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
        this.filteredEmployees = employees;
        this.totalRecords = employees.length;
        
        if (this.viewMode === 'orgchart') {
          this.buildOrganizationChart();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load employees. Please try again.';
        this.isLoading = false;
        console.error('Error loading employees:', error);
      }
    });
  }

  loadDepartmentOptions() {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departmentOptions = departments.map(dept => ({ label: dept.name, value: dept.name }));
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  loadAvailableSkills() {
    this.skillsService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills = skills;
      },
      error: (error) => {
        console.error('Error loading skills:', error);
      }
    });
  }

  refreshData() {
    if (!this.isLoading) {
      this.loadData();
    }
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'orgchart' : 'grid';
    if (this.viewMode === 'orgchart') {
      this.buildOrganizationChart();
    }
  }

  onSearch() {
    if (this.searchTerm.trim()) {
      this.employeeService.searchEmployees(this.searchTerm).subscribe({
        next: (results) => {
          this.filteredEmployees = results;
          this.totalRecords = results.length;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Search Error',
            detail: 'Failed to search employees'
          });
        }
      });
    } else {
      this.onFilterChange();
    }
  }

  onFilterChange() {
    this.filteredEmployees = this.employees.filter(emp => {
      const departmentMatch = !this.selectedDepartment || emp.department?.name === this.selectedDepartment;
      const roleMatch = !this.selectedRole || emp.user?.role === this.selectedRole;
      const inTeam = emp.managerId === this.authService.getCurrentUser()?.id || !this.showTeamOnly;
      return departmentMatch && roleMatch && inTeam;
    });
    this.totalRecords = this.filteredEmployees.length;
  }

  loadEmployeesLazy(event: any) {
    // For now, we'll handle pagination client-side
    // In a real app, you'd pass the event parameters to your API
    const start = event.first || 0;
    const rows = event.rows || this.pageSize;
    // This would be an API call with pagination parameters
  }

  buildOrganizationChart() {
    if (!this.employees.length) return;

    // Find top-level managers (those without managers)
    const topManagers = this.employees.filter(emp => !emp.managerId);
    
    this.orgChartData = topManagers.map(manager => this.buildOrgNode(manager));
  }

  buildOrgNode(employee: Employee): TreeNode {
    const directReports = this.employees.filter(emp => emp.managerId === employee.id);
    
    return {
      label: employee.fullName,
      type: 'person',
      expanded: true,
      data: {
        id: employee.id,
        email: employee.email,
        position: employee.currentPosition?.title,
        department: employee.department?.name,
        employee: employee
      },
      children: directReports.map(report => this.buildOrgNode(report))
    };
  }

  onOrgNodeSelect(event: any) {
    if (event.node?.data?.employee) {
      this.openEmployeeProfile(event.node.data.employee);
    }
  }

  openEmployeeProfile(employee: Employee) {
    this.selectedEmployee = employee;
    this.resetEditingEmployee();
    this.showProfileSidebar = true;
    this.loadEmployeeSkills();
    this.loadEmployeePerformance();
    this.loadEmployeeCareerIntelligence();
  }

  resetEditingEmployee() {
    if (this.selectedEmployee) {
      this.editingEmployee = {
        firstName: this.selectedEmployee.firstName,
        lastName: this.selectedEmployee.lastName,
        phone: this.selectedEmployee.phone,
        salary: this.selectedEmployee.salary,
        hireDate: new Date(this.selectedEmployee.hireDate)
      };
    }
    this.isEditingProfile = false;
  }

  startEditingProfile() {
    this.isEditingProfile = true;
  }

  cancelEditingProfile() {
    this.resetEditingEmployee();
  }

  saveEmployeeProfile() {
    if (!this.selectedEmployee) return;

    this.isSavingProfile = true;
    const updateDto: UpdateEmployeeDto = {
      firstName: this.editingEmployee.firstName,
      lastName: this.editingEmployee.lastName,
      phone: this.editingEmployee.phone,
      salary: this.editingEmployee.salary,
      hireDate: this.editingEmployee.hireDate
    };

    this.employeeService.updateEmployee(this.selectedEmployee.id, updateDto).subscribe({
      next: (updatedEmployee) => {
        this.selectedEmployee = updatedEmployee;
        this.isEditingProfile = false;
        this.isSavingProfile = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Profile updated successfully'
        });
        // Update the employee in the main list
        const index = this.employees.findIndex(emp => emp.id === updatedEmployee.id);
        if (index !== -1) {
          this.employees[index] = updatedEmployee;
          this.onFilterChange();
        }
      },
      error: (error) => {
        this.isSavingProfile = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update profile'
        });
        console.error('Error updating profile:', error);
      }
    });
  }

  loadEmployeeSkills() {
    if (!this.selectedEmployee) return;

    this.loadingSkills = true;
    this.skillsService.getEmployeeSkills(this.selectedEmployee.id).subscribe({
      next: (skills) => {
        this.employeeSkills = skills;
        this.loadingSkills = false;
      },
      error: (error) => {
        this.loadingSkills = false;
        console.error('Error loading skills:', error);
      }
    });
  }

  loadEmployeePerformance() {
    if (!this.selectedEmployee) return;

    this.loadingPerformance = true;
    this.performanceService.getPerformanceAnalytics(this.selectedEmployee.id).subscribe({
      next: (analytics) => {
        this.performanceAnalytics = analytics;
        this.loadingPerformance = false;
      },
      error: (error) => {
        this.loadingPerformance = false;
        console.error('Error loading performance:', error);
      }
    });
  }

  loadEmployeeCareerIntelligence() {
    if (!this.selectedEmployee) return;

    this.loadingCareerIntelligence = true;

    // Load career intelligence
    this.intelligenceService.getEmployeeCareerIntelligence(this.selectedEmployee.id).subscribe({
      next: (intelligence) => {
        this.careerIntelligence = intelligence;
        this.loadingCareerIntelligence = false;
      },
      error: (error) => {
        this.loadingCareerIntelligence = false;
        console.error('Error loading career intelligence:', error);
      }
    });

    // Load performance insights
    this.intelligenceService.getPerformanceInsights(this.selectedEmployee.id).subscribe({
      next: (insights) => {
        this.performanceInsights = insights;
      },
      error: (error) => {
        console.error('Error loading performance insights:', error);
      }
    });
  }

  addSkill() {
    if (!this.selectedEmployee || !this.newSkill.skillId) return;

    this.isAddingSkill = true;
    this.newSkill.employeeId = this.selectedEmployee.id;

    this.skillsService.addEmployeeSkill(this.newSkill).subscribe({
      next: (skill) => {
        this.employeeSkills.push(skill);
        this.showAddSkillDialog = false;
        this.resetNewSkill();
        this.isAddingSkill = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill added successfully'
        });
      },
      error: (error) => {
        this.isAddingSkill = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add skill'
        });
        console.error('Error adding skill:', error);
      }
    });
  }

  editSkill(skill: EmployeeSkill) {
    this.editingSkill = { ...skill };
    this.showEditSkillDialog = true;
  }

  updateSkill() {
    if (!this.editingSkill || !this.selectedEmployee) return;

    this.isUpdatingSkill = true;
    const updateDto: UpdateEmployeeSkill = {
      proficiencyLevel: this.editingSkill.proficiencyLevel,
      acquiredDate: this.editingSkill.acquiredDate,
      notes: this.editingSkill.notes
    };

    this.skillsService.updateEmployeeSkill(
      this.selectedEmployee.id,
      this.editingSkill.skillId,
      updateDto
    ).subscribe({
      next: (updatedSkill) => {
        const index = this.employeeSkills.findIndex(s => s.id === updatedSkill.id);
        if (index !== -1) {
          this.employeeSkills[index] = updatedSkill;
        }
        this.showEditSkillDialog = false;
        this.editingSkill = null;
        this.isUpdatingSkill = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill updated successfully'
        });
      },
      error: (error) => {
        this.isUpdatingSkill = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update skill'
        });
        console.error('Error updating skill:', error);
      }
    });
  }

  deleteSkill(skill: EmployeeSkill) {
    if (!this.selectedEmployee) return;

    this.skillsService.removeEmployeeSkill(this.selectedEmployee.id, skill.skillId).subscribe({
      next: () => {
        this.employeeSkills = this.employeeSkills.filter(s => s.id !== skill.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill removed successfully'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove skill'
        });
        console.error('Error removing skill:', error);
      }
    });
  }

  resetNewSkill() {
    this.newSkill = {
      employeeId: 0,
      skillId: 0,
      proficiencyLevel: 1
    };
  }

  canEditEmployee(): boolean {
    if (!this.selectedEmployee) return false;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    console.log('Current User:', currentUser);
    console.log('Current User Role', currentUser.role);

    // HR and Admin can edit anyone
    if (currentUser.role === 'HR' || currentUser.role === 'Admin') {
      return true;
    }

    // Managers can edit their direct reports
    if (currentUser.role === 'Manager' && this.selectedEmployee.managerId === currentUser.id) {
      return true;
    }

    // Users can edit their own profile
    return currentUser.id === this.selectedEmployee.userId;
  }

  // Utility methods
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (role) {
      case 'Admin': return 'danger';
      case 'HR': return 'warning';
      case 'Manager': return 'info';
      default: return 'secondary';
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (status) {
      case 'Approved': return 'success';
      case 'Completed': return 'info';
      case 'Draft': return 'warning';
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
}