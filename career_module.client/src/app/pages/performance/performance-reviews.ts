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
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';

// Services
import { PerformanceReviewService, PerformanceReview, CreatePerformanceReviewDto, UpdatePerformanceReviewDto, PerformanceAnalyticsDto } from '../service/performance-review.service';
import { IntelligenceService, CareerPerformanceInsight } from '../service/intelligence.service';
import { EmployeeService, Employee } from '../service/employee.service';
import { AuthService } from '../service/auth.service';

interface ReviewWithEmployee extends PerformanceReview {
  employeeFullName: string;
  reviewerFullName: string;
}

interface AnalyticsData {
  performanceAnalytics: PerformanceAnalyticsDto | null;
  performanceInsights: CareerPerformanceInsight | null;
  chartData: any;
  chartOptions: any;
}

@Component({
  selector: 'app-performance',
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
    RatingModule,
    ProgressBarModule,
    ChartModule
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Performance Reviews</h1>
            <p class="text-surface-600 dark:text-surface-300 mt-1 mb-0">
              Manage performance reviews and view analytics
            </p>
          </div>
          <div class="flex gap-2">
            <p-button 
              label="New Review" 
              icon="pi pi-plus"
              (click)="openCreateReviewDialog()"
              pTooltip="Create New Review"
              *ngIf="canCreateReviews()">
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
      <div *ngIf="isLoading() && !reviews().length" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading performance data...</span>
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
      <div *ngIf="!isLoading() || reviews().length" class="px-6">
        <p-fluid>
          <p-tabs value="reviews">
            <p-tablist>
              <p-tab value="reviews">
                Reviews
                <p-badge [value]="getTotalReviews()" severity="info" class="ml-2"></p-badge>
              </p-tab>
              <p-tab value="pending">
                Pending
                <p-badge [value]="getPendingReviews()" severity="warn" class="ml-2"></p-badge>
              </p-tab>
              <p-tab value="analytics">
                Analytics
                <p-badge value="AI" severity="success" class="ml-2"></p-badge>
              </p-tab>
            </p-tablist>

            <!-- Reviews Tab -->
            <p-tabpanel value="reviews" header="All Reviews" leftIcon="pi pi-list">
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
                          (input)="filterReviews()"
                          placeholder="Search reviews..." 
                          class="w-full">
                      </span>
                    </div>
                    <p-select
                      [(ngModel)]="selectedStatus"
                      [options]="statusOptions()"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="All Statuses"
                      (onChange)="filterReviews()"
                      [showClear]="true"
                      class="min-w-48">
                    </p-select>
                  </div>
                </p-card>
              </div>

              <!-- Summary Cards -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-blue-500">{{ getTotalReviews() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">Total Reviews</div>
                </p-card>
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-orange-500">{{ getPendingReviews() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">Pending</div>
                </p-card>
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-green-500">{{ getCompletedReviews() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">Completed</div>
                </p-card>
                <p-card styleClass="text-center">
                  <div class="text-2xl font-bold text-purple-500">{{ getAverageRating() }}</div>
                  <div class="text-surface-600 dark:text-surface-300">Average Rating</div>
                </p-card>
              </div>

              <!-- Reviews Table -->
              <p-card>
                <p-table 
                  [value]="filteredReviews()" 
                  [loading]="isLoading()"
                  [paginator]="true" 
                  [rows]="10"
                  [rowHover]="true"
                  dataKey="id"
                  styleClass="p-datatable-gridlines">
                  
                  <ng-template pTemplate="header">
                    <tr>
                      <th pSortableColumn="employee.fullName">
                        Employee <p-sortIcon field="employee.fullName"></p-sortIcon>
                      </th>
                      <th pSortableColumn="reviewer.fullName">
                        Reviewer <p-sortIcon field="reviewer.fullName"></p-sortIcon>
                      </th>
                      <th pSortableColumn="reviewPeriodStart">
                        Period <p-sortIcon field="reviewPeriodStart"></p-sortIcon>
                      </th>
                      <th pSortableColumn="overallRating">
                        Rating <p-sortIcon field="overallRating"></p-sortIcon>
                      </th>
                      <th pSortableColumn="status">
                        Status <p-sortIcon field="status"></p-sortIcon>
                      </th>
                      <th style="width: 10rem">Actions</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-review>
                    <tr>
                      <td>
                        <div class="flex items-center gap-2">
                          <p-avatar 
                            [label]="getInitials(review.employeeFullName || review.employee?.fullName || 'Unknown')"
                            shape="circle"
                            size="normal">
                          </p-avatar>
                          <div>
                            <div class="font-medium">{{ review.employeeFullName || review.employee?.fullName || 'Unknown Employee' }}</div>
                            <div class="text-xs text-surface-500 dark:text-surface-400">
                              ID: {{ review.employeeId }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <p-avatar 
                            [label]="getInitials(review.reviewerFullName || review.reviewer?.fullName || 'Unknown')"
                            shape="circle"
                            size="normal">
                          </p-avatar>
                          <span>{{ review.reviewerFullName || review.reviewer?.fullName || 'Unknown Reviewer' }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="text-sm">
                          <div>{{ review.reviewPeriodStart | date:'MMM d' }} - {{ review.reviewPeriodEnd | date:'MMM d, y' }}</div>
                          <div class="text-surface-500 dark:text-surface-400">
                            {{ getDaysDifference(review.reviewPeriodStart, review.reviewPeriodEnd) }} days
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2" *ngIf="review.overallRating; else noRating">
                          <p-rating 
                            [ngModel]="review.overallRating" 
                            [readonly]="true" 
                            styleClass="text-sm">
                          </p-rating>
                          <span class="text-sm font-medium">{{ review.overallRating }}/5</span>
                        </div>
                        <ng-template #noRating>
                          <span class="text-surface-500 dark:text-surface-400">Not rated</span>
                        </ng-template>
                      </td>
                      <td>
                        <p-tag 
                          [value]="review.status" 
                          [severity]="getStatusSeverity(review.status)">
                        </p-tag>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <p-button 
                            icon="pi pi-eye"
                            size="small"
                            severity="secondary"
                            [outlined]="true"
                            (click)="viewReview(review)"
                            pTooltip="View Details">
                          </p-button>
                          <p-button 
                            *ngIf="canEditReview(review)"
                            icon="pi pi-pencil"
                            size="small"
                            severity="info"
                            [outlined]="true"
                            (click)="editReview(review)"
                            pTooltip="Edit Review">
                          </p-button>
                          <p-button 
                            *ngIf="canSubmitReview(review)"
                            icon="pi pi-send"
                            size="small"
                            severity="success"
                            [outlined]="true"
                            (click)="submitReview(review)"
                            pTooltip="Submit Review">
                          </p-button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="6" class="text-center py-8">
                        <div class="text-surface-500 dark:text-surface-400">
                          <i class="pi pi-file-excel text-4xl mb-3 block"></i>
                          <div class="text-lg font-medium mb-2">No Reviews Found</div>
                          <p class="mb-4">No performance reviews match your current filters.</p>
                          <p-button 
                            *ngIf="canCreateReviews()"
                            label="Create Review" 
                            icon="pi pi-plus"
                            (click)="openCreateReviewDialog()">
                          </p-button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-card>
            </p-tabpanel>

            <!-- Pending Reviews Tab -->
            <p-tabpanel value="pending" header="Pending Reviews" leftIcon="pi pi-clock">
              <div class="space-y-6">
                <p-message 
                  severity="info" 
                  text="These reviews require your attention for completion or approval."
                  styleClass="w-full">
                </p-message>

                <div *ngFor="let review of getPendingReviewsList(); trackBy: trackByReviewId" class="mb-4">
                  <p-card>
                    <ng-template pTemplate="header">
                      <div class="p-4 pb-0">
                        <div class="flex justify-between items-start">
                          <div class="flex items-center gap-3">
                            <i class="pi pi-clock text-2xl text-orange-500"></i>
                            <div>
                              <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                                Performance Review
                              </h6>
                              <p class="text-surface-600 dark:text-surface-300 m-0">
                                {{ review.employeeFullName || review.employee?.fullName }} • {{ review.reviewPeriodStart | date:'MMM y' }}
                              </p>
                            </div>
                          </div>
                          <p-tag 
                            [value]="review.status" 
                            [severity]="getStatusSeverity(review.status)">
                          </p-tag>
                        </div>
                      </div>
                    </ng-template>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Review Details</h6>
                        <div class="space-y-2 text-sm">
                          <div class="flex justify-between">
                            <span class="text-surface-600 dark:text-surface-300">Employee:</span>
                            <strong>{{ review.employeeFullName || review.employee?.fullName }}</strong>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-surface-600 dark:text-surface-300">Period:</span>
                            <strong>{{ review.reviewPeriodStart | date:'MMM d' }} - {{ review.reviewPeriodEnd | date:'MMM d, y' }}</strong>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-surface-600 dark:text-surface-300">Status:</span>
                            <p-tag [value]="review.status" [severity]="getStatusSeverity(review.status)"></p-tag>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Current Rating</h6>
                        <div class="flex items-center gap-2" *ngIf="review.overallRating; else noPendingRating">
                          <p-rating 
                            [ngModel]="review.overallRating" 
                            [readonly]="true">
                          </p-rating>
                          <span class="font-medium">{{ review.overallRating }}/5</span>
                        </div>
                        <ng-template #noPendingRating>
                          <span class="text-surface-500 dark:text-surface-400">Not yet rated</span>
                        </ng-template>
                      </div>

                      <div>
                        <h6 class="font-medium text-surface-900 dark:text-surface-0 mb-2">Actions</h6>
                        <div class="space-y-2">
                          <p-button 
                            *ngIf="canEditReview(review)"
                            label="Continue Review"
                            icon="pi pi-pencil"
                            severity="primary"
                            size="small"
                            (click)="editReview(review)"
                            class="w-full">
                          </p-button>
                          <p-button 
                            *ngIf="canSubmitReview(review)"
                            label="Submit Review"
                            icon="pi pi-send"
                            severity="success"
                            size="small"
                            (click)="submitReview(review)"
                            class="w-full">
                          </p-button>
                          <p-button 
                            label="View Details"
                            icon="pi pi-eye"
                            severity="secondary"
                            [outlined]="true"
                            size="small"
                            (click)="viewReview(review)"
                            class="w-full">
                          </p-button>
                        </div>
                      </div>
                    </div>
                  </p-card>
                </div>

                <!-- No Pending Reviews -->
                <div *ngIf="!getPendingReviewsList().length" class="text-center py-12">
                  <i class="pi pi-check-circle text-6xl text-green-500 mb-4 block"></i>
                  <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                    All Caught Up!
                  </h3>
                  <p class="text-surface-500 dark:text-surface-400">
                    You have no pending performance reviews at this time.
                  </p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Analytics Tab -->
            <p-tabpanel value="analytics" header="Performance Analytics" leftIcon="pi pi-chart-line">
              <div class="space-y-6" *ngIf="!isLoadingAnalytics(); else loadingAnalytics">
                <!-- Employee Selection for Analytics -->
                <p-card *ngIf="canViewOtherAnalytics()">
                  <div class="flex items-center gap-4">
                    <label class="font-medium text-surface-700 dark:text-surface-300">
                      View Analytics For:
                    </label>
                    <p-select
                      [(ngModel)]="selectedAnalyticsEmployee"
                      [options]="employeeOptions()"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Employee"
                      (onChange)="loadAnalyticsData()"
                      class="min-w-64">
                    </p-select>
                  </div>
                </p-card>

                <!-- Analytics Content -->
                <div *ngIf="analyticsData()">
                  <!-- Performance Overview -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <p-card styleClass="text-center" *ngIf="analyticsData()?.performanceAnalytics as analytics">
                      <div class="text-2xl font-bold text-blue-500">{{ analytics.averageRating | number:'1.1-1' }}</div>
                      <div class="text-surface-600 dark:text-surface-300">Average Rating</div>
                      <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                        {{ analytics.totalReviews }} review(s)
                      </div>
                    </p-card>
                    <p-card styleClass="text-center" *ngIf="analyticsData()?.performanceAnalytics as analytics">
                      <div class="text-2xl font-bold text-green-500">{{ analytics.latestRating | number:'1.1-1' }}</div>
                      <div class="text-surface-600 dark:text-surface-300">Latest Rating</div>
                      <div class="text-xs" [ngClass]="getTrendClass(analytics.ratingTrend)">
                        {{ analytics.ratingTrend }}
                      </div>
                    </p-card>
                    <p-card styleClass="text-center" *ngIf="analyticsData()?.performanceAnalytics as analytics">
                      <div class="text-2xl font-bold text-purple-500">{{ analytics.departmentAverage | number:'1.1-1' }}</div>
                      <div class="text-surface-600 dark:text-surface-300">Department Average</div>
                      <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                        Comparison baseline
                      </div>
                    </p-card>
                  </div>

                  <!-- Performance Trends Chart -->
                  <p-card header="Performance Trends">
                    <p-chart 
                      type="line" 
                      [data]="analyticsData()?.chartData" 
                      [options]="analyticsData()?.chartOptions"
                      height="400px">
                    </p-chart>
                  </p-card>

                  <!-- Performance Insights -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4" *ngIf="analyticsData()?.performanceInsights as insights">
                    <!-- Strengths -->
                    <p-card header="Key Strengths">
                      <div class="space-y-2" *ngIf="insights.keyStrengths?.length; else noStrengths">
                        <div *ngFor="let strength of insights.keyStrengths" class="flex items-center gap-2">
                          <i class="pi pi-check-circle text-green-500"></i>
                          <span>{{ strength }}</span>
                        </div>
                      </div>
                      <ng-template #noStrengths>
                        <p class="text-surface-500 dark:text-surface-400">
                          Strengths will be identified as more performance data becomes available.
                        </p>
                      </ng-template>
                    </p-card>

                    <!-- Development Areas -->
                    <p-card header="Development Areas">
                      <div class="space-y-2" *ngIf="insights.developmentAreas?.length; else noDevelopment">
                        <div *ngFor="let area of insights.developmentAreas" class="flex items-center gap-2">
                          <i class="pi pi-arrow-up text-blue-500"></i>
                          <span>{{ area }}</span>
                        </div>
                      </div>
                      <ng-template #noDevelopment>
                        <p class="text-surface-500 dark:text-surface-400">
                          Development areas will be identified through performance analysis.
                        </p>
                      </ng-template>
                    </p-card>

                    <!-- Career Insights -->
                    <p-card header="Career Trajectory" *ngIf="insights.careerTrajectory">
                      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p class="text-blue-700 dark:text-blue-300 m-0">
                          {{ insights.careerTrajectory }}
                        </p>
                      </div>
                    </p-card>

                    <!-- AI Insights -->
                    <p-card header="AI Insights" *ngIf="insights.insights?.length">
                      <div class="space-y-2">
                        <div *ngFor="let insight of insights.insights" class="flex items-start gap-2">
                          <i class="pi pi-lightbulb text-yellow-500 mt-1"></i>
                          <span class="text-sm">{{ insight }}</span>
                        </div>
                      </div>
                    </p-card>
                  </div>
                </div>

                <!-- No Analytics Data -->
                <div *ngIf="!analyticsData()" class="text-center py-12">
                  <i class="pi pi-chart-line text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                  <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                    No Analytics Available
                  </h3>
                  <p class="text-surface-500 dark:text-surface-400">
                    Performance analytics will be available once reviews are completed.
                  </p>
                </div>
              </div>

              <!-- Loading Analytics -->
              <ng-template #loadingAnalytics>
                <div class="flex justify-center items-center py-20">
                  <div class="flex flex-col items-center gap-4">
                    <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
                    <span class="text-surface-600 dark:text-surface-300">Loading analytics...</span>
                  </div>
                </div>
              </ng-template>
            </p-tabpanel>
          </p-tabs>
        </p-fluid>
      </div>

      <!-- Create Review Dialog -->
      <p-dialog 
        header="Create Performance Review" 
        [(visible)]="showCreateDialog" 
        [modal]="true"
        styleClass="w-full max-w-2xl">
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Employee *
            </label>
            <p-select
              [(ngModel)]="newReviewForm.employeeId"
              [options]="employeeOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="Select employee"
              class="w-full">
            </p-select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Review Period Start *
              </label>
              <p-datepicker
                [(ngModel)]="newReviewForm.reviewPeriodStart"
                [showIcon]="true"
                class="w-full">
              </p-datepicker>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Review Period End *
              </label>
              <p-datepicker
                [(ngModel)]="newReviewForm.reviewPeriodEnd"
                [showIcon]="true"
                class="w-full">
              </p-datepicker>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Initial Notes (Optional)
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="newReviewForm.initialNotes"
              rows="3"
              class="w-full"
              placeholder="Add any initial notes or goals for this review...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelCreateReview()">
          </p-button>
          <p-button 
            label="Create Review" 
            icon="pi pi-plus"
            (click)="createReview()"
            [disabled]="!isCreateFormValid()"
            [loading]="isSubmittingReview()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Review Details/Edit Drawer -->
      <p-drawer
        [(visible)]="showReviewDrawer" 
        position="right" 
        styleClass="!w-full md:!w-150 lg:!w-[35rem]"
        [modal]="true">
        
        <ng-template pTemplate="header">
          <div *ngIf="selectedReview" class="flex items-center gap-3">
            <i class="pi pi-file-edit text-2xl text-primary"></i>
            <div>
              <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">
                {{ isEditMode() ? 'Edit Review' : 'Review Details' }}
              </h3>
              <p class="text-surface-600 dark:text-surface-300 m-0">
                {{ selectedReview.employeeFullName || selectedReview.employee?.fullName }}
              </p>
            </div>
          </div>
        </ng-template>

        <div *ngIf="selectedReview" class="space-y-6">
          <!-- Review Status -->
          <p-card header="Review Status">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <p-tag 
                  [value]="selectedReview.status" 
                  [severity]="getStatusSeverity(selectedReview.status)"
                  styleClass="text-lg px-3 py-2">
                </p-tag>
                <div class="text-right text-sm text-surface-600 dark:text-surface-300">
                  <div>Created: {{ selectedReview.createdAt | date:'mediumDate' }}</div>
                  <div>Updated: {{ selectedReview.updatedAt | date:'mediumDate' }}</div>
                </div>
              </div>
              
              <div class="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="font-medium">Period:</span>
                    <div>{{ selectedReview.reviewPeriodStart | date:'MMM d' }} - {{ selectedReview.reviewPeriodEnd | date:'MMM d, y' }}</div>
                  </div>
                  <div>
                    <span class="font-medium">Reviewer:</span>
                    <div>{{ selectedReview.reviewerFullName || selectedReview.reviewer?.fullName }}</div>
                  </div>
                </div>
              </div>
            </div>
          </p-card>

          <!-- Overall Rating -->
          <p-card header="Overall Rating">
            <div class="space-y-4">
              <div *ngIf="!isEditMode()">
                <div class="flex items-center gap-3" *ngIf="selectedReview.overallRating; else noRatingView">
                  <p-rating 
                    [ngModel]="selectedReview.overallRating" 
                    [readonly]="true" 
                    styleClass="text-lg">
                  </p-rating>
                  <span class="text-xl font-medium">{{ selectedReview.overallRating }}/5</span>
                </div>
                <ng-template #noRatingView>
                  <span class="text-surface-500 dark:text-surface-400">Not yet rated</span>
                </ng-template>
              </div>

              <div *ngIf="isEditMode()">
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Overall Rating *
                </label>
                <p-rating 
                  [(ngModel)]="editReviewForm.overallRating">
                </p-rating>
              </div>
            </div>
          </p-card>

          <!-- Review Content -->
          <p-card header="Review Content">
            <div class="space-y-4">
              <!-- Strengths -->
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Strengths
                </label>
                <div *ngIf="!isEditMode()">
                  <div *ngIf="selectedReview.strengths; else noStrengthsView" 
                       class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p class="text-green-700 dark:text-green-300 m-0 whitespace-pre-wrap">
                      {{ selectedReview.strengths }}
                    </p>
                  </div>
                  <ng-template #noStrengthsView>
                    <span class="text-surface-500 dark:text-surface-400">No strengths noted</span>
                  </ng-template>
                </div>
                <textarea 
                  *ngIf="isEditMode()"
                  pTextarea 
                  [(ngModel)]="editReviewForm.strengths"
                  rows="3"
                  class="w-full"
                  placeholder="Describe the employee's key strengths and accomplishments...">
                </textarea>
              </div>

              <!-- Areas for Improvement -->
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Areas for Improvement
                </label>
                <div *ngIf="!isEditMode()">
                  <div *ngIf="selectedReview.areasForImprovement; else noImprovementView" 
                       class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p class="text-blue-700 dark:text-blue-300 m-0 whitespace-pre-wrap">
                      {{ selectedReview.areasForImprovement }}
                    </p>
                  </div>
                  <ng-template #noImprovementView>
                    <span class="text-surface-500 dark:text-surface-400">No improvement areas noted</span>
                  </ng-template>
                </div>
                <textarea 
                  *ngIf="isEditMode()"
                  pTextarea 
                  [(ngModel)]="editReviewForm.areasForImprovement"
                  rows="3"
                  class="w-full"
                  placeholder="Identify areas where the employee can develop and improve...">
                </textarea>
              </div>

              <!-- Goals -->
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Goals & Development Plans
                </label>
                <div *ngIf="!isEditMode()">
                  <div *ngIf="selectedReview.goals; else noGoalsView" 
                       class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <p class="text-purple-700 dark:text-purple-300 m-0 whitespace-pre-wrap">
                      {{ selectedReview.goals }}
                    </p>
                  </div>
                  <ng-template #noGoalsView>
                    <span class="text-surface-500 dark:text-surface-400">No goals set</span>
                  </ng-template>
                </div>
                <textarea 
                  *ngIf="isEditMode()"
                  pTextarea 
                  [(ngModel)]="editReviewForm.goals"
                  rows="4"
                  class="w-full"
                  placeholder="Set specific goals and development plans for the next review period...">
                </textarea>
              </div>
            </div>
          </p-card>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <div *ngIf="!isEditMode()">
              <p-button 
                *ngIf="canEditReview(selectedReview)"
                label="Edit Review"
                icon="pi pi-pencil"
                severity="primary"
                (click)="enableEditMode()"
                class="w-full">
              </p-button>
              <p-button 
                *ngIf="canSubmitReview(selectedReview)"
                label="Submit Review"
                icon="pi pi-send"
                severity="success"
                (click)="submitReview(selectedReview)"
                [loading]="isSubmittingReview()"
                class="w-full">
              </p-button>
              <p-button 
                *ngIf="canApproveReview(selectedReview)"
                label="Approve Review"
                icon="pi pi-check"
                severity="success"
                (click)="approveReview(selectedReview)"
                [loading]="isSubmittingReview()"
                class="w-full">
              </p-button>
            </div>

            <div *ngIf="isEditMode()" class="flex gap-2">
              <p-button 
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                (click)="cancelEdit()"
                class="flex-1">
              </p-button>
              <p-button 
                label="Save Changes"
                icon="pi pi-save"
                severity="primary"
                (click)="saveReview()"
                [disabled]="!isEditFormValid()"
                [loading]="isSubmittingReview()"
                class="flex-1">
              </p-button>
            </div>
          </div>
        </div>
      </p-drawer>
    </div>
  `,
})
export class PerformanceReviews implements OnInit {
  // Signals for reactive state management
  reviews = signal<ReviewWithEmployee[]>([]);
  filteredReviews = signal<ReviewWithEmployee[]>([]);
  employees = signal<Employee[]>([]);
  currentUser = signal<Employee | null>(null);
  analyticsData = signal<AnalyticsData | null>(null);

  // Loading states
  isLoading = signal<boolean>(false);
  isLoadingAnalytics = signal<boolean>(false);
  isSubmittingReview = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Dialog states
  showCreateDialog = false;
  showReviewDrawer = false;
  isEditingReview = signal<boolean>(false);

  // Filter states
  searchTerm = '';
  selectedStatus: string | null = null;
  selectedAnalyticsEmployee: number | null = null;

  // Selected review
  selectedReview: ReviewWithEmployee | null = null;

  // Form data
  newReviewForm: CreatePerformanceReviewDto & { initialNotes?: string } = {
    employeeId: 0,
    reviewerId: 0,
    reviewPeriodStart: new Date(),
    reviewPeriodEnd: new Date(),
    initialNotes: ''
  };

  editReviewForm: UpdatePerformanceReviewDto = {
    overallRating: 0,
    strengths: '',
    areasForImprovement: '',
    goals: '',
    status: 'Draft'
  };

  // Computed properties
  statusOptions = computed(() => [
    { label: 'All Statuses', value: null },
    { label: 'Draft', value: 'Draft' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Approved', value: 'Approved' }
  ]);

  employeeOptions = computed(() => 
    this.employees().map(emp => ({ 
      label: emp.fullName, 
      value: emp.id 
    }))
  );

  constructor(
    private performanceReviewService: PerformanceReviewService,
    private intelligenceService: IntelligenceService,
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
        this.loadCurrentUser(),
        this.loadReviews(),
        this.loadEmployees()
      ]);
      this.filterReviews();
    } catch (error) {
      console.error('Error loading performance data:', error);
      this.errorMessage.set('Failed to load performance data. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCurrentUser() {
    try {
      const user = await this.employeeService.getMyProfile().toPromise();
      if (user) {
        this.currentUser.set(user);
        this.newReviewForm.reviewerId = user.id;
        this.selectedAnalyticsEmployee = user.id;
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  async loadReviews() {
    try {
      const reviews = await this.performanceReviewService.getReviews().toPromise();
      if (reviews) {
        const reviewsWithNames = reviews.map(review => ({
          ...review,
          employeeFullName: review.employee?.fullName || `Employee ${review.employeeId}`,
          reviewerFullName: review.reviewer?.fullName || `Reviewer ${review.reviewerId}`
        }));
        this.reviews.set(reviewsWithNames);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      throw error;
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

  async loadAnalyticsData() {
    if (!this.selectedAnalyticsEmployee) return;

    this.isLoadingAnalytics.set(true);

    try {
      const [performanceAnalytics, performanceInsights] = await Promise.all([
        this.performanceReviewService.getPerformanceAnalytics(this.selectedAnalyticsEmployee).toPromise(),
        this.intelligenceService.getPerformanceInsights(this.selectedAnalyticsEmployee).toPromise()
      ]);

      // Create chart data
      const chartData = this.createChartData(performanceAnalytics ?? null);
      const chartOptions = this.createChartOptions();

      this.analyticsData.set({
        performanceAnalytics: performanceAnalytics ?? null,
        performanceInsights: performanceInsights ?? null,
        chartData,
        chartOptions
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Analytics Error',
        detail: 'Failed to load performance analytics'
      });
    } finally {
      this.isLoadingAnalytics.set(false);
    }
  }

  createChartData(analytics: PerformanceAnalyticsDto | null) {
    if (!analytics?.performanceHistory?.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const sortedHistory = [...analytics.performanceHistory].sort(
      (a, b) => new Date(a.reviewPeriodStart).getTime() - new Date(b.reviewPeriodStart).getTime()
    );

    return {
      labels: sortedHistory.map(h => new Date(h.reviewPeriodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
      datasets: [
        {
          label: 'Performance Rating',
          data: sortedHistory.map(h => h.rating),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Department Average',
          data: new Array(sortedHistory.length).fill(analytics.departmentAverage),
          borderColor: '#EF4444',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0
        }
      ]
    };
  }

  createChartOptions() {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const
        },
        title: {
          display: true,
          text: 'Performance Rating Over Time'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1
          }
        }
      }
    };
  }

  // Filter methods
  filterReviews() {
    let filtered = this.reviews();

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        review.employeeFullName.toLowerCase().includes(term) ||
        review.reviewerFullName.toLowerCase().includes(term) ||
        review.status.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(review => review.status === this.selectedStatus);
    }

    this.filteredReviews.set(filtered);
  }

  // Summary methods
  getTotalReviews(): number {
    return this.reviews().length;
  }

  getPendingReviews(): number {
    return this.reviews().filter(r => r.status === 'Draft').length;
  }

  getCompletedReviews(): number {
    return this.reviews().filter(r => r.status === 'Completed' || r.status === 'Approved').length;
  }

  getAverageRating(): string {
    const reviewsWithRating = this.reviews().filter(r => r.overallRating && r.overallRating > 0);
    if (reviewsWithRating.length === 0) return '0.0';
    
    const sum = reviewsWithRating.reduce((acc, r) => acc + (r.overallRating || 0), 0);
    return (sum / reviewsWithRating.length).toFixed(1);
  }

  getPendingReviewsList(): ReviewWithEmployee[] {
    return this.filteredReviews().filter(r => r.status === 'Draft');
  }

  // Review management methods
  openCreateReviewDialog() {
    this.resetCreateForm();
    this.showCreateDialog = true;
  }

  async createReview() {
    if (!this.isCreateFormValid()) return;

    this.isSubmittingReview.set(true);

    try {
      const reviewData: CreatePerformanceReviewDto = {
        employeeId: this.newReviewForm.employeeId,
        reviewerId: this.newReviewForm.reviewerId,
        reviewPeriodStart: this.newReviewForm.reviewPeriodStart,
        reviewPeriodEnd: this.newReviewForm.reviewPeriodEnd,
        goals: this.newReviewForm.initialNotes || undefined
      };

      const review = await this.performanceReviewService.createReview(reviewData).toPromise();
      if (review) {
        this.messageService.add({
          severity: 'success',
          summary: 'Review Created',
          detail: 'Performance review has been created successfully'
        });
        this.cancelCreateReview();
        await this.loadReviews();
        this.filterReviews();
      }
    } catch (error) {
      console.error('Error creating review:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Creation Failed',
        detail: 'Failed to create performance review'
      });
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  viewReview(review: ReviewWithEmployee) {
    this.selectedReview = review;
    this.isEditingReview.set(false);
    this.showReviewDrawer = true;
  }

  editReview(review: ReviewWithEmployee) {
    this.selectedReview = review;
    this.populateEditForm(review);
    this.isEditingReview.set(true);
    this.showReviewDrawer = true;
  }

  enableEditMode() {
    if (this.selectedReview) {
      this.populateEditForm(this.selectedReview);
      this.isEditingReview.set(true);
    }
  }

  async saveReview() {
    if (!this.selectedReview || !this.isEditFormValid()) return;

    this.isSubmittingReview.set(true);

    try {
      const updatedReview = await this.performanceReviewService.updateReview(
        this.selectedReview.id, 
        this.editReviewForm
      ).toPromise();

      if (updatedReview) {
        this.messageService.add({
          severity: 'success',
          summary: 'Review Updated',
          detail: 'Performance review has been updated successfully'
        });
        
        this.isEditingReview.set(false);
        await this.loadReviews();
        this.filterReviews();
        
        // Update selected review
        this.selectedReview = this.reviews().find(r => r.id === updatedReview.id) || null;
      }
    } catch (error) {
      console.error('Error updating review:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: 'Failed to update performance review'
      });
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  async submitReview(review: ReviewWithEmployee) {
    this.confirmationService.confirm({
      message: `Submit this performance review for ${review.employeeFullName}?`,
      header: 'Submit Review',
      icon: 'pi pi-send',
      acceptButtonStyleClass: 'p-button-success',
      accept: async () => {
        this.isSubmittingReview.set(true);

        try {
          const result = await this.performanceReviewService.submitReview(review.id).toPromise();
          if (result) {
            this.messageService.add({
              severity: 'success',
              summary: 'Review Submitted',
              detail: result.message
            });
            
            await this.loadReviews();
            this.filterReviews();
            
            if (this.selectedReview?.id === review.id) {
              this.selectedReview = this.reviews().find(r => r.id === review.id) || null;
            }
          }
        } catch (error) {
          console.error('Error submitting review:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Submission Failed',
            detail: 'Failed to submit performance review'
          });
        } finally {
          this.isSubmittingReview.set(false);
        }
      }
    });
  }

  async approveReview(review: ReviewWithEmployee) {
    this.confirmationService.confirm({
      message: `Approve this performance review for ${review.employeeFullName}?`,
      header: 'Approve Review',
      icon: 'pi pi-check',
      acceptButtonStyleClass: 'p-button-success',
      accept: async () => {
        this.isSubmittingReview.set(true);

        try {
          const result = await this.performanceReviewService.approveReview(review.id).toPromise();
          if (result) {
            this.messageService.add({
              severity: 'success',
              summary: 'Review Approved',
              detail: result.message
            });
            
            await this.loadReviews();
            this.filterReviews();
            
            if (this.selectedReview?.id === review.id) {
              this.selectedReview = this.reviews().find(r => r.id === review.id) || null;
            }
          }
        } catch (error) {
          console.error('Error approving review:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Approval Failed',
            detail: 'Failed to approve performance review'
          });
        } finally {
          this.isSubmittingReview.set(false);
        }
      }
    });
  }

  // Form management
  resetCreateForm() {
    const currentUser = this.currentUser();
    this.newReviewForm = {
      employeeId: 0,
      reviewerId: currentUser?.id || 0,
      reviewPeriodStart: new Date(new Date().getFullYear(), 0, 1), // Start of year
      reviewPeriodEnd: new Date(new Date()), // Today
      initialNotes: ''
    };
  }

  populateEditForm(review: ReviewWithEmployee) {
    this.editReviewForm = {
      overallRating: review.overallRating || 0,
      strengths: review.strengths || '',
      areasForImprovement: review.areasForImprovement || '',
      goals: review.goals || '',
      status: review.status
    };
  }

  cancelCreateReview() {
    this.showCreateDialog = false;
    this.resetCreateForm();
  }

  cancelEdit() {
    this.isEditingReview.set(false);
    this.editReviewForm = {
      overallRating: 0,
      strengths: '',
      areasForImprovement: '',
      goals: '',
      status: 'Draft'
    };
  }

  // Validation methods
  isCreateFormValid(): boolean {
    return !!(
      this.newReviewForm.employeeId &&
      this.newReviewForm.reviewerId &&
      this.newReviewForm.reviewPeriodStart &&
      this.newReviewForm.reviewPeriodEnd
    );
  }

  isEditFormValid(): boolean {
    return this.editReviewForm.overallRating > 0;
  }

  // Permission methods
  canCreateReviews(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Manager' || user?.role === 'HR' || user?.role === 'Admin';
  }

  canEditReview(review: ReviewWithEmployee): boolean {
    const currentUser = this.currentUser();
    if (!currentUser) return false;

    const user = this.authService.getCurrentUser();
    
    // Reviewers can edit their own draft reviews
    if (review.reviewerId === currentUser.id && review.status === 'Draft') {
      return true;
    }

    // HR and Admin can edit any review
    return user?.role === 'HR' || user?.role === 'Admin';
  }

  canSubmitReview(review: ReviewWithEmployee): boolean {
    const currentUser = this.currentUser();
    if (!currentUser) return false;

    return review.reviewerId === currentUser.id && 
           review.status === 'Draft' && 
           review.overallRating > 0;
  }

  canApproveReview(review: ReviewWithEmployee): boolean {
    const user = this.authService.getCurrentUser();
    return (user?.role === 'HR' || user?.role === 'Admin') && review.status === 'Completed';
  }

  canViewOtherAnalytics(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Manager' || user?.role === 'HR' || user?.role === 'Admin';
  }

  // Helper methods
  isEditMode(): boolean {
    return this.isEditingReview();
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (status) {
      case 'Approved': return 'success';
      case 'Completed': return 'info';
      case 'Draft': return 'warning';
      default: return 'secondary';
    }
  }

  getTrendClass(trend: string): string {
    switch (trend?.toLowerCase()) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-surface-600';
    }
  }

  getInitials(fullName: string): string {
    if (!fullName) return '??';
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getDaysDifference(startDate: Date | string, endDate: Date | string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  refreshData() {
    this.loadData();
    if (this.selectedAnalyticsEmployee) {
      this.loadAnalyticsData();
    }
  }

  trackByReviewId(index: number, review: ReviewWithEmployee): number {
    return review.id;
  }
}