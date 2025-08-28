/*
// employee-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { SkillService } from '../../services/skill.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeDetailDto, SkillDto, AddEmployeeSkillDto } from '../../models/base.models';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div *ngIf="employee" class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <span class="text-indigo-600 font-bold text-2xl">
              {{ employee.firstName.charAt(0) }}{{ employee.lastName.charAt(0) }}
            </span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ getFullName(employee) }}</h1>
            <p class="text-gray-600">{{ employee.currentPositionTitle || 'No position assigned' }}</p>
            <p class="text-sm text-gray-500">{{ employee.department }}</p>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button routerLink="/employees" 
                  class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Back to List
          </button>
          <button *ngIf="canEditEmployee()" 
                  (click)="toggleEditMode()"
                  [class]="isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'"
                  class="px-4 py-2 text-white rounded-lg transition-colors">
            {{ isEditing ? 'Save Changes' : 'Edit Profile' }}
          </button>
          <button *ngIf="canEditEmployee() && isEditing" 
                  (click)="cancelEdit()"
                  class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input *ngIf="isEditing" 
                   type="text" 
                   [(ngModel)]="editForm.firstName"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <p *ngIf="!isEditing" class="text-gray-900">{{ employee.firstName }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input *ngIf="isEditing" 
                   type="text" 
                   [(ngModel)]="editForm.lastName"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <p *ngIf="!isEditing" class="text-gray-900">{{ employee.lastName }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input *ngIf="isEditing" 
                   type="email" 
                   [(ngModel)]="editForm.email"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <p *ngIf="!isEditing" class="text-gray-900">{{ employee.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input *ngIf="isEditing" 
                   type="tel" 
                   [(ngModel)]="editForm.phone"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <p *ngIf="!isEditing" class="text-gray-900">{{ employee.phone || 'N/A' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input *ngIf="isEditing" 
                   type="text" 
                   [(ngModel)]="editForm.department"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <p *ngIf="!isEditing" class="text-gray-900">{{ employee.department || 'N/A' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
            <p class="text-gray-900">{{ formatDate(employee.hireDate) }}</p>
          </div>
          <div *ngIf="canViewSalary()">
            <label class="block text-sm font-medium text-gray-700 mb-1">Salary</label>
            <input *ngIf="isEditing" 
                   type="number" 
                   [(ngModel)]="editForm.salary"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <p *ngIf="!isEditing" class="text-gray-900">{{ formatSalary(employee.salary) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <p class="text-gray-900">{{ employee.managerName || 'No manager assigned' }}</p>
          </div>
        </div>
      </div>

      <!-- Skills Section -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Skills & Competencies</h2>
          <button *ngIf="canEditEmployee()" 
                  (click)="showAddSkillModal = true"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Add Skill
          </button>
        </div>

        <!-- Skills Grid -->
        <div *ngIf="employee.skills && employee.skills.length > 0" 
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let skill of employee.skills" 
               class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-gray-900">{{ skill.skillName }}</h3>
              <button *ngIf="canEditEmployee()" 
                      (click)="removeSkill(skill.skillId)"
                      class="text-red-500 hover:text-red-700 text-sm">
                Remove
              </button>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ skill.skillCategory }}</p>
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-sm text-gray-600">Proficiency:</span>
              <div class="flex space-x-1">
                <div *ngFor="let i of [1,2,3,4,5]" 
                     [class]="i <= skill.proficiencyLevel ? 'bg-indigo-500' : 'bg-gray-200'"
                     class="w-4 h-2 rounded-full">
                </div>
              </div>
              <span class="text-sm text-gray-600">({{ skill.proficiencyLevel }}/5)</span>
            </div>
            <div class="text-xs text-gray-500">
              <p>Acquired: {{ formatDate(skill.acquiredDate) }}</p>
              <p *ngIf="skill.lastAssessedDate">Last assessed: {{ formatDate(skill.lastAssessedDate) }}</p>
              <p *ngIf="skill.notes">Notes: {{ skill.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!employee.skills || employee.skills.length === 0" 
             class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.375m1.5-12H5.625m4.125 12H1.875m4.125-12v2.625a1.125 1.125 0 001.125 1.125h2.25a1.125 1.125 0 001.125-1.125V8.25"/>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No skills recorded</h3>
          <p class="mt-1 text-sm text-gray-500">Add skills to track this employee's competencies.</p>
        </div>
      </div>

      <!-- Direct Reports -->
      <div *ngIf="employee.directReports && employee.directReports.length > 0" 
           class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Direct Reports</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let report of employee.directReports"
               [routerLink]="['/employees', report.id]"
               class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span class="text-gray-600 font-medium text-sm">
                  {{ report.firstName.charAt(0) }}{{ report.lastName.charAt(0) }}
                </span>
              </div>
              <div>
                <h3 class="font-medium text-gray-900">{{ report.firstName }} {{ report.lastName }}</h3>
                <p class="text-sm text-gray-600">{{ report.department }}</p>
                <p class="text-xs text-gray-500">{{ report.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Career Goals -->
      <div *ngIf="employee.careerGoals && employee.careerGoals.length > 0" 
           class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Career Goals</h2>
        <div class="space-y-4">
          <div *ngFor="let goal of employee.careerGoals"
               class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-medium text-gray-900">{{ goal.goalDescription }}</h3>
              <span [class]="getGoalStatusClass(goal.status)"
                    class="px-2 py-1 text-xs rounded-full">
                {{ goal.status }}
              </span>
            </div>
            <p *ngIf="goal.targetPositionTitle" class="text-sm text-gray-600 mb-2">
              Target Position: {{ goal.targetPositionTitle }}
            </p>
            <div class="flex justify-between items-center text-sm text-gray-500">
              <span>Priority: {{ goal.priority }}</span>
              <span>Target Date: {{ formatDate(goal.targetDate) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Skill Modal -->
    <div *ngIf="showAddSkillModal" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         (click)="showAddSkillModal = false">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" (click)="$event.stopPropagation()">
        <h3 class="text-lg font-semibold mb-4">Add Skill</h3>
        <form (ngSubmit)="addSkill()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Skill</label>
            <select [(ngModel)]="newSkill.skillId" name="skillId" required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">Select a skill</option>
              <option *ngFor="let skill of availableSkills" [value]="skill.id">
                {{ skill.name }} ({{ skill.category }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
            <select [(ngModel)]="newSkill.proficiencyLevel" name="proficiencyLevel" required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="1">1 - Beginner</option>
              <option value="2">2 - Basic</option>
              <option value="3">3 - Intermediate</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Expert</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea [(ngModel)]="newSkill.notes" name="notes"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      rows="3">
            </textarea>
          </div>
          <div class="flex space-x-3">
            <button type="submit" 
                    [disabled]="!newSkill.skillId || !newSkill.proficiencyLevel"
                    class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Add Skill
            </button>
            <button type="button" (click)="showAddSkillModal = false"
                    class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600">Loading employee details...</span>
    </div>

    <!-- Error State -->
    <div *ngIf="!employee && !isLoading" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Employee not found</h3>
      <p class="mt-1 text-sm text-gray-500">The employee you're looking for doesn't exist or you don't have permission to view it.</p>
      <button routerLink="/employees" 
              class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Back to Employees
      </button>
    </div>
  `
})
export class EmployeeDetailComponent implements OnInit {
  employee: EmployeeDetailDto | null = null;
  availableSkills: SkillDto[] = [];
  isLoading = true;
  isEditing = false;
  showAddSkillModal = false;
  
  editForm: any = {};
  newSkill: AddEmployeeSkillDto = {
    skillId: 0,
    proficiencyLevel: 1,
    acquiredDate: new Date(),
    notes: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private skillService: SkillService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const employeeId = Number(this.route.snapshot.paramMap.get('id'));
    if (employeeId) {
      this.loadEmployeeDetails(employeeId);
      this.loadAvailableSkills();
    }
  }

  private loadEmployeeDetails(id: number): void {
    this.isLoading = true;
    this.employeeService.getEmployee(id).subscribe({
      next: (employee) => {
        this.employee = employee;
        this.initializeEditForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load employee:', error);
        this.employee = null;
        this.isLoading = false;
      }
    });
  }

  private loadAvailableSkills(): void {
    this.skillService.getSkills({ isActive: true, pageSize: 1000 }).subscribe({
      next: (skills) => this.availableSkills = skills,
      error: (error) => console.error('Failed to load skills:', error)
    });
  }

  private initializeEditForm(): void {
    if (this.employee) {
      this.editForm = {
        firstName: this.employee.firstName,
        lastName: this.employee.lastName,
        email: this.employee.email,
        phone: this.employee.phone,
        department: this.employee.department,
        salary: this.employee.salary
      };
    }
  }

  toggleEditMode(): void {
    if (this.isEditing) {
      this.saveChanges();
    } else {
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.initializeEditForm();
  }

  private saveChanges(): void {
    if (!this.employee) return;
    
    this.employeeService.updateEmployee(this.employee.id, this.editForm).subscribe({
      next: () => {
        this.isEditing = false;
        this.loadEmployeeDetails(this.employee!.id);
      },
      error: (error) => {
        console.error('Failed to update employee:', error);
        alert('Failed to save changes. Please try again.');
      }
    });
  }

  addSkill(): void {
    if (!this.employee || !this.newSkill.skillId || !this.newSkill.proficiencyLevel) return;

    this.newSkill.acquiredDate = new Date();
    this.employeeService.addEmployeeSkill(this.employee.id, this.newSkill).subscribe({
      next: () => {
        this.showAddSkillModal = false;
        this.resetNewSkill();
        this.loadEmployeeDetails(this.employee!.id);
      },
      error: (error) => {
        console.error('Failed to add skill:', error);
        alert('Failed to add skill. Please try again.');
      }
    });
  }

  removeSkill(skillId: number): void {
    if (!this.employee || !confirm('Are you sure you want to remove this skill?')) return;

    this.employeeService.removeEmployeeSkill(this.employee.id, skillId).subscribe({
      next: () => this.loadEmployeeDetails(this.employee!.id),
      error: (error) => {
        console.error('Failed to remove skill:', error);
        alert('Failed to remove skill. Please try again.');
      }
    });
  }

  private resetNewSkill(): void {
    this.newSkill = {
      skillId: 0,
      proficiencyLevel: 1,
      acquiredDate: new Date(),
      notes: ''
    };
  }

  canEditEmployee(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.employee) return false;
    
    return this.authService.hasAnyRole(['HR', 'Admin']) ||
           (this.authService.hasRole('Manager') && 
            currentUser.employee?.id === this.employee.managerId) ||
           (currentUser.employee?.id === this.employee.id);
  }

  canViewSalary(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.employee) return false;
    
    return this.authService.hasAnyRole(['HR', 'Admin']) ||
           (currentUser.employee?.id === this.employee.id);
  }

  getFullName(employee: EmployeeDetailDto): string {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatSalary(amount?: number): string {
    if (!amount) return 'N/A';
    return `${amount.toLocaleString()}`;
  }

  getGoalStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Active': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
*/