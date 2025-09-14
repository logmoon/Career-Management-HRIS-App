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

// Services
import { EmployeeService, Employee, UpdateEmployeeDto } from '../service/employee.service';
import { SkillsService, EmployeeSkill, AddEmployeeSkill, UpdateEmployeeSkill, Skill } from '../service/skills.service';
import { IntelligenceService, CareerIntelligenceReport, SkillDevelopmentRecommendation, CareerOpportunity } from '../service/intelligence.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-profile',
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
    FluidModule
  ],
  providers: [MessageService],
  template: `
    <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
      <p-toast></p-toast>
      
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
          <span class="text-surface-600 dark:text-surface-300">Loading your profile...</span>
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
              <p-tab value="career">Career</p-tab>
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
                          [disabled]="!isEditingProfile()"
                          class="w-full">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Last Name
                        </label>
                        <input 
                          pInputText 
                          [(ngModel)]="editForm.lastName"
                          [disabled]="!isEditingProfile()"
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
                          [disabled]="!isEditingProfile()"
                          class="w-full">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Hire Date
                        </label>
                        <p-datepicker
                          [(ngModel)]="editForm.hireDate"
                          [disabled]="!isEditingProfile()"
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
                    <div class="flex gap-2">
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
                        <h3 class="text-xl font-semibold m-0">My Skills ({{ employeeSkills().length }})</h3>
                        <p-button 
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
                      <div *ngFor="let skill of employeeSkills()" 
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
                          <div class="flex gap-1">
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
                      <p class="text-surface-500 dark:text-surface-400 mb-3">No skills added yet</p>
                      <p-button 
                        label="Add Your First Skill"
                        icon="pi pi-plus"
                        (click)="showAddSkillDialog = true">
                      </p-button>
                    </div>
                  </p-card>
                </div>

                <!-- Skills Radar Chart -->
                <div>
                  <p-card header="Skills Overview">
                    <div *ngIf="employeeSkills().length" class="h-96">
                      <p-chart 
                        type="radar" 
                        [data]="radarChartData()" 
                        [options]="radarChartOptions()"
                        styleClass="w-full h-full">
                      </p-chart>
                    </div>
                    <div *ngIf="!employeeSkills().length" class="flex items-center justify-center h-96 text-surface-500">
                      <div class="text-center">
                        <i class="pi pi-chart-bar text-6xl mb-4 block opacity-30"></i>
                        <p>Add skills to see your radar chart</p>
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
                  layout="vertical"
                  align="alternate">
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
    </div>
  `,
})
export class Profile implements OnInit {
  // Signals for reactive state management
  profile = signal<Employee | null>(null);
  employeeSkills = signal<EmployeeSkill[]>([]);
  availableSkills = signal<Skill[]>([]);
  careerIntelligence = signal<CareerIntelligenceReport | null>(null);
  
  // Loading states
  isLoading = signal(false);
  skillsLoading = signal(false);
  careerLoading = signal(false);
  isSaving = signal(false);
  isAddingSkill = signal(false);
  isUpdatingSkill = signal(false);
  
  // Error handling
  errorMessage = signal('');
  
  // Edit mode
  isEditingProfile = signal(false);
  editForm: any = {};
  
  // Skill management
  showAddSkillDialog = false;
  showEditSkillDialog = false;
  newSkill: AddEmployeeSkill = {
    employeeId: 0,
    skillId: 0,
    proficiencyLevel: 1
  };
  editingSkill: EmployeeSkill | null = null;
  
  // Chart data
  radarChartData = signal<any>(null);
  radarChartOptions = signal<any>(null);

  constructor(
    private employeeService: EmployeeService,
    private skillsService: SkillsService,
    private intelligenceService: IntelligenceService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initChartOptions();
  }

  ngOnInit() {
    this.loadData();
    this.loadAvailableSkills();
  }

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Load profile
    this.employeeService.getMyProfile().subscribe({
      next: (employee) => {
        this.profile.set(employee);
        this.resetEditForm();
        this.loadEmployeeSkills();
        this.loadCareerIntelligence();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load profile. Please try again.');
        this.isLoading.set(false);
        console.error('Error loading profile:', error);
      }
    });
  }

  loadEmployeeSkills() {
    const profile = this.profile();
    if (!profile) return;

    this.skillsLoading.set(true);
    this.skillsService.getEmployeeSkills(profile.id).subscribe({
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
    this.intelligenceService.getMyCareerIntelligence().subscribe({
      next: (intelligence) => {
        this.careerIntelligence.set(intelligence);
        this.careerLoading.set(false);
      },
      error: (error) => {
        this.careerLoading.set(false);
        console.error('Error loading career intelligence:', error);
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
    const profile = this.profile();
    if (!profile) return;

    this.isSaving.set(true);
    const updateDto: UpdateEmployeeDto = {
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      phone: this.editForm.phone,
      salary: this.editForm.salary,
      hireDate: this.editForm.hireDate
    };

    this.employeeService.updateEmployee(profile.id, updateDto).subscribe({
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
    const profile = this.profile();
    if (!profile || !this.newSkill.skillId) return;

    this.isAddingSkill.set(true);
    this.newSkill.employeeId = profile.id;

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
    if (!this.editingSkill || !this.profile()) return;

    this.isUpdatingSkill.set(true);
    const updateDto: UpdateEmployeeSkill = {
      proficiencyLevel: this.editingSkill.proficiencyLevel,
      acquiredDate: this.editingSkill.acquiredDate,
      notes: this.editingSkill.notes
    };

    this.skillsService.updateEmployeeSkill(
      this.profile()!.id,
      this.editingSkill.skillId,
      updateDto
    ).subscribe({
      next: (updatedSkill) => {
        const skills = this.employeeSkills();
        const index = skills.findIndex(s => s.id === updatedSkill.id);
        if (index !== -1) {
          skills[index] = updatedSkill;
          this.employeeSkills.set([...skills]);
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
    const profile = this.profile();
    if (!profile) return;

    this.skillsService.removeEmployeeSkill(profile.id, skill.skillId).subscribe({
      next: () => {
        const skills = this.employeeSkills();
        this.employeeSkills.set(skills.filter(s => s.id !== skill.id));
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
          label: 'My Skills',
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

  // Utility Methods
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

  getTimelineEvents() {
    const profile = this.profile();
    const skills = this.employeeSkills();
    const events: any[] = [];

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

      // Add recent skills
      skills
        .filter(skill => skill.acquiredDate)
        .sort((a, b) => new Date(b.acquiredDate!).getTime() - new Date(a.acquiredDate!).getTime())
        .slice(0, 5)
        .forEach(skill => {
          events.push({
            title: `Acquired ${skill.skill.name}`,
            description: `Reached ${this.getProficiencyLabel(skill.proficiencyLevel)} level`,
            date: new Date(skill.acquiredDate!),
            type: 'skill',
            category: skill.skill.category || 'Skill',
            icon: 'pi pi-star'
          });
        });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getTimelineMarkerClass(type: string): string {
    switch (type) {
      case 'career': return 'bg-blue-500';
      case 'skill': return 'bg-green-500';
      case 'achievement': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }

  getEventSeverity(type: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    switch (type) {
      case 'career': return 'info';
      case 'skill': return 'success';
      case 'achievement': return 'warning';
      default: return 'secondary';
    }
  }

  canEditSalary(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'HR' || user?.role === 'Admin';
  }
}