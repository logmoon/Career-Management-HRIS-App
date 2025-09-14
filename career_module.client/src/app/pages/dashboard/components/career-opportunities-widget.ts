import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';

@Component({
  standalone: true,
  selector: 'app-career-opportunities-widget',
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    TagModule, 
    ProgressBarModule,
    CardModule,
    AvatarModule,
    RippleModule
  ],
  template: `
    <div class="card mb-0">
      <div class="flex items-center justify-between mb-4">
        <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Career Opportunities</div>
        <p-button 
          *ngIf="opportunities && opportunities.length > 5"
          label="View All" 
          icon="pi pi-arrow-right"
          severity="secondary"
          [outlined]="true"
          size="small">
        </p-button>
      </div>
      
      <div *ngIf="opportunities && opportunities.length > 0">
        <!-- Desktop Table View -->
        <div class="hidden md:block">
          <p-table 
            [value]="opportunities.slice(0, 5)" 
            [paginator]="false" 
            responsiveLayout="scroll"
            styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th style="min-width: 16rem">Position</th>
                <th style="min-width: 10rem">Department</th>
                <th style="min-width: 8rem" class="text-center">Match</th>
                <th style="min-width: 6rem" class="text-center">Priority</th>
                <th style="min-width: 8rem" class="text-center">Action</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-opportunity>
              <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20">
                      <i class="pi pi-briefcase text-primary-600 dark:text-primary-400"></i>
                    </div>
                    <div>
                      <div class="font-medium text-surface-900 dark:text-surface-0">{{ opportunity.title }}</div>
                      <div class="text-sm text-surface-600 dark:text-surface-400">{{ opportunity.type }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="text-surface-900 dark:text-surface-0">{{ opportunity.department }}</span>
                </td>
                <td class="text-center">
                  <div class="flex flex-col items-center gap-2">
                    <p-progressBar 
                      [value]="opportunity.matchScore" 
                      styleClass="w-full" 
                      style="height: 4px;"
                      [showValue]="false">
                    </p-progressBar>
                    <span class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ opportunity.matchScore }}%</span>
                  </div>
                </td>
                <td class="text-center">
                  <p-tag 
                    [value]="opportunity.priority" 
                    [severity]="getPrioritySeverity(opportunity.priority)"
                    [rounded]="true">
                  </p-tag>
                </td>
                <td class="text-center">
                  <div class="flex gap-2 justify-center">
                    <p-button 
                      icon="pi pi-eye" 
                      severity="secondary"
                      [outlined]="true"
                      [rounded]="true"
                      size="small"
                      pTooltip="View Details"
                      tooltipPosition="top">
                    </p-button>
                    <p-button 
                      icon="pi pi-heart" 
                      severity="success"
                      [outlined]="true"
                      [rounded]="true"
                      size="small"
                      pTooltip="Save Opportunity"
                      tooltipPosition="top">
                    </p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Mobile Card View -->
        <div class="block md:hidden">
          <div class="flex flex-col gap-3">
            <div 
              *ngFor="let opportunity of opportunities.slice(0, 5); trackBy: trackByIndex" 
              class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer">
              
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex-shrink-0">
                    <i class="pi pi-briefcase text-primary-600 dark:text-primary-400"></i>
                  </div>
                  <div>
                    <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0">{{ opportunity.title }}</h6>
                    <p class="text-sm text-surface-600 dark:text-surface-400 m-0 mt-1">{{ opportunity.department }}</p>
                  </div>
                </div>
                <p-tag 
                  [value]="opportunity.priority" 
                  [severity]="getPrioritySeverity(opportunity.priority)"
                  [rounded]="true">
                </p-tag>
              </div>
              
              <div class="mb-3">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-surface-600 dark:text-surface-400">Match Score</span>
                  <span class="font-medium text-surface-900 dark:text-surface-0">{{ opportunity.matchScore }}%</span>
                </div>
                <p-progressBar 
                  [value]="opportunity.matchScore" 
                  styleClass="w-full" 
                  style="height: 4px;"
                  [showValue]="false">
                </p-progressBar>
              </div>
              
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-4">
                {{ opportunity.description || opportunity.recommendedAction }}
              </div>
              
              <div class="flex gap-2">
                <p-button 
                  label="View Details" 
                  icon="pi pi-eye"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  class="flex-1">
                </p-button>
                <p-button 
                  icon="pi pi-heart" 
                  severity="success"
                  [outlined]="true"
                  [rounded]="true"
                  size="small"
                  pTooltip="Save">
                </p-button>
              </div>
            </div>
          </div>
        </div>

        <!-- View All Button (Mobile) -->
        <div *ngIf="opportunities.length > 5" class="block md:hidden mt-4">
          <p-button 
            label="View All Opportunities" 
            icon="pi pi-arrow-right"
            severity="secondary"
            [outlined]="true"
            class="w-full">
          </p-button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!opportunities || opportunities.length === 0" class="text-center py-12">
        <div class="flex items-center justify-center w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 mx-auto mb-4">
          <i class="pi pi-star text-2xl text-surface-400 dark:text-surface-500"></i>
        </div>
        <h3 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Opportunities Available</h3>
        <p class="text-surface-600 dark:text-surface-400 mb-6 max-w-sm mx-auto">
          Complete your profile and skills assessment to discover personalized career opportunities that match your expertise.
        </p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center">
          <p-button 
            label="Complete Profile" 
            icon="pi pi-user"
            severity="primary"
            size="small">
          </p-button>
          <p-button 
            label="Update Skills" 
            icon="pi pi-cog"
            severity="secondary"
            [outlined]="true"
            size="small">
          </p-button>
        </div>
      </div>
    </div>
  `
})
export class CareerOpportunitiesWidget {
  @Input() opportunities: any[] = [];

  trackByIndex(index: number, item: any): number {
    return item.relatedId || index;
  }

  getPrioritySeverity(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warn';
      case 'low': return 'success';
      default: return 'info';
    }
  }
}