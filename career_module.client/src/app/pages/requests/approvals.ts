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
import { RatingModule } from 'primeng/rating';

// Services
import { EmployeeRequestService, EmployeeRequest, ApprovalDto, RejectionDto } from '../service/employee-request.service';
import { EmployeeService, Employee } from '../service/employee.service';
import { DepartmentService, Department } from '../service/department.service';
import { AuthService } from '../service/auth.service';
import { CareerPath, CareerPathService } from '../service/career-path.service';
import { Position, PositionService } from '../service/position.service';

interface ApprovalRequest extends EmployeeRequest {
  requestTypeLabel: string;
  canApprove?: boolean;
  isExpanded?: boolean;
  approvalLevel?: 'manager' | 'hr' | 'completed';
}

interface TimelineEvent {
  status: string;
  date: string;
  icon: string;
  color: string;
  description: string;
  person?: string;
}

interface ApprovalAction {
  type: 'approve' | 'reject';
  requestId: number;
  notes?: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-approvals',
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
    DatePickerModule,
    RatingModule
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Pending Approvals</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Review and approve employee requests
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
      <div *ngIf="isLoading() && !pendingRequests().length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading pending requests...</span>
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
                (click)="loadPendingRequests()"
                class="ml-auto">
              </p-button>
            </div>
          </ng-template>
        </p-message>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading() || pendingRequests().length" class="px-6">
        <p-fluid>
          <p-tabs value="all-requests">
            <p-tablist>
              <p-tab value="all-requests">
                All Requests 
                <p-badge [value]="getTotalPendingCount()" severity="warn" class="ml-2"></p-badge>
              </p-tab>
              <p-tab value="manager-approval">
                Manager Approval
                <p-badge [value]="getManagerApprovalCount()" severity="info" class="ml-2"></p-badge>
              </p-tab>
              <p-tab value="hr-approval">
                HR Approval
                <p-badge [value]="getHRApprovalCount()" severity="success" class="ml-2"></p-badge>
              </p-tab>
            </p-tablist>

            <!-- All Requests Tab -->
            <p-tabpanel value="all-requests" header="All Requests" leftIcon="pi pi-list">
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
                      [(ngModel)]="selectedApprovalLevel"
                      [options]="approvalLevelOptions()"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="All Levels"
                      (onChange)="filterRequests()"
                      [showClear]="true"
                      class="min-w-48">
                    </p-select>
                  </div>
                </p-card>
              </div>

