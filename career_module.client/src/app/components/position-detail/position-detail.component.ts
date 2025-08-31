import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { PositionService } from '../../services/position.service';
import { SkillService } from '../../services/skill.service';
import { AuthService } from '../../services/auth.service';
import { 
  PositionDetailDto, 
  SkillDto, 
  AddPositionSkillDto, 
  CandidateMatchDto 
} from '../../models/base.models';

@Component({
  selector: 'app-position-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './position-detail.component.html',
  styleUrls: ['./position-detail.component.css']
})
export class PositionDetailComponent implements OnInit {
  position: PositionDetailDto | null = null;
  candidates: CandidateMatchDto[] = [];
  availableSkills: SkillDto[] = [];
  departments: string[] = [];
  levels: string[] = [];
  isLoading = true;
  isLoadingCandidates = false;
  isEditing = false;
  showAddSkillModal = false;
  
  editPositionForm: FormGroup;
  addSkillForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private positionService: PositionService,
    private skillService: SkillService,
    private authService: AuthService
  ) {
    this.editPositionForm = this.formBuilder.group({
      title: ['', Validators.required],
      department: ['', Validators.required],
      description: [''],
      level: ['', Validators.required],
      minSalary: [null, [Validators.min(0)]],
      maxSalary: [null, [Validators.min(0)]],
      minYearsExperience: [0, [Validators.required, Validators.min(0)]],
      isKeyPosition: [false],
      isActive: [true]
    }, { validators: this.salaryRangeValidator });

    this.addSkillForm = this.formBuilder.group({
      skillId: [null, Validators.required],
      requiredLevel: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      isMandatory: [true],
      weight: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  // Custom validator to ensure minSalary < maxSalary
  private salaryRangeValidator(control: AbstractControl): ValidationErrors | null {
    const minSalary = control.get('minSalary')?.value;
    const maxSalary = control.get('maxSalary')?.value;

    if (minSalary != null && maxSalary != null && 
        typeof minSalary === 'number' && typeof maxSalary === 'number') {
      
      // 
      if (minSalary > maxSalary) {
        return { salaryRangeInvalid: true };
      }
    }

    return null;
  }

  ngOnInit(): void {
    const positionId = Number(this.route.snapshot.paramMap.get('id'));
    if (positionId) {
      this.loadPositionDetails(positionId);
      this.loadAvailableSkills();
      this.loadDepartments();
      this.loadLevels();
    }
  }

  private loadPositionDetails(id: number): void {
    this.isLoading = true;
    this.positionService.getPosition(id).subscribe({
      next: (position) => {
        this.position = position;
        this.initializeEditForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load position:', error);
        this.position = null;
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

  private initializeEditForm(): void {
    if (this.position) {
      this.editPositionForm.patchValue({
        title: this.position.title,
        department: this.position.department,
        description: this.position.description,
        level: this.position.level,
        minSalary: this.position.minSalary,
        maxSalary: this.position.maxSalary,
        minYearsExperience: this.position.minYearsExperience,
        isKeyPosition: this.position.isKeyPosition,
        isActive: this.position.isActive
      });
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


  get isSalaryRangeInvalid(): boolean {
    return this.editPositionForm.hasError('salaryRangeInvalid');
  }
  getSalaryRangeErrorMessage(): string {
    if (this.isSalaryRangeInvalid) {
      return 'Minimum salary must be less than maximum salary';
    }
    return '';
  }

  private saveChanges(): void {
    if (!this.position || !this.editPositionForm.valid) return;
    
    const formValue = this.editPositionForm.value;
    const updateData = {
      ...formValue,
      minSalary: formValue.minSalary || null,
      maxSalary: formValue.maxSalary || null
    };

    this.positionService.updatePosition(this.position.id, updateData).subscribe({
      next: () => {
        this.isEditing = false;
        this.loadPositionDetails(this.position!.id);
      },
      error: (error) => {
        console.error('Failed to update position:', error);
        alert('Failed to save changes. Please try again.');
      }
    });
  }

  loadCandidates(): void {
    if (!this.position) return;
    
    this.isLoadingCandidates = true;
    this.positionService.getPositionCandidates(this.position.id).subscribe({
      next: (candidates) => {
        this.candidates = candidates;
        this.isLoadingCandidates = false;
      },
      error: (error) => {
        console.error('Failed to load candidates:', error);
        this.isLoadingCandidates = false;
      }
    });
  }

  openAddSkillModal(): void {
    this.resetAddSkillForm();
    this.showAddSkillModal = true;
  }

  addSkill(): void {
    if (!this.position || !this.addSkillForm.valid) return;

    const formValue = this.addSkillForm.value;
    const skillData: AddPositionSkillDto = {
      skillId: formValue.skillId,
      requiredLevel: formValue.requiredLevel,
      isMandatory: formValue.isMandatory,
      weight: formValue.weight
    };

    this.positionService.addPositionSkill(this.position.id, skillData).subscribe({
      next: () => {
        this.showAddSkillModal = false;
        this.resetAddSkillForm();
        this.loadPositionDetails(this.position!.id);
      },
      error: (error) => {
        console.error('Failed to add skill:', error);
        alert('Failed to add skill. Please try again.');
      }
    });
  }

  removeSkill(skillId: number): void {
    if (!this.position || !confirm('Are you sure you want to remove this skill requirement?')) return;

    this.positionService.removePositionSkill(this.position.id, skillId).subscribe({
      next: () => this.loadPositionDetails(this.position!.id),
      error: (error) => {
        console.error('Failed to remove skill:', error);
        alert('Failed to remove skill. Please try again.');
      }
    });
  }

  private resetAddSkillForm(): void {
    this.addSkillForm.reset({
      skillId: null,
      requiredLevel: 1,
      isMandatory: true,
      weight: 1
    });
  }

  canEditPosition(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin']);
  }

  canViewSalary(): boolean {
    return this.authService.hasAnyRole(['HR', 'Admin', 'Manager']);
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

  getSkillRequiredLevelText(level: number): string {
    const levels = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return levels[level] || level.toString();
  }

  getMatchScoreClass(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getSkillGapClass(gap: number): string {
    if (gap <= 0) return 'text-green-600';
    if (gap <= 1) return 'text-yellow-600';
    return 'text-red-600';
  }

  getSkillGapText(gap: number): string {
    if (gap <= 0) return 'Meets requirement';
    return `${gap} level${gap > 1 ? 's' : ''} below`;
  }
}