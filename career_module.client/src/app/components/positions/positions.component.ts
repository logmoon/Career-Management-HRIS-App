import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PositionService } from '../../services/position.service';
import { AuthService } from '../../services/auth.service';
import { PositionDto, CreatePositionDto } from '../../models/base.models';

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
  
  // Filters
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
    });
  }

  ngOnInit(): void {
    this.loadPositions();
    this.loadDepartments();
    this.loadLevels();
  }

  private loadPositions(): void {
    this.isLoading = true;
    this.positionService.getPositions({ pageSize: 1000 }).subscribe({
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
  }

  clearFilters(): void {
    this.selectedDepartment = '';
    this.selectedLevel = '';
    this.showKeyPositionsOnly = false;
    this.showActiveOnly = true;
    this.searchText = '';
    this.applyFilters();
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