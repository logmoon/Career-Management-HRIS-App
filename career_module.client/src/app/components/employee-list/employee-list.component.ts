// components/employees/employee-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { PositionService } from '../../services/position.service';
import { EmployeeDto, EmployeeFilters } from '../../models/base.models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees: EmployeeDto[] = [];
  departments: string[] = [];
  isLoading = true;
  searchTerm = '';
  
  private searchSubject = new Subject<string>();

  filters: EmployeeFilters = {
    page: 1,
    pageSize: 10,
    department: '',
    managerId: undefined
  };

  constructor(
    private employeeService: EmployeeService,
    private positionService: PositionService
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.filters.page = 1; // Reset to first page
      this.loadEmployees();
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees(this.filters).subscribe({
      next: (employees) => {
        // If we have a search term, filter locally (since API might not support search)
        if (this.searchTerm) {
          this.employees = employees.filter(emp => 
            this.getFullName(emp).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            emp.department.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        } else {
          this.employees = employees;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.isLoading = false;
      }
    });
  }

  loadDepartments(): void {
    this.positionService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  onSearchChange(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  applyFilters(): void {
    this.filters.page = 1; // Reset to first page when filters change
    this.loadEmployees();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      page: 1,
      pageSize: 10,
      department: '',
      managerId: undefined
    };
    this.loadEmployees();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.filters.department || this.filters.managerId);
  }

  previousPage(): void {
    if (this.filters.page! > 1) {
      this.filters.page!--;
      this.loadEmployees();
    }
  }

  nextPage(): void {
    if (this.employees.length >= (this.filters.pageSize || 10)) {
      this.filters.page!++;
      this.loadEmployees();
    }
  }

  deleteEmployee(employee: EmployeeDto): void {
    if (confirm(`Are you sure you want to delete ${this.getFullName(employee)}?`)) {
      this.employeeService.deleteEmployee(employee.id).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          alert('Failed to delete employee. Please try again.');
        }
      });
    }
  }

  getFullName(employee: EmployeeDto): string {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }

  getInitials(employee: EmployeeDto): string {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
  }

  getDepartmentColor(department: string): string {
    const colors: { [key: string]: string } = {
      'Engineering': 'bg-blue-100 text-blue-800',
      'Sales': 'bg-green-100 text-green-800',
      'Marketing': 'bg-purple-100 text-purple-800',
      'HR': 'bg-yellow-100 text-yellow-800',
      'Finance': 'bg-red-100 text-red-800',
      'Operations': 'bg-indigo-100 text-indigo-800'
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  }

  trackByEmployeeId(index: number, employee: EmployeeDto): number {
    return employee.id;
  }
}