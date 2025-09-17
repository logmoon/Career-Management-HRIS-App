import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
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
import { PanelModule } from 'primeng/panel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { PositionService, Position, CreatePositionDto, UpdatePositionDto, PositionWithStats } from '../service/position.service';
import { DepartmentService, Department } from '../service/department.service';
import { CareerPathService, CareerPath } from '../service/career-path.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
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
    PanelModule,
    ConfirmDialogModule,
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Positions</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Manage organizational positions and roles
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
              *ngIf="canManagePositions()"
              label="New Position" 
              icon="pi pi-plus" 
              (click)="openNewPositionDialog()">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading() && !positions().length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading positions...</span>
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
                  placeholder="Search positions..." 
                  class="w-full">
              </span>
            </div>
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
            <p-select
              [(ngModel)]="selectedLevelFilter"
              [options]="levelOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Levels"
              (onChange)="onFilterChange()"
              [showClear]="true">
            </p-select>
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

          <!-- Positions Table -->
          <p-table 
            [value]="filteredPositions()" 
            [loading]="isLoading()"
            [paginator]="true" 
            [rows]="pageSize"
            [totalRecords]="totalRecords"
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
      </div>

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
export class Positions implements OnInit {
  // Signals for reactive state management
  positions = signal<PositionWithStats[]>([]);
  filteredPositions = signal<PositionWithStats[]>([]);
  departments = signal<Department[]>([]);
  
  // Loading states
  isLoading = signal(false);
  isSavingPosition = signal(false);
  
  // Error handling
  errorMessage = signal('');
  
  // Pagination
  pageSize = 10;
  totalRecords = 0;
  
  // Filters
  selectedDepartmentFilter: number | null = null;
  selectedLevelFilter: string | null = null;
  statusFilter: string | null = null;
  searchTerm = '';
  
  // Filter options
  levelOptions = [
    { label: 'Junior', value: 'Junior' },
    { label: 'Mid', value: 'Mid' },
    { label: 'Senior', value: 'Senior' },
    { label: 'Lead', value: 'Lead' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Director', value: 'Director' }
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];
  
  // Dialog states
  showPositionDialog = false;
  showPositionDetailsDialog = false;
  
  // Edit modes
  isEditingPosition = false;
  
  // Selected items
  selectedPosition: PositionWithStats | null = null;
  
  // Forms
  positionForm: any = {};
  
  // Career paths
  careerPathsFrom = signal<CareerPath[]>([]);
  careerPathsTo = signal<CareerPath[]>([]);

  constructor(
    private positionService: PositionService,
    private departmentService: DepartmentService,
    private careerPathService: CareerPathService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadDepartments();
  }

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.loadPositions();
  }

  async loadPositions() {
    try {
      const positions = await this.positionService.getAllPositions().toPromise();
      
      if (positions) {
        // Get employee count for each position by fetching position employees
        const positionsWithStats = await Promise.all(
          positions.map(async (position) => {
            try {
              const employees = await this.positionService.getPositionEmployees(position.id).toPromise();
              const employeeCount = employees ? employees.length : 0;
              
              // Create position with stats
              const posWithStats: PositionWithStats = {
                ...position,
                employeeCount,
                vacancyCount: 0 // Could be calculated based on business logic
              };
              
              return posWithStats;
            } catch (error) {
              // If individual stats fail, return position with default stats
              console.warn(`Failed to load stats for position ${position.title}:`, error);
              return {
                ...position,
                employeeCount: 0,
                vacancyCount: 0
              } as PositionWithStats;
            }
          })
        );
        
        this.positions.set(positionsWithStats);
        this.filteredPositions.set(positionsWithStats);
        this.totalRecords = positionsWithStats.length;
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      this.errorMessage.set('Failed to load positions. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  loadDepartments() {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments.set(departments);
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  refreshData() {
    this.loadData();
    this.loadDepartments();
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  onDepartmentFilterChange() {
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = this.positions();

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(position => 
        position.title.toLowerCase().includes(searchLower) ||
        (position.description && position.description.toLowerCase().includes(searchLower)) ||
        (position.department?.name && position.department.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply department filter
    if (this.selectedDepartmentFilter) {
      filtered = filtered.filter(position => position.departmentId === this.selectedDepartmentFilter);
    }

    // Apply level filter
    if (this.selectedLevelFilter) {
      filtered = filtered.filter(position => position.level === this.selectedLevelFilter);
    }

    // Apply status filter
    if (this.statusFilter) {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(position => position.isActive === isActive);
    }

    this.filteredPositions.set(filtered);
    this.totalRecords = filtered.length;
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
          this.loadPositions();
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
            this.loadPositions();
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
  canManagePositions(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin';
  }

  // Utility Methods
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