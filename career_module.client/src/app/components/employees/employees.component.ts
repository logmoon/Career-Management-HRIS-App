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
  filteredEmployees: EmployeeDto[] = [];
  managers: EmployeeDto[] = [];
  departments: string[] = [];
  isLoading = false;
  showCreateModal = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 9; // 3x3 grid
  totalEmployees = 0;
  totalPages = 0;
  
  // Filters
  filters: EmployeeFilters = {
    page: 1,
    pageSize: 1000 // Load all, we'll do the filtering and pagination here on the client-side
  }
  selectedDepartment = '';
  selectedManagerId = '';
  searchText = '';

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
      phone: ['', [Validators.required, Validators.min(0)]],
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
        this.applyFilters();
        return of(null);
      })
    ).subscribe();
  }

  private loadEmployees() {
    this.isLoading = true;
    this.employeeService.getEmployees(this.filters)
      .pipe( catchError(() => of([])) )
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.applyFilters();
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

  applyFilters(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesDepartment = !this.selectedDepartment || employee.department === this.selectedDepartment;
      const matchesManager = !this.selectedManagerId || employee.managerId?.toString() === this.selectedManagerId;
      const matchesSearch = !this.searchText || 
        employee.firstName?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        employee.lastName?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        employee.email?.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesDepartment && matchesManager && matchesSearch;
    });

    this.totalEmployees = this.filteredEmployees.length;
    this.totalPages = Math.ceil(this.totalEmployees / this.pageSize);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
  }

  clearFilters(): void {
    this.selectedDepartment = '';
    this.selectedManagerId = '';
    this.searchText = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  get paginatedEmployees(): EmployeeDto[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredEmployees.slice(startIndex, endIndex);
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
    this.searchSubject.next(this.searchText);
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

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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