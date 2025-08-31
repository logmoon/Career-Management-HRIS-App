import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkillService } from '../../services/skill.service';
import { AuthService } from '../../services/auth.service';
import { SkillDto, CreateSkillDto, CategoryStatsDto, SkillFilters } from '../../models/base.models';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.css']
})
export class SkillsComponent implements OnInit {
  skills: SkillDto[] = [];
  filteredSkills: SkillDto[] = [];
  categories: CategoryStatsDto[] = [];
  isLoading = true;
  showCreateModal = false;
  
  createSkillForm: FormGroup;
  
  // Pagination
  currentPage = 1;
  pageSize = 12; // 4x3 grid for skills
  totalSkills = 0;
  totalPages = 0;
  
  // Filters
  filters: SkillFilters = {
    page: 1,
    pageSize: 1000 // Load all, we'll do the filtering and pagination here on the client-side
  }
  selectedCategory = '';
  showActiveOnly = true;
  searchText = '';

  constructor(
    private formBuilder: FormBuilder,
    private skillService: SkillService,
    private authService: AuthService
  ) {
    this.createSkillForm = this.formBuilder.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadSkills();
    this.loadCategories();
  }

  private loadSkills(): void {
    this.isLoading = true;
    this.skillService.getSkills(this.filters).subscribe({
      next: (skills) => {
        this.skills = skills;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load skills:', error);
        this.isLoading = false;
      }
    });
  }

  private loadCategories(): void {
    this.skillService.getCategories().subscribe({
      next: (categories) => this.categories = categories,
      error: (error) => console.error('Failed to load categories:', error)
    });
  }

  applyFilters(): void {
    this.filteredSkills = this.skills.filter(skill => {
      const matchesCategory = !this.selectedCategory || skill.category === this.selectedCategory;
      const matchesActive = !this.showActiveOnly || skill.isActive;
      const matchesSearch = !this.searchText || 
        skill.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        skill.description?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        skill.category.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesCategory && matchesActive && matchesSearch;
    });

    this.totalSkills = this.skills.length;
    this.totalPages = Math.ceil(this.totalSkills / this.pageSize);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.showActiveOnly = true;
    this.searchText = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  get paginatedSkills(): SkillDto[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredSkills.slice(startIndex, endIndex);
  }

  openCreateModal(): void {
    this.resetCreateForm();
    this.showCreateModal = true;
  }

  createSkill(): void {
    if (!this.createSkillForm.valid) return;

    const formValue = this.createSkillForm.value;
    const createData: CreateSkillDto = {
      name: formValue.name,
      category: formValue.category,
      description: formValue.description || ''
    };

    this.skillService.createSkill(createData).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.resetCreateForm();
        this.loadSkills();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Failed to create skill:', error);
        alert('Failed to create skill. Please try again.');
      }
    });
  }

  deleteSkill(id: number): void {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    this.skillService.deleteSkill(id).subscribe({
      next: () => {
        this.loadSkills();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Failed to delete skill:', error);
        alert('Failed to delete skill. Please try again.');
      }
    });
  }

  private resetCreateForm(): void {
    this.createSkillForm.reset({
      name: '',
      category: '',
      description: ''
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

  canCreateSkill(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin']);
  }

  canDeleteSkill(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin']);
  }

  getCategoryColor(category: string): string {
    const colors = {
      'Technical': 'bg-blue-100 text-blue-800 border-blue-200',
      'Leadership': 'bg-purple-100 text-purple-800 border-purple-200',
      'Communication': 'bg-green-100 text-green-800 border-green-200',
      'Business': 'bg-orange-100 text-orange-800 border-orange-200',
      'Creative': 'bg-pink-100 text-pink-800 border-pink-200',
      'Analytical': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors['Other'];
  }

  getUsageStatsText(employeeCount: number, positionCount: number): string {
    const parts = [];
    if (employeeCount > 0) parts.push(`${employeeCount} employee${employeeCount !== 1 ? 's' : ''}`);
    if (positionCount > 0) parts.push(`${positionCount} position${positionCount !== 1 ? 's' : ''}`);
    return parts.join(', ') || 'Not used';
  }

  getSkillActivityClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getSkillActivityText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
}