import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { RatingModule } from 'primeng/rating';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { BadgeModule } from 'primeng/badge';
import { FluidModule } from 'primeng/fluid';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// Services
import { EmployeeService, Employee, UpdateEmployeeDto, EmployeeExperience, EmployeeEducation, CreateExperienceDto, UpdateExperienceDto, CreateEducationDto, UpdateEducationDto } from '../service/employee.service';
import { SkillsService, EmployeeSkill, AddEmployeeSkill, UpdateEmployeeSkill, Skill } from '../service/skills.service';
import { IntelligenceService, CareerIntelligenceReport, SkillDevelopmentRecommendation, CareerOpportunity, CareerPerformanceInsight } from '../service/intelligence.service';
import { PerformanceReviewService, PerformanceAnalyticsDto } from '../service/performance-review.service';
import { AuthService } from '../service/auth.service';
import { ActivatedRoute } from '@angular/router';

interface TimelineEvent {
  title: string;
  description: string;
  date: Date;
  type: 'career' | 'experience' | 'education' | 'skill' | 'performance';
  category: string;
  icon: string;
}

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    AvatarModule,
    TagModule,
    ChipModule,
    RatingModule,
    ProgressBarModule,
    SelectModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    MessageModule,
    ChartModule,
    TimelineModule,
    PanelModule,
    DividerModule,
    TextareaModule,
    BadgeModule,
    FluidModule,
    TableModule,
    TooltipModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary-500 to-primary-700 text-white px-6 py-8 mb-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-center gap-6">
            <p-avatar 
              [label]="getInitials(profile()?.fullName || '')"
              shape="circle"
              size="xlarge"
              styleClass="text-2xl bg-white text-primary-500">
            </p-avatar>
            <div class="flex-1">
              <h1 class="text-4xl font-bold mb-2">{{ profile()?.fullName }}</h1>
              <p class="text-primary-100 text-lg mb-2">{{ profile()?.currentPosition?.title || 'No Position Assigned' }}</p>
              <div class="flex items-center gap-4">
                <p-tag [value]="profile()?.department?.name" severity="secondary" styleClass="bg-white/20 text-white border-0"></p-tag>
                <p-tag [value]="profile()?.user?.role" [severity]="getRoleSeverity(profile()?.user?.role || '')"  styleClass="bg-white/20 text-white border-0"></p-tag>
                <span class="text-primary-100">{{ profile()?.email }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-primary-100 text-sm">Joined</div>
              <div class="text-xl font-semibold">{{ profile()?.hireDate | date:'mediumDate' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="flex justify-center items-center py-20">
        <div class="flex flex-col items-center gap-4">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <span class="text-surface-600 dark:text-surface-300">Loading profile...</span>
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
      <div *ngIf="!isLoading() && profile()" class="max-w-7xl mx-auto px-6">
        <p-fluid>
          <p-tabs value="profile">
            <p-tablist>
              <p-tab value="profile">Profile</p-tab>
              <p-tab value="skills">Skills</p-tab>
              <p-tab value="experience">Experience</p-tab>
              <p-tab value="education">Education</p-tab>
              <p-tab value="performance">Performance</p-tab>
              <p-tab value="career">Career Intelligence</p-tab>
              <p-tab value="timeline">Timeline</p-tab>
            </p-tablist>

            <!-- Profile Tab -->
            <p-tabpanel value="profile" header="Personal Information" leftIcon="pi pi-user">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Personal Details -->
                <div class="lg:col-span-2">
                  <p-card header="Personal Details">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          First Name
                        </label>
                        <input 
                          pInputText 
                          [(ngModel)]="editForm.firstName"
                          [disabled]="!isEditingProfile() || !canEdit()"
                          class="w-full">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Last Name
                        </label>
                        <input 
                          pInputText 
                          [(ngModel)]="editForm.lastName"
                          [disabled]="!isEditingProfile() || !canEdit()"
                          class="w-full">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Email
                        </label>
                        <input 
                          pInputText 
                          [value]="profile()?.email"
                          disabled
                          class="w-full">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Phone
                        </label>
                        <input 
                          pInputText 
                          [(ngModel)]="editForm.phone"
                          [disabled]="!isEditingProfile() || !canEdit()"
                          class="w-full">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Hire Date
                        </label>
                        <p-datepicker
                          [(ngModel)]="editForm.hireDate"
                          [disabled]="!isEditingProfile() || !canEdit()"
                          dateFormat="dd/mm/yy"
                          [showIcon]="true"
                          styleClass="w-full">
                        </p-datepicker>
                      </div>
                      <div *ngIf="canEditSalary()">
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Salary
                        </label>
                        <p-inputNumber 
                          [(ngModel)]="editForm.salary"
                          [disabled]="!isEditingProfile()"
                          mode="currency" 
                          currency="TND"
                          styleClass="w-full">
                        </p-inputNumber>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <p-divider></p-divider>
                    <div class="flex gap-2" *ngIf="canEdit()">
                      <p-button 
                        *ngIf="!isEditingProfile()"
                        label="Edit Profile" 
                        icon="pi pi-pencil"
                        (click)="startEditing()">
                      </p-button>
                      <p-button 
                        *ngIf="isEditingProfile()"
                        label="Save Changes" 
                        icon="pi pi-check"
                        (click)="saveProfile()"
                        [loading]="isSaving()">
                      </p-button>
                      <p-button 
                        *ngIf="isEditingProfile()"
                        label="Cancel" 
                        icon="pi pi-times"
                        severity="secondary"
                        [outlined]="true"
                        (click)="cancelEditing()">
                      </p-button>
                    </div>
                  </p-card>
                </div>

                <!-- Quick Stats -->
                <div>
                  <p-card header="Quick Stats">
                    <div class="space-y-4">
                      <div class="flex justify-between items-center">
                        <span class="font-medium">Department:</span>
                        <p-tag [value]="profile()?.department?.name" severity="info"></p-tag>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium">Role:</span>
                        <p-tag 
                          [value]="profile()?.user?.role" 
                          [severity]="getRoleSeverity(profile()?.user?.role || '')">
                        </p-tag>
                      </div>
                      <div class="flex justify-between items-center" *ngIf="profile()?.manager">
                        <span class="font-medium">Manager:</span>
                        <span class="text-primary font-medium">{{ profile()?.manager?.fullName }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium">Skills:</span>
                        <p-badge [value]="employeeSkills().length"></p-badge>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium">Experience:</span>
                        <p-badge [value]="employeeExperiences().length"></p-badge>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium">Education:</span>
                        <p-badge [value]="employeeEducations().length"></p-badge>
                      </div>
                      <div class="flex justify-between items-center" *ngIf="profile()?.directReports?.length">
                        <span class="font-medium">Direct Reports:</span>
                        <p-badge [value]="profile()?.directReports?.length ?? 0"></p-badge>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium">Years of Service:</span>
                        <span class="font-medium">{{ getYearsOfService() }}</span>
                      </div>
                    </div>
                  </p-card>
                </div>
              </div>
            </p-tabpanel>

            <!-- Skills Tab -->
            <p-tabpanel value="skills" header="Skills & Expertise" leftIcon="pi pi-star">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Skills Management -->
                <div>
                  <p-card>
                    <ng-template pTemplate="header">
                      <div class="flex justify-between items-center p-4">
                        <h3 class="text-xl font-semibold m-0">Skills ({{ employeeSkills().length }})</h3>
                        <p-button 
                          *ngIf="canManageSkills()"
                          icon="pi pi-plus"
                          size="small"
                          (click)="showAddSkillDialog = true"
                          pTooltip="Add New Skill">
                        </p-button>
                      </div>
                    </ng-template>

                    <!-- Skills Loading -->
                    <div *ngIf="skillsLoading()" class="text-center py-8">
                      <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                      <p class="text-surface-600 dark:text-surface-300 mt-2">Loading skills...</p>
                    </div>

                    <!-- Skills List -->
                    <div *ngIf="!skillsLoading() && employeeSkills().length" class="space-y-3">
                      <div *ngFor="let skill of employeeSkills(); trackBy: trackBySkillId" 
                           class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                        <div class="flex justify-between items-start mb-3">
                          <div>
                            <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                              {{ skill.skill.name }}
                            </h5>
                            <p-tag 
                              *ngIf="skill.skill.category" 
                              [value]="skill.skill.category" 
                              severity="secondary"
                              styleClass="text-xs">
                            </p-tag>
                          </div>
                          <div class="flex items-center gap-2">
                            <p-rating 
                              [(ngModel)]="skill.proficiencyLevel"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                            <span class="text-sm text-surface-600 dark:text-surface-300">
                              ({{ getProficiencyLabel(skill.proficiencyLevel) }})
                            </span>
                          </div>
                        </div>
                        
                        <div *ngIf="skill.notes" class="text-sm text-surface-600 dark:text-surface-300 mb-3">
                          {{ skill.notes }}
                        </div>

                        <div class="flex justify-between items-center">
                          <span *ngIf="skill.acquiredDate" class="text-xs text-surface-500 dark:text-surface-400">
                            Acquired: {{ skill.acquiredDate | date:'mediumDate' }}
                          </span>
                          <div class="flex gap-1" *ngIf="canManageSkills()">
                            <p-button 
                              icon="pi pi-pencil"
                              size="small"
                              severity="secondary"
                              [text]="true"
                              (click)="editSkill(skill)"
                              pTooltip="Edit Skill">
                            </p-button>
                            <p-button 
                              icon="pi pi-trash"
                              size="small"
                              severity="danger"
                              [text]="true"
                              (click)="deleteSkill(skill)"
                              pTooltip="Remove Skill">
                            </p-button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- No Skills -->
                    <div *ngIf="!skillsLoading() && !employeeSkills().length" class="text-center py-8">
                      <i class="pi pi-star text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
                      <p class="text-surface-500 dark:text-surface-400 mb-3">No skills recorded yet</p>
                      <p-button 
                        *ngIf="canManageSkills()"
                        label="Add First Skill"
                        icon="pi pi-plus"
                        (click)="showAddSkillDialog = true">
                      </p-button>
                    </div>
                  </p-card>
                </div>

                <!-- Skills Radar Chart -->
                <div>
                  <p-card header="Skills Overview">
                    <div *ngIf="employeeSkills().length && employeeSkills().length > 2" class="h-132">
                      <p-chart 
                        type="radar" 
                        [data]="radarChartData()" 
                        [options]="radarChartOptions()"
                        styleClass="w-full h-full">
                      </p-chart>
                    </div>
                    <div *ngIf="!employeeSkills().length || (employeeSkills().length && employeeSkills().length <= 2)" class="flex items-center justify-center h-96 text-surface-500">
                      <div class="text-center">
                        <i class="pi pi-chart-bar text-6xl mb-4 block opacity-30"></i>
                        <p>Add more skills to see radar chart</p>
                      </div>
                    </div>
                  </p-card>
                </div>
              </div>

              <!-- Skill Categories Overview -->
              <div *ngIf="employeeSkills().length" class="mt-6">
                <p-card header="Skills by Category">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div *ngFor="let category of getSkillCategories()" class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                      <div class="flex justify-between items-center mb-2">
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                          {{ category.name || 'Other' }}
                        </h6>
                        <p-badge [value]="category.count"></p-badge>
                      </div>
                      <p-progressBar 
                        [value]="category.averageLevel * 20" 
                        [showValue]="false">
                      </p-progressBar>
                      <div class="text-xs text-surface-600 dark:text-surface-300 mt-1">
                        Average Level: {{ category.averageLevel.toFixed(1) }}/5
                      </div>
                    </div>
                  </div>
                </p-card>
              </div>
            </p-tabpanel>

            <!-- Experience Tab -->
            <p-tabpanel value="experience" header="Work Experience" leftIcon="pi pi-briefcase">
              <p-card>
                <ng-template pTemplate="header">
                  <div class="flex justify-between items-center p-4">
                    <h3 class="text-xl font-semibold m-0">Work Experience ({{ employeeExperiences().length }})</h3>
                    <p-button 
                      *ngIf="canEdit()"
                      label="Add Experience"
                      icon="pi pi-plus"
                      size="small"
                      (click)="showAddExperienceDialog = true">
                    </p-button>
                  </div>
                </ng-template>

                <!-- Experience Loading -->
                <div *ngIf="experienceLoading()" class="text-center py-8">
                  <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                  <p class="text-surface-600 dark:text-surface-300 mt-2">Loading experience...</p>
                </div>

                <!-- Experience List -->
                <div *ngIf="!experienceLoading() && employeeExperiences().length" class="space-y-4">
                  <div *ngFor="let exp of employeeExperiences()" 
                       class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1">
                        <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                          {{ exp.jobTitle }}
                        </h5>
                        <p class="text-primary font-medium m-0 mb-1">{{ exp.company }}</p>
                        <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                          {{ exp.startDate | date:'MMM yyyy' }} - 
                          {{ exp.endDate ? (exp.endDate | date:'MMM yyyy') : 'Present' }}
                        </p>
                      </div>
                      <div class="flex gap-1" *ngIf="canEdit()">
                        <p-button 
                          icon="pi pi-pencil"
                          size="small"
                          severity="secondary"
                          [text]="true"
                          (click)="editExperience(exp)"
                          pTooltip="Edit Experience">
                        </p-button>
                        <p-button 
                          icon="pi pi-trash"
                          size="small"
                          severity="danger"
                          [text]="true"
                          (click)="deleteExperience(exp)"
                          pTooltip="Delete Experience">
                        </p-button>
                      </div>
                    </div>
                    
                    <div *ngIf="exp.description" class="text-sm text-surface-700 dark:text-surface-200">
                      {{ exp.description }}
                    </div>
                  </div>
                </div>

                <!-- No Experience -->
                <div *ngIf="!experienceLoading() && !employeeExperiences().length" class="text-center py-8">
                  <i class="pi pi-briefcase text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
                  <p class="text-surface-500 dark:text-surface-400 mb-3">No work experience recorded yet</p>
                  <p-button 
                    *ngIf="canEdit()"
                    label="Add First Experience"
                    icon="pi pi-plus"
                    (click)="showAddExperienceDialog = true">
                  </p-button>
                </div>
              </p-card>
            </p-tabpanel>

            <!-- Education Tab -->
            <p-tabpanel value="education" header="Education" leftIcon="pi pi-book">
              <p-card>
                <ng-template pTemplate="header">
                  <div class="flex justify-between items-center p-4">
                    <h3 class="text-xl font-semibold m-0">Education ({{ employeeEducations().length }})</h3>
                    <p-button 
                      *ngIf="canEdit()"
                      label="Add Education"
                      icon="pi pi-plus"
                      size="small"
                      (click)="showAddEducationDialog = true">
                    </p-button>
                  </div>
                </ng-template>

                <!-- Education Loading -->
                <div *ngIf="educationLoading()" class="text-center py-8">
                  <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                  <p class="text-surface-600 dark:text-surface-300 mt-2">Loading education...</p>
                </div>

                <!-- Education List -->
                <div *ngIf="!educationLoading() && employeeEducations().length" class="space-y-4">
                  <div *ngFor="let edu of employeeEducations()" 
                       class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1">
                        <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                          {{ edu.degree }}
                        </h5>
                        <p class="text-primary font-medium m-0 mb-1">{{ edu.institution }}</p>
                        <div class="flex gap-4 text-sm text-surface-600 dark:text-surface-300">
                          <span *ngIf="edu.fieldOfStudy">{{ edu.fieldOfStudy }}</span>
                          <span *ngIf="edu.graduationYear">Graduated: {{ edu.graduationYear }}</span>
                        </div>
                      </div>
                      <div class="flex gap-1" *ngIf="canEdit()">
                        <p-button 
                          icon="pi pi-pencil"
                          size="small"
                          severity="secondary"
                          [text]="true"
                          (click)="editEducation(edu)"
                          pTooltip="Edit Education">
                        </p-button>
                        <p-button 
                          icon="pi pi-trash"
                          size="small"
                          severity="danger"
                          [text]="true"
                          (click)="deleteEducation(edu)"
                          pTooltip="Delete Education">
                        </p-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- No Education -->
                <div *ngIf="!educationLoading() && !employeeEducations().length" class="text-center py-8">
                  <i class="pi pi-book text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
                  <p class="text-surface-500 dark:text-surface-400 mb-3">No education recorded yet</p>
                  <p-button 
                    *ngIf="canEdit()"
                    label="Add First Education"
                    icon="pi pi-plus"
                    (click)="showAddEducationDialog = true">
                  </p-button>
                </div>
              </p-card>
            </p-tabpanel>

            <!-- Performance Tab -->
            <p-tabpanel value="performance" header="Performance" leftIcon="pi pi-chart-line">
              <div class="space-y-4">
                <!-- Performance Loading -->
                <div *ngIf="performanceLoading()" class="text-center py-8">
                  <p-progressSpinner styleClass="w-2rem h-2rem"></p-progressSpinner>
                  <p class="text-surface-600 dark:text-surface-300 mt-2">Loading performance data...</p>
                </div>

                <!-- Performance Overview -->
                <div *ngIf="!performanceLoading() && performanceAnalytics()">
                  <p-card header="Performance Overview">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-primary">
                          {{ performanceAnalytics()?.totalReviews }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Total Reviews
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-primary">
                          {{ performanceAnalytics()?.averageRating | number:'1.1-1' }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Average Rating
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold text-primary">
                          {{ performanceAnalytics()?.latestRating | number:'1.1-1' }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Latest Rating
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl font-bold" 
                             [ngClass]="{
                               'text-green-500': performanceAnalytics()?.ratingTrend === 'Improving',
                               'text-yellow-500': performanceAnalytics()?.ratingTrend === 'Stable',
                               'text-red-500': performanceAnalytics()?.ratingTrend === 'Declining'
                             }">
                          {{ performanceAnalytics()?.ratingTrend }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-300">
                          Trend
                        </div>
                      </div>
                    </div>

                    <!-- Performance Progress -->
                    <div class="mb-4">
                      <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">Performance vs Department Average</span>
                        <span class="text-sm text-surface-600 dark:text-surface-300">
                          {{ performanceAnalytics()?.departmentAverage | number:'1.1-1' }} dept avg
                        </span>
                      </div>
                      <p-progressBar 
                        [value]="(performanceAnalytics()!.averageRating / 5) * 100"
                        [showValue]="false">
                      </p-progressBar>
                    </div>
                  </p-card>

                  <!-- Performance History -->
                  <p-card header="Performance History" *ngIf="performanceAnalytics()?.performanceHistory?.length">
                    <p-timeline 
                      [value]="performanceAnalytics()!.performanceHistory"
                      layout="vertical"
                      align="alternate">
                      <ng-template pTemplate="content" let-item>
                        <p-card styleClass="shadow-sm">
                          <div class="flex justify-between items-start mb-2">
                            <div>
                              <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                                {{ item.reviewPeriodStart | date:'MMM yyyy' }} - 
                                {{ item.reviewPeriodEnd | date:'MMM yyyy' }}
                              </h6>
                              <p-tag 
                                [value]="item.status" 
                                [severity]="getStatusSeverity(item.status)">
                              </p-tag>
                            </div>
                            <div class="text-right">
                              <p-rating 
                                [ngModel]="item.rating"
                                [readonly]="true"
                                [stars]="5">
                              </p-rating>
                              <div class="text-sm text-surface-600 dark:text-surface-300">
                                {{ item.rating }}/5
                              </div>
                            </div>
                          </div>
                        </p-card>
                      </ng-template>
                    </p-timeline>
                  </p-card>

                  <!-- Performance Insights -->
                  <p-card header="Performance Insights" *ngIf="performanceInsights()">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Key Strengths -->
                      <div>
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Key Strengths</h6>
                        <div class="space-y-1">
                          <p-chip 
                            *ngFor="let strength of performanceInsights()?.keyStrengths"
                            [label]="strength"
                            styleClass="mr-1 mb-1">
                          </p-chip>
                        </div>
                      </div>

                      <!-- Development Areas -->
                      <div>
                        <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Development Areas</h6>
                        <div class="space-y-1">
                          <p-chip 
                            *ngFor="let area of performanceInsights()?.developmentAreas"
                            [label]="area"
                            styleClass="mr-1 mb-1"
                            [removable]="false">
                          </p-chip>
                        </div>
                      </div>
                    </div>

                    <div class="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Career Trajectory</h6>
                      <p class="text-surface-700 dark:text-surface-200 m-0">
                        {{ performanceInsights()?.careerTrajectory }}
                      </p>
                    </div>

                    <div *ngIf="performanceInsights()?.insights?.length" class="mt-4">
                      <h6 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Insights</h6>
                      <ul class="list-disc list-inside space-y-1 text-surface-600 dark:text-surface-300">
                        <li *ngFor="let insight of performanceInsights()?.insights">{{ insight }}</li>
                      </ul>
                    </div>
                  </p-card>
                </div>

                <!-- No Performance Data -->
                <div *ngIf="!performanceLoading() && !performanceAnalytics()" class="text-center py-8">
                  <i class="pi pi-chart-line text-4xl text-surface-300 dark:text-surface-600 mb-3 block"></i>
                  <p class="text-surface-500 dark:text-surface-400">No performance data available</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Career Intelligence Tab -->
            <p-tabpanel value="career" header="Career Intelligence" leftIcon="pi pi-lightbulb">
              <!-- Career Intelligence Loading -->
              <div *ngIf="careerLoading()" class="text-center py-8">
                <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
                <p class="text-surface-600 dark:text-surface-300 mt-2">Loading career insights...</p>
              </div>

              <!-- Career Intelligence Content -->
              <div *ngIf="!careerLoading() && careerIntelligence()" class="space-y-6">
                <!-- Career Opportunities -->
                <p-card *ngIf="careerIntelligence()?.careerOpportunities?.length" header="Career Opportunities">
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div *ngFor="let opportunity of careerIntelligence()?.careerOpportunities"
                         class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:shadow-md transition-shadow">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0 mb-1">
                            {{ opportunity.title }}
                          </h5>
                          <p class="text-sm text-surface-600 dark:text-surface-300 m-0">
                            {{ opportunity.department }}
                          </p>
                        </div>
                        <div class="text-right">
                          <div class="text-sm font-semibold text-primary mb-1">
                            {{ opportunity.matchScore }}% match
                          </div>
                          <p-tag 
                            [value]="opportunity.priority" 
                            [severity]="getPrioritySeverity(opportunity.priority)">
                          </p-tag>
                        </div>
                      </div>
                      <p class="text-sm text-surface-700 dark:text-surface-200 mb-3">
                        {{ opportunity.description }}
                      </p>
                      <div class="text-xs text-surface-500 dark:text-surface-400">
                        <strong>Recommended Action:</strong> {{ opportunity.recommendedAction }}
                      </div>
                    </div>
                  </div>
                </p-card>

                <!-- Skill Development Recommendations -->
                <p-card *ngIf="careerIntelligence()?.skillDevelopmentRecommendations?.length" header="Skill Development Recommendations">
                  <div class="space-y-4">
                    <div *ngFor="let skillRec of careerIntelligence()?.skillDevelopmentRecommendations"
                         class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <h6 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                            {{ skillRec.skill.name }}
                          </h6>
                          <p-tag 
                            *ngIf="skillRec.skill.category" 
                            [value]="skillRec.skill.category" 
                            severity="secondary"
                            styleClass="text-xs mt-1">
                          </p-tag>
                        </div>
                        <p-tag 
                          [value]="skillRec.priority" 
                          [severity]="getPrioritySeverity(skillRec.priority)">
                        </p-tag>
                      </div>
                      
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-4">
                          <div class="text-center">
                            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Current</div>
                            <p-rating 
                              [ngModel]="skillRec.currentLevel"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                          </div>
                          <i class="pi pi-arrow-right text-surface-400"></i>
                          <div class="text-center">
                            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Target</div>
                            <p-rating 
                              [ngModel]="skillRec.recommendedLevel"
                              [readonly]="true"
                              [stars]="5">
                            </p-rating>
                          </div>
                        </div>
                        <div class="text-center">
                          <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">Gap</div>
                          <p-badge [value]="skillRec.gap" severity="warn"></p-badge>
                        </div>
                      </div>

                      <p class="text-sm text-surface-600 dark:text-surface-300 mb-3">
                        <strong>Reason:</strong> {{ skillRec.reason }}
                      </p>

                      <div *ngIf="skillRec.suggestedActions?.length">
                        <h6 class="text-xs font-semibold text-surface-700 dark:text-surface-200 mb-2">Suggested Actions:</h6>
                        <div class="flex flex-wrap gap-1">
                          <p-chip 
                            *ngFor="let action of skillRec.suggestedActions"
                            [label]="action"
                            styleClass="text-xs">
                          </p-chip>
                        </div>
                      </div>
                    </div>
                  </div>
                </p-card>

                <!-- Smart Insights -->
                <p-card *ngIf="careerIntelligence()?.smartInsights?.length" header="Smart Insights">
                  <div class="space-y-3">
                    <div *ngFor="let insight of careerIntelligence()?.smartInsights"
                         class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <i class="pi pi-lightbulb text-blue-500 mt-0.5"></i>
                      <span class="text-sm text-surface-700 dark:text-surface-200">{{ insight }}</span>
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- No Career Intelligence -->
              <div *ngIf="!careerLoading() && !careerIntelligence()" class="text-center py-12">
                <i class="pi pi-lightbulb text-6xl text-surface-300 dark:text-surface-600 mb-4 block"></i>
                <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
                  Career Intelligence Coming Soon
                </h3>
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  We're analyzing your profile to provide personalized career insights
                </p>
                <p-button 
                  label="Request Analysis" 
                  icon="pi pi-refresh"
                  severity="secondary"
                  [outlined]="true"
                  (click)="loadCareerIntelligence()">
                </p-button>
              </div>
            </p-tabpanel>

            <!-- Development Timeline Tab -->
            <p-tabpanel value="timeline" header="Development Timeline" leftIcon="pi pi-history">
              <p-card header="Your Professional Journey">
                <p-timeline 
                  [value]="getTimelineEvents()" 
                  layout="vertical">
                  <ng-template pTemplate="marker" let-event>
                    <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm" 
                          [ngClass]="getTimelineMarkerClass(event.type)">
                      <i [class]="event.icon"></i>
                    </span>
                  </ng-template>
                  <ng-template pTemplate="content" let-event>
                    <p-card>
                      <ng-template pTemplate="header">
                        <div class="flex justify-between items-center">
                          <h5 class="font-semibold text-surface-900 dark:text-surface-0 m-0">
                            {{ event.title }}
                          </h5>
                          <small class="text-surface-500 dark:text-surface-400">
                            {{ event.date | date:'mediumDate' }}
                          </small>
                        </div>
                      </ng-template>
                      <p class="text-surface-600 dark:text-surface-300 m-0">
                        {{ event.description }}
                      </p>
                      <p-tag 
                        *ngIf="event.category"
                        [value]="event.category" 
                        [severity]="getEventSeverity(event.type)"
                        styleClass="mt-2">
                      </p-tag>
                    </p-card>
                  </ng-template>
                </p-timeline>
              </p-card>
            </p-tabpanel>
          </p-tabs>
        </p-fluid>
      </div>

      <!-- Add Skill Dialog -->
      <p-dialog 
        header="Add New Skill" 
        [(visible)]="showAddSkillDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Skill *
            </label>
            <p-select
              [(ngModel)]="newSkill.skillId"
              [options]="availableSkills()"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a skill"
              [filter]="true"
              filterBy="name"
              styleClass="w-full">
            </p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Proficiency Level *
            </label>
            <div class="flex items-center gap-3">
              <p-rating 
                [(ngModel)]="newSkill.proficiencyLevel"
                [stars]="5">
              </p-rating>
              <span class="text-sm text-surface-600 dark:text-surface-300">
                {{ getProficiencyLabel(newSkill.proficiencyLevel) }}
              </span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Acquired Date (Optional)
            </label>
            <p-datepicker
              [(ngModel)]="newSkill.acquiredDate"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              styleClass="w-full">
            </p-datepicker>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Notes (Optional)
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="newSkill.notes"
              rows="3"
              class="w-full"
              placeholder="Add any notes about this skill...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelAddSkill()">
          </p-button>
          <p-button 
            label="Add Skill" 
            (click)="addSkill()"
            [disabled]="!newSkill.skillId || !newSkill.proficiencyLevel"
            [loading]="isAddingSkill()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Edit Skill Dialog -->
      <p-dialog 
        header="Edit Skill" 
        [(visible)]="showEditSkillDialog" 
        [modal]="true"
        styleClass="w-full max-w-md">
        <div class="space-y-4" *ngIf="editingSkill">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Skill
            </label>
            <input 
              pInputText 
              [value]="editingSkill.skill.name"
              disabled
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Proficiency Level
            </label>
            <div class="flex items-center gap-3">
              <p-rating 
                [(ngModel)]="editingSkill.proficiencyLevel"
                [stars]="5">
              </p-rating>
              <span class="text-sm text-surface-600 dark:text-surface-300">
                {{ getProficiencyLabel(editingSkill.proficiencyLevel) }}
              </span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Acquired Date (Optional)
            </label>
            <p-datepicker
              [(ngModel)]="editingSkill.acquiredDate"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              styleClass="w-full">
            </p-datepicker>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Notes (Optional)
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="editingSkill.notes"
              rows="3"
              class="w-full"
              placeholder="Add any notes about this skill...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelEditSkill()">
          </p-button>
          <p-button 
            label="Update Skill" 
            (click)="updateSkill()"
            [loading]="isUpdatingSkill()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Add Experience Dialog -->
      <p-dialog 
        header="Add Work Experience" 
        [(visible)]="showAddExperienceDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Job Title *
            </label>
            <input 
              pInputText 
              [(ngModel)]="newExperience.jobTitle"
              class="w-full"
              placeholder="e.g. Senior Software Developer">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Company *
            </label>
            <input 
              pInputText 
              [(ngModel)]="newExperience.company"
              class="w-full"
              placeholder="e.g. Tech Corp Inc.">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Start Date *
              </label>
              <p-datepicker
                [(ngModel)]="newExperience.startDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                styleClass="w-full">
              </p-datepicker>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                End Date
              </label>
              <p-datepicker
                [(ngModel)]="newExperience.endDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                [showClear]="true"
                placeholder="Leave empty if current"
                styleClass="w-full">
              </p-datepicker>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Description
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="newExperience.description"
              rows="4"
              class="w-full"
              placeholder="Describe your role and responsibilities...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelAddExperience()">
          </p-button>
          <p-button 
            label="Add Experience" 
            (click)="addExperience()"
            [disabled]="!newExperience.jobTitle || !newExperience.company || !newExperience.startDate"
            [loading]="isAddingExperience()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Edit Experience Dialog -->
      <p-dialog 
        header="Edit Work Experience" 
        [(visible)]="showEditExperienceDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div class="space-y-4" *ngIf="editingExperience">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Job Title *
            </label>
            <input 
              pInputText 
              [(ngModel)]="editingExperience.jobTitle"
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Company *
            </label>
            <input 
              pInputText 
              [(ngModel)]="editingExperience.company"
              class="w-full">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Start Date *
              </label>
              <p-datepicker
                [(ngModel)]="editingExperience.startDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                styleClass="w-full">
              </p-datepicker>
            </div>
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                End Date
              </label>
              <p-datepicker
                [(ngModel)]="editingExperience.endDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                [showClear]="true"
                placeholder="Leave empty if current"
                styleClass="w-full">
              </p-datepicker>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Description
            </label>
            <textarea 
              pTextarea 
              [(ngModel)]="editingExperience.description"
              rows="4"
              class="w-full"
              placeholder="Describe your role and responsibilities...">
            </textarea>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelEditExperience()">
          </p-button>
          <p-button 
            label="Update Experience" 
            (click)="updateExperience()"
            [loading]="isUpdatingExperience()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Add Education Dialog -->
      <p-dialog 
        header="Add Education" 
        [(visible)]="showAddEducationDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Degree *
            </label>
            <input 
              pInputText 
              [(ngModel)]="newEducation.degree"
              class="w-full"
              placeholder="e.g. Bachelor of Science">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Institution *
            </label>
            <input 
              pInputText 
              [(ngModel)]="newEducation.institution"
              class="w-full"
              placeholder="e.g. University of Technology">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Field of Study
            </label>
            <input 
              pInputText 
              [(ngModel)]="newEducation.fieldOfStudy"
              class="w-full"
              placeholder="e.g. Computer Science">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Graduation Year
            </label>
            <p-inputNumber 
              [(ngModel)]="newEducation.graduationYear"
              [useGrouping]="false"
              [min]="1950"
              [max]="2030"
              styleClass="w-full">
            </p-inputNumber>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelAddEducation()">
          </p-button>
          <p-button 
            label="Add Education" 
            (click)="addEducation()"
            [disabled]="!newEducation.degree || !newEducation.institution"
            [loading]="isAddingEducation()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Edit Education Dialog -->
      <p-dialog 
        header="Edit Education" 
        [(visible)]="showEditEducationDialog" 
        [modal]="true"
        styleClass="w-full max-w-lg">
        <div class="space-y-4" *ngIf="editingEducation">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Degree *
            </label>
            <input 
              pInputText 
              [(ngModel)]="editingEducation.degree"
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Institution *
            </label>
            <input 
              pInputText 
              [(ngModel)]="editingEducation.institution"
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Field of Study
            </label>
            <input 
              pInputText 
              [(ngModel)]="editingEducation.fieldOfStudy"
              class="w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Graduation Year
            </label>
            <p-inputNumber 
              [(ngModel)]="editingEducation.graduationYear"
              [useGrouping]="false"
              [min]="1950"
              [max]="2030"
              styleClass="w-full">
            </p-inputNumber>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            severity="secondary" 
            [outlined]="true"
            (click)="cancelEditEducation()">
          </p-button>
          <p-button 
            label="Update Education" 
            (click)="updateEducation()"
            [loading]="isUpdatingEducation()">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class EmployeeDetail implements OnInit {
  private employeeId: number = 0;

  // Signals for reactive state management
  profile = signal<Employee | null>(null);
  employeeSkills = signal<EmployeeSkill[]>([]);
  employeeExperiences = signal<EmployeeExperience[]>([]);
  employeeEducations = signal<EmployeeEducation[]>([]);
  availableSkills = signal<Skill[]>([]);
  careerIntelligence = signal<CareerIntelligenceReport | null>(null);
  performanceAnalytics = signal<PerformanceAnalyticsDto | null>(null);
  performanceInsights = signal<CareerPerformanceInsight | null>(null);

  // Loading states
  isLoading = signal<boolean>(false);
  skillsLoading = signal<boolean>(false);
  experienceLoading = signal<boolean>(false);
  educationLoading = signal<boolean>(false);
  careerLoading = signal<boolean>(false);
  performanceLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Edit states
  isEditingProfile = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isAddingSkill = signal<boolean>(false);
  isUpdatingSkill = signal<boolean>(false);
  isAddingExperience = signal<boolean>(false);
  isUpdatingExperience = signal<boolean>(false);
  isAddingEducation = signal<boolean>(false);
  isUpdatingEducation = signal<boolean>(false);

  // Dialog states
  showAddSkillDialog = false;
  showEditSkillDialog = false;
  showAddExperienceDialog = false;
  showEditExperienceDialog = false;
  showAddEducationDialog = false;
  showEditEducationDialog = false;

  // Chart data
  radarChartData = signal<any>(null);
  radarChartOptions = signal<any>({});

  // Edit forms
  editForm: {
    firstName: string;
    lastName: string;
    phone?: string;
    salary?: number;
    hireDate: Date;
  } = {
    firstName: '',
    lastName: '',
    hireDate: new Date()
  };

  newSkill: AddEmployeeSkill = {
    employeeId: 0,
    skillId: 0,
    proficiencyLevel: 1
  };

  editingSkill: EmployeeSkill | null = null;

  newExperience: CreateExperienceDto = {
    jobTitle: '',
    company: '',
    startDate: new Date(),
    endDate: undefined,
    description: ''
  };

  editingExperience: EmployeeExperience | null = null;

  newEducation: CreateEducationDto = {
    degree: '',
    institution: '',
    graduationYear: undefined,
    fieldOfStudy: ''
  };

  editingEducation: EmployeeEducation | null = null;

  constructor(
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private skillsService: SkillsService,
    private intelligenceService: IntelligenceService,
    private performanceService: PerformanceReviewService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initChartOptions();
  }

  ngOnInit() {
    // Get employee ID from route parameter
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.employeeId = parseInt(id, 10);
        this.loadData();
        this.loadAvailableSkills();
      } else {
        this.employeeService.getMyProfile().subscribe(profile => {
          if (profile) {
            this.employeeId = profile.id;
            this.loadData();
            this.loadAvailableSkills();
          }
          else {
            this.errorMessage.set('Invalid employee ID');
          }
        });
      }
    });
  }

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (employee) => {
        this.profile.set(employee);
        this.resetEditForm();
        this.loadEmployeeSkills();
        this.loadEmployeeExperiences();
        this.loadEmployeeEducations();
        this.loadCareerIntelligence();
        this.loadPerformanceData();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load employee profile. Please try again.');
        this.isLoading.set(false);
        console.error('Error loading employee profile:', error);
      }
    });
  }

  loadEmployeeSkills() {
    if (!this.employeeId) return;

    this.skillsLoading.set(true);
    this.skillsService.getEmployeeSkills(this.employeeId).subscribe({
      next: (skills) => {
        this.employeeSkills.set(skills);
        this.updateRadarChart();
        this.skillsLoading.set(false);
      },
      error: (error) => {
        this.skillsLoading.set(false);
        console.error('Error loading skills:', error);
      }
    });
  }

  loadEmployeeExperiences() {
    if (!this.employeeId) return;

    this.experienceLoading.set(true);
    this.employeeService.getEmployeeExperiences(this.employeeId).subscribe({
      next: (experiences) => {
        this.employeeExperiences.set(experiences);
        this.experienceLoading.set(false);
      },
      error: (error) => {
        this.experienceLoading.set(false);
        console.error('Error loading experiences:', error);
      }
    });
  }

  loadEmployeeEducations() {
    if (!this.employeeId) return;

    this.educationLoading.set(true);
    this.employeeService.getEmployeeEducations(this.employeeId).subscribe({
      next: (educations) => {
        this.employeeEducations.set(educations);
        this.educationLoading.set(false);
      },
      error: (error) => {
        this.educationLoading.set(false);
        console.error('Error loading educations:', error);
      }
    });
  }

  loadAvailableSkills() {
    this.skillsService.getAllSkills().subscribe({
      next: (skills) => {
        this.availableSkills.set(skills);
      },
      error: (error) => {
        console.error('Error loading available skills:', error);
      }
    });
  }

  loadCareerIntelligence() {
    this.careerLoading.set(true);
    this.intelligenceService.getEmployeeCareerIntelligence(this.employeeId).subscribe({
      next: (intelligence) => {
        this.careerIntelligence.set(intelligence);
        this.careerLoading.set(false);
      },
      error: (error) => {
        this.careerLoading.set(false);
        console.error('Error loading career intelligence:', error);
      }
    });

    // Load performance insights
    this.intelligenceService.getPerformanceInsights(this.employeeId).subscribe({
      next: (insights) => {
        this.performanceInsights.set(insights);
      },
      error: (error) => {
        console.error('Error loading performance insights:', error);
      }
    });
  }

  loadPerformanceData() {
    this.performanceLoading.set(true);
    this.performanceService.getPerformanceAnalytics(this.employeeId).subscribe({
      next: (analytics) => {
        this.performanceAnalytics.set(analytics);
        this.performanceLoading.set(false);
      },
      error: (error) => {
        this.performanceLoading.set(false);
        console.error('Error loading performance:', error);
      }
    });
  }

  // Profile Management
  resetEditForm() {
    const profile = this.profile();
    if (profile) {
      this.editForm = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        salary: profile.salary,
        hireDate: new Date(profile.hireDate)
      };
    }
  }

  startEditing() {
    this.isEditingProfile.set(true);
  }

  cancelEditing() {
    this.resetEditForm();
    this.isEditingProfile.set(false);
  }

  saveProfile() {
    if (!this.employeeId) return;

    this.isSaving.set(true);
    const updateDto: UpdateEmployeeDto = {
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      phone: this.editForm.phone,
      salary: this.editForm.salary,
      hireDate: this.editForm.hireDate
    };

    this.employeeService.updateEmployee(this.employeeId, updateDto).subscribe({
      next: (updatedEmployee) => {
        this.profile.set(updatedEmployee);
        this.isEditingProfile.set(false);
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Profile updated successfully'
        });
      },
      error: (error) => {
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update profile'
        });
        console.error('Error updating profile:', error);
      }
    });
  }

  // Skills Management
  addSkill() {
    if (!this.employeeId || !this.newSkill.skillId) return;

    this.isAddingSkill.set(true);
    this.newSkill.employeeId = this.employeeId;

    this.skillsService.addEmployeeSkill(this.newSkill).subscribe({
      next: (skill) => {
        const currentSkills = this.employeeSkills();
        this.employeeSkills.set([...currentSkills, skill]);
        this.updateRadarChart();
        this.cancelAddSkill();
        this.isAddingSkill.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill added successfully'
        });
      },
      error: (error) => {
        this.isAddingSkill.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add skill'
        });
        console.error('Error adding skill:', error);
      }
    });
  }

  editSkill(skill: EmployeeSkill) {
    this.editingSkill = { ...skill };
    this.showEditSkillDialog = true;
  }

  updateSkill() {
    if (!this.editingSkill || !this.employeeId) return;

    this.isUpdatingSkill.set(true);
    const updateDto: UpdateEmployeeSkill = {
      proficiencyLevel: this.editingSkill.proficiencyLevel,
      acquiredDate: this.editingSkill.acquiredDate,
      notes: this.editingSkill.notes
    };

    this.skillsService.updateEmployeeSkill(
      this.employeeId,
      this.editingSkill.skillId,
      updateDto
    ).subscribe({
      next: (updatedSkill) => {
        const skills = [...this.employeeSkills()];
        const index = skills.findIndex(s => s.skillId === updatedSkill.skillId);
        if (index !== -1) {
          skills[index] = updatedSkill;
          this.employeeSkills.set(skills);
          this.updateRadarChart();
        }
        this.cancelEditSkill();
        this.isUpdatingSkill.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Skill updated successfully'
        });
      },
      error: (error) => {
        this.isUpdatingSkill.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update skill'
        });
        console.error('Error updating skill:', error);
      }
    });
  }

  deleteSkill(skill: EmployeeSkill) {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove the skill "${skill.skill.name}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!this.employeeId) return;

        this.skillsService.removeEmployeeSkill(this.employeeId, skill.skillId).subscribe({
          next: () => {
            const skills = this.employeeSkills();
            const updatedSkills = skills.filter(s => s.skillId !== skill.skillId);
            this.employeeSkills.set(updatedSkills);
            this.updateRadarChart();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Skill removed successfully'
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to remove skill'
            });
            console.error('Error removing skill:', error);
          }
        });
      }
    });
  }

  cancelAddSkill() {
    this.showAddSkillDialog = false;
    this.newSkill = {
      employeeId: 0,
      skillId: 0,
      proficiencyLevel: 1
    };
  }

  cancelEditSkill() {
    this.showEditSkillDialog = false;
    this.editingSkill = null;
  }

  // Experience Management
  addExperience() {
    if (!this.employeeId || !this.newExperience.jobTitle || !this.newExperience.company) return;

    this.isAddingExperience.set(true);

    this.employeeService.addEmployeeExperience(this.employeeId, this.newExperience).subscribe({
      next: (experience) => {
        const currentExperiences = this.employeeExperiences();
        this.employeeExperiences.set([...currentExperiences, experience]);
        this.cancelAddExperience();
        this.isAddingExperience.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Experience added successfully'
        });
      },
      error: (error) => {
        this.isAddingExperience.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add experience'
        });
        console.error('Error adding experience:', error);
      }
    });
  }

  editExperience(experience: EmployeeExperience) {
    this.editingExperience = { 
      ...experience,
      startDate: new Date(experience.startDate),
      endDate: experience.endDate ? new Date(experience.endDate) : undefined
    };
    this.showEditExperienceDialog = true;
  }

  updateExperience() {
    if (!this.editingExperience) return;

    this.isUpdatingExperience.set(true);
    const updateDto: UpdateExperienceDto = {
      jobTitle: this.editingExperience.jobTitle,
      company: this.editingExperience.company,
      startDate: this.editingExperience.startDate,
      endDate: this.editingExperience.endDate,
      description: this.editingExperience.description
    };

    this.employeeService.updateEmployeeExperience(this.editingExperience.id, updateDto).subscribe({
      next: (updatedExperience) => {
        const experiences = [...this.employeeExperiences()];
        const index = experiences.findIndex(e => e.id === updatedExperience.id);
        if (index !== -1) {
          experiences[index] = updatedExperience;
          this.employeeExperiences.set(experiences);
        }
        this.cancelEditExperience();
        this.isUpdatingExperience.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Experience updated successfully'
        });
      },
      error: (error) => {
        this.isUpdatingExperience.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update experience'
        });
        console.error('Error updating experience:', error);
      }
    });
  }

  deleteExperience(experience: EmployeeExperience) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the experience "${experience.jobTitle}" at ${experience.company}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.employeeService.deleteEmployeeExperience(experience.id).subscribe({
          next: () => {
            const experiences = this.employeeExperiences();
            const updatedExperiences = experiences.filter(e => e.id !== experience.id);
            this.employeeExperiences.set(updatedExperiences);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Experience deleted successfully'
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete experience'
            });
            console.error('Error deleting experience:', error);
          }
        });
      }
    });
  }

  cancelAddExperience() {
    this.showAddExperienceDialog = false;
    this.newExperience = {
      jobTitle: '',
      company: '',
      startDate: new Date(),
      endDate: undefined,
      description: ''
    };
  }

  cancelEditExperience() {
    this.showEditExperienceDialog = false;
    this.editingExperience = null;
  }

  // Education Management
  addEducation() {
    if (!this.employeeId || !this.newEducation.degree || !this.newEducation.institution) return;

    this.isAddingEducation.set(true);

    this.employeeService.addEmployeeEducation(this.employeeId, this.newEducation).subscribe({
      next: (education) => {
        const currentEducations = this.employeeEducations();
        this.employeeEducations.set([...currentEducations, education]);
        this.cancelAddEducation();
        this.isAddingEducation.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Education added successfully'
        });
      },
      error: (error) => {
        this.isAddingEducation.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add education'
        });
        console.error('Error adding education:', error);
      }
    });
  }

  editEducation(education: EmployeeEducation) {
    this.editingEducation = { ...education };
    this.showEditEducationDialog = true;
  }

  updateEducation() {
    if (!this.editingEducation) return;

    this.isUpdatingEducation.set(true);
    const updateDto: UpdateEducationDto = {
      degree: this.editingEducation.degree,
      institution: this.editingEducation.institution,
      graduationYear: this.editingEducation.graduationYear,
      fieldOfStudy: this.editingEducation.fieldOfStudy
    };

    this.employeeService.updateEmployeeEducation(this.editingEducation.id, updateDto).subscribe({
      next: (updatedEducation) => {
        const educations = [...this.employeeEducations()];
        const index = educations.findIndex(e => e.id === updatedEducation.id);
        if (index !== -1) {
          educations[index] = updatedEducation;
          this.employeeEducations.set(educations);
        }
        this.cancelEditEducation();
        this.isUpdatingEducation.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Education updated successfully'
        });
      },
      error: (error) => {
        this.isUpdatingEducation.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update education'
        });
        console.error('Error updating education:', error);
      }
    });
  }

  deleteEducation(education: EmployeeEducation) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the education "${education.degree}" from ${education.institution}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.employeeService.deleteEmployeeEducation(education.id).subscribe({
          next: () => {
            const educations = this.employeeEducations();
            const updatedEducations = educations.filter(e => e.id !== education.id);
            this.employeeEducations.set(updatedEducations);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Education deleted successfully'
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete education'
            });
            console.error('Error deleting education:', error);
          }
        });
      }
    });
  }

  cancelAddEducation() {
    this.showAddEducationDialog = false;
    this.newEducation = {
      degree: '',
      institution: '',
      graduationYear: undefined,
      fieldOfStudy: ''
    };
  }

  cancelEditEducation() {
    this.showEditEducationDialog = false;
    this.editingEducation = null;
  }

  // TrackBy functions for ngFor performance
  trackBySkillId(index: number, skill: EmployeeSkill): number {
    return skill.skillId;
  }

  trackByExperienceId(index: number, experience: EmployeeExperience): number {
    return experience.id;
  }

  trackByEducationId(index: number, education: EmployeeEducation): number {
    return education.id;
  }

  // Chart Management
  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.radarChartOptions.set({
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        r: {
          pointLabels: {
            color: textColor
          },
          grid: {
            color: surfaceBorder
          },
          min: 0,
          max: 5
        }
      }
    });
  }

  updateRadarChart() {
    const skills = this.employeeSkills();
    if (!skills.length) {
      this.radarChartData.set(null);
      return;
    }

    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500');
    const primaryColorTransparent = documentStyle.getPropertyValue('--p-primary-200');

    const labels = skills.map(skill => skill.skill.name);
    const data = skills.map(skill => skill.proficiencyLevel);

    this.radarChartData.set({
      labels: labels,
      datasets: [
        {
          label: 'Skills',
          data: data,
          fill: true,
          backgroundColor: primaryColorTransparent,
          borderColor: primaryColor,
          pointBackgroundColor: primaryColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: primaryColor
        }
      ]
    });
  }

  // Permission checks
  canEdit(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const profile = this.profile();
    
    if (!currentUser || !profile) return false;
    
    // User can edit their own profile, or HR/Admin can edit anyone
    return currentUser.id === profile.userId || 
           currentUser.role === 'HR' || 
           currentUser.role === 'Admin';
  }

  canManageSkills(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const profile = this.profile();
    
    if (!currentUser || !profile) return false;
    
    // User can manage their own skills, or HR/Admin can manage anyone's skills
    return currentUser.id === profile.userId || 
           currentUser.role === 'HR' || 
           currentUser.role === 'Admin';
  }

  canEditSalary(): boolean {
    const user = this.authService.getCurrentUser();
    return this.profile()?.userId != user?.id && (user?.role === 'HR' || user?.role === 'Admin');
  }

  // Utility methods
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (role) {
      case 'Admin': return 'danger';
      case 'HR': return 'warning';
      case 'Manager': return 'info';
      default: return 'secondary';
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (status) {
      case 'Approved': return 'success';
      case 'Completed': return 'info';
      case 'Draft': return 'warning';
      default: return 'secondary';
    }
  }

  getProficiencyLabel(level: number): string {
    const labels: { [key: number]: string } = {
      1: 'Beginner',
      2: 'Novice',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert'
    };
    return labels[level] || 'Unknown';
  }

  getYearsOfService(): string {
    const profile = this.profile();
    if (!profile) return '0';

    const hireDate = new Date(profile.hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));

    if (diffYears === 0) {
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
      return diffMonths < 1 ? 'Less than a month' : `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    }

    return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
  }

  getSkillCategories() {
    const skills = this.employeeSkills();
    const categories = new Map<string, { count: number; totalLevel: number }>();

    skills.forEach(skill => {
      const category = skill.skill.category || 'Other';
      if (categories.has(category)) {
        const current = categories.get(category)!;
        categories.set(category, {
          count: current.count + 1,
          totalLevel: current.totalLevel + skill.proficiencyLevel
        });
      } else {
        categories.set(category, {
          count: 1,
          totalLevel: skill.proficiencyLevel
        });
      }
    });

    return Array.from(categories.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      averageLevel: data.totalLevel / data.count
    }));
  }

  getTimelineEvents(): TimelineEvent[] {
    const profile = this.profile();
    const skills = this.employeeSkills();
    const experiences = this.employeeExperiences();
    const educations = this.employeeEducations();
    const events: TimelineEvent[] = [];

    if (profile) {
      // Add hire date
      events.push({
        title: 'Joined Company',
        description: `Started as ${profile.currentPosition?.title || 'Employee'} in ${profile.department.name}`,
        date: new Date(profile.hireDate),
        type: 'career',
        category: 'Milestone',
        icon: 'pi pi-briefcase'
      });
    }

    // Add experiences
    experiences.forEach(exp => {
      events.push({
        title: `${exp.jobTitle} at ${exp.company}`,
        description: exp.description || `Worked as ${exp.jobTitle}`,
        date: new Date(exp.startDate),
        type: 'experience',
        category: 'Experience',
        icon: 'pi pi-briefcase'
      });
    });

    // Add educations
    educations.forEach(edu => {
      if (edu.graduationYear) {
        events.push({
          title: `${edu.degree} - ${edu.institution}`,
          description: `${edu.fieldOfStudy ? `Field of Study: ${edu.fieldOfStudy}` : 'Completed degree program'}`,
          date: new Date(edu.graduationYear, 5, 1), // Assuming June graduation
          type: 'education',
          category: 'Education',
          icon: 'pi pi-graduation-cap'
        });
      }
    });

    // Add recent skills (last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    skills.forEach(skill => {
      if (skill.acquiredDate) {
        const acquiredDate = new Date(skill.acquiredDate);
        if (acquiredDate > twoYearsAgo) {
          events.push({
            title: `Acquired ${skill.skill.name}`,
            description: `Reached ${this.getProficiencyLabel(skill.proficiencyLevel)} level proficiency`,
            date: acquiredDate,
            type: 'skill',
            category: skill.skill.category || 'Skill Development',
            icon: 'pi pi-star'
          });
        }
      }
    });

    // Sort events by date (most recent first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getTimelineMarkerClass(type: TimelineEvent['type']): string {
    switch (type) {
      case 'career':
        return 'bg-blue-500';
      case 'experience':
        return 'bg-green-500';
      case 'education':
        return 'bg-purple-500';
      case 'skill':
        return 'bg-orange-500';
      case 'performance':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  getEventSeverity(type: TimelineEvent['type']): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (type) {
      case 'career':
        return 'info';
      case 'experience':
        return 'success';
      case 'education':
        return 'secondary';
      case 'skill':
        return 'warning';
      case 'performance':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}