              <!-- Summary Cards -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-blue-500">{{ getTotalPendingCount() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">Total Pending</div>
                </p-card>
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-orange-500">{{ getManagerApprovalCount() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">Manager Review</div>
                </p-card>
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-green-500">{{ getHRApprovalCount() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">HR Review</div>
                </p-card>
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-purple-500">{{ getPromotionRequestCount() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">Promotions</div>
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
                      <th pSortableColumn="requestType">
                        Type <p-sortIcon field="requestType"></p-sortIcon>
                      </th>
                      <th pSortableColumn="requesterName">
                        Requester <p-sortIcon field="requesterName"></p-sortIcon>
                      </th>
                      <th>Target Employee</th>
                      <th pSortableColumn="requestDate">
                        Date <p-sortIcon field="requestDate"></p-sortIcon>
                      </th>
                      <th pSortableColumn="status">
                        Status <p-sortIcon field="status"></p-sortIcon>
                      </th>
                      <th>Approval Level</th>
                      <th style="width: 12rem">Actions</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-request let-expanded="expanded" let-ri="rowIndex">
                    <tr>
                      <td>
                        <div class="flex items-center gap-2">
                          <i [class]="getRequestTypeIcon(request.requestType)" class="text-lg"></i>
                          <span class="font-medium">{{ getRequestTypeLabel(request.requestType) }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <p-avatar 
                            [label]="getInitials(request.requesterName)"
                            shape="circle"
                            size="normal">
                          </p-avatar>
                          <div>
                            <div class="font-medium">{{ request.requesterName }}</div>
                            <div class="text-xs text-surface-500 dark:text-surface-400">
                              ID: {{ request.requesterId }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2" *ngIf="request.targetEmployeeName && request.targetEmployeeName !== request.requesterName">
                          <p-avatar 
                            [label]="getInitials(request.targetEmployeeName)"
                            shape="circle"
                            size="normal">
                          </p-avatar>
                          <span>{{ request.targetEmployeeName }}</span>
                        </div>
                        <span *ngIf="!request.targetEmployeeName || request.targetEmployeeName === request.requesterName" 
                              class="text-surface-500 dark:text-surface-400">
                          Self Request
                        </span>
                      </td>
                      <td>
                        <span class="text-surface-600 dark:text-surface-300">
                          {{ request.requestDate | date:'mediumDate' }}
                        </span>
                        <div class="text-xs text-surface-500 dark:text-surface-400">
                          {{ getTimeAgo(request.requestDate) }}
                        </div>
                      </td>
                      <td>
                        <p-tag 
                          [value]="getStatusDisplayText(request.status)" 
                          [severity]="getStatusSeverity(request.status)">
                        </p-tag>
                      </td>
                      <td>
                        <p-chip 
                          [label]="getApprovalLevelLabel(request)"
                          [styleClass]="getApprovalLevelClass(request)">
                        </p-chip>
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
                            *ngIf="canApproveAsManager(request)"
                            icon="pi pi-check"
                            size="small"
                            severity="success"
                            [outlined]="true"
                            (click)="approveRequest(request)"
                            [loading]="isProcessingAction() && selectedActionRequestId === request.id"
                            pTooltip="Approve as Manager">
                          </p-button>
                          <p-button 
                            *ngIf="canApproveAsHR(request)"
                            icon="pi pi-verified"
                            size="small"
                            severity="success"
                            (click)="approveRequest(request)"
                            [loading]="isProcessingAction() && selectedActionRequestId === request.id"
                            pTooltip="Approve as HR">
                          </p-button>
                          <p-button 
                            *ngIf="canRejectRequest(request)"
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            [outlined]="true"
                            (click)="rejectRequest(request)"
                            [loading]="isProcessingAction() && selectedActionRequestId === request.id"
                            pTooltip="Reject Request">
                          </p-button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="7" class="text-center py-8">
                        <div class="text-surface-500 dark:text-surface-400">
                          <i class="pi pi-inbox text-4xl mb-3 block"></i>
                          <div class="text-lg font-medium mb-2">No Pending Requests</div>
                          <p class="mb-4">There are no requests pending your approval at this time.</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            </p-tabpanel>

            <!-- Manager Approval Tab -->
            <p-tabpanel value="manager-approval" header="Manager Approval" leftIcon="pi pi-user-check">
              <div class="space-y-6">
                <p-message 
                  severity="info" 
                  text="These requests require manager approval before proceeding to HR review."
                  styleClass="w-full">
                </p-message>

                <div *ngFor="let request of getManagerApprovalRequests(); trackBy: trackByRequestId" class="mb-4">
                  <p-card>
                    <ng-template pTemplate="header">
                      <div class="p-4 pb-0">
                        <div class="flex justify-between items-start">
                          <div class="flex items-center gap-3">
                            <i [class]="getRequestTypeIcon(request.requestType)" class="text-2xl text-primary"></i>
                            <div>
                              <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                                {{ getRequestTypeLabel(request.requestType) }}
                              </h6>
                              <p class="text-surface-600 dark:text-surface-300 m-0">
                                Requested by {{ request.requesterName }} on {{ request.requestDate | date:'mediumDate' }}
                              </p>
                            </div>
                          </div>
                          <p-tag 
                            [value]="getStatusDisplayText(request.status)" 
                            [severity]="getStatusSeverity(request.status)">
                          </p-tag>
                        </div>
                      </div>
                    </ng-template>

                    <div class="space-y-4">
                      <!-- Request Summary -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Request Details</h6>
                          <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Target Employee:</span>
                              <strong>{{ request.targetEmployeeName || request.requesterName }}</strong>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Request Date:</span>
                              <strong>{{ request.requestDate | date:'mediumDate' }}</strong>
                            </div>

                            <!-- Promotion specific details -->
                            <ng-container *ngIf="request.requestType === 'PositionChange'">
                              <ng-container *ngIf="getPromotionRequestData(request) as promotion">
                                <div class="flex justify-between">
                                  <span class="text-surface-600 dark:text-surface-300">Career Path:</span>
                                  <strong>{{ getPositionChangeRequestTitle(promotion) }}</strong>
                                </div>
                                <div class="flex justify-between" *ngIf="promotion.proposedSalary">
                                  <span class="text-surface-600 dark:text-surface-300">Proposed Salary:</span>
                                  <strong>{{ promotion.proposedSalary | currency:'TND':'symbol':'1.0-0' }}</strong>
                                </div>
                              </ng-container>
                            </ng-container>

                            <!-- Department Change specific details -->
                            <ng-container *ngIf="request.requestType === 'DepartmentChange'">
                              <ng-container *ngIf="getDepartmentChangeRequestData(request) as deptChange">
                                <div class="flex justify-between">
                                  <span class="text-surface-600 dark:text-surface-300">New Department ID:</span>
                                  <strong>{{ deptChange.newDepartmentId || 'Not specified' }}</strong>
                                </div>
                                <div class="flex justify-between" *ngIf="deptChange.newManagerId">
                                  <span class="text-surface-600 dark:text-surface-300">New Manager ID:</span>
                                  <strong>{{ deptChange.newManagerId }}</strong>
                                </div>
                              </ng-container>
                            </ng-container>
                          </div>
                        </div>

                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Quick Actions</h6>
                          <div class="space-y-2">
                            <p-button 
                              *ngIf="canApproveAsManager(request)"
                              label="Approve as Manager"
                              icon="pi pi-check"
                              severity="success"
                              size="small"
                              (click)="approveRequest(request)"
                              [loading]="isProcessingAction() && selectedActionRequestId === request.id"
                              class="w-full">
                            </p-button>
                            <p-button 
                              label="Reject Request"
                              icon="pi pi-times"
                              severity="danger"
                              [outlined]="true"
                              size="small"
                              (click)="rejectRequest(request)"
                              [loading]="isProcessingAction() && selectedActionRequestId === request.id"
                              class="w-full">
                            </p-button>
                            <p-button 
                              label="View Full Details"
                              icon="pi pi-eye"
                              severity="secondary"
                              [outlined]="true"
                              size="small"
                              (click)="viewRequestDetails(request)"
                              class="w-full">
                            </p-button>
                          </div>
                        </div>
                      </div>

                      <!-- Justification/Reason -->
                      <div *ngIf="getRequestJustification(request)">
                        <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Justification</h6>
                        <div class="bg-surface-100 dark:bg-surface-800 p-3 rounded-lg">
                          <p class="text-surface-700 dark:text-surface-200 text-sm m-0">
                            {{ getRequestJustification(request) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </p-card>
                </div>

                <!-- No Manager Approval Requests -->
                <div *ngIf="!getManagerApprovalRequests().length" class="text-center py-12">
                  <i class="pi pi-user-check text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                  <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                    No Manager Approvals Needed
                  </h3>
                  <p class="text-surface-500 dark:text-surface-400">
                    There are no requests currently waiting for manager approval.
                  </p>
                </div>
              </div>
            </p-tabpanel>

            <!-- HR Approval Tab -->
            <p-tabpanel value="hr-approval" header="HR Approval" leftIcon="pi pi-verified">
              <div class="space-y-6">
                <p-message 
                  severity="success" 
                  text="These requests have manager approval and are ready for final HR review."
                  styleClass="w-full">
                </p-message>

                <div *ngFor="let request of getHRApprovalRequests(); trackBy: trackByRequestId" class="mb-4">
                  <p-card>
                    <ng-template pTemplate="header">
                      <div class="p-4 pb-0">
                        <div class="flex justify-between items-start">
                          <div class="flex items-center gap-3">
                            <i [class]="getRequestTypeIcon(request.requestType)" class="text-2xl text-green-500"></i>
                            <div>
                              <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                                {{ getRequestTypeLabel(request.requestType) }}
                              </h6>
                              <p class="text-surface-600 dark:text-surface-300 m-0">
                                Manager approved • Ready for HR review
                              </p>
                            </div>
                          </div>
                          <div class="text-right">
                            <p-tag 
                              value="Manager Approved" 
                              severity="success"
                              styleClass="mb-2">
                            </p-tag>
                            <div class="text-xs text-surface-500 dark:text-surface-400">
                              Approved by {{ request.approvedByManagerName }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ng-template>

                    <div class="space-y-4">
                      <!-- Request Summary -->
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Employee</h6>
                          <div class="flex items-center gap-2">
                            <p-avatar 
                              [label]="getInitials(request.targetEmployeeName || request.requesterName)"
                              shape="circle"
                              size="normal">
                            </p-avatar>
                            <div>
                              <div class="font-medium text-sm">{{ request.targetEmployeeName || request.requesterName }}</div>
                              <div class="text-xs text-surface-500 dark:text-surface-400">
                                ID: {{ request.targetEmployeeId || request.requesterId }}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Timeline</h6>
                          <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Requested:</span>
                              <span>{{ request.requestDate | date:'shortDate' }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Manager Approved:</span>
                              <span>{{ request.managerApprovalDate | date:'shortDate' }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Days Pending:</span>
                              <span class="font-medium">{{ getDaysPending(request.requestDate) }}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">HR Actions</h6>
                          <div class="space-y-2">
                            <p-button 
                              *ngIf="canApproveAsHR(request)"
                              label="Final Approval"
                              icon="pi pi-verified"
                              severity="success"
                              size="small"
                              (click)="approveRequest(request)"
                              [loading]="isProcessingAction() && selectedActionRequestId === request.id"
                              class="w-full">
                            </p-button>
                            <p-button 
                              label="Reject"
                              icon="pi pi-times"
                              severity="danger"
                              [outlined]="true"
                              size="small"
                              (click)="rejectRequest(request)"
                              [loading]="isProcessingAction() && selectedActionRequestId === request.id"
                              class="w-full">
                            </p-button>
                          </div>
                        </div>
                      </div>

                      <!-- HR-Specific Information -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Impact Assessment -->
                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Impact Assessment</h6>
                          <div class="space-y-2 text-sm">
                            <div class="flex items-center gap-2">
                              <i class="pi pi-users text-blue-500"></i>
                              <span>{{ getImpactDescription(request) }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <i class="pi pi-calendar text-green-500"></i>
                              <span>Effective immediately upon approval</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <i class="pi pi-exclamation-triangle text-orange-500"></i>
                              <span>{{ getRiskLevel(request) }} risk level</span>
                            </div>
                          </div>
                        </div>

                        <!-- Additional Details -->
                        <div>
                          <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Additional Details</h6>
                          <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Budget Impact:</span>
                              <span class="font-medium">{{ getBudgetImpact(request) }}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Policy Compliance:</span>
                              <p-tag value="Compliant" severity="success" styleClass="text-xs"></p-tag>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-surface-600 dark:text-surface-300">Documentation:</span>
                              <span class="font-medium text-green-600">Complete</span>
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </p-card>
                </div>

                <!-- No HR Approval Requests -->
                <div *ngIf="!getHRApprovalRequests().length" class="text-center py-12">
                  <i class="pi pi-verified text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                  <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                    No HR Approvals Needed
                  </h3>
                  <p class="text-surface-500 dark:text-surface-400">
                    There are no requests currently waiting for HR approval.
                  </p>
                </div>
              </div>
            </p-tabpanel>
          </p-tabs>
        </p-fluid>
      </div>

      <!-- Request Details Drawer -->
      <p-drawer
        [(visible)]="showRequestDetailsDrawer" 
        position="right" 
        styleClass="!w-full md:!w-150 lg:!w-[40rem]"
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
          <!-- Status and Priority -->
          <p-card header="Request Status">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <p-tag 
                  [value]="getStatusDisplayText(selectedRequest.status)" 
                  [severity]="getStatusSeverity(selectedRequest.status)"
                  styleClass="text-lg px-3 py-2">
                </p-tag>
                <p-chip 
                  [label]="getApprovalLevelLabel(selectedRequest)"
                  [styleClass]="getApprovalLevelClass(selectedRequest)">
                </p-chip>
              </div>
              
              <div class="text-sm text-surface-600 dark:text-surface-300">
                Submitted {{ getTimeAgo(selectedRequest.requestDate) }} by {{ selectedRequest.requesterName }}
              </div>

              <!-- Priority Indicator -->
              <div class="flex items-center gap-2">
                <i class="pi pi-clock text-orange-500"></i>
                <span class="text-sm">{{ getDaysPending(selectedRequest.requestDate) }} days pending</span>
              </div>
            </div>
          </p-card>

          <!-- Requester Information -->
          <p-card header="Requester Information">
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <p-avatar 
                  [label]="getInitials(selectedRequest.requesterName)"
                  shape="circle"
                  size="large">
                </p-avatar>
                <div>
                  <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                    {{ selectedRequest.requesterName }}
                  </h6>
                  <p class="text-surface-500 dark:text-surface-400 text-sm m-0">
                    Employee ID: {{ selectedRequest.requesterId }}
                  </p>
                </div>
              </div>
            </div>
          </p-card>

          <!-- Target Employee Information -->
          <p-card header="Target Employee" *ngIf="selectedRequest.targetEmployeeName && selectedRequest.targetEmployeeName !== selectedRequest.requesterName">
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <p-avatar 
                  [label]="getInitials(selectedRequest.targetEmployeeName)"
                  shape="circle"
                  size="large">
                </p-avatar>
                <div>
                  <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                    {{ selectedRequest.targetEmployeeName }}
                  </h6>
                  <p class="text-surface-500 dark:text-surface-400 text-sm m-0">
                    Employee ID: {{ selectedRequest.targetEmployeeId }}
                  </p>
                </div>
              </div>
            </div>
          </p-card>

          <!-- Request Specific Details -->
          <p-card header="Request Details">
            <div class="space-y-4">
              <!-- Promotion Request Details -->
              <div *ngIf="selectedRequest.requestType === 'PositionChange'">
                <ng-container *ngIf="getPromotionRequestData(selectedRequest) as promotion">
                  <div class="space-y-3">
                    <div class="flex justify-between" *ngIf="promotion.careerPathId">
                      <span class="font-medium text-surface-600 dark:text-surface-300">Career Path ID:</span>
                      <strong>{{ promotion.careerPathId }}</strong>
                    </div>
                    <div class="flex justify-between" *ngIf="promotion.proposedSalary">
                      <span class="font-medium text-surface-600 dark:text-surface-300">Proposed Salary:</span>
                      <strong>{{ promotion.proposedSalary | currency:'TND':'symbol':'1.0-0' }}</strong>
                    </div>
                    <div class="flex justify-between" *ngIf="promotion.newManagerId">
                      <span class="font-medium text-surface-600 dark:text-surface-300">New Manager ID:</span>
                      <strong>{{ promotion.newManagerId }}</strong>
                    </div>
                    <div class="flex justify-between" *ngIf="selectedRequest.effectiveDate">
                      <span class="font-medium text-surface-600 dark:text-surface-300">Effective Date:</span>
                      <strong>{{ selectedRequest.effectiveDate | date:'mediumDate' }}</strong>
                    </div>
                  </div>
                  
                  <div *ngIf="promotion.justification" class="mt-4">
                    <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Justification</h6>
                    <div class="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg">
                      <p class="text-surface-700 dark:text-surface-200 text-sm m-0">
                        {{ promotion.justification }}
                      </p>
                    </div>
                  </div>
                </ng-container>
              </div>

              <!-- Department Change Request Details -->
              <div *ngIf="selectedRequest.requestType === 'DepartmentChange'">
                <ng-container *ngIf="getDepartmentChangeRequestData(selectedRequest) as deptChange">
                  <div class="space-y-3">
                    <div class="flex justify-between" *ngIf="deptChange.newDepartmentId">
                      <span class="font-medium text-surface-600 dark:text-surface-300">New Department ID:</span>
                      <strong>{{ deptChange.newDepartmentId }}</strong>
                    </div>
                    <div class="flex justify-between" *ngIf="deptChange.newManagerId">
                      <span class="font-medium text-surface-600 dark:text-surface-300">New Manager ID:</span>
                      <strong>{{ deptChange.newManagerId }}</strong>
                    </div>
                    <div class="flex justify-between" *ngIf="selectedRequest.effectiveDate">
                      <span class="font-medium text-surface-600 dark:text-surface-300">Effective Date:</span>
                      <strong>{{ selectedRequest.effectiveDate | date:'mediumDate' }}</strong>
                    </div>
                  </div>
                  
                  <div *ngIf="deptChange.reason" class="mt-4">
                    <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Reason</h6>
                    <div class="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg">
                      <p class="text-surface-700 dark:text-surface-200 text-sm m-0">
                        {{ deptChange.reason }}
                      </p>
                    </div>
                  </div>
                </ng-container>
              </div>

              <!-- General Notes -->
              <div *ngIf="selectedRequest.notes" class="mt-4">
                <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Additional Notes</h6>
                <div class="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg">
                  <p class="text-surface-700 dark:text-surface-200 text-sm m-0">
                    {{ selectedRequest.notes }}
                  </p>
                </div>
              </div>
            </div>
          </p-card>

          <!-- Approval Timeline -->
          <p-card header="Approval Timeline">
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
                    <span *ngIf="event.person"> • {{ event.person }}</span>
                  </div>
                  <p class="text-sm text-surface-700 dark:text-surface-200 m-0">
                    {{ event.description }}
                  </p>
                </div>
              </ng-template>
            </p-timeline>
          </p-card>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-2">
            <p-button 
              *ngIf="canApproveAsManager(selectedRequest)"
              label="Approve as Manager"
              icon="pi pi-check"
              severity="success"
              (click)="approveRequest(selectedRequest)"
              [loading]="isProcessingAction() && selectedActionRequestId === selectedRequest.id"
              class="w-full">
            </p-button>
            <p-button 
              *ngIf="canApproveAsHR(selectedRequest)"
              label="Final HR Approval"
              icon="pi pi-verified"
              severity="success"
              (click)="approveRequest(selectedRequest)"
              [loading]="isProcessingAction() && selectedActionRequestId === selectedRequest.id"
              class="w-full">
            </p-button>
            <p-button 
              *ngIf="canRejectRequest(selectedRequest)"
              label="Reject Request"
              icon="pi pi-times"
              severity="danger"
              [outlined]="true"
              (click)="rejectRequest(selectedRequest)"
              [loading]="isProcessingAction() && selectedActionRequestId === selectedRequest.id"
              class="w-full">
            </p-button>
          </div>
        </div>
      </p-drawer>

      <!-- Approval Confirmation Dialog -->
      <p-dialog 
        header="Approve Request" 
        [(visible)]="showApprovalDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div *ngIf="selectedRequest" class="space-y-4">
          <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <i class="pi pi-check-circle text-4xl text-green-500 mb-2 block"></i>
            <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
              Approve {{ getRequestTypeLabel(selectedRequest.requestType) }}
            </h6>
            <p class="text-surface-600 dark:text-surface-300 text-sm m-0">
              {{ selectedRequest.requesterName }} → {{ selectedRequest.targetEmployeeName || 'Self' }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Approval Notes (Optional)
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="approvalNotes"
              rows="3"
              class="w-full"
              placeholder="Add any comments about this approval...">
            </textarea>
          </div>

          <p-message 
            severity="info" 
            text="This action will move the request to the next approval stage or complete the process."
            styleClass="w-full">
          </p-message>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelApproval()">
          </p-button>
          <p-button 
            label="Approve Request" 
            icon="pi pi-check"
            severity="success"
            (click)="confirmApproval()"
            [loading]="isProcessingAction()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Rejection Dialog -->
      <p-dialog 
        header="Reject Request" 
        [(visible)]="showRejectionDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div *ngIf="selectedRequest" class="space-y-4">
          <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <i class="pi pi-times-circle text-4xl text-red-500 mb-2 block"></i>
            <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
              Reject {{ getRequestTypeLabel(selectedRequest.requestType) }}
            </h6>
            <p class="text-surface-600 dark:text-surface-300 text-sm m-0">
              {{ selectedRequest.requesterName }} → {{ selectedRequest.targetEmployeeName || 'Self' }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Rejection Reason *
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="rejectionReason"
              rows="4"
              class="w-full"
              placeholder="Please provide a clear reason for rejecting this request...">
            </textarea>
          </div>

          <p-message 
            severity="warn" 
            text="This action will permanently reject the request and notify the requester."
            styleClass="w-full">
          </p-message>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelRejection()">
          </p-button>
          <p-button 
            label="Reject Request" 
            icon="pi pi-times"
            severity="danger"
            (click)="confirmRejection()"
            [disabled]="!rejectionReason?.trim()"
            [loading]="isProcessingAction()">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class Approvals implements OnInit {
  // Signals for reactive state management
  pendingRequests = signal<ApprovalRequest[]>([]);
  filteredRequests = signal<ApprovalRequest[]>([]);
  positions = signal<Position[]>([]);
  departments = signal<Department[]>([]);
  currentUser = signal<Employee | null>(null);
  currentUserRole = signal<string>('');

  // Loading states
  isLoading = signal<boolean>(false);
  isProcessingAction = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Dialog states
  showRequestDetailsDrawer = false;
  showApprovalDialog = false;
  showRejectionDialog = false;

  // Filter states
  searchTerm = '';
  selectedRequestType: string | null = null;
  selectedApprovalLevel: string | null = null;

  // Selected items
  selectedRequest: ApprovalRequest | null = null;
  selectedActionRequestId: number | null = null;

  // Form data
  approvalNotes = '';
  rejectionReason = '';

  // Computed properties
  requestTypeOptions = computed(() => [
    { label: 'All Types', value: null },
    { label: 'Position Change', value: 'PositionChange' },
    { label: 'Department Change', value: 'DepartmentChange' },
  ]);

  approvalLevelOptions = computed(() => [
    { label: 'All Levels', value: null },
    { label: 'Manager Approval', value: 'manager' },
    { label: 'HR Approval', value: 'hr' },
  ]);

  constructor(
    private employeeRequestService: EmployeeRequestService,
    private employeeService: EmployeeService,
    private positionService: PositionService,
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
        this.loadPendingRequests(),
        this.loadPositions(),
        this.loadDepartments()
      ]);
    } catch (error) {
      console.error('Error loading approvals data:', error);
      this.errorMessage.set('Failed to load approvals data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCurrentUser() {
    try {
      const user = await this.employeeService.getMyProfile().toPromise();
      if (user) {
        this.currentUser.set(user);
        this.currentUserRole.set(user.user.role);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  async loadPendingRequests() {
    try {
      const requests = await this.employeeRequestService.getPendingRequests().toPromise();
      if (requests) {
        const requestsWithMetadata = requests.map(request => ({
          ...request,
          requestTypeLabel: this.getRequestTypeLabel(request.requestType),
          canApprove: this.canApproveRequest(request),
          isExpanded: false,
          approvalLevel: this.getRequestApprovalLevel(request)
        }));
        this.pendingRequests.set(requestsWithMetadata);
        this.filterRequests();
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      throw error;
    }
  }

  async loadPositions() {
    try {
      const positions = await this.positionService.getActivePositions().toPromise();
      if (positions) {
        this.positions.set(positions);
      }
    } catch (error) {
      console.error('Error loading career paths:', error);
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

  // Filter methods
  filterRequests() {
    let filtered = this.pendingRequests();

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.requestType.toLowerCase().includes(term) ||
        request.requesterName.toLowerCase().includes(term) ||
        request.targetEmployeeName?.toLowerCase().includes(term) ||
        request.notes?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (this.selectedRequestType) {
      filtered = filtered.filter(request => request.requestType === this.selectedRequestType);
    }

    // Approval level filter
    if (this.selectedApprovalLevel) {
      filtered = filtered.filter(request => request.approvalLevel === this.selectedApprovalLevel);
    }

    this.filteredRequests.set(filtered);
  }

  // Summary methods
  getTotalPendingCount(): number {
    return this.pendingRequests().length;
  }

  getManagerApprovalCount(): number {
    return this.pendingRequests().filter(r => r.status === 'Pending').length;
  }

  getHRApprovalCount(): number {
    return this.pendingRequests().filter(r => r.status === 'ManagerApproved').length;
  }

  getPromotionRequestCount(): number {
    return this.pendingRequests().filter(r => r.requestType === 'PositionChange').length;
  }

  getManagerApprovalRequests(): ApprovalRequest[] {
    return this.filteredRequests().filter(r => r.status === 'Pending');
  }

  getHRApprovalRequests(): ApprovalRequest[] {
    return this.filteredRequests().filter(r => r.status === 'ManagerApproved');
  }

  // Request details methods
  viewRequestDetails(request: ApprovalRequest) {
    this.selectedRequest = request;
    this.showRequestDetailsDrawer = true;
  }

  getPromotionRequestData(request: EmployeeRequest): any | null {
    if (request.requestType === 'PositionChange') {
      return this.employeeRequestService.getPositionChangeData(request);
    }
    return null;
  }

  getDepartmentChangeRequestData(request: EmployeeRequest): any | null {
    if (request.requestType === 'DepartmentChange') {
      return this.employeeRequestService.getDepartmentChangeData(request);
    }
    return null;
  }

  getPositionChangeRequestTitle(promotionData: any): string {
    const newPositionId = promotionData.newPositionId;
    const position = this.positions().find(p => p.id === newPositionId);
    return position ? `${position.title}` : 'Unknown Position';
  }

  getRequestJustification(request: EmployeeRequest): string | null {
    if (request.requestType === 'PositionChange') {
      return this.employeeRequestService.getRequestData<string>(request, 'justification') || null;
    }
    if (request.requestType === 'DepartmentChange') {
      return this.employeeRequestService.getRequestData<string>(request, 'reason') || null;
    }
    return request.notes || null;
  }

  // Approval and rejection methods
  approveRequest(request: ApprovalRequest) {
    this.selectedRequest = request;
    this.selectedActionRequestId = request.id;
    this.approvalNotes = '';
    this.showApprovalDialog = true;
  }

  rejectRequest(request: ApprovalRequest) {
    this.selectedRequest = request;
    this.selectedActionRequestId = request.id;
    this.rejectionReason = '';
    this.showRejectionDialog = true;
  }

  async confirmApproval() {
    if (!this.selectedRequest) return;

    this.isProcessingAction.set(true);

    try {
      const approvalData: ApprovalDto = {
        notes: this.approvalNotes.trim() || undefined
      };

      const result = await this.employeeRequestService.approveRequest(
        this.selectedRequest.id, 
        approvalData
      ).toPromise();

      if (result) {
        const isHRApproval = this.selectedRequest.status === 'ManagerApproved';
        const approvalLevel = isHRApproval ? 'HR' : 'Manager';
        
        this.messageService.add({
          severity: 'success',
          summary: 'Request Approved',
          detail: `${this.getRequestTypeLabel(this.selectedRequest.requestType)} approved as ${approvalLevel}`
        });

        this.cancelApproval();
        await this.loadPendingRequests();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Approval Failed',
        detail: `Unable to approve request. Please try again.`
      });
    } finally {
      this.isProcessingAction.set(false);
    }
  }

  async confirmRejection() {
    if (!this.selectedRequest || !this.rejectionReason.trim()) return;

    this.isProcessingAction.set(true);

    try {
      const rejectionData: RejectionDto = {
        reason: this.rejectionReason.trim()
      };

      const result = await this.employeeRequestService.rejectRequest(
        this.selectedRequest.id, 
        rejectionData
      ).toPromise();

      if (result) {
        this.messageService.add({
          severity: 'success',
          summary: 'Request Rejected',
          detail: `${this.getRequestTypeLabel(this.selectedRequest.requestType)} has been rejected`
        });

        this.cancelRejection();
        await this.loadPendingRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Rejection Failed',
        detail: 'Unable to reject request. Please try again.'
      });
    } finally {
      this.isProcessingAction.set(false);
    }
  }

  cancelApproval() {
    this.showApprovalDialog = false;
    this.selectedRequest = null;
    this.selectedActionRequestId = null;
    this.approvalNotes = '';
  }

  cancelRejection() {
    this.showRejectionDialog = false;
    this.selectedRequest = null;
    this.selectedActionRequestId = null;
    this.rejectionReason = '';
  }

  // Permission methods - Updated to work with new DTO structure
  canApproveRequest(request: EmployeeRequest): boolean {
    const currentUser = this.currentUser();
    const userRole = this.currentUserRole();
    
    if (!currentUser) return false;

    // Note: The service methods expect the full entity data
    // For now, we'll use simplified permission checks based on role and status
    return this.canApproveAsManager(request) || this.canApproveAsHR(request);
  }

  canApproveAsManager(request: EmployeeRequest): boolean {
    const currentUser = this.currentUser();
    const userRole = this.currentUserRole();
    
    if (!currentUser || request.status !== 'Pending') return false;
    
    // Simplified manager check - in a real app, you'd check if current user is the manager
    // of either the requester or target employee
    return userRole === 'Manager' || userRole === 'Admin';
  }

  canApproveAsHR(request: EmployeeRequest): boolean {
    const userRole = this.currentUserRole();
    
    if (!userRole) return false;
    
    // HR can approve manager-approved requests or pending requests
    return (userRole === 'HR' || userRole === 'Admin') && 
           (request.status === 'ManagerApproved' || request.status === 'Pending');
  }

  canRejectRequest(request: EmployeeRequest): boolean {
    return this.canApproveRequest(request);
  }

  // Helper methods for display
  getRequestApprovalLevel(request: EmployeeRequest): 'manager' | 'hr' | 'completed' {
    if (request.status === 'Pending') return 'manager';
    if (request.status === 'ManagerApproved') return 'hr';
    return 'completed';
  }

  getApprovalLevelLabel(request: EmployeeRequest): string {
    const level = this.getRequestApprovalLevel(request);
    switch (level) {
      case 'manager': return 'Manager Review';
      case 'hr': return 'HR Review';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  }

  getApprovalLevelClass(request: EmployeeRequest): string {
    const level = this.getRequestApprovalLevel(request);
    switch (level) {
      case 'manager': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'hr': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-200';
    }
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
      description: `${this.getRequestTypeLabel(request.requestType)} request submitted for review`,
      person: request.requesterName
    });

    // Manager approval
    if (request.managerApprovalDate) {
      timeline.push({
        status: 'Manager Approved',
        date: request.managerApprovalDate,
        icon: 'pi pi-check',
        color: '#10b981',
        description: `Request approved by manager and forwarded to HR for final review`,
        person: request.approvedByManagerName
      });
    }

    // HR approval
    if (request.hrApprovalDate) {
      timeline.push({
        status: 'HR Approved',
        date: request.hrApprovalDate,
        icon: 'pi pi-verified',
        color: '#059669',
        description: `Final approval completed. Request has been processed.`,
        person: request.approvedByHRName
      });
    }

    // Rejection
    if (request.status === 'Rejected') {
      timeline.push({
        status: 'Request Rejected',
        date: request.processedDate || new Date().toISOString(),
        icon: 'pi pi-times',
        color: '#dc2626',
        description: request.rejectionReason ? `Rejected: ${request.rejectionReason}` : 'Request was rejected',
        person: request.approvedByManagerName || request.approvedByHRName
      });
    }

    return timeline;
  }

  // Utility methods
  getRequestTypeLabel(requestType: string): string {
    switch (requestType) {
      case 'PositionChange': return 'Position Change';
      case 'DepartmentChange': return 'Department Change';
      case 'Transfer': return 'Transfer Request';
      default: return requestType;
    }
  }

  getRequestTypeIcon(requestType: string): string {
    switch (requestType) {
      case 'PositionChange': return 'pi pi-arrow-up-right';
      case 'DepartmentChange': return 'pi pi-building';
      case 'Transfer': return 'pi pi-refresh';
      default: return 'pi pi-file';
    }
  }

  getStatusDisplayText(status: string): string {
    return this.employeeRequestService.getStatusDisplayText(status);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
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
      case 'Canceled':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  getInitials(fullName: string): string {
    if (!fullName) return '??';
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2); // Limit to 2 characters
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const requestDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - requestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  }

  getDaysPending(requestDate: string): number {
    const now = new Date();
    const submitted = new Date(requestDate);
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // HR-specific helper methods
  getImpactDescription(request: EmployeeRequest): string {
    if (request.requestType === 'PositionChange') {
      return 'Position change with potential team impact';
    }
    if (request.requestType === 'DepartmentChange') {
      return 'Cross-departmental transfer affecting team dynamics';
    }
    if (request.requestType === 'Transfer') {
      return 'Employee transfer with minimal organizational impact';
    }
    return 'Standard employee request';
  }

  getRiskLevel(request: EmployeeRequest): string {
    if (request.requestType === 'PositionChange') {
      return 'Medium';
    }
    if (request.requestType === 'DepartmentChange') {
      return 'Low';
    }
    if (request.requestType === 'Transfer') {
      return 'Low';
    }
    return 'Low';
  }

  getBudgetImpact(request: EmployeeRequest): string {
    if (request.requestType === 'PositionChange') {
      const promotionData = this.getPromotionRequestData(request);
      if (promotionData && promotionData.proposedSalary) {
        // Since we don't have current salary in the DTO, we can only show the proposed salary
        return `Proposed: ${promotionData.proposedSalary.toLocaleString()} TND`;
      }
      return 'To be determined';
    }
    return 'No impact';
  }

  // Refresh and utility methods
  refreshData() {
    this.loadData();
  }

  trackByRequestId(index: number, request: ApprovalRequest): number {
    return request.id;
  }
}