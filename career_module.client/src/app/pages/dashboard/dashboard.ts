import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, timeout, catchError, of, finalize } from 'rxjs';
import { CareerStatsWidget } from './components/career-stats-widget';
import { CareerOpportunitiesWidget } from './components/career-opportunities-widget';
import { SkillDevelopmentWidget } from './components/skill-development-widget';
import { TalentRisksWidget } from './components/talent-risks-widget';
import { SmartRecommendationsWidget } from './components/smart-recommendations-widget';
import { IntelligenceService, IntelligentDashboard } from '../service/intelligence.service';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    MessageModule,
    ButtonModule,
    CareerStatsWidget,
    CareerOpportunitiesWidget,
    SkillDevelopmentWidget,
    TalentRisksWidget,
    SmartRecommendationsWidget,
  ],
  template: `
    <div class="min-h-screen">
      <!-- Header -->
      <div class="bg-surface-0 dark:bg-surface-900 shadow-sm border-b border-surface-200 dark:border-surface-700 px-6 py-4 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ pageTitle }}</h1>
            <p class="text-lg text-surface-600 dark:text-surface-300 mt-2 mb-0">{{ welcomeMessage }}</p>
          </div>
          <div class="flex gap-2">
            <p-button 
              icon="pi pi-refresh" 
              severity="secondary" 
              [outlined]="true"
              (click)="refreshDashboard()"
              [loading]="isLoading"
              [disabled]="isLoading"
              pTooltip="Refresh Dashboard">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && !dashboard" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading your dashboard...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="px-6 mb-6">
        <p-message severity="error" [text]="errorMessage" styleClass="w-full">
          <ng-template #content>
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ errorMessage }}</span>
              <p-button 
                label="Retry" 
                size="small" 
                severity="danger" 
                [outlined]="true"
                [disabled]="isLoading"
                (click)="loadDashboard()"
                class="ml-auto">
              </p-button>
            </div>
          </ng-template>
        </p-message>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="dashboard && !isLoading" class="px-6">
        <!-- Stats Overview -->
        <div class="grid grid-cols-12 gap-6 mb-6">
          <app-career-stats-widget 
            class="col-span-12" 
            [quickStats]="dashboard.quickStats"
            [userRole]="userRole">
          </app-career-stats-widget>
        </div>
        
        <!-- Main Content Grid -->
        <div class="grid grid-cols-12 gap-6">
          <!-- Left Column -->
          <div class="col-span-12 xl:col-span-8">
            <div class="flex flex-col gap-6">
              <!-- Career Opportunities for Employees -->
              <app-career-opportunities-widget 
                *ngIf="userRole === 'Employee' && hasCareerOpportunities"
                [opportunities]="dashboard.careerOpportunities">
              </app-career-opportunities-widget>

              <!-- Talent Risks for HR/Admin -->
              <app-talent-risks-widget 
                *ngIf="isAdminOrHR && hasTalentRisks"
                [talentRisks]="dashboard.talentRisks"
                [attritionRisks]="dashboard.attritionRisks">
              </app-talent-risks-widget>

              <!-- Skills Development -->
              <app-skill-development-widget 
                *ngIf="hasSkillRecommendations"
                [skillRecommendations]="dashboard.skillRecommendations"
                [userRole]="userRole">
              </app-skill-development-widget>

              <!-- Empty State -->
              <div *ngIf="!hasMainContent" class="card">
                <div class="text-center py-12">
                  <i class="pi pi-chart-line text-6xl text-surface-300 dark:text-surface-600 mb-4"></i>
                  <h3 class="text-xl font-medium text-surface-600 dark:text-surface-300 mb-2">
                    {{ emptyStateTitle }}
                  </h3>
                  <p class="text-surface-500 dark:text-surface-400">
                    {{ emptyStateMessage }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Column -->
          <div class="col-span-12 xl:col-span-4">
            <div class="flex flex-col gap-6">
              <app-smart-recommendations-widget 
                [recommendations]="dashboard.smartRecommendations || []"
                [insights]="dashboard.personalInsights?.smartInsights || []"
                [strategicRecommendations]="this.getStrategicRecommendations(dashboard) || []"
                [userRole]="userRole">
              </app-smart-recommendations-widget>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty Dashboard State -->
      <div *ngIf="!dashboard && !isLoading && !errorMessage" class="px-6">
        <div class="card">
          <div class="text-center py-20">
            <i class="pi pi-database text-6xl text-surface-300 dark:text-surface-600 mb-4"></i>
            <h2 class="text-2xl font-medium text-surface-600 dark:text-surface-300 mb-2">Welcome to Your Dashboard</h2>
            <p class="text-surface-500 dark:text-surface-400 mb-6 max-w-lg mx-auto">
              Your intelligent career dashboard is being prepared. Complete your profile and start using the system to see personalized insights.
            </p>
            <div class="flex gap-2 justify-center">
              <p-button 
                label="Complete Profile" 
                icon="pi pi-user"
                severity="primary">
              </p-button>
              <p-button 
                label="Explore Features" 
                icon="pi pi-compass"
                severity="secondary"
                [outlined]="true">
              </p-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Dashboard implements OnInit, OnDestroy {
  dashboard: IntelligentDashboard | null = null;
  isLoading = false;
  errorMessage = '';
  userRole = '';
  
  // Cache computed properties
  pageTitle = '';
  welcomeMessage = '';
  isAdminOrHR = false;
  hasCareerOpportunities = false;
  hasTalentRisks = false;
  hasSkillRecommendations = false;
  hasMainContent = false;
  emptyStateTitle = '';
  emptyStateMessage = '';

  private destroy$ = new Subject<void>();
  private isRefreshing = false;

  constructor(
    private intelligenceService: IntelligenceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role || 'Employee';
    this.updateCachedProperties();
    this.loadDashboard();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard() {
    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      console.warn('Dashboard load already in progress, skipping...');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.intelligenceService.getDashboard()
      .pipe(
        // Add timeout to prevent hanging requests
        timeout(30000), // 30 seconds timeout
        // Ensure loading state is reset regardless of outcome
        finalize(() => {
          this.isLoading = false;
          this.isRefreshing = false;
        }),
        // Handle errors gracefully
        catchError(error => {
          console.error('Dashboard loading error:', error);
          this.errorMessage = this.getErrorMessage(error);
          return of(null); // Return null instead of throwing
        }),
        // Automatically unsubscribe on component destroy
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.dashboard = data;
            this.updateCachedProperties();
            this.errorMessage = '';
          }
        }
      });
  }

  refreshDashboard() {
    // Debounce refresh requests
    if (this.isLoading || this.isRefreshing) {
      console.warn('Refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;
    this.loadDashboard();
  }

  getStrategicRecommendations(dashboard: IntelligentDashboard) {
    return this.intelligenceService.getStrategicRecommendations(dashboard);
  }

  private updateCachedProperties() {
    // Cache all computed properties to avoid recalculation on every change detection
    this.pageTitle = this.getPageTitle();
    this.welcomeMessage = this.getWelcomeMessage();
    this.isAdminOrHR = this.userRole === 'Admin' || this.userRole === 'HR';
    this.hasCareerOpportunities = (this.dashboard?.careerOpportunities?.length ?? 0) > 0;
    this.hasTalentRisks = ((this.dashboard?.talentRisks?.length ?? 0) > 0) || 
                         ((this.dashboard?.attritionRisks?.length ?? 0) > 0);
    this.hasSkillRecommendations = (this.dashboard?.skillRecommendations?.length ?? 0) > 0;
    this.hasMainContent = this.calculateHasMainContent();
    this.emptyStateTitle = this.getEmptyStateTitle();
    this.emptyStateMessage = this.getEmptyStateMessage();
  }

  private calculateHasMainContent(): boolean {
    if (this.userRole === 'Employee') {
      return this.hasCareerOpportunities || this.hasSkillRecommendations;
    } else if (this.isAdminOrHR) {
      return this.hasTalentRisks || this.hasSkillRecommendations;
    } else {
      return this.hasSkillRecommendations;
    }
  }

  private getWelcomeMessage(): string {
    const hour = new Date().getHours();
    const user = this.authService.getCurrentUser();
    const name = user?.firstName || this.userRole;
    
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  }

  private getPageTitle(): string {
    switch (this.userRole) {
      case 'Admin': return 'Organization Dashboard';
      case 'HR': return 'HR Intelligence Dashboard'; 
      case 'Manager': return 'Team Management Dashboard';
      default: return 'Career Dashboard';
    }
  }

  private getEmptyStateTitle(): string {
    switch (this.userRole) {
      case 'Admin':
      case 'HR':
        return 'Analyzing Organization Data';
      case 'Manager':
        return 'Building Team Insights';
      default:
        return 'Preparing Your Career Insights';
    }
  }

  private getEmptyStateMessage(): string {
    switch (this.userRole) {
      case 'Admin':
      case 'HR':
        return 'Our AI is processing employee data to provide talent analytics, risk assessments, and strategic recommendations.';
      case 'Manager':
        return 'Team performance data and development opportunities will appear here as your team members engage with the platform.';
      default:
        return 'Complete your profile and skills assessment to unlock personalized career opportunities and development recommendations.';
    }
  }

  private getErrorMessage(error: any): string {
    if (error.name === 'TimeoutError') {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (error.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }
    
    return error.error?.message || 'Failed to load dashboard data. Please try again.';
  }
}