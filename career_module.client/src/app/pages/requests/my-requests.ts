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
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { DrawerModule } from 'primeng/drawer';
import { AccordionModule } from 'primeng/accordion';
import { FluidModule } from 'primeng/fluid';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';

// Services
import { EmployeeRequestService, EmployeeRequest, PromotionRequest, DepartmentChangeRequest, CreatePromotionRequestDto, CreateDepartmentChangeRequestDto } from '../service/employee-request.service';
import { EmployeeService, Employee } from '../service/employee.service';
import { DepartmentService, Department } from '../service/department.service';
import { AuthService } from '../service/auth.service';
import { CareerPath, CareerPathService } from '../service/career-path.service';

interface RequestWithType extends EmployeeRequest {
  requestTypeLabel: string;
  canCancel?: boolean;
  isExpanded?: boolean;
}

interface TimelineEvent {
  status: string;
  date: string;
  icon: string;
  color: string;
  description: string;
}

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
    TooltipModule,
    ConfirmDialogModule,
    PanelModule,
    DividerModule,
    TimelineModule,
    AvatarModule,
    DrawerModule,
    AccordionModule,
    FluidModule,
    TextareaModule,
    InputNumberModule,
    DatePickerModule
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
              Track and manage your employee requests
            </p>
          </div>
          <div class="flex gap-2">
            <p-button 
              label="New Request" 
              icon="pi pi-plus"
              (click)="showCreateRequestDialog = true"
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
      <div *ngIf="isLoading() && !requests().length" class="flex justify-center items-center py-20">
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
      <div *ngIf="!isLoading() || requests().length" class="px-6">
        <p-fluid>
          <!-- Filters -->
          <div class="mb-6">
            <p-card>
              <div class="flex flex-wrap gap-4 items-center">
                <div class="flex-1 min-w-0">
                  <span class="p-input-icon-left w-full">
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
                  [(ngModel)]="selectedRequestType"
                  [options]="requestTypeOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="All Types"
                  (onChange)="filterRequests()"
                  [showClear]="true"
                  class="min-w-48">
                </p-select>
                <p-select
                  [(ngModel)]="selectedStatus"
                  [options]="statusOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="All Statuses"
                  (onChange)="filterRequests()"
                  [showClear]="true"
                  class="min-w-48">
                </p-select>
              </div>
            </p-card>
          </div>

          <!-- Requests Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <p-card styleClass="text-center">
              <div class="text-2xl font-bold text-blue-500">{{ getTotalRequests() }}</div>
              <div class="text-surface-600 dark:text-surface-300">Total Requests</div>
            </p-card>
            <p-card styleClass="text-center">
              <div class="text-2xl font-bold text-orange-500">{{ getPendingRequests() }}</div>
              <div class="text-surface-600 dark:text-surface-300">Pending</div>
            </p-card>
            <p-card styleClass="text-center">
              <div class="text-2xl font-bold text-green-500">{{ getApprovedRequests() }}</div>
              <div class="text-surface-600 dark:text-surface-300">Approved</div>
            </p-card>
            <p-card styleClass="text-center">
              <div class="text-2xl font-bold text-red-500">{{ getRejectedRequests() }}</div>
              <div class="text-surface-600 dark:text-surface-300">Rejected</div>
            </p-card>
          </div>

          <!-- Requests Table -->
          <p-card>
            <p-table 
              [value]="filteredRequests()" 
              [loading]="isLoading()"
              [paginator]="true" 
              [rows]="10"
              [rowHover]="true"
              dataKey="id"
              styleClass="p-datatable-gridlines">
              
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 3rem"></th>
                  <th pSortableColumn="requestType">
                    Type <p-sortIcon field="requestType"></p-sortIcon>
                  </th>
                  <th pSortableColumn="status">
                    Status <p-sortIcon field="status"></p-sortIcon>
                  </th>
                  <th pSortableColumn="requestDate">
                    Request Date <p-sortIcon field="requestDate"></p-sortIcon>
                  </th>
                  <th>Target Employee</th>
                  <th>Progress</th>
                  <th style="width: 8rem">Actions</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-request let-expanded="expanded" let-ri="rowIndex">
                <tr>
                  <td>
                    <p-button 
                      [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      (click)="toggleRequestDetails(request)">
                    </p-button>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <i [class]="getRequestTypeIcon(request.requestType)" class="text-lg"></i>
                      <span class="font-medium">{{ getRequestTypeLabel(request.requestType) }}</span>
                    </div>
                  </td>
                  <td>
                    <p-tag 
                      [value]="getStatusDisplayText(request.status)" 
                      [severity]="getStatusSeverity(request.status)">
                    </p-tag>
                  </td>
                  <td>
                    <span class="text-surface-600 dark:text-surface-300">
                      {{ request.requestDate | date:'mediumDate' }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2" *ngIf="request.targetEmployee">
                      <p-avatar 
                        [label]="getInitials(request.targetEmployee.fullName)"
                        shape="circle"
                        size="normal">
                      </p-avatar>
                      <span>{{ request.targetEmployee.fullName }}</span>
                    </div>
                    <span *ngIf="!request.targetEmployee" class="text-surface-500 dark:text-surface-400">
                      Self Request
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="flex-1">
                        <div class="text-xs text-surface-600 dark:text-surface-300 mb-1">
                          {{ getProgressText(request.status) }}
                        </div>
                        <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                          <div 
                            class="h-2 rounded-full transition-all"
                            [style.width.%]="getProgressPercentage(request.status)"
                            [ngClass]="getProgressColor(request.status)">
                          </div>
                        </div>
                      </div>
                      <span class="text-xs font-medium">{{ getProgressPercentage(request.status) }}%</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <p-button 
                        icon="pi pi-eye"
                        size="small"
                        severity="secondary"
                        [outlined]="true"
                        (click)="viewRequestDetails(request)"
                        pTooltip="View Details">
                      </p-button>
                      <p-button 
                        *ngIf="canCancelRequest(request)"
                        icon="pi pi-times"
                        size="small"
                        severity="danger"
                        [outlined]="true"
                        (click)="cancelRequest(request)"
                        pTooltip="Cancel Request">
                      </p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="rowexpansion" let-request>
                <tr>
                  <td colspan="7">
                    <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Request Details -->
                        <div>
                          <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Request Details</h6>
                          
                          <!-- Promotion Request Details -->
                          <div *ngIf="request.requestType === 'Promotion'" class="space-y-3">
                            <ng-container *ngIf="getPromotionRequest(request) as promotion">
                              <div class="flex justify-between">
                                <span class="text-surface-600 dark:text-surface-300">New Position:</span>
                                <strong>{{ this.getPromotionRequestTitle(promotion) }}</strong>
                              </div>
                              <div class="flex justify-between" *ngIf="promotion.proposedSalary">
                                <span class="text-surface-600 dark:text-surface-300">Proposed Salary:</span>
                                <strong>{{ promotion.proposedSalary | currency:'TND':'symbol':'1.0-0' }}</strong>
                              </div>
                              <div *ngIf="promotion.justification">
                                <span class="text-surface-600 dark:text-surface-300 block mb-1">Justification:</span>
                                <p class="text-sm bg-surface-100 dark:bg-surface-700 p-3 rounded">
                                  {{ promotion.justification }}
                                </p>
                              </div>
                            </ng-container>
                          </div>

                          <!-- Department Change Request Details -->
                          <div *ngIf="request.requestType === 'DepartmentChange'" class="space-y-3">
                            <ng-container *ngIf="getDepartmentChangeRequest(request) as deptChange">
                              <div class="flex justify-between">
                                <span class="text-surface-600 dark:text-surface-300">New Department:</span>
                                <strong>{{ deptChange.newDepartment.name || 'Unknown Department' }}</strong>
                              </div>
                              <div class="flex justify-between" *ngIf="deptChange.newManager">
                                <span class="text-surface-600 dark:text-surface-300">New Manager:</span>
                                <strong>{{ deptChange.newManager.fullName }}</strong>
                              </div>
                              <div *ngIf="deptChange.reason">
                                <span class="text-surface-600 dark:text-surface-300 block mb-1">Reason:</span>
                                <p class="text-sm bg-surface-100 dark:bg-surface-700 p-3 rounded">
                                  {{ deptChange.reason }}
                                </p>
                              </div>
                            </ng-container>
                          </div>

                          <!-- General Request Info -->
                          <div class="space-y-3 mt-4">
                            <div class="flex justify-between" *ngIf="request.notes">
                              <span class="text-surface-600 dark:text-surface-300">Notes:</span>
                            </div>
                            <div *ngIf="request.notes">
                              <p class="text-sm bg-surface-100 dark:bg-surface-700 p-3 rounded">
                                {{ request.notes }}
                              </p>
                            </div>
                            <div class="flex justify-between" *ngIf="request.rejectionReason">
                              <span class="text-surface-600 dark:text-surface-300">Rejection Reason:</span>
                            </div>
                            <div *ngIf="request.rejectionReason">
                              <p class="text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded">
                                {{ request.rejectionReason }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Timeline -->
                        <div>
                          <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Request Timeline</h6>
                          <p-timeline 
                            [value]="getRequestTimeline(request)" 
                            layout="vertical"
                            styleClass="customized-timeline">
                            <ng-template pTemplate="marker" let-event>
                              <div 
                                class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                                [style.background-color]="event.color">
                                <i [class]="event.icon" class="text-xs"></i>
                              </div>
                            </ng-template>

                            <ng-template pTemplate="content" let-event>
                              <div class="ml-3">
                                <div class="font-medium text-surface-900 dark:text-surface-0">
                                  {{ event.status }}
                                </div>
                                <div class="text-sm text-surface-600 dark:text-surface-300 mb-1">
                                  {{ event.date | date:'medium' }}
                                </div>
                                <p class="text-sm text-surface-700 dark:text-surface-200 m-0">
                                  {{ event.description }}
                                </p>
                              </div>
                            </ng-template>
                          </p-timeline>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="7" class="text-center py-8">
                    <div class="text-surface-500 dark:text-surface-400">
                      <i class="pi pi-inbox text-4xl mb-3 block"></i>
                      <div class="text-lg font-medium mb-2">No Requests Found</div>
                      <p class="mb-4">You haven't submitted any requests yet.</p>
                      <p-button 
                        label="Create Your First Request" 
                        icon="pi pi-plus"
                        (click)="showCreateRequestDialog = true">
                      </p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </p-fluid>
      </div>

      <!-- Create Request Dialog -->
      <p-dialog 
        header="Create New Request" 
        [(visible)]="showCreateRequestDialog" 
        [modal]="true"
        styleClass="w-full max-w-2xl">
        
        <p-tabs value="promotion">
          <p-tablist>
            <p-tab value="promotion">Promotion Request</p-tab>
            <p-tab value="department">Department Change</p-tab>
          </p-tablist>

          <!-- Promotion Request Tab -->
          <p-tabpanel value="promotion" header="Promotion Request" leftIcon="pi pi-arrow-up">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Target Employee *
                </label>
                <p-select
                  [(ngModel)]="newPromotionRequest.targetEmployeeId"
                  [options]="employeeOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select employee"
                  class="w-full"
                  [disabled]="!canSelectEmployee()">
                </p-select>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Career Path *
                </label>
                <p-select
                  [(ngModel)]="newPromotionRequest.careerPathId"
                  [options]="pathOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select career path"
                  class="w-full">
                </p-select>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  New Manager (Optional)
                </label>
                <p-select
                  [(ngModel)]="newPromotionRequest.newManagerId"
                  [options]="availableManagers()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select new manager"
                  class="w-full">
                </p-select>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Proposed Salary (Optional)
                </label>
                <p-inputNumber
                  [(ngModel)]="newPromotionRequest.proposedSalary"
                  mode="currency"
                  currency="TND"
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
                  [(ngModel)]="newPromotionRequest.justification"
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
                (click)="cancelCreateRequest()">
              </p-button>
              <p-button 
                label="Submit Request" 
                (click)="submitPromotionRequest()"
                [disabled]="!isPromotionRequestValid()"
                [loading]="isSubmittingRequest()">
              </p-button>
            </ng-template>
          </p-tabpanel>

          <!-- Department Change Request Tab -->
          <p-tabpanel value="department" header="Department Change" leftIcon="pi pi-building">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Target Employee *
                </label>
                <p-select
                  [(ngModel)]="newDepartmentChangeRequest.targetEmployeeId"
                  [options]="employeeOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select employee"
                  class="w-full"
                  [disabled]="!canSelectEmployee()">
                </p-select>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  New Department *
                </label>
                <p-select
                  [(ngModel)]="newDepartmentChangeRequest.newDepartmentId"
                  [options]="departmentOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select new department"
                  class="w-full"
                  (onChange)="onDepartmentChange()">
                </p-select>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  New Manager (Optional)
                </label>
                <p-select
                  [(ngModel)]="newDepartmentChangeRequest.newManagerId"
                  [options]="availableManagers()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select new manager"
                  class="w-full"
                  [disabled]="!newDepartmentChangeRequest.newDepartmentId">
                </p-select>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Reason *
                </label>
                <textarea 
                  pTextarea 
                  [(ngModel)]="newDepartmentChangeRequest.reason"
                  rows="4"
                  class="w-full"
                  placeholder="Explain the reason for this department change...">
                </textarea>
              </div>
            </div>
            
            <ng-template pTemplate="footer">
              <p-button 
                label="Cancel" 
                severity="secondary" 
                [outlined]="true"
                (click)="cancelCreateRequest()">
              </p-button>
              <p-button 
                label="Submit Request" 
                (click)="submitDepartmentChangeRequest()"
                [disabled]="!isDepartmentChangeRequestValid()"
                [loading]="isSubmittingRequest()">
              </p-button>
            </ng-template>
          </p-tabpanel>
        </p-tabs>
      </p-dialog>

      <!-- Request Details Drawer -->
      <p-drawer
        [(visible)]="showRequestDetailsDrawer" 
        position="right" 
        styleClass="!w-full md:!w-150 lg:!w-[35rem]"
        [modal]="true">
        
        <ng-template pTemplate="header">
          <div *ngIf="selectedRequest" class="flex items-center gap-3">
            <i [class]="getRequestTypeIcon(selectedRequest.requestType)" class="text-2xl text-primary"></i>
            <div>
              <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">
                {{ getRequestTypeLabel(selectedRequest.requestType) }}
              </h3>
              <p class="text-surface-600 dark:text-surface-300 m-0">
                Request #{{ selectedRequest.id }}
              </p>
            </div>
          </div>
        </ng-template>

        <div *ngIf="selectedRequest" class="space-y-6">
          <!-- Status Card -->
          <p-card header="Current Status">
            <div class="flex items-center justify-between mb-4">
              <p-tag 
                [value]="getStatusDisplayText(selectedRequest.status)" 
                [severity]="getStatusSeverity(selectedRequest.status)"
                styleClass="text-lg px-3 py-2">
              </p-tag>
              <span class="text-surface-600 dark:text-surface-300">
                {{ selectedRequest.requestDate | date:'mediumDate' }}
              </span>
            </div>
            
            <div class="mb-4">
              <div class="text-sm text-surface-600 dark:text-surface-300 mb-2">
                {{ getProgressText(selectedRequest.status) }}
              </div>
              <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-3">
                <div 
                  class="h-3 rounded-full transition-all"
                  [style.width.%]="getProgressPercentage(selectedRequest.status)"
                  [ngClass]="getProgressColor(selectedRequest.status)">
                </div>
              </div>
            </div>
          </p-card>

          <!-- Request Details -->
          <p-card header="Request Details">
            <div class="space-y-4">
              <!-- Target Employee -->
              <div class="flex items-center justify-between">
                <span class="font-medium text-surface-600 dark:text-surface-300">Target Employee:</span>
                <div class="flex items-center gap-2">
                  <p-avatar 
                    *ngIf="selectedRequest.targetEmployee"
                    [label]="getInitials(selectedRequest.targetEmployee.fullName)"
                    shape="circle"
                    size="normal">
                  </p-avatar>
                  <span>{{ selectedRequest.targetEmployee?.fullName || 'Self Request' }}</span>
                </div>
              </div>

              <!-- Type-specific details -->
              <ng-container *ngIf="selectedRequest.requestType === 'Promotion'">
                <ng-container *ngIf="getPromotionRequest(selectedRequest) as promotion">
                  <div class="flex justify-between">
                    <span class="font-medium text-surface-600 dark:text-surface-300">New Position:</span>
                    <strong>{{ this.getPromotionRequestTitle(promotion) }}</strong>
                  </div>
                  <div class="flex justify-between" *ngIf="promotion.proposedSalary">
                    <span class="font-medium text-surface-600 dark:text-surface-300">Proposed Salary:</span>
                    <strong>{{ promotion.proposedSalary | currency:'TND':'symbol':'1.0-0' }}</strong>
                  </div>
                </ng-container>
              </ng-container>

              <ng-container *ngIf="selectedRequest.requestType === 'DepartmentChange'">
                <ng-container *ngIf="getDepartmentChangeRequest(selectedRequest) as deptChange">
                  <div class="flex justify-between">
                    <span class="font-medium text-surface-600 dark:text-surface-300">New Department:</span>
                    <strong>{{ deptChange.newDepartment.name || 'Unknown Department' }}</strong>
                  </div>
                  <div class="flex justify-between" *ngIf="deptChange.newManager">
                    <span class="font-medium text-surface-600 dark:text-surface-300">New Manager:</span>
                    <strong>{{ deptChange.newManager.fullName }}</strong>
                  </div>
                </ng-container>
              </ng-container>
            </div>
          </p-card>

          <!-- Justification/Reason -->
          <p-card header="Justification" *ngIf="getRequestJustification(selectedRequest)">
            <p class="text-surface-700 dark:text-surface-200 leading-relaxed">
              {{ getRequestJustification(selectedRequest) }}
            </p>
          </p-card>

          <!-- Rejection Reason -->
          <p-card header="Rejection Reason" *ngIf="selectedRequest.rejectionReason">
            <p class="text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded leading-relaxed">
              {{ selectedRequest.rejectionReason }}
            </p>
          </p-card>

          <!-- Timeline -->
          <p-card header="Request Timeline">
            <p-timeline 
              [value]="getRequestTimeline(selectedRequest)" 
              layout="vertical"
              styleClass="customized-timeline">
              <ng-template pTemplate="marker" let-event>
                <div 
                  class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  [style.background-color]="event.color">
                  <i [class]="event.icon" class="text-xs"></i>
                </div>
              </ng-template>

              <ng-template pTemplate="content" let-event>
                <div class="ml-3 pb-4">
                  <div class="font-medium text-surface-900 dark:text-surface-0">
                    {{ event.status }}
                  </div>
                  <div class="text-sm text-surface-600 dark:text-surface-300 mb-1">
                    {{ event.date | date:'medium' }}
                  </div>
                  <p class="text-sm text-surface-700 dark:text-surface-200 m-0">
                    {{ event.description }}
                  </p>
                </div>
              </ng-template>
            </p-timeline>
          </p-card>

          <!-- Actions -->
          <div class="flex gap-2" *ngIf="canCancelRequest(selectedRequest)">
            <p-button 
              label="Cancel Request" 
              icon="pi pi-times"
              severity="danger"
              [outlined]="true"
              (click)="cancelRequest(selectedRequest)"
              class="flex-1">
            </p-button>
          </div>
        </div>
      </p-drawer>
    </div>
  `,
})
export class MyRequests implements OnInit {
  // Signals for reactive state management
  requests = signal<RequestWithType[]>([]);
  filteredRequests = signal<RequestWithType[]>([]);
  paths = signal<CareerPath[]>([]);
  departments = signal<Department[]>([]);
  employees = signal<Employee[]>([]);
  currentUser = signal<Employee | null>(null);

  // Loading states
  isLoading = signal<boolean>(false);
  isSubmittingRequest = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Dialog states
  showCreateRequestDialog = false;
  showRequestDetailsDrawer = false;

  // Filter states
  searchTerm = '';
  selectedRequestType: string | null = null;
  selectedStatus: string | null = null;

  // Selected request for details
  selectedRequest: RequestWithType | null = null;

  // Form data
  newPromotionRequest: CreatePromotionRequestDto = {
    targetEmployeeId: 0,
    careerPathId: 0,
    newManagerId: undefined,
    proposedSalary: undefined,
    justification: ''
  };

  newDepartmentChangeRequest: CreateDepartmentChangeRequestDto = {
    targetEmployeeId: 0,
    newDepartmentId: 0,
    newManagerId: undefined,
    reason: ''
  };

  // Computed properties
  requestTypeOptions = computed(() => [
    { label: 'All Types', value: null },
    { label: 'Promotion', value: 'Promotion' },
    { label: 'Department Change', value: 'DepartmentChange' },
  ]);

  statusOptions = computed(() => [
    { label: 'All Statuses', value: null },
    { label: 'Pending', value: 'Pending' },
    { label: 'Manager Approved', value: 'ManagerApproved' },
    { label: 'HR Approved', value: 'HRApproved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Auto Approved', value: 'AutoApproved' }
  ]);

  pathOptions = computed(() => 
    this.paths().map(path => ({ 
      label: `From ${path.fromPosition.title} to ${path.toPosition.title} - ${path.toPosition.department?.name || 'Unknown Dept'}`, 
      value: path.id 
    }))
  );

  departmentOptions = computed(() => 
    this.departments().map(dept => ({ 
      label: dept.name, 
      value: dept.id 
    }))
  );

  employeeOptions = computed(() => {
    const current = this.currentUser();
    if (!current) return [];
    
    // If user is HR/Admin/Manager, they can select other employees
    if (this.canSelectEmployee()) {
      return this.employees().map(emp => ({ label: emp.fullName, value: emp.id }));
    }
    
    // Regular employees can only select themselves
    return [{ label: current.fullName, value: current.id }];
  });

  availableManagers = computed(() => {
    const selectedDeptId = this.newDepartmentChangeRequest.newDepartmentId;
    if (!selectedDeptId) return [];
    
    // Get employees in the selected department who are managers
    return this.employees()
      .filter(emp => emp.departmentId === selectedDeptId && emp.user.role === 'Manager')
      .map(emp => ({ label: emp.fullName, value: emp.id }));
  });

  constructor(
    private employeeRequestService: EmployeeRequestService,
    private employeeService: EmployeeService,
    private careerPathService: CareerPathService,
    private departmentService: DepartmentService,
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
        this.loadCurrentUser(),
        this.loadRequests(),
        this.loadPaths(),
        this.loadDepartments(),
        this.loadEmployees()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage.set('Failed to load data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCurrentUser() {
    try {
      const user = await this.employeeService.getMyProfile().toPromise();
      if (user) {
        this.currentUser.set(user);
        // Initialize form with current user
        this.newPromotionRequest.targetEmployeeId = user.id;
        this.newDepartmentChangeRequest.targetEmployeeId = user.id;
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  async loadRequests() {
    try {
      const requests = await this.employeeRequestService.getMyRequests().toPromise();
      if (requests) {
        const requestsWithType = requests.map(request => ({
          ...request,
          requestTypeLabel: this.getRequestTypeLabel(request.requestType),
          canCancel: this.canCancelRequest(request),
          isExpanded: false
        }));
        this.requests.set(requestsWithType);
        this.filterRequests();
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      throw error;
    }
  }

  async loadPaths() {
    try {
      const paths = await this.careerPathService.getActiveCareerPaths().toPromise();
      if (paths) {
        this.paths.set(paths);
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

  // Filter methods
  filterRequests() {
    let filtered = this.requests();

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.requestType.toLowerCase().includes(term) ||
        request.status.toLowerCase().includes(term) ||
        request.targetEmployee?.fullName.toLowerCase().includes(term) ||
        request.notes?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (this.selectedRequestType) {
      filtered = filtered.filter(request => request.requestType === this.selectedRequestType);
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(request => request.status === this.selectedStatus);
    }

    this.filteredRequests.set(filtered);
  }

  // Summary methods
  getTotalRequests(): number {
    return this.requests().length;
  }

  getPendingRequests(): number {
    return this.requests().filter(r => this.employeeRequestService.isRequestPending(r.status)).length;
  }

  getApprovedRequests(): number {
    return this.requests().filter(r => r.status === 'HRApproved' || r.status === 'AutoApproved').length;
  }

  getRejectedRequests(): number {
    return this.requests().filter(r => r.status === 'Rejected').length;
  }

  // Request details methods
  toggleRequestDetails(request: RequestWithType) {
    request.isExpanded = !request.isExpanded;
  }

  viewRequestDetails(request: RequestWithType) {
    this.selectedRequest = request;
    this.showRequestDetailsDrawer = true;
  }

  getPromotionRequest(request: EmployeeRequest): PromotionRequest | null {
    return request.requestType === 'Promotion' ? request as PromotionRequest : null;
  }

  getDepartmentChangeRequest(request: EmployeeRequest): DepartmentChangeRequest | null {
    return request.requestType === 'DepartmentChange' ? request as DepartmentChangeRequest : null;
  }

  getPromotionRequestTitle(promotion: PromotionRequest): string {
    const path = this.paths().find(p => p.id === promotion.careerPathId);
    return path ? 'Promotion From ' + path.fromPosition.title + ' to ' + path.toPosition.title : 'Unknown Path';
  }

  getRequestJustification(request: EmployeeRequest): string | null {
    if (request.requestType === 'Promotion') {
      const promotion = request as PromotionRequest;
      return promotion.justification || null;
    }
    if (request.requestType === 'DepartmentChange') {
      const deptChange = request as DepartmentChangeRequest;
      return deptChange.reason || null;
    }
    return request.notes || null;
  }

  // Timeline methods
  getRequestTimeline(request: EmployeeRequest): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];

    // Request submitted
    timeline.push({
      status: 'Request Submitted',
      date: request.requestDate,
      icon: 'pi pi-send',
      color: '#3b82f6',
      description: `${this.getRequestTypeLabel(request.requestType)} request submitted for review`
    });

    // Manager approval
    if (request.managerApprovalDate) {
      timeline.push({
        status: 'Manager Approved',
        date: request.managerApprovalDate,
        icon: 'pi pi-check',
        color: '#10b981',
        description: `Approved by ${request.approvedByManager?.fullName || 'Manager'}`
      });
    }

    // HR approval
    if (request.hrApprovalDate) {
      timeline.push({
        status: 'HR Approved',
        date: request.hrApprovalDate,
        icon: 'pi pi-verified',
        color: '#059669',
        description: `Final approval by ${request.approvedByHR?.fullName || 'HR'}`
      });
    }

    // Processing/Completion
    if (request.processedDate) {
      timeline.push({
        status: 'Processed',
        date: request.processedDate,
        icon: 'pi pi-check-circle',
        color: '#047857',
        description: 'Request has been processed and implemented'
      });
    }

    // Rejection
    if (request.status === 'Rejected') {
      timeline.push({
        status: 'Request Rejected',
        date: request.processedDate || request.requestDate,
        icon: 'pi pi-times',
        color: '#dc2626',
        description: request.rejectionReason || 'Request was rejected'
      });
    }

    return timeline;
  }

  // Status and progress methods
  getStatusDisplayText(status: string): string {
    return this.employeeRequestService.getStatusDisplayText(status);
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
      case 'Pending': return 25;
      case 'ManagerApproved': return 50;
      case 'HRApproved': return 100;
      case 'AutoApproved': return 100;
      case 'Rejected': return 0;
      case 'Canceled': return 0;
      default: return 0;
    }
  }

  getProgressText(status: string): string {
    switch (status) {
      case 'Pending': return 'Awaiting manager approval';
      case 'ManagerApproved': return 'Awaiting HR approval';
      case 'HRApproved': return 'Approved and processed';
      case 'AutoApproved': return 'Auto-approved and processed';
      case 'Rejected': return 'Request rejected';
      case 'Canceled': return 'Request canceled';
      default: return 'Unknown status';
    }
  }

  getProgressColor(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-yellow-500';
      case 'ManagerApproved': return 'bg-blue-500';
      case 'HRApproved':
      case 'AutoApproved': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }

  // Request type methods
  getRequestTypeLabel(type: string): string {
    switch (type) {
      case 'Promotion': return 'Promotion Request';
      case 'DepartmentChange': return 'Department Change';
      default: return type;
    }
  }

  getRequestTypeIcon(type: string): string {
    switch (type) {
      case 'Promotion': return 'pi pi-arrow-up';
      case 'DepartmentChange': return 'pi pi-building';
      default: return 'pi pi-file';
    }
  }

  // Form submission methods
  async submitPromotionRequest() {
    if (!this.isPromotionRequestValid()) return;

    this.isSubmittingRequest.set(true);

    try {
      const request = await this.employeeRequestService.createPromotionRequest(this.newPromotionRequest).toPromise();
      if (request) {
        this.messageService.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: 'Your promotion request has been submitted successfully'
        });
        this.cancelCreateRequest();
        await this.loadRequests();
      }
    } catch (error) {
      console.error('Error submitting promotion request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Submission Failed',
        detail: 'Unable to submit promotion request'
      });
    } finally {
      this.isSubmittingRequest.set(false);
    }
  }

  async submitDepartmentChangeRequest() {
    if (!this.isDepartmentChangeRequestValid()) return;

    this.isSubmittingRequest.set(true);

    try {
      const request = await this.employeeRequestService.createDepartmentChangeRequest(this.newDepartmentChangeRequest).toPromise();
      if (request) {
        this.messageService.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: 'Your department change request has been submitted successfully'
        });
        this.cancelCreateRequest();
        await this.loadRequests();
      }
    } catch (error) {
      console.error('Error submitting department change request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Submission Failed',
        detail: 'Unable to submit department change request'
      });
    } finally {
      this.isSubmittingRequest.set(false);
    }
  }

  // Form validation methods
  isPromotionRequestValid(): boolean {
    return !!(this.newPromotionRequest.targetEmployeeId && 
              this.newPromotionRequest.careerPathId && 
              this.newPromotionRequest.justification?.trim());
  }

  isDepartmentChangeRequestValid(): boolean {
    return !!(this.newDepartmentChangeRequest.targetEmployeeId && 
              this.newDepartmentChangeRequest.newDepartmentId && 
              this.newDepartmentChangeRequest.reason?.trim());
  }

  // Form management methods
  cancelCreateRequest() {
    this.showCreateRequestDialog = false;
    this.resetForms();
  }

  resetForms() {
    const currentUserId = this.currentUser()?.id || 0;
    
    this.newPromotionRequest = {
      targetEmployeeId: currentUserId,
      careerPathId: 0,
      newManagerId: undefined,
      proposedSalary: undefined,
      justification: ''
    };

    this.newDepartmentChangeRequest = {
      targetEmployeeId: currentUserId,
      newDepartmentId: 0,
      newManagerId: undefined,
      reason: ''
    };
  }

  onDepartmentChange() {
    // Clear manager selection when department changes
    this.newDepartmentChangeRequest.newManagerId = undefined;
  }

  // Permission methods
  canSelectEmployee(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin' || user?.role === 'Manager';
  }

  canCancelRequest(request: EmployeeRequest): boolean {
    return this.employeeRequestService.isRequestPending(request.status);
  }

  // Request cancellation
  cancelRequest(request: EmployeeRequest) {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel this ${this.getRequestTypeLabel(request.requestType).toLowerCase()}?`,
      header: 'Cancel Request',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const message = await this.employeeRequestService.cancelRequest(request.id).toPromise();
          if (message) {
            this.messageService.add({
              severity: 'success',
              summary: 'Request Canceled',
              detail: message.message
            });
          }
        } catch (error) {
          console.error('Error canceling request:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Cancellation Failed',
            detail: 'Unable to cancel request'
          });
        }
      }
    });
  }

  // Utility methods
  refreshData() {
    this.loadData();
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}