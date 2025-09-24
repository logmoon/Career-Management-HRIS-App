import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-career-stats-widget',
  imports: [CommonModule, ButtonModule, RippleModule, RouterModule],
  template: `
    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-12 sm:col-span-6 lg:col-span-3" *ngFor="let stat of getStatsArray(); trackBy: trackByIndex">
        <div class="card mb-0 h-full">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-grow">
              <span class="block text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">
                {{ stat.label }}
              </span>
              <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl mb-1">
                {{ stat.value }}
              </div>
              <div class="flex items-center gap-1">
                <span class="text-primary-500 font-medium text-sm">{{ stat.subtitle }}</span>
                <span class="text-surface-500 dark:text-surface-400 text-sm">{{ stat.description }}</span>
              </div>
            </div>
            <div class="flex items-center justify-center rounded-full flex-shrink-0 ml-3" 
                 [ngClass]="stat.bgClass"
                 style="width: 3rem; height: 3rem">
              <i [class]="stat.icon + ' text-xl'"></i>
            </div>
          </div>
          
          <!-- Optional trend indicator -->
          <div *ngIf="stat.trend" class="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700">
            <span class="text-xs text-surface-500 dark:text-surface-400">vs last period</span>
            <div class="flex items-center gap-1">
              <i [class]="stat.trend.icon" [ngClass]="stat.trend.color"></i>
              <span class="text-xs font-medium" [ngClass]="stat.trend.color">
                {{ stat.trend.value }}
              </span>
            </div>
          </div>
          
          <!-- Quick action button -->
          <div *ngIf="stat.actionUrl" class="mt-3">
            <p-button 
              [label]="stat.actionLabel || 'View Details'" 
              icon="pi pi-arrow-right"
              size="small"
              severity="secondary"
              [outlined]="true"
              class="w-full"
              [routerLink]="stat.actionUrl">
            </p-button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CareerStatsWidget {
  @Input() quickStats: any;
  @Input() userRole: string = 'Employee';

  trackByIndex(index: number, item: any): number {
    return index;
  }

  getStatsArray() {
    if (!this.quickStats) return this.getDefaultStats();

    const stats = [];

    if (this.userRole === 'Employee') {
      stats.push(
        {
          label: 'Career Opportunities',
          value: this.quickStats.careerOpportunities || 0,
          subtitle: `${this.quickStats.careerOpportunities || 0} available`,
          description: 'positions match your profile',
          icon: 'pi pi-star',
          bgClass: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
          actionUrl: '/career',
          actionLabel: 'Explore',
          trend: this.getTrend(5, 'increase')
        },
        {
          label: 'Active Development',
          value: this.quickStats.activeCareerPaths || 0,
          subtitle: `${this.quickStats.activeCareerPaths || 0} in progress`,
          description: 'career paths active',
          icon: 'pi pi-sitemap',
          bgClass: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
          actionUrl: '/career',
          actionLabel: 'View Progress',
          trend: this.getTrend(2, 'increase')
        },
        {
          label: 'Pending Requests',
          value: this.quickStats.myPendingRequests || 0,
          subtitle: `${this.quickStats.myPendingRequests || 0} pending`,
          description: 'awaiting approval',
          icon: 'pi pi-clock',
          bgClass: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
          actionUrl: '/requests',
          actionLabel: 'View Requests'
        },
        {
          label: 'Skills Progress',
          value: this.calculateSkillsProgress(),
          subtitle: this.getSkillsProgressLabel(),
          description: 'of development goals',
          icon: 'pi pi-chart-line',
          bgClass: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
          actionUrl: '/profile',
          actionLabel: 'Update Skills',
          trend: this.getTrend(12, 'increase')
        }
      );
    } else if (this.userRole === 'Manager') {
      stats.push(
        {
          label: 'Team Members',
          value: this.quickStats.myDirectReports || 0,
          subtitle: `${this.quickStats.myDirectReports || 0} direct reports`,
          description: 'under your management',
          icon: 'pi pi-users',
          bgClass: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
          actionUrl: '/employees',
          actionLabel: 'View Team'
        },
        {
          label: 'Pending Approvals',
          value: this.quickStats.pendingRequests || 0,
          subtitle: `${this.quickStats.pendingRequests || 0} requests`,
          description: 'need your approval',
          icon: 'pi pi-clock',
          bgClass: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
          actionUrl: '/approvals',
          actionLabel: 'Review'
        },
        {
          label: 'High Performers',
          value: this.quickStats.highPerformers || this.calculateHighPerformers(),
          subtitle: `${this.quickStats.highPerformers || this.calculateHighPerformers()} excelling`,
          description: 'team members',
          icon: 'pi pi-star',
          bgClass: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
          actionUrl: '/performance/analytics',
          actionLabel: 'View Analytics'
        },
        {
          label: 'Development Plans',
          value: this.quickStats.activeCareerPaths || 0,
          subtitle: `${this.quickStats.activeCareerPaths || 0} active`,
          description: 'career development plans',
          icon: 'pi pi-chart-bar',
          bgClass: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
          actionUrl: '/career',
          actionLabel: 'View Plans'
        }
      );
    } else {
      // Admin/HR stats
      stats.push(
        {
          label: 'Total Employees',
          value: this.quickStats.totalEmployees || 0,
          subtitle: `${this.quickStats.totalEmployees || 0} active`,
          description: 'in the organization',
          icon: 'pi pi-users',
          bgClass: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
          actionUrl: '/employees',
          actionLabel: 'Manage'
        },
        {
          label: 'Active Programs',
          value: this.quickStats.activeCareerPaths || 0,
          subtitle: `${this.quickStats.activeCareerPaths || 0} running`,
          description: 'development programs',
          icon: 'pi pi-sitemap',
          bgClass: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
          actionUrl: '/career',
          actionLabel: 'View Programs'
        },
        {
          label: 'Succession Plans',
          value: this.quickStats.successionPlansActive || 0,
          subtitle: `${this.quickStats.successionPlansActive || 0} prepared`,
          description: 'leadership transitions',
          icon: 'pi pi-arrow-up-right',
          bgClass: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
          actionUrl: '/succession-planning',
          actionLabel: 'Review Plans'
        },
        {
          label: 'Action Items',
          value: this.quickStats.pendingRequests || 0,
          subtitle: `${this.quickStats.pendingRequests || 0} pending`,
          description: 'requiring attention',
          icon: 'pi pi-exclamation-triangle',
          bgClass: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
          actionUrl: '/approvals',
          actionLabel: 'Review'
        }
      );
    }

    return stats;
  }

  private getDefaultStats() {
    // Return empty stats array when no data is available
    return [];
  }

  private calculateSkillsProgress(): string {
    // This would normally calculate based on actual skill data
    // For now, return a placeholder
    return '78%';
  }

  private getSkillsProgressLabel(): string {
    return 'completion rate';
  }

  private calculateHighPerformers(): number {
    // This would calculate based on team performance data
    // For now, return a reasonable estimate
    const teamSize = this.quickStats?.myDirectReports || 0;
    return Math.floor(teamSize * 0.3); // Assume 30% are high performers
  }

  private getTrend(value: number, direction: 'increase' | 'decrease' | 'stable'): any {
    const trends = {
      increase: {
        icon: 'pi pi-arrow-up',
        color: 'text-green-500',
        value: `+${value}%`
      },
      decrease: {
        icon: 'pi pi-arrow-down',
        color: 'text-red-500',
        value: `-${value}%`
      },
      stable: {
        icon: 'pi pi-minus',
        color: 'text-surface-500',
        value: '0%'
      }
    };

    return trends[direction];
  }
}