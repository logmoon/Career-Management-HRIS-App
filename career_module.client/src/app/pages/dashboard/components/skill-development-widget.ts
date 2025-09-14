import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TabsModule } from 'primeng/tabs';

@Component({
  standalone: true,
  selector: 'app-skill-development-widget',
  imports: [
    CommonModule, 
    TagModule, 
    ProgressBarModule, 
    ButtonModule, 
    ChartModule,
    TabsModule
  ],
  template: `
    <div class="card mb-0">
      <div class="flex items-center justify-between mb-4">
        <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">{{ getTitle() }}</div>
        <p-button 
          *ngIf="skillRecommendations && skillRecommendations.length > 0"
          label="View All Skills" 
          icon="pi pi-arrow-right"
          severity="secondary"
          [outlined]="true"
          size="small"
          routerLink="/skills">
        </p-button>
      </div>

      <div *ngIf="skillRecommendations && skillRecommendations.length > 0">
        <!-- Skills Overview Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Skills to Develop</div>
                <div class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ getSkillsToDevelope() }}</div>
              </div>
              <i class="pi pi-arrow-up text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-green-600 dark:text-green-400 font-medium">On Track</div>
                <div class="text-xl font-bold text-green-700 dark:text-green-300">{{ getOnTrackSkills() }}</div>
              </div>
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl"></i>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm text-orange-600 dark:text-orange-400 font-medium">High Priority</div>
                <div class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ getHighPrioritySkills() }}</div>
              </div>
              <i class="pi pi-exclamation-triangle text-orange-600 dark:text-orange-400 text-xl"></i>
            </div>
          </div>
        </div>

        <!-- Skills List -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div 
            *ngFor="let skill of skillRecommendations.slice(0, 6); trackBy: trackBySkillId" 
            class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
            
            <!-- Skill Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20">
                  <i class="pi pi-graduation-cap text-primary-600 dark:text-primary-400"></i>
                </div>
                <div>
                  <h6 class="font-medium text-surface-900 dark:text-surface-0 m-0">
                    {{ skill.skill?.name || 'Skill Development' }}
                  </h6>
                  <p class="text-sm text-surface-600 dark:text-surface-400 m-0 mt-1">
                    {{ skill.skill?.category || 'Professional Skills' }}
                  </p>
                </div>
              </div>
              <p-tag 
                [value]="skill.priority" 
                [severity]="getPrioritySeverity(skill.priority)"
                [rounded]="true">
              </p-tag>
            </div>

            <!-- Skill Progress -->
            <div class="mb-3">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-surface-600 dark:text-surface-400">Progress</span>
                <span class="font-medium text-surface-900 dark:text-surface-0">
                  Level {{ skill.currentLevel }}/{{ skill.recommendedLevel }}
                </span>
              </div>
              <p-progressBar 
                [value]="getSkillProgress(skill)" 
                styleClass="w-full"
                style="height: 6px;"
                [showValue]="false">
              </p-progressBar>
            </div>

            <!-- Skill Gap Info -->
            <div class="mb-4">
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
                {{ skill.reason }}
              </p>
              <div *ngIf="skill.gap > 0" class="flex items-center gap-2 text-xs">
                <span class="px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-surface-600 dark:text-surface-300">
                  Gap: {{ skill.gap }} level{{ skill.gap > 1 ? 's' : '' }}
                </span>
                <span class="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400">
                  {{ getEstimatedTime(skill.gap) }}
                </span>
              </div>
            </div>

            <!-- Action Items -->
            <div *ngIf="skill.suggestedActions && skill.suggestedActions.length > 0" class="mb-4">
              <div class="text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">Suggested Actions:</div>
              <div class="flex flex-wrap gap-1">
                <span 
                  *ngFor="let action of skill.suggestedActions.slice(0, 2)" 
                  class="text-xs px-2 py-1 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded text-surface-700 dark:text-surface-300">
                  {{ action }}
                </span>
                <span 
                  *ngIf="skill.suggestedActions.length > 2"
                  class="text-xs px-2 py-1 text-primary-600 dark:text-primary-400">
                  +{{ skill.suggestedActions.length - 2 }} more
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <p-button 
                label="Start Learning" 
                icon="pi pi-play"
                size="small"
                severity="primary"
                class="flex-1">
              </p-button>
              <p-button 
                icon="pi pi-bookmark" 
                severity="secondary"
                [outlined]="true"
                [rounded]="true"
                size="small"
                pTooltip="Save for later">
              </p-button>
            </div>
          </div>
        </div>

        <!-- Learning Path Suggestion -->
        <div *ngIf="userRole === 'Employee'" class="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
          <div class="flex items-start gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
              <i class="pi pi-lightbulb text-purple-600 dark:text-purple-400"></i>
            </div>
            <div class="flex-grow">
              <h6 class="font-medium text-purple-900 dark:text-purple-100 mb-2">AI Learning Path Recommendation</h6>
              <p class="text-sm text-purple-700 dark:text-purple-300 mb-3">
                Based on your career goals, we recommend focusing on these {{ getTopSkillsCount() }} skills in the next quarter to maximize your career advancement opportunities.
              </p>
              <p-button 
                label="Create Learning Plan" 
                icon="pi pi-star"
                severity="secondary"
                [outlined]="true"
                size="small">
              </p-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!skillRecommendations || skillRecommendations.length === 0" class="text-center py-12">
        <div class="flex items-center justify-center w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 mx-auto mb-4">
          <i class="pi pi-graduation-cap text-2xl text-surface-400 dark:text-surface-500"></i>
        </div>
        <h3 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">{{ getEmptyStateTitle() }}</h3>
        <p class="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
          {{ getEmptyStateMessage() }}
        </p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center">
          <p-button 
            label="Assess Skills" 
            icon="pi pi-chart-bar"
            severity="primary"
            size="small">
          </p-button>
          <p-button 
            label="Browse Skills" 
            icon="pi pi-search"
            severity="secondary"
            [outlined]="true"
            size="small"
            routerLink="/skills">
          </p-button>
        </div>
      </div>
    </div>
  `
})
export class SkillDevelopmentWidget {
  @Input() skillRecommendations: any[] = [];
  @Input() userRole: string = 'Employee';

