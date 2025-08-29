import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { PositionService } from '../../services/position.service';
import { AuthService } from '../../services/auth.service';
import { CreateEmployeeDto, EmployeeDto, EmployeeFilters } from '../../models/base.models';
import { debounceTime, Subject, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})

export class EmployeesComponent implements OnInit {
  createEmployeeForm: FormGroup;

  employees: EmployeeDto[] = [];
  managers: EmployeeDto[] = [];
  departments: string[] = [];
  isLoading = false;
  searchTerm = '';
  showCreateModal = false;
  
  filters: EmployeeFilters = {
    page: 1,
    pageSize: 12
  };

  newEmployee: CreateEmployeeDto = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    hireDate: '',
  };

  private searchSubject = new Subject<string>();

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private positionService: PositionService,
    private authService: AuthService
  ) {
    this.createEmployeeForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      department: ['', Validators.required],
      hireDate: ['', Validators.required],
      salary: ['', [Validators.min(0)]],
      managerId: [null],
      currentPositionId: [null]
    });
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadInitialData();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(() => {
        this.filters.page = 1;
        return this.employeeService.getEmployees(this.filters)
          .pipe( catchError(() => of([])) );
        }
      )
    ).subscribe((employees) => {
      this.employees = employees;
      this.isLoading = false;
    });
  }
  private loadEmployees() {
    this.isLoading = true;
    this.employeeService.getEmployees(this.filters)
      .pipe( catchError(() => of([])) )
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.isLoading = false;
        }, error: () => {
          this.isLoading = false;
          this.employees = [];
        }
      }
    );
  }

  private loadInitialData(): void {
    this.loadEmployees();
    this.loadDepartments();
    this.loadManagers();
  }

  private loadDepartments(): void {
    this.positionService.getDepartments().subscribe({
      next: (departments) => this.departments = departments,
      error: () => this.departments = []
    });
  }

  private loadManagers(): void {
    this.employeeService.getEmployees({ pageSize: 1000 }).subscribe({
      next: (employees) => {
        this.managers = employees.filter(emp => 
          employees.some(e => e.managerId === emp.id)
        );
      },
      error: () => this.managers = []
    });
  }

  private resetNewEmployeeForm(): void {
    this.createEmployeeForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      hireDate: '',
      salary: '',
      managerId: null,
      currentPositionId: null
    });
  }

  openCreateModal(): void {
    this.resetNewEmployeeForm();
    this.showCreateModal = true;
  }

  addEmployee(): void {
    if (this.createEmployeeForm.valid) {
      const formValue = this.createEmployeeForm.value;
      
      // Convert empty strings to null for optional numeric fields
      const employeeData: CreateEmployeeDto = {
        ...formValue,
        managerId: formValue.managerId || null,
        currentPositionId: formValue.currentPositionId || null,
        salary: formValue.salary || undefined
      };

      this.employeeService.createEmployee(employeeData).subscribe({
        next: () => {
          this.showCreateModal = false;
          this.resetNewEmployeeForm();
          this.resetFilters();
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Failed to add employee:', error);
          alert('Failed to add employee. Please try again.');
        }
      });
    }
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadEmployees();
  }

  resetFilters(): void {
    this.filters = { page: 1, pageSize: 12 };
    this.searchTerm = '';
    this.loadEmployees();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.department || this.filters.managerId || this.searchTerm);
  }

  previousPage(): void {
    if ((this.filters.page ?? 1) > 1) {
      this.filters.page = (this.filters.page ?? 1) - 1;
      this.loadEmployees();
    }
  }

  nextPage(): void {
    this.filters.page = (this.filters.page ?? 1) + 1;
    this.loadEmployees();
  }

  editEmployee(employee: EmployeeDto, event: Event): void {
    event.stopPropagation();
    // Navigate to edit form - to be implemented
    console.log('Edit employee:', employee);
  }

  deleteEmployee(employee: EmployeeDto, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete ${this.getFullName(employee)}?`)) {
      this.employeeService.deleteEmployee(employee.id).subscribe({
        next: () => this.loadEmployees(),
        error: (error) => console.error('Delete failed:', error)
      });
    }
  }

  canCreateEmployee(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin']);
  }

  canManageEmployee(employee: EmployeeDto): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    return this.authService.hasAnyRole(['HR', 'Admin']) ||
           (this.authService.hasRole('Manager') && 
            currentUser.employee?.id === employee.managerId);
  }

  canViewSalary(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin']);
  }

  getFullName(employee: EmployeeDto): string {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatSalary(amount?: number): string {
    if (!amount) return 'N/A';
    return `$${amount.toLocaleString()}`;
  }
}