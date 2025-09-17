import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
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
import { PanelModule } from 'primeng/panel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { DepartmentService, Department, CreateDepartmentDto, UpdateDepartmentDto, DepartmentWithStats } from '../service/department.service';
import { IntelligenceService, DepartmentIntelligence } from '../service/intelligence.service';
import { AuthService } from '../service/auth.service';
import { EmployeeService } from '../service/employee.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    MessageModule,
    TableModule,
    TagModule,
    BadgeModule,
    PanelModule,
    ConfirmDialogModule,
    AvatarModule,
    CheckboxModule,
    TooltipModule
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Departments</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Manage organizational departments and hierarchy
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
            <p-button 
              *ngIf="canManageDepartments()"
              label="New Department" 
              icon="pi pi-plus" 
              (click)="openNewDepartmentDialog()">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading() && !departments().length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading departments...</span>
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
      <div *ngIf="!isLoading()" class="px-6">
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
                  placeholder="Search departments..." 
                  class="w-full">
              </span>
            </div>
            <p-select
              [(ngModel)]="statusFilter"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Statuses"
              (onChange)="onFilterChange()"
              [showClear]="true">
            </p-select>
          </div>

          <!-- Departments Table -->
          <p-table 
            [value]="filteredDepartments()" 
            [loading]="isLoading()"
            [paginator]="true" 
            [rows]="pageSize"
            [totalRecords]="totalRecords"
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
    </div>
  `,
})
export class Departments implements OnInit {
  // Signals for reactive state management
  departments = signal<DepartmentWithStats[]>([]);
  filteredDepartments = signal<DepartmentWithStats[]>([]);
  availableEmployees = signal<any[]>([]);
  departmentIntelligence = signal<DepartmentIntelligence | null>(null);
  
  // Loading states
  isLoading = signal(false);
  isSavingDepartment = signal(false);
  
  // Error handling
  errorMessage = signal('');
  
  // Pagination
  pageSize = 10;
  totalRecords = 0;
  
  // Search and filters
  searchTerm = '';
  statusFilter: string | null = null;
  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];
  
  // Dialog states
  showDepartmentDialog = false;
  showDepartmentDetailsDialog = false;
  
  // Edit modes
  isEditingDepartment = false;
  
  // Selected items
  selectedDepartment: DepartmentWithStats | null = null;
  
  // Forms
  departmentForm: any = {};

  constructor(
    private departmentService: DepartmentService,
    private intelligenceService: IntelligenceService,
    private authService: AuthService,
    private employeeService: EmployeeService,
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
    
    this.loadDepartments();
  }

  async loadDepartments() {
    try {
      // First get all departments
      const departments = await this.departmentService.getAllDepartments().toPromise();
      
      if (departments) {
        // Then get stats for each department by calling individual department endpoints
        const departmentsWithStats = await Promise.all(
          departments.map(async (dept) => {
            try {
              // Get employees count
              const employees = await this.departmentService.getDepartmentEmployees(dept.id).toPromise();
              const employeeCount = employees ? employees.length : 0;
              
              // Get positions count
              const positions = await this.departmentService.getDepartmentPositions(dept.id).toPromise();
              const positionCount = positions ? positions.length : 0;
              
              // Create department with stats
              const deptWithStats: DepartmentWithStats = {
                ...dept,
                employeeCount,
                activeEmployeeCount: employeeCount, // For now, assume all employees are active
                positionCount
              };
              
              return deptWithStats;
            } catch (error) {
              // If individual stats fail, return department with zero stats
              console.warn(`Failed to load stats for department ${dept.name}:`, error);
              return {
                ...dept,
                employeeCount: 0,
                activeEmployeeCount: 0,
                positionCount: 0
              } as DepartmentWithStats;
            }
          })
        );
        
        this.departments.set(departmentsWithStats);
        this.filteredDepartments.set(departmentsWithStats);
        this.totalRecords = departmentsWithStats.length;
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      this.errorMessage.set('Failed to load departments. Please try again.');
    } finally {
      this.isLoading.set(false);
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

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = this.departments();

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(searchLower) ||
        (dept.description && dept.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(dept => dept.isActive === isActive);
    }

    this.filteredDepartments.set(filtered);
    this.totalRecords = filtered.length;
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
            this.applyFilters();
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
            this.loadDepartments();
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

  // Permissions
  canManageDepartments(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin';
  }

  canDeleteDepartments(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Admin';
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
}