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
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.css']
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