  trackBySkillId(index: number, skill: any): any {
    return skill.skill?.id || index;
  }

  getTitle(): string {
    return this.userRole === 'Employee' ? 'Skill Development Plan' : 'Team Skill Development';
  }

  getPrioritySeverity(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warn';
      case 'low': return 'success';
      default: return 'info';
    }
  }

  getSkillProgress(skill: any): number {
    if (!skill.currentLevel || !skill.recommendedLevel) return 0;
    return Math.min((skill.currentLevel / skill.recommendedLevel) * 100, 100);
  }

  getSkillsToDevelope(): number {
    return this.skillRecommendations?.length || 0;
  }

  getOnTrackSkills(): number {
    return this.skillRecommendations?.filter(skill => 
      skill.priority?.toLowerCase() === 'low' || 
      this.getSkillProgress(skill) >= 80
    ).length || 0;
  }

  getHighPrioritySkills(): number {
    return this.skillRecommendations?.filter(skill => 
      skill.priority?.toLowerCase() === 'high'
    ).length || 0;
  }

  getTopSkillsCount(): number {
    return Math.min(3, this.skillRecommendations?.length || 0);
  }

  getEstimatedTime(gap: number): string {
    if (gap <= 1) return '2-4 weeks';
    if (gap <= 2) return '1-2 months';
    if (gap <= 3) return '2-3 months';
    return '3+ months';
  }

  getEmptyStateTitle(): string {
    return this.userRole === 'Employee' 
      ? 'No Skill Recommendations Yet'
      : 'No Team Skill Development Data';
  }

  getEmptyStateMessage(): string {
    return this.userRole === 'Employee'
      ? 'Complete your skills assessment and career profile to receive personalized development recommendations powered by AI.'
      : 'Team skill development recommendations will appear here as team members complete their assessments and career planning.';
  }
}