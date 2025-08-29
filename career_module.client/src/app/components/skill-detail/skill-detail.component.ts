import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkillService } from '../../services/skill.service';
import { AuthService } from '../../services/auth.service';
import { 
  SkillDetailDto, 
  SkillGapAnalysisDto 
} from '../../models/base.models';

@Component({
  selector: 'app-skill-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './skill-detail.component.html',
  styleUrls: ['./skill-detail.component.css']
})
export class SkillDetailComponent implements OnInit {
  skill: SkillDetailDto | null = null;
  gapAnalysis: SkillGapAnalysisDto | null = null;
  isLoading = true;
  isLoadingGapAnalysis = false;
  isEditing = false;
  
  editSkillForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private skillService: SkillService,
    private authService: AuthService
  ) {
    this.editSkillForm = this.formBuilder.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    const skillId = Number(this.route.snapshot.paramMap.get('id'));
    if (skillId) {
      this.loadSkillDetails(skillId);
    }
  }

  private loadSkillDetails(id: number): void {
    this.isLoading = true;
    this.skillService.getSkill(id).subscribe({
      next: (skill) => {
        this.skill = skill;
        this.initializeEditForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load skill:', error);
        this.skill = null;
        this.isLoading = false;
      }
    });
  }

  private initializeEditForm(): void {
    if (this.skill) {
      this.editSkillForm.patchValue({
        name: this.skill.name,
        category: this.skill.category,
        description: this.skill.description,
        isActive: this.skill.isActive
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

  private saveChanges(): void {
    if (!this.skill || !this.editSkillForm.valid) return;
    
    const formValue = this.editSkillForm.value;
    const updateData = {
      name: formValue.name,
      category: formValue.category,
      description: formValue.description || '',
      isActive: formValue.isActive
    };

    this.skillService.updateSkill(this.skill.id, updateData).subscribe({
      next: () => {
        this.isEditing = false;
        this.loadSkillDetails(this.skill!.id);
      },
      error: (error) => {
        console.error('Failed to update skill:', error);
        alert('Failed to save changes. Please try again.');
      }
    });
  }

  loadGapAnalysis(): void {
    if (!this.skill) return;
    
    this.isLoadingGapAnalysis = true;
    this.skillService.getSkillGapAnalysis(this.skill.id).subscribe({
      next: (analysis) => {
        this.gapAnalysis = analysis;
        this.isLoadingGapAnalysis = false;
      },
      error: (error) => {
        console.error('Failed to load gap analysis:', error);
        this.isLoadingGapAnalysis = false;
      }
    });
  }

  canEditSkill(): boolean {
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

  getActivityClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getActivityText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getProficiencyText(level: number): string {
    const levels = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return levels[level] || level.toString();
  }

  getProficiencyColor(level: number): string {
    const colors = ['', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-blue-600', 'text-green-600'];
    return colors[level] || 'text-gray-600';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getGapSeverityClass(gap: number): string {
    if (gap <= 0) return 'text-green-600';
    if (gap <= 1) return 'text-yellow-600';
    return 'text-red-600';
  }

  getGapSeverityText(gap: number): string {
    if (gap <= 0) return 'No Gap';
    if (gap <= 1) return 'Minor Gap';
    return 'Major Gap';
  }

  getDepartmentGapClass(averageProficiency: number, maxRequired: number = 5): string {
    const ratio = averageProficiency / maxRequired;
    if (ratio >= 0.8) return 'bg-green-100 text-green-800';
    if (ratio >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }
}