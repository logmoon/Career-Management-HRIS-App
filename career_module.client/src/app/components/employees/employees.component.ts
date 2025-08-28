// employees.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { PositionService } from '../../services/position.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeDto, EmployeeFilters } from '../../models/base.models';
import { debounceTime, Subject, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})

export class EmployeesComponent implements OnInit {
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

  private searchSubject = new Subject<string>();

  constructor(
    private employeeService: EmployeeService,
    private positionService: PositionService,
    private authService: AuthService
  ) {}

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