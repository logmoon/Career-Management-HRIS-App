import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PositionService } from '../../services/position.service';
import { AuthService } from '../../services/auth.service';
import { PositionDto, CreatePositionDto, PositionFilters } from '../../models/base.models';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.css']
})
export class PositionsComponent implements OnInit {
  positions: PositionDto[] = [];
  filteredPositions: PositionDto[] = [];
  departments: string[] = [];
  levels: string[] = [];
  isLoading = true;
  showCreateModal = false;
  
  createPositionForm: FormGroup;
  
  // Pagination
  currentPage = 1;
  pageSize = 9; // 3x3 grid
  totalPositions = 0;
  totalPages = 0;
  
  // Filters
  filters: PositionFilters = {
    page: 1,
    pageSize: 1000 // Load all, we'll do the filtering and pagination here on the client-side
  }
  selectedDepartment = '';
  selectedLevel = '';
  showKeyPositionsOnly = false;
  showActiveOnly = true;
  searchText = '';

  constructor(
    private formBuilder: FormBuilder,
    private positionService: PositionService,
    private authService: AuthService
  ) {
    this.createPositionForm = this.formBuilder.group({
      title: ['', Validators.required],
      department: ['', Validators.required],
      description: [''],
      level: ['', Validators.required],
      minSalary: [null, [Validators.min(0)]],
      maxSalary: [null, [Validators.min(0)]],
      minYearsExperience: [0, [Validators.required, Validators.min(0)]],
      isKeyPosition: [false]
    }, { validators: this.salaryRangeValidator });
  }

  // Custom validator to ensure minSalary < maxSalary
  private salaryRangeValidator(control: AbstractControl): ValidationErrors | null {
    const minSalary = control.get('minSalary')?.value;
    const maxSalary = control.get('maxSalary')?.value;

    if (minSalary != null && maxSalary != null && 
        typeof minSalary === 'number' && typeof maxSalary === 'number') {
      
      if (minSalary > maxSalary) {
        return { salaryRangeInvalid: true };
      }
    }

    return null;
  }

  ngOnInit(): void {
    this.loadPositions();
    this.loadDepartments();
    this.loadLevels();
  }

  private loadPositions(): void {
    this.isLoading = true;
    this.positionService.getPositions(this.filters).subscribe({
      next: (positions) => {
        this.positions = positions;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load positions:', error);
        this.isLoading = false;
      }
    });
  }

  private loadDepartments(): void {
    this.positionService.getDepartments().subscribe({
      next: (departments) => this.departments = departments,
      error: (error) => console.error('Failed to load departments:', error)
    });
  }

  private loadLevels(): void {
    this.positionService.getPositionLevels().subscribe({
      next: (levels) => this.levels = levels,
      error: (error) => console.error('Failed to load levels:', error)
    });
  }

  applyFilters(): void {
    this.filteredPositions = this.positions.filter(position => {
      const matchesDepartment = !this.selectedDepartment || position.department === this.selectedDepartment;
      const matchesLevel = !this.selectedLevel || position.level === this.selectedLevel;
      const matchesKeyPosition = !this.showKeyPositionsOnly || position.isKeyPosition;
      const matchesActive = !this.showActiveOnly || position.isActive;
      const matchesSearch = !this.searchText || 
        position.title?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        position.description?.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesDepartment && matchesLevel && matchesKeyPosition && matchesActive && matchesSearch;
    });

    this.totalPositions = this.positions.length;
    this.totalPages = Math.ceil(this.totalPositions / this.pageSize);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
  }

  clearFilters(): void {
    this.selectedDepartment = '';
    this.selectedLevel = '';
    this.showKeyPositionsOnly = false;
    this.showActiveOnly = true;
    this.searchText = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  get paginatedPositions(): PositionDto[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredPositions.slice(startIndex, endIndex);
  }

  openCreateModal(): void {
    this.resetCreateForm();
    this.showCreateModal = true;
  }

  createPosition(): void {
    if (!this.createPositionForm.valid) return;

    const formValue = this.createPositionForm.value;
    const createData: CreatePositionDto = {
      title: formValue.title,
      department: formValue.department,
      description: formValue.description || '',
      level: formValue.level,
      minSalary: formValue.minSalary || null,
      maxSalary: formValue.maxSalary || null,
      minYearsExperience: formValue.minYearsExperience,
      isKeyPosition: formValue.isKeyPosition
    };

    this.positionService.createPosition(createData).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.resetCreateForm();
        this.loadPositions();
      },
      error: (error) => {
        console.error('Failed to create position:', error);
        alert('Failed to create position. Please try again.');
      }
    });
  }

  deletePosition(id: number): void {
    if (!confirm('Are you sure you want to delete this position?')) return;

    this.positionService.deletePosition(id).subscribe({
      next: () => this.loadPositions(),
      error: (error) => {
        console.error('Failed to delete position:', error);
        alert('Failed to delete position. Please try again.');
      }
    });
  }

  private resetCreateForm(): void {
    this.createPositionForm.reset({
      title: '',
      department: '',
      description: '',
      level: '',
      minSalary: null,
      maxSalary: null,
      minYearsExperience: 0,
      isKeyPosition: false
    });
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

  get isSalaryRangeInvalid(): boolean {
    return this.createPositionForm.hasError('salaryRangeInvalid');
  }
  
  getSalaryRangeErrorMessage(): string {
    if (this.isSalaryRangeInvalid) {
      return 'Minimum salary must be less than maximum salary';
    }
    return '';
  }

  canCreatePosition(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin']);
  }

  canDeletePosition(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin']);
  }

  formatSalaryRange(minSalary?: number, maxSalary?: number): string {
    if (!minSalary && !maxSalary) return 'Not specified';
    if (minSalary && maxSalary) return `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
    if (minSalary) return `From $${minSalary.toLocaleString()}`;
    return `Up to $${maxSalary!.toLocaleString()}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  getPositionStatusClass(position: PositionDto): string {
    if (!position.isActive) return 'bg-red-100 text-red-800';
    if (position.isKeyPosition) return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  }

  getPositionStatusText(position: PositionDto): string {
    if (!position.isActive) return 'Inactive';
    if (position.isKeyPosition) return 'Key Position';
    return 'Active';
  }
}