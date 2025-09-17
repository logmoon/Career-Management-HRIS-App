import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TreeNode } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { FluidModule } from 'primeng/fluid';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';

// Services
import { DepartmentService, Department, CreateDepartmentDto, UpdateDepartmentDto, DepartmentWithStats } from '../service/department.service';
import { PositionService, Position, CreatePositionDto, UpdatePositionDto, PositionWithStats } from '../service/position.service';
import { CareerPathService, CareerPath } from '../service/career-path.service';
import { IntelligenceService, DepartmentIntelligence } from '../service/intelligence.service';
import { AuthService } from '../service/auth.service';
import { EmployeeService } from '../service/employee.service';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    MessageModule,
    TableModule,
    TagModule,
    BadgeModule,
    ChipModule,
    PanelModule,
    DividerModule,
    ToolbarModule,
    ConfirmDialogModule,
    OrganizationChartModule,
    AvatarModule,
    FluidModule,
    CheckboxModule,
    AccordionModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
      <p-toast></p-toast>
      <p-confirmdialog [style]="{ width: '450px' }"></p-confirmdialog>
      
      <!-- Header -->
      <div class="bg-surface-0 dark:bg-surface-900 shadow-sm border-b border-surface-200 dark:border-surface-700 px-6 py-4 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Organization Structure</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Manage departments, positions, and organizational hierarchy
            </p>
          </div>
          <div class="flex gap-2">
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
      <div *ngIf="isLoading()" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading organization data...</span>
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
      <div *ngIf="!isLoading()" class="max-w-7xl mx-auto px-6">
        <p-fluid>
          <p-tabs value="departments">
            <p-tablist>
              <p-tab value="departments">Departments</p-tab>
              <p-tab value="positions">Positions</p-tab>
              <p-tab value="orgchart">Organization Chart</p-tab>
            </p-tablist>
            
            <!-- Departments Tab -->
            <p-tabpanel value="departments">
              <p-card>
                <ng-template pTemplate="header">
                  <p-toolbar styleClass="border-none p-0">
                    <ng-template #start>
                      <h3 class="text-xl font-semibold m-0">Departments ({{ departments().length }})</h3>
                    </ng-template>
                    <ng-template #end>
                      <p-button 
                        *ngIf="canManageDepartments()"
                        label="New Department" 
                        icon="pi pi-plus" 
                        (click)="openNewDepartmentDialog()">
                      </p-button>
                    </ng-template>
                  </p-toolbar>
                </ng-template>

                <!-- Departments Table -->
                <p-table 
                  [value]="departments()" 
                  [loading]="departmentsLoading()"
                  [paginator]="true" 
                  [rows]="10"
                  [rowHover]="true"
                  styleClass="p-datatable-gridlines">
                  
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Department</th>
                      <th>Head of Department</th>
                      <th>Employees</th>
                      <th>Positions</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-department>
                    <tr (click)="viewDepartmentDetails(department)" class="cursor-pointer">
                      <td>
                        <div>
                          <div class="font-semibold text-surface-900 dark:text-surface-0">
                            {{ department.name }}
                          </div>
                          <div class="text-surface-600 dark:text-surface-300 text-sm" *ngIf="department.description">
                            {{ department.description | slice:0:100 }}{{ department.description.length > 100 ? '...' : '' }}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div *ngIf="department.headOfDepartment; else noHead">
                          <div class="flex items-center gap-2">
                            <p-avatar 
                              [label]="getInitials(department.headOfDepartment.fullName)"
                              shape="circle"
                              size="normal">
                            </p-avatar>
                            <span class="font-medium">{{ department.headOfDepartment.fullName }}</span>
                          </div>
                        </div>
                        <ng-template #noHead>
                          <span class="text-surface-500 dark:text-surface-400 italic">No head assigned</span>
                        </ng-template>
                      </td>
                      <td>
                        <p-badge [value]="department.employeeCount || 0" severity="info"></p-badge>
                      </td>
                      <td>
                        <p-badge [value]="department.positionCount || 0" severity="secondary"></p-badge>
                      </td>
                      <td>
                        <p-tag 
                          [value]="department.isActive ? 'Active' : 'Inactive'"
                          [severity]="department.isActive ? 'success' : 'danger'">
                        </p-tag>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <p-button 
                            icon="pi pi-eye"
                            size="small"
                            severity="secondary"
                            [text]="true"
                            (click)="viewDepartmentDetails(department); $event.stopPropagation()"
                            pTooltip="View Details">
                          </p-button>
                          <p-button 
                            *ngIf="canManageDepartments()"
                            icon="pi pi-pencil"
                            size="small"
                            severity="secondary"
                            [text]="true"
                            (click)="editDepartment(department); $event.stopPropagation()"
                            pTooltip="Edit Department">
                          </p-button>
                          <p-button 
                            *ngIf="canDeleteDepartments()"
                            icon="pi pi-trash"
                            size="small"
                            severity="danger"
                            [text]="true"
                            (click)="confirmDeleteDepartment(department); $event.stopPropagation()"
                            pTooltip="Delete Department">
                          </p-button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="6" class="text-center py-8">
                        <div class="text-surface-500 dark:text-surface-400">
                          <i class="pi pi-building text-4xl mb-3 block"></i>
                          No departments found
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            </p-tabpanel>

            <!-- Positions Tab -->
            <p-tabpanel value="positions">
              <p-card>
                <ng-template pTemplate="header">
                  <p-toolbar styleClass="border-none p-0">
                    <ng-template #start>
                      <div class="flex items-center gap-4">
                        <h3 class="text-xl font-semibold m-0">Positions ({{ positions().length }})</h3>
                        <p-select
                          [(ngModel)]="selectedDepartmentFilter"
                          [options]="departmentFilterOptions()"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="All Departments"
                          (onChange)="onDepartmentFilterChange()"
                          [showClear]="true"
                          styleClass="w-64">
                        </p-select>
                      </div>
                    </ng-template>
                    <ng-template #end>
                      <p-button 
                        *ngIf="canManagePositions()"
                        label="New Position" 
                        icon="pi pi-plus" 
                        (click)="openNewPositionDialog()">
                      </p-button>
                    </ng-template>
                  </p-toolbar>
                </ng-template>

                <!-- Positions Table -->
                <p-table 
                  [value]="filteredPositions()" 
                  [loading]="positionsLoading()"
                  [paginator]="true" 
                  [rows]="10"
                  [rowHover]="true"
                  styleClass="p-datatable-gridlines">
                  
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Level</th>
                      <th>Salary Range</th>
                      <th>Employees</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-position>
                    <tr (click)="viewPositionDetails(position)" class="cursor-pointer">
                      <td>
                        <div>
                          <div class="font-semibold text-surface-900 dark:text-surface-0">
                            {{ position.title }}
                            <p-tag *ngIf="position.isKeyPosition" value="Key Position" severity="warning" styleClass="ml-2 text-xs"></p-tag>
                          </div>
                          <div class="text-surface-600 dark:text-surface-300 text-sm" *ngIf="position.description">
                            {{ position.description | slice:0:80 }}{{ position.description.length > 80 ? '...' : '' }}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p-tag [value]="position.department?.name" severity="info"></p-tag>
                      </td>
                      <td>
                        <p-tag 
                          [value]="position.level" 
                          [severity]="getLevelSeverity(position.level)"
                          styleClass="text-xs">
                        </p-tag>
                      </td>
                      <td>
                        <div *ngIf="position.minSalary || position.maxSalary; else noSalary" class="text-sm">
                          <span *ngIf="position.minSalary">{{ position.minSalary | currency:'TND':'symbol':'1.0-0' }}</span>
                          <span *ngIf="position.minSalary && position.maxSalary"> - </span>
                          <span *ngIf="position.maxSalary">{{ position.maxSalary | currency:'TND':'symbol':'1.0-0' }}</span>
                        </div>
                        <ng-template #noSalary>
                          <span class="text-surface-500 dark:text-surface-400 text-sm italic">Not specified</span>
                        </ng-template>
                      </td>
                      <td>
                        <p-badge [value]="position.employeeCount || 0" severity="info"></p-badge>
                      </td>
                      <td>
                        <p-tag 
                          [value]="position.isActive ? 'Active' : 'Inactive'"
                          [severity]="position.isActive ? 'success' : 'danger'">
                        </p-tag>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <p-button 
                            icon="pi pi-eye"
                            size="small"
                            severity="secondary"
                            [text]="true"
                            (click)="viewPositionDetails(position); $event.stopPropagation()"
                            pTooltip="View Details">
                          </p-button>
                          <p-button 
                            *ngIf="canManagePositions()"
                            icon="pi pi-pencil"
                            size="small"
                            severity="secondary"
                            [text]="true"
                            (click)="editPosition(position); $event.stopPropagation()"
                            pTooltip="Edit Position">
                          </p-button>
                          <p-button 
                            *ngIf="canManagePositions()"
                            icon="pi pi-trash"
                            size="small"
                            severity="danger"
                            [text]="true"
                            (click)="confirmDeletePosition(position); $event.stopPropagation()"
                            pTooltip="Delete Position">
                          </p-button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="7" class="text-center py-8">
                        <div class="text-surface-500 dark:text-surface-400">
                          <i class="pi pi-briefcase text-4xl mb-3 block"></i>
                          No positions found
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            </p-tabpanel>

            <!-- Organization Chart Tab -->
            <p-tabpanel value="orgchart">
              <p-card>
                <ng-template pTemplate="header">
                  <div class="text-center">
                    <h3 class="text-xl font-semibold mb-2">Organization Chart</h3>
                    <p class="text-surface-600 dark:text-surface-300 m-0">
                      Interactive organizational hierarchy view
                    </p>
                  </div>
                </ng-template>

                <div *ngIf="orgChartLoading()" class="text-center py-12">
                  <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
                  <p class="text-surface-600 dark:text-surface-300 mt-2">Building organization chart...</p>
                </div>

                <div *ngIf="!orgChartLoading() && orgChartData().length" class="org-chart-container">
                  <p-organizationChart 
                    [value]="orgChartData()"
                    selectionMode="single"
                    (onNodeSelect)="onOrgNodeSelect($event)">
                    <ng-template let-node pTemplate="person">
                      <div class="flex flex-col items-center p-4 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all">
                        <p-avatar 
                          [label]="getInitials(node.label)"
                          shape="circle"
                          size="large"
                          styleClass="mb-3">
                        </p-avatar>
                        <div class="text-center">
                          <div class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                            {{ node.label }}
                          </div>
                          <div class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                            {{ node.data?.position || 'No Position' }}
                          </div>
                          <p-tag 
                            [value]="node.data?.department" 
                            severity="info"
                            styleClass="text-xs">
                          </p-tag>
                          <div *ngIf="node.data?.directReports" class="text-xs text-surface-500 dark:text-surface-400 mt-2">
                            {{ node.data.directReports }} direct report{{ node.data.directReports !== 1 ? 's' : '' }}
                          </div>
                        </div>
                      </div>
                    </ng-template>
                  </p-organizationChart>
                </div>

                <div *ngIf="!orgChartLoading() && !orgChartData().length" class="text-center py-12">
                  <i class="pi pi-sitemap text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                  <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                    No Organization Chart Available
                  </h3>
                  <p class="text-surface-500 dark:text-surface-400 mb-4">
                    Add departments and assign managers to build the organizational hierarchy
                  </p>
                </div>
              </p-card>
            </p-tabpanel>
          </p-tabs>
        </p-fluid>
      </div>

      <!-- Department Details Dialog -->
      <p-dialog 
        header="Department Details" 
        [(visible)]="showDepartmentDetailsDialog" 
        [modal]="true"
        styleClass="w-full max-w-4xl">
        
        <div *ngIf="selectedDepartment" class="space-y-6">
          <!-- Basic Info -->
          <p-card header="Basic Information">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Name:</strong>
                <span>{{ selectedDepartment.name }}</span>
              </div>
              <div>
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Status:</strong>
                <p-tag 
                  [value]="selectedDepartment.isActive ? 'Active' : 'Inactive'"
                  [severity]="selectedDepartment.isActive ? 'success' : 'danger'">
                </p-tag>
              </div>
              <div class="md:col-span-2" *ngIf="selectedDepartment.description">
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Description:</strong>
                <p class="text-surface-600 dark:text-surface-300 m-0">{{ selectedDepartment.description }}</p>
              </div>
            </div>
          </p-card>

          <!-- Department Intelligence -->
          <p-card *ngIf="departmentIntelligence()" header="Department Intelligence">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">
                  {{ departmentIntelligence()?.totalEmployees }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-300">
                  Total Employees
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">
                  {{ departmentIntelligence()?.averagePerformance | number:'1.1-1' }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-300">
                  Avg Performance
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">
                  {{ departmentIntelligence()?.careerOpportunities?.length || 0 }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-300">
                  Career Opportunities
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">
                  {{ departmentIntelligence()?.talentRisks?.length || 0 }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-300">
                  Talent Risks
                </div>
              </div>
            </div>

            <div *ngIf="departmentIntelligence()?.insights?.length">
              <h5 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Key Insights</h5>
              <div class="space-y-2">
                <div *ngFor="let insight of departmentIntelligence()?.insights"
                     class="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                  <span class="text-sm text-surface-700 dark:text-surface-200">{{ insight }}</span>
                </div>
              </div>
            </div>
          </p-card>
        </div>
      </p-dialog>

      <!-- Position Details Dialog -->
      <p-dialog 
        header="Position Details" 
        [(visible)]="showPositionDetailsDialog" 
        [modal]="true"
        styleClass="w-full max-w-4xl">
        
        <div *ngIf="selectedPosition" class="space-y-6">
          <!-- Basic Info -->
          <p-card header="Basic Information">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Title:</strong>
                <span>{{ selectedPosition.title }}</span>
              </div>
              <div>
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Department:</strong>
                <p-tag [value]="selectedPosition.department?.name" severity="info"></p-tag>
              </div>
              <div>
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Level:</strong>
                <p-tag 
                  [value]="selectedPosition.level" 
                  [severity]="getLevelSeverity(selectedPosition.level)">
                </p-tag>
              </div>
              <div>
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Status:</strong>
                <p-tag 
                  [value]="selectedPosition.isActive ? 'Active' : 'Inactive'"
                  [severity]="selectedPosition.isActive ? 'success' : 'danger'">
                </p-tag>
              </div>
              <div class="md:col-span-2" *ngIf="selectedPosition.description">
                <strong class="block text-surface-700 dark:text-surface-300 mb-1">Job Description:</strong>
                <div class="text-surface-600 dark:text-surface-300 whitespace-pre-wrap">{{ selectedPosition.description }}</div>
              </div>
            </div>
          </p-card>

          <!-- Career Paths -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Paths From This Position -->
            <p-card *ngIf="careerPathsFrom().length" header="Career Advancement From This Role">
              <div class="space-y-3">
                <div *ngFor="let path of careerPathsFrom()"
                     class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <div class="flex justify-between items-start mb-2">
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                      {{ path.toPosition.title }}
                    </h6>
                    <p-tag [value]="path.toPosition.department?.name" severity="secondary" styleClass="text-xs"></p-tag>
                  </div>
                  <div class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                    Min. {{ path.minYearsInCurrentRole }} year(s) in current role
                  </div>
                  <div *ngIf="path.description" class="text-xs text-surface-500 dark:text-surface-400">
                    {{ path.description }}
                  </div>
                </div>
              </div>
            </p-card>

            <!-- Paths To This Position -->
            <p-card *ngIf="careerPathsTo().length" header="Entry Paths To This Role">
              <div class="space-y-3">
                <div *ngFor="let path of careerPathsTo()"
                     class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                  <div class="flex justify-between items-start mb-2">
                    <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                      From {{ path.fromPosition.title }}
                    </h6>
                    <p-tag [value]="path.fromPosition.department?.name" severity="secondary" styleClass="text-xs"></p-tag>
                  </div>
                  <div class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                    Min. {{ path.minYearsInCurrentRole }} year(s) experience required
                  </div>
                  <div *ngIf="path.description" class="text-xs text-surface-500 dark:text-surface-400">
                    {{ path.description }}
                  </div>
                </div>
              </div>
            </p-card>
          </div>
        </div>
      </p-dialog>

      <!-- Add/Edit Department Dialog -->
      <p-dialog 
        [header]="isEditingDepartment ? 'Edit Department' : 'New Department'" 
        [(visible)]="showDepartmentDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Name *
            </label>
            <input 
              pInputText 
              [(ngModel)]="departmentForm.name"
              class="w-full"
              placeholder="Enter department name">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Description
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="departmentForm.description"
              rows="3"
              class="w-full"
              placeholder="Enter department description">
            </textarea>
          </div>
          <div *ngIf="!isEditingDepartment">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Head of Department (Optional)
            </label>
            <p-select
              [(ngModel)]="departmentForm.headOfDepartmentId"
              [options]="availableEmployees()"
              optionLabel="fullName"
              optionValue="id"
              placeholder="Select head of department"
              [filter]="true"
              filterBy="fullName"
              [showClear]="true"
              styleClass="w-full">
            </p-select>
          </div>
          <div *ngIf="isEditingDepartment">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Status
            </label>
            <div class="flex items-center gap-2">
              <p-checkbox [(ngModel)]="departmentForm.isActive" [binary]="true"/>
              <label>Active Department</label>
            </div>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelDepartmentDialog()">
          </p-button>
          <p-button 
            [label]="isEditingDepartment ? 'Update Department' : 'Create Department'" 
            (click)="saveDepartment()"
            [disabled]="!departmentForm.name"
            [loading]="isSavingDepartment()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Add/Edit Position Dialog -->
      <p-dialog 
        [header]="isEditingPosition ? 'Edit Position' : 'New Position'" 
        [(visible)]="showPositionDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Title *
            </label>
            <input 
              pInputText 
              [(ngModel)]="positionForm.title"
              class="w-full"
              placeholder="Enter position title">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Department *
            </label>
            <p-select
              [(ngModel)]="positionForm.departmentId"
              [options]="departmentOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="Select department"
              styleClass="w-full">
            </p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Level
            </label>
            <p-select
              [(ngModel)]="positionForm.level"
              [options]="levelOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select level"
              styleClass="w-full">
            </p-select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Min Salary (TND)
              </label>
              <p-inputNumber 
                [(ngModel)]="positionForm.minSalary"
                mode="currency" 
                currency="TND"
                styleClass="w-full">
              </p-inputNumber>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Max Salary (TND)
              </label>
              <p-inputNumber 
                [(ngModel)]="positionForm.maxSalary"
                mode="currency" 
                currency="TND"
                styleClass="w-full">
              </p-inputNumber>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Job Description
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="positionForm.description"
              rows="4"
              class="w-full"
              placeholder="Enter detailed job description">
            </textarea>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <p-checkbox [(ngModel)]="positionForm.isKeyPosition" [binary]="true"/>
              <label>Key Position</label>
            </div>
            <div *ngIf="isEditingPosition" class="flex items-center gap-2">
              <p-checkbox [(ngModel)]="positionForm.isActive" [binary]="true"/>
              <label>Active Position</label>
            </div>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelPositionDialog()">
          </p-button>
          <p-button 
            [label]="isEditingPosition ? 'Update Position' : 'Create Position'" 
            (click)="savePosition()"
            [disabled]="!positionForm.title || !positionForm.departmentId"
            [loading]="isSavingPosition()">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class Organization implements OnInit {
  // Signals for reactive state management
  departments = signal<DepartmentWithStats[]>([]);
  positions = signal<PositionWithStats[]>([]);
  filteredPositions = signal<PositionWithStats[]>([]);
  availableEmployees = signal<any[]>([]);
  orgChartData = signal<TreeNode[]>([]);
  departmentIntelligence = signal<DepartmentIntelligence | null>(null);
  
  // Loading states
  isLoading = signal(false);
  departmentsLoading = signal(false);
  positionsLoading = signal(false);
  orgChartLoading = signal(false);
  isSavingDepartment = signal(false);
  isSavingPosition = signal(false);
  
  // Error handling
  errorMessage = signal('');
  
  // Dialog states
  showDepartmentDialog = false;
  showPositionDialog = false;
  showDepartmentDetailsDialog = false;
  showPositionDetailsDialog = false;
  
  // Edit modes
  isEditingDepartment = false;
  isEditingPosition = false;
  
  // Selected items
  selectedDepartment: DepartmentWithStats | null = null;
  selectedPosition: PositionWithStats | null = null;
  
  // Filters
  selectedDepartmentFilter: number | null = null;
  
  // Forms
  departmentForm: any = {};
  positionForm: any = {};
  
  // Options
  levelOptions = [
    { label: 'Junior', value: 'Junior' },
    { label: 'Mid', value: 'Mid' },
    { label: 'Senior', value: 'Senior' },
    { label: 'Lead', value: 'Lead' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Director', value: 'Director' }
  ];
  
  // Career paths
  careerPathsFrom = signal<CareerPath[]>([]);
  careerPathsTo = signal<CareerPath[]>([]);

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private positionService: PositionService,
    private careerPathService: CareerPathService,
    private intelligenceService: IntelligenceService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadAvailableEmployees();
  }

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    Promise.all([
      this.loadDepartments(),
      this.loadPositions(),
      this.loadOrgChart()
    ]).finally(() => {
      this.isLoading.set(false);
    });
  }

  async loadDepartments() {
    this.departmentsLoading.set(true);
    try {
      const departments = await this.departmentService.getDepartmentsWithStats().toPromise();
      this.departments.set(departments || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      this.departmentsLoading.set(false);
    }
  }

    async loadPositions() {
    this.positionsLoading.set(true);
    try {
        const positions = await this.positionService.getAllPositions().toPromise();
        
        if (positions) {
        // Use Promise.all with map to get analytics for each position
        const positionsWithStats = await Promise.all(
            positions.map(async (position) => {
            try {
                const analytics = await this.positionService.getPositionAnalytics(position.id).toPromise();
                return analytics || { ...position, employeeCount: 0, vacancyCount: 0 };
            } catch (error) {
                // If analytics fail, return position with default stats
                return { ...position, employeeCount: 0, vacancyCount: 0 };
            }
            })
        );
        
        this.positions.set(positionsWithStats);
        this.filteredPositions.set(positionsWithStats);
        } else {
        this.positions.set([]);
        this.filteredPositions.set([]);
        }
    } catch (error) {
        console.error('Error loading positions:', error);
        this.positions.set([]);
        this.filteredPositions.set([]);
    } finally {
        this.positionsLoading.set(false);
    }
    }

  async loadOrgChart() {
    this.orgChartLoading.set(true);
    try {
      const employees = await this.employeeService.getOrganizationChart().toPromise();
      this.buildOrgChart(employees || []);
    } catch (error) {
      console.error('Error loading org chart:', error);
    } finally {
      this.orgChartLoading.set(false);
    }
  }

  loadAvailableEmployees() {
    this.employeeService.getAllEmployees().subscribe({
      next: (employees) => {
        this.availableEmployees.set(employees);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  refreshData() {
    this.loadData();
    this.loadAvailableEmployees();
  }

  // Department Management
  openNewDepartmentDialog() {
    this.isEditingDepartment = false;
    this.departmentForm = {
      name: '',
      description: '',
      headOfDepartmentId: null
    };
    this.showDepartmentDialog = true;
  }

  editDepartment(department: DepartmentWithStats) {
    this.isEditingDepartment = true;
    this.selectedDepartment = department;
    this.departmentForm = {
      name: department.name,
      description: department.description,
      isActive: department.isActive
    };
    this.showDepartmentDialog = true;
  }

  saveDepartment() {
    this.isSavingDepartment.set(true);
    
    if (this.isEditingDepartment && this.selectedDepartment) {
      const updateDto: UpdateDepartmentDto = {
        name: this.departmentForm.name,
        description: this.departmentForm.description,
        isActive: this.departmentForm.isActive
      };
      
      this.departmentService.updateDepartment(this.selectedDepartment.id, updateDto).subscribe({
        next: (updatedDepartment) => {
          const departments = this.departments();
          const index = departments.findIndex(d => d.id === updatedDepartment.id);
          if (index !== -1) {
            departments[index] = { ...departments[index], ...updatedDepartment };
            this.departments.set([...departments]);
          }
          this.showDepartmentDialog = false;
          this.isSavingDepartment.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Department updated successfully'
          });
        },
        error: () => {
          this.isSavingDepartment.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update department'
          });
        }
      });
    } else {
      const createDto: CreateDepartmentDto = {
        name: this.departmentForm.name,
        description: this.departmentForm.description,
        headOfDepartmentId: this.departmentForm.headOfDepartmentId
      };
      
      this.departmentService.createDepartment(createDto).subscribe({
        next: () => {
          this.loadDepartments();
          this.showDepartmentDialog = false;
          this.isSavingDepartment.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Department created successfully'
          });
        },
        error: (error) => {
          this.isSavingDepartment.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create department: ' + (error?.error?.message || '')
          });
        }
      });
    }
  }

  confirmDeleteDepartment(department: DepartmentWithStats) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the department "${department.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.departmentService.deactivateDepartment(department.id).subscribe({
          next: () => {
            const departments = this.departments().filter(d => d.id !== department.id);
            this.departments.set(departments);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Department deleted successfully'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete department'
            });
          }
        });
      }
    });
  }

  cancelDepartmentDialog() {
    this.showDepartmentDialog = false;
    this.selectedDepartment = null;
    this.departmentForm = {};
  }

  // Position Management
  openNewPositionDialog() {
    this.isEditingPosition = false;
    this.positionForm = {
      title: '',
      departmentId: null,
      level: '',
      minSalary: null,
      maxSalary: null,
      description: '',
      isKeyPosition: false
    };
    this.showPositionDialog = true;
  }

  editPosition(position: PositionWithStats) {
    this.isEditingPosition = true;
    this.selectedPosition = position;
    this.positionForm = {
      title: position.title,
      departmentId: position.departmentId,
      level: position.level,
      minSalary: position.minSalary,
      maxSalary: position.maxSalary,
      description: position.description,
      isKeyPosition: position.isKeyPosition,
      isActive: position.isActive
    };
    this.showPositionDialog = true;
  }

  savePosition() {
    this.isSavingPosition.set(true);
    
    if (this.isEditingPosition && this.selectedPosition) {
      const updateDto: UpdatePositionDto = {
        title: this.positionForm.title,
        description: this.positionForm.description,
        minSalary: this.positionForm.minSalary,
        maxSalary: this.positionForm.maxSalary,
        level: this.positionForm.level,
        isKeyPosition: this.positionForm.isKeyPosition,
        isActive: this.positionForm.isActive
      };
      
      this.positionService.updatePosition(this.selectedPosition.id, updateDto).subscribe({
        next: (updatedPosition) => {
          const positions = this.positions();
          const index = positions.findIndex(p => p.id === updatedPosition.id);
          if (index !== -1) {
            positions[index] = { ...positions[index], ...updatedPosition };
            this.positions.set([...positions]);
            this.onDepartmentFilterChange();
          }
          this.showPositionDialog = false;
          this.isSavingPosition.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Position updated successfully'
          });
        },
        error: (error) => {
          this.isSavingPosition.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update position'
          });
        }
      });
    } else {
      const createDto: CreatePositionDto = {
        title: this.positionForm.title,
        departmentId: this.positionForm.departmentId,
        description: this.positionForm.description,
        minSalary: this.positionForm.minSalary,
        maxSalary: this.positionForm.maxSalary,
        level: this.positionForm.level,
        isKeyPosition: this.positionForm.isKeyPosition
      };
      
      this.positionService.createPosition(createDto).subscribe({
        next: () => {
          this.loadPositions();
          this.onDepartmentFilterChange();
          this.showPositionDialog = false;
          this.isSavingPosition.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Position created successfully'
          });
        },
        error: () => {
          this.isSavingPosition.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create position'
          });
        }
      });
    }
  }

  confirmDeletePosition(position: PositionWithStats) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the position "${position.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.positionService.deactivatePosition(position.id).subscribe({
          next: () => {
            const positions = this.positions().filter(p => p.id !== position.id);
            this.positions.set(positions);
            this.onDepartmentFilterChange();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Position deleted successfully'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete position'
            });
          }
        });
      }
    });
  }

  cancelPositionDialog() {
    this.showPositionDialog = false;
    this.selectedPosition = null;
    this.positionForm = {};
  }

  // View Details
  viewDepartmentDetails(department: DepartmentWithStats) {
    this.selectedDepartment = department;
    this.showDepartmentDetailsDialog = true;
    
    // Load department intelligence
    this.intelligenceService.getDepartmentIntelligence(department.id).subscribe({
      next: (intelligence) => {
        this.departmentIntelligence.set(intelligence);
      },
      error: (error) => {
        console.error('Error loading department intelligence:', error);
      }
    });
  }

  viewPositionDetails(position: PositionWithStats) {
    this.selectedPosition = position;
    this.showPositionDetailsDialog = true;
    
    // Load career paths
    this.careerPathService.getPathsFromPosition(position.id).subscribe({
      next: (paths) => {
        this.careerPathsFrom.set(paths);
      },
      error: (error) => {
        console.error('Error loading career paths from position:', error);
      }
    });
    
    this.careerPathService.getPathsToPosition(position.id).subscribe({
      next: (paths) => {
        this.careerPathsTo.set(paths);
      },
      error: (error) => {
        console.error('Error loading career paths to position:', error);
      }
    });
  }

  // Organization Chart
  buildOrgChart(employees: any[]) {
    const topManagers = employees.filter(emp => !emp.managerId);
    this.orgChartData.set(topManagers.map(manager => this.buildOrgNode(manager, employees)));
  }

  buildOrgNode(employee: any, allEmployees: any[]): TreeNode {
    const directReports = allEmployees.filter(emp => emp.managerId === employee.id);
    
    return {
      label: employee.fullName,
      type: 'person',
      expanded: true,
      data: {
        id: employee.id,
        email: employee.email,
        position: employee.currentPosition?.title,
        department: employee.department?.name,
        directReports: directReports.length,
        employee: employee
      },
      children: directReports.map(report => this.buildOrgNode(report, allEmployees))
    };
  }

  onOrgNodeSelect(event: any) {
    if (event.node?.data?.employee) {
      // Could open employee profile or department details
      console.log('Selected employee:', event.node.data.employee);
    }
  }

  // Filters
  onDepartmentFilterChange() {
    const positions = this.positions();
    if (this.selectedDepartmentFilter) {
      this.filteredPositions.set(positions.filter(p => p.departmentId === this.selectedDepartmentFilter));
    } else {
      this.filteredPositions.set(positions);
    }
  }

  // Options
  departmentOptions() {
    return this.departments().map(dept => ({
      label: dept.name,
      value: dept.id
    }));
  }

  departmentFilterOptions() {
    return this.departments().map(dept => ({
      label: dept.name,
      value: dept.id
    }));
  }

  // Permissions
  canManageDepartments(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin';
  }

  canDeleteDepartments(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Admin';
  }

  canManagePositions(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin';
  }

  // Utility Methods
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getLevelSeverity(level: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (level) {
      case 'Director': return 'danger';
      case 'Manager': return 'warning';
      case 'Lead': return 'info';
      case 'Senior': return 'success';
      default: return 'secondary';
    }
  }
}