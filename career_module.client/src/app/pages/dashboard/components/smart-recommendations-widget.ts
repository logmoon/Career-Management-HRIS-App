import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-smart-recommendations-widget',
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="card mb-6">
      <div class="font-semibold text-xl mb-4">Smart Recommendations</div>
      <div *ngIf="hasRecommendations(); else noRecommendations">
        
        <!-- AI Recommendations -->
        <div *ngIf="recommendations && recommendations.length > 0">
          <div *ngFor="let rec of recommendations.slice(0, 3)" 
               class="border border-surface-200 rounded-lg p-4 mb-3">
            <div class="flex items-start gap-3">
              <div class="flex items-center justify-center bg-primary-100 rounded-lg flex-shrink-0"
                   style="width: 2rem; height: 2rem">
                <i class="pi pi-lightbulb text-primary-500"></i>
              </div>
              <div class="flex-grow-1">
                <h6 class="font-medium mb-1">{{ rec.title }}</h6>
                <p class="text-sm text-muted-color mb-2">{{ rec.description }}</p>
                <button *ngIf="rec.actionUrl" pButton 
                        label="Take Action" 
                        icon="pi pi-arrow-right"
                        class="p-button-text p-button-sm">
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Insights for Employees -->
        <div *ngIf="insights && insights.length > 0 && userRole === 'Employee'">
          <h5 class="font-medium mb-3 mt-4">Personal Insights</h5>
          <div *ngFor="let insight of insights.slice(0, 2)" 
               class="border border-surface-200 rounded-lg p-3 mb-3">
            <div class="flex items-start gap-2">
              <i class="pi pi-info-circle text-blue-500 mt-1"></i>
              <span class="text-sm">{{ insight }}</span>
            </div>
          </div>
        </div>

        <!-- Strategic Recommendations for HR/Admin -->
        <div *ngIf="strategicRecommendations && strategicRecommendations.length > 0 && isAdminOrHR()">
          <h5 class="font-medium mb-3 mt-4">Strategic Recommendations</h5>
          <div *ngFor="let rec of strategicRecommendations.slice(0, 3)" 
               class="border border-surface-200 rounded-lg p-3 mb-3">
            <div class="flex items-start gap-2">
              <i class="pi pi-arrow-right text-primary mt-1"></i>
              <span class="text-sm">{{ rec }}</span>
            </div>
          </div>
        </div>

      </div>
      <ng-template #noRecommendations>
        <div class="text-center py-6">
          <i class="pi pi-brain text-4xl text-muted-color mb-4"></i>
          <div class="text-lg font-medium text-surface-900 mb-2">AI Learning Your Patterns</div>
          <p class="text-muted-color">Smart recommendations will appear as our AI analyzes your career data.</p>
        </div>
      </ng-template>
    </div>

    <!-- Quick Actions Card -->
    <div class="card mb-0">
      <div class="font-semibold text-xl mb-4">Quick Actions</div>
      <div class="flex flex-col gap-2">
        <button pButton 
                *ngIf="userRole === 'Employee'"
                label="Update Profile" 
                icon="pi pi-user"
                class="p-button-outlined w-full justify-content-start">
        </button>
        <button pButton 
                *ngIf="userRole === 'Employee'"
                label="Explore Career Paths" 
                icon="pi pi-sitemap"
                class="p-button-outlined w-full justify-content-start">
        </button>
        <button pButton 
                *ngIf="isAdminOrHR()"
                label="Review Requests" 
                icon="pi pi-clock"
                class="p-button-outlined w-full justify-content-start">
        </button>
        <button pButton 
                *ngIf="isAdminOrHR()"
                label="Talent Analytics" 
                icon="pi pi-chart-bar"
                class="p-button-outlined w-full justify-content-start">
        </button>
        <button pButton 
                *ngIf="userRole === 'Manager'"
                label="Team Overview" 
                icon="pi pi-users"
                class="p-button-outlined w-full justify-content-start">
        </button>
      </div>
    </div>
  `
})
export class SmartRecommendationsWidget {
  @Input() recommendations: any[] = [];
  @Input() insights: string[] = [];
  @Input() strategicRecommendations: string[] = [];
  @Input() userRole: string = 'Employee';

  hasRecommendations(): boolean {
    return (this.recommendations && this.recommendations.length > 0) ||
           (this.insights && this.insights.length > 0) ||
           (this.strategicRecommendations && this.strategicRecommendations.length > 0);
  }

  isAdminOrHR(): boolean {
    return this.userRole === 'Admin' || this.userRole === 'HR';
  }
}