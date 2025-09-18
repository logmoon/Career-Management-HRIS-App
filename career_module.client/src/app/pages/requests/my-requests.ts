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
import { TimelineModule } from 'primeng/timeline';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { OverlayModule } from 'primeng/overlay';
import { MenuModule } from 'primeng/menu';

// Services
import { EmployeeRequestService, EmployeeRequest, PromotionRequest, DepartmentChangeRequest, CreatePromotionRequestDto, CreateDepartmentChangeRequestDto } from '../service/employee-request.service';
import { PositionService, Position } from '../service/position.service';
import { DepartmentService, Department } from '../service/department.service';
import { EmployeeService, Employee } from '../service/employee.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-my-requests',
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
    TimelineModule,
    InputNumberModule,
    DatePickerModule,
    OverlayModule,
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">My Requests</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Track your submitted requests and their approval status
            </p>
          </div>
          <div class="flex gap-2">
            <p-button 
              label="New Request" 
              icon="pi pi-plus"
              (click)="showNewRequestDialog = true"
              pTooltip="Create New Request">
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
      <div *ngIf="isLoading() && !myRequests().length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading your requests...</span>
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
                (click)="loadRequests()"
                class="ml-auto">
              </p-button>
            </div>
          </ng-template>
        </p-message>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading() || myRequests().length" class="px-6">
        <p-fluid>
          <!-- Stats Overview -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <p-card styleClass="border-l-4 border-l-blue-500">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ totalRequests() }}</div>
                  <div class="text-sm text-surface-600 dark:text-surface-300">Total Requests</div>
                </div>
                <i class="pi pi-file text-2xl text-blue-500"></i>
              </div>
            </p-card>

            <p-card styleClass="border-l-4 border-l-orange-500">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ pendingRequests() }}</div>
                  <div class="text-sm text-surface-600 dark:text-surface-300">Pending</div>
                </div>
                <i class="pi pi-clock text-2xl text-orange-500"></i>
              </div>
            </p-card>

            <p-card styleClass="border-l-4 border-l-green-500">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ approvedRequests() }}</div>
                  <div class="text-sm text-surface-600 dark:text-surface-300">Approved</div>
                </div>
                <i class="pi pi-check-circle text-2xl text-green-500"></i>
              </div>
            </p-card>

            <p-card styleClass="border-l-4 border-l-red-500">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ rejectedRequests() }}</div>
                  <div class="text-sm text-surface-600 dark:text-surface-300">Rejected</div>
                </div>
                <i class="pi pi-times-circle text-2xl text-red-500"></i>
              </div>
            </p-card>
          </div>

          <!-- Filters -->
          <div class="mb-6">
            <div class="flex flex-wrap gap-4 items-center">
              <div class="flex-1 min-w-0">
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-search"></i>
                  <input 
                    pInputText 
                    type="text" 
                    [(ngModel)]="searchTerm"
                    (input)="filterRequests()"
                    placeholder="Search requests..." 
                    class="w-full">
                </span>
              </div>
              <p-select
                [(ngModel)]="selectedStatus"
                [options]="statusOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Statuses"
                (onChange)="filterRequests()"
                [showClear]="true"
                class="min-w-40">
              </p-select>
              <p-select
                [(ngModel)]="selectedRequestType"
                [options]="requestTypeOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Types"
                (onChange)="filterRequests()"
                [showClear]="true"
                class="min-w-40">
              </p-select>
              <p-button 
                icon="pi pi-filter-slash" 
                severity="secondary" 
                [outlined]="true"
                (click)="clearFilters()"
                pTooltip="Clear Filters">
              </p-button>
            </div>
          </div>

          <!-- Requests List -->
          <div *ngIf="filteredRequests().length" class="space-y-4">
            <div *ngFor="let request of filteredRequests(); trackBy: trackByRequestId" class="mb-4">
              <p-card styleClass="hover:shadow-md transition-shadow">
                <ng-template pTemplate="header">
                  <div class="p-4 pb-0">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h5 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
                            {{ getRequestTitle(request) }}
                          </h5>
                          <p-tag 
                            [value]="getRequestTypeLabel(request.requestType)" 
                            [severity]="getRequestTypeSeverity(request.requestType)">
                          </p-tag>
                        </div>
                        <div class="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-300">
                          <div class="flex items-center gap-1">
                            <i class="pi pi-calendar"></i>
                            <span>{{ request.requestDate | date:'MMM dd, yyyy' }}</span>
                          </div>
                          <div class="flex items-center gap-1" *ngIf="request.targetEmployee && request.targetEmployee.id !== request.requester.id">
                            <i class="pi pi-user"></i>
                            <span>For: {{ request.targetEmployee.fullName }}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-3">
                        <p-tag 
                          [value]="employeeRequestService.getStatusDisplayText(request.status)" 
                          [severity]="getStatusSeverity(request.status)"
                          styleClass="text-sm">
                        </p-tag>
                        <p-button 
                          icon="pi pi-angle-down" 
                          severity="secondary" 
                          [text]="true"
                          (click)="toggleRequestDetails(request.id)"
                          [class.pi-angle-up]="expandedRequests.has(request.id)"
                          pTooltip="Toggle Details">
                        </p-button>
                      </div>
                    </div>
                  </div>
                </ng-template>

                <!-- Request Summary -->
                <div class="mb-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Progress Indicator -->
                    <div class="md:col-span-3">
                      <div class="mb-2">
                        <div class="flex justify-between items-center text-sm">
                          <span class="font-medium text-surface-700 dark:text-surface-200">Progress</span>
                          <span class="text-surface-600 dark:text-surface-300">{{ getProgressText(request) }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                          <div 
                            class="h-2 rounded-full transition-all"
                            [style.width.%]="getProgressPercentage(request.status)"
                            [ngClass]="{
                              'bg-green-500': request.status === 'HRApproved' || request.status === 'AutoApproved',
                              'bg-blue-500': request.status === 'ManagerApproved',
                              'bg-orange-500': request.status === 'Pending',
                              'bg-red-500': request.status === 'Rejected'
                            }">
                          </div>
                        </div>
                        <span class="text-sm text-surface-600 dark:text-surface-300 min-w-fit">
                          {{ getProgressPercentage(request.status) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Expandable Details -->
                <div *ngIf="expandedRequests.has(request.id)" class="border-t border-surface-200 dark:border-surface-700 pt-4">
                  <div class="space-y-6">
                    <!-- Request Details -->
                    <div>
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Request Details</h6>
                      <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                        <div *ngIf="isPromotionRequest(request)" class="space-y-3">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">New Position:</span>
                              <div class="text-surface-900 dark:text-surface-0 mt-1">
                                {{ request.newPosition.title || 'Position not found' }}
                              </div>
                            </div>
                            <div *ngIf="request.proposedSalary">
                              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Proposed Salary:</span>
                              <div class="text-surface-900 dark:text-surface-0 mt-1">
                                {{ request.proposedSalary | currency }}
                              </div>
                            </div>
                          </div>
                          <div *ngIf="request.justification">
                            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Justification:</span>
                            <div class="text-surface-900 dark:text-surface-0 mt-1">
                              {{ request.justification }}
                            </div>
                          </div>
                        </div>

                        <div *ngIf="isDepartmentChangeRequest(request)" class="space-y-3">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">New Department:</span>
                              <div class="text-surface-900 dark:text-surface-0 mt-1">
                                {{ request.newDepartment.name || 'Department not found' }}
                              </div>
                            </div>
                            <div *ngIf="request.newManager">
                              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">New Manager:</span>
                              <div class="text-surface-900 dark:text-surface-0 mt-1">
                                {{ request.newManager.fullName }}
                              </div>
                            </div>
                          </div>
                          <div *ngIf="request.reason">
                            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Reason:</span>
                            <div class="text-surface-900 dark:text-surface-0 mt-1">
                              {{ request.reason }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Approval Timeline -->
                    <div>
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Approval Timeline</h6>
                      <p-timeline 
                        [value]="getApprovalTimeline(request)" 
                        styleClass="customized-timeline">
                        <ng-template pTemplate="marker" let-event>
                          <div 
                            class="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                            [ngClass]="{
                              'bg-green-500': event.completed,
                              'bg-blue-500': event.current && !event.completed,
                              'bg-surface-400': !event.current && !event.completed
                            }">
                            <i 
                              [class]="event.completed ? 'pi pi-check' : (event.current ? 'pi pi-clock' : 'pi pi-circle')"
                              class="text-xs">
                            </i>
                          </div>
                        </ng-template>

                        <ng-template pTemplate="content" let-event>
                          <div class="pl-4">
                            <div class="flex justify-between items-start mb-1">
                              <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0">{{ event.title }}</h6>
                              <span class="text-xs text-surface-600 dark:text-surface-300" *ngIf="event.date">
                                {{ event.date | date:'MMM dd, yyyy HH:mm' }}
                              </span>
                            </div>
                            <p class="text-sm text-surface-600 dark:text-surface-300 m-0" *ngIf="event.description">
                              {{ event.description }}
                            </p>
                            <div *ngIf="event.approver" class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                              by {{ event.approver }}
                            </div>
                          </div>
                        </ng-template>
                      </p-timeline>
                    </div>

                    <!-- Notes -->
                    <div *ngIf="request.notes || request.rejectionReason">
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">
                        {{ request.rejectionReason ? 'Rejection Reason' : 'Notes' }}
                      </h6>
                      <div 
                        class="p-3 rounded-lg text-sm"
                        [ngClass]="{
                          'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200': request.rejectionReason,
                          'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200': request.notes && !request.rejectionReason
                        }">
                        {{ request.rejectionReason || request.notes }}
                      </div>
                    </div>
                  </div>
                </div>
              </p-card>
            </div>
          </div>

          <!-- No Requests Message -->
          <div *ngIf="!filteredRequests().length && !isLoading()" class="text-center py-12">
            <i class="pi pi-inbox text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
            <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
              {{ searchTerm || selectedStatus || selectedRequestType ? 'No Matching Requests' : 'No Requests Yet' }}
            </h3>
            <p class="text-surface-500 dark:text-surface-400 mb-4">
              {{ searchTerm || selectedStatus || selectedRequestType 
                ? 'No requests match your current filters' 
                : 'You haven\'t submitted any requests yet. Click "New Request" to get started.' 
              }}
            </p>
            <p-button 
              *ngIf="!searchTerm && !selectedStatus && !selectedRequestType"
              label="Create First Request" 
              icon="pi pi-plus"
              (click)="showNewRequestDialog = true">
            </p-button>
          </div>
        </p-fluid>
      </div>

      <!-- New Request Dialog -->
      <p-dialog 
        header="Create New Request" 
        [(visible)]="showNewRequestDialog" 
        [modal]="true"
        styleClass="w-full max-w-2xl">
        <div class="space-y-6">
          <!-- Request Type Selection -->
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Request Type *
            </label>
            <p-select
              [(ngModel)]="newRequest.requestType"
              [options]="availableRequestTypes()"
              optionLabel="label"
              optionValue="value"
              placeholder="Select request type"
              class="w-full"
              (onChange)="onRequestTypeChange()">
            </p-select>
          </div>

          <!-- Promotion Request Fields -->
          <div *ngIf="newRequest.requestType === 'Promotion'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Target Employee *
              </label>
              <p-select
                [(ngModel)]="newRequest.targetEmployeeId"
                [options]="employeeOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select employee"
                class="w-full">
              </p-select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                New Position *
              </label>
              <p-select
                [(ngModel)]="newRequest.newPositionId"
                [options]="positionOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select position"
                class="w-full">
              </p-select>
            </div>

            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Proposed Salary
              </label>
              <p-inputNumber
                [(ngModel)]="newRequest.proposedSalary"
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
                [(ngModel)]="newRequest.justification"
                rows="4"
                class="w-full"
                placeholder="Explain why this promotion is warranted...">
              </textarea>
            </div>
          </div>

          <!-- Department Change Request Fields -->
          <div *ngIf="newRequest.requestType === 'DepartmentChange'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Target Employee *
              </label>
              <p-select
                [(ngModel)]="newRequest.targetEmployeeId"
                [options]="employeeOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select employee"
                class="w-full">
              </p-select>
            </div>

            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                New Department *
              </label>
              <p-select
                [(ngModel)]="newRequest.newDepartmentId"
                [options]="departmentOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select department"
                class="w-full">
              </p-select>
            </div>

            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                New Manager
              </label>
              <p-select
                [(ngModel)]="newRequest.newManagerId"
                [options]="managerOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Select manager (optional)"
                class="w-full"
                [showClear]="true">
              </p-select>
            </div>

            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Reason *
              </label>
              <textarea 
                pTextarea 
                [(ngModel)]="newRequest.reason"
                rows="4"
                class="w-full"
                placeholder="Explain the reason for department change...">
              </textarea>
            </div>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelNewRequest()">
          </p-button>
          <p-button 
            label="Submit Request" 
            (click)="submitNewRequest()"
            [disabled]="!isNewRequestValid()"
            [loading]="isSubmitting()">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class MyRequests implements OnInit {
  // Signals for reactive state management
  myRequests = signal<EmployeeRequest[]>([]);
  filteredRequests = signal<EmployeeRequest[]>([]);
  positions = signal<Position[]>([]);
  departments = signal<Department[]>([]);
  employees = signal<Employee[]>([]);
  currentUser = signal<Employee | null>(null);

  // Loading states
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Dialog states
  showNewRequestDialog = false;
  expandedRequests = new Set<number>();

  // Filter states
  searchTerm = '';
  selectedStatus: string | null = null;
  selectedRequestType: string | null = null;

  // New request form
  newRequest: any = {
    requestType: null,
    targetEmployeeId: null,
    newPositionId: null,
    newDepartmentId: null,
    newManagerId: null,
    proposedSalary: null,
    justification: '',
    reason: ''
  };

  // Computed properties
  totalRequests = computed(() => this.myRequests().length);
  pendingRequests = computed(() => 
    this.myRequests().filter(req => 
      req.status === 'Pending' || req.status === 'ManagerApproved'
    ).length
  );
  approvedRequests = computed(() => 
    this.myRequests().filter(req => 
      req.status === 'HRApproved' || req.status === 'AutoApproved'
    ).length
  );
  rejectedRequests = computed(() => 
    this.myRequests().filter(req => req.status === 'Rejected').length
  );

  statusOptions = computed(() => [
    { label: 'All Statuses', value: null },
    { label: 'Pending', value: 'Pending' },
    { label: 'Manager Approved', value: 'ManagerApproved' },
    { label: 'HR Approved', value: 'HRApproved' },
    { label: 'Auto Approved', value: 'AutoApproved' },
    { label: 'Rejected', value: 'Rejected' }
  ]);

  requestTypeOptions = computed(() => [
    { label: 'All Types', value: null },
    { label: 'Promotion', value: 'Promotion' },
    { label: 'Department Change', value: 'DepartmentChange' }
  ]);

  availableRequestTypes = computed(() => [
    { label: 'Promotion Request', value: 'Promotion' },
    { label: 'Department Change Request', value: 'DepartmentChange' }
  ]);

  positionOptions = computed(() => 
    this.positions().map(pos => ({ 
      label: `${pos.title} - ${pos.department?.name || 'Unknown Dept'}`, 
      value: pos.id 
    }))
  );

  departmentOptions = computed(() => 
    this.departments().map(dept => ({ 
      label: dept.name, 
      value: dept.id 
    }))
  );

  employeeOptions = computed(() => 
    this.employees().map(emp => ({ 
      label: emp.fullName, 
      value: emp.id 
    }))
  );

  managerOptions = computed(() => 
    this.employees().filter(emp => 
      // Filter for managers/team leads - you might need to adjust this logic
      emp.currentPosition?.level === 'Manager' || 
      emp.currentPosition?.level === 'Director' ||
      emp.currentPosition?.level === 'Lead'
    ).map(emp => ({ 
      label: emp.fullName, 
      value: emp.id 
    }))
  );

  constructor(
    public employeeRequestService: EmployeeRequestService,
    private positionService: PositionService,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
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
        this.loadRequests(),
        this.loadPositions(),
        this.loadDepartments(),
        this.loadEmployees(),
        this.loadCurrentUser()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadRequests() {
    try {
      const requests = await this.employeeRequestService.getMyRequests().toPromise();
      if (requests) {
        this.myRequests.set(requests);
        this.filterRequests();
      }
    } catch (error) {
      console.error('Error loading requests:', error);
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

  async loadDepartments() {
    try {
      const departments = await this.departmentService.getActiveDepartments().toPromise();
      if (departments) {
        this.departments.set(departments);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
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

  async loadCurrentUser() {
    try {
      const user = await this.employeeService.getMyProfile().toPromise();
      if (user) {
        this.currentUser.set(user);
        // Set default target employee to current user
        this.newRequest.targetEmployeeId = user.id;
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  // Filtering methods
  filterRequests() {
    let filtered = this.myRequests();

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        this.getRequestTitle(request).toLowerCase().includes(term) ||
        request.requestType.toLowerCase().includes(term) ||
        request.targetEmployee?.fullName.toLowerCase().includes(term) ||
        request.notes?.toLowerCase().includes(term) ||
        request.rejectionReason?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(request => request.status === this.selectedStatus);
    }

    // Request type filter
    if (this.selectedRequestType) {
      filtered = filtered.filter(request => request.requestType === this.selectedRequestType);
    }

    this.filteredRequests.set(filtered);
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedRequestType = null;
    this.filterRequests();
  }

  refreshData() {
    this.loadRequests();
  }

  // Request management
  toggleRequestDetails(requestId: number) {
    if (this.expandedRequests.has(requestId)) {
      this.expandedRequests.delete(requestId);
    } else {
      this.expandedRequests.add(requestId);
    }
  }

  // New request management
  onRequestTypeChange() {
    // Reset form fields when request type changes
    this.newRequest.newPositionId = null;
    this.newRequest.newDepartmentId = null;
    this.newRequest.newManagerId = null;
    this.newRequest.proposedSalary = null;
    this.newRequest.justification = '';
    this.newRequest.reason = '';
  }

  async submitNewRequest() {
    if (!this.isNewRequestValid()) return;

    this.isSubmitting.set(true);

    try {
      let request;

      if (this.newRequest.requestType === 'Promotion') {
        const promotionRequest: CreatePromotionRequestDto = {
          targetEmployeeId: this.newRequest.targetEmployeeId,
          newPositionId: this.newRequest.newPositionId,
          proposedSalary: this.newRequest.proposedSalary,
          justification: this.newRequest.justification
        };
        request = await this.employeeRequestService.createPromotionRequest(promotionRequest).toPromise();
      } else if (this.newRequest.requestType === 'DepartmentChange') {
        const deptChangeRequest: CreateDepartmentChangeRequestDto = {
          targetEmployeeId: this.newRequest.targetEmployeeId,
          newDepartmentId: this.newRequest.newDepartmentId,
          newManagerId: this.newRequest.newManagerId,
          reason: this.newRequest.reason
        };
        request = await this.employeeRequestService.createDepartmentChangeRequest(deptChangeRequest).toPromise();
      }

      if (request) {
        this.messageService.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: 'Your request has been submitted for approval'
        });
        this.cancelNewRequest();
        await this.loadRequests();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Submission Failed',
        detail: 'Unable to submit request. Please try again.'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancelNewRequest() {
    this.showNewRequestDialog = false;
    this.newRequest = {
      requestType: null,
      targetEmployeeId: this.currentUser()?.id || null,
      newPositionId: null,
      newDepartmentId: null,
      newManagerId: null,
      proposedSalary: null,
      justification: '',
      reason: ''
    };
  }

  isNewRequestValid(): boolean {
    if (!this.newRequest.requestType || !this.newRequest.targetEmployeeId) {
      return false;
    }

    if (this.newRequest.requestType === 'Promotion') {
      return !!(this.newRequest.newPositionId && this.newRequest.justification?.trim());
    }

    if (this.newRequest.requestType === 'DepartmentChange') {
      return !!(this.newRequest.newDepartmentId && this.newRequest.reason?.trim());
    }

    return false;
  }

  // Utility methods
  getRequestTitle(request: EmployeeRequest): string {
    if (this.isPromotionRequest(request)) {
      const promotionReq = request as PromotionRequest;
      return `Promotion to ${promotionReq.newPosition?.title || 'Unknown Position'}`;
    } else if (this.isDepartmentChangeRequest(request)) {
      const deptChangeReq = request as DepartmentChangeRequest;
      return `Department Change to ${deptChangeReq.newDepartment?.name || 'Unknown Department'}`;
    }
    return `${request.requestType} Request`;
  }

  getRequestTypeLabel(requestType: string): string {
    const labels: { [key: string]: string } = {
      'Promotion': 'Promotion',
      'DepartmentChange': 'Dept. Change'
    };
    return labels[requestType] || requestType;
  }

  getRequestTypeSeverity(requestType: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const severities: { [key: string]: any } = {
      'Promotion': 'success',
      'DepartmentChange': 'info'
    };
    return severities[requestType] || 'secondary';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (status) {
      case 'HRApproved':
      case 'AutoApproved':
        return 'success';
      case 'ManagerApproved':
        return 'info';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getProgressPercentage(status: string): number {
    switch (status) {
      case 'Pending':
        return 25;
      case 'ManagerApproved':
        return 75;
      case 'HRApproved':
      case 'AutoApproved':
        return 100;
      case 'Rejected':
        return 0;
      default:
        return 0;
    }
  }

  getProgressText(request: EmployeeRequest): string {
    switch (request.status) {
      case 'Pending':
        return 'Awaiting manager approval';
      case 'ManagerApproved':
        return 'Manager approved, awaiting HR approval';
      case 'HRApproved':
        return 'Approved and processed';
      case 'AutoApproved':
        return 'Auto-approved and processed';
      case 'Rejected':
        return 'Request rejected';
      default:
        return 'Status unknown';
    }
  }

  getApprovalTimeline(request: EmployeeRequest): any[] {
    const timeline = [];

    // Request Submitted
    timeline.push({
      title: 'Request Submitted',
      description: `Request created by ${request.requester.fullName}`,
      date: new Date(request.requestDate),
      completed: true,
      current: false,
      approver: request.requester.fullName
    });

    // Manager Approval
    if (request.status === 'Pending') {
      timeline.push({
        title: 'Manager Review',
        description: 'Awaiting manager approval',
        date: null,
        completed: false,
        current: true,
        approver: null
      });
    } else if (request.managerApprovalDate) {
      timeline.push({
        title: 'Manager Approved',
        description: 'Approved by manager',
        date: new Date(request.managerApprovalDate),
        completed: true,
        current: false,
        approver: request.approvedByManager?.fullName || 'Manager'
      });
    }

    // HR Approval
    if (request.status === 'ManagerApproved') {
      timeline.push({
        title: 'HR Review',
        description: 'Awaiting HR approval',
        date: null,
        completed: false,
        current: true,
        approver: null
      });
    } else if (request.hrApprovalDate) {
      timeline.push({
        title: 'HR Approved',
        description: 'Approved and processed by HR',
        date: new Date(request.hrApprovalDate),
        completed: true,
        current: false,
        approver: request.approvedByHR?.fullName || 'HR'
      });
    } else if (request.status === 'AutoApproved') {
      timeline.push({
        title: 'Auto Approved',
        description: 'Automatically approved and processed',
        date: request.processedDate ? new Date(request.processedDate) : null,
        completed: true,
        current: false,
        approver: 'System'
      });
    } else if (request.status === 'Rejected') {
      timeline.push({
        title: 'Request Rejected',
        description: request.rejectionReason || 'Request was rejected',
        date: request.processedDate ? new Date(request.processedDate) : null,
        completed: true,
        current: false,
        approver: request.approvedByHR?.fullName || request.approvedByManager?.fullName || 'Reviewer'
      });
    }

    return timeline;
  }

  isPromotionRequest(request: EmployeeRequest): request is PromotionRequest {
    return request.requestType === 'Promotion';
  }

  isDepartmentChangeRequest(request: EmployeeRequest): request is DepartmentChangeRequest {
    return request.requestType === 'DepartmentChange';
  }

  // TrackBy function for performance
  trackByRequestId(index: number, request: EmployeeRequest): number {
    return request.id;
  }
}