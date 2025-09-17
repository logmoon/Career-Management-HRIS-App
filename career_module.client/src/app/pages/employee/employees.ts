import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { EmployeeService, Employee, UpdateEmployeeDto } from '../service/employee.service';
import { SkillsService, EmployeeSkill, AddEmployeeSkill, UpdateEmployeeSkill } from '../service/skills.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
                <!-- Action Button - Only show if user can edit -->
                <div *ngIf="canEditEmployee()" class="flex justify-end mb-4">
                  <p-button 
                    label="More About Employee" 
                    icon="pi pi-external-link"
                    severity="primary"
                    (click)="navigateToEmployeeDetail()"
                    pTooltip="View detailed profile and edit information">
                  </p-button>
                </div>

                <!-- Basic Info Card -->
                <p-card header="Basic Information">
                  <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        First Name
                      </label>
                      <div class="text-surface-900 dark:text-surface-0 font-medium">
                        {{ selectedEmployee.firstName }}
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Last Name
                      </label>
                      <div class="text-surface-900 dark:text-surface-0 font-medium">
                        {{ selectedEmployee.lastName }}
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Email
                      </label>
                      <div class="text-surface-900 dark:text-surface-0 font-medium">
                        {{ selectedEmployee.email }}
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Phone
                      </label>
                      <div class="text-surface-900 dark:text-surface-0 font-medium">
                        {{ selectedEmployee.phone || 'Not provided' }}
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Hire Date
                      </label>
                      <div class="text-surface-900 dark:text-surface-0 font-medium">
                        {{ selectedEmployee.hireDate | date:'mediumDate' }}
                      </div>
                    </div>
                    <div *ngIf="userRole === 'HR' || userRole === 'Admin'">
                      <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Salary
                      </label>
                      <div class="text-surface-900 dark:text-surface-0 font-medium">
                        {{ selectedEmployee.salary | currency:'TND':'symbol':'1.0-0' }}
                      </div>
                    </div>
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
          </p-tabs>
        </div>
      </p-drawer>
    </div>
  `,
})
export class Employees implements OnInit {
  // Loading states
  isLoading = false;
  loadingSkills = false;
  loadingPerformance = false;
  loadingCareerIntelligence = false;

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

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    public skillsService: SkillsService,
    private messageService: MessageService,
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role || 'Employee';
    this.loadData();
    this.loadDepartmentOptions();
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

  navigateToEmployeeDetail() {
    if (this.selectedEmployee) {
      this.router.navigate(['/employee-detail', this.selectedEmployee.id]);
    }
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
    this.showProfileSidebar = true;
  }

  canEditEmployee(): boolean {
    if (!this.selectedEmployee) return false;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

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