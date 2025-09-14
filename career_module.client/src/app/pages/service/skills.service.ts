import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

// Interfaces based on your DTOs
export interface SkillGap {
  skillId: number;
  skillName: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  category: string;
  isMandatory: boolean;
}

export interface SkillRecommendation {
  skillId: number;
  skillName: string;
  category: string;
  currentLevel: number;
  recommendedLevel: number;
  priority: string; // 'High' | 'Medium' | 'Low'
  reason: string;
  careerPaths: string[];
}

export interface Skill {
  id: number;
  name: string;
  category?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSkill {
  id: number;
  employeeId: number;
  skillId: number;
  skill: Skill;
  proficiencyLevel: number;
  acquiredDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSkill {
  name: string;
  category?: string;
  description?: string;
}

export interface UpdateSkill {
  name?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddEmployeeSkill {
  employeeId: number;
  skillId: number;
  proficiencyLevel: number;
  acquiredDate?: Date;
  notes?: string;
}

export interface UpdateEmployeeSkill {
  proficiencyLevel?: number;
  acquiredDate?: Date;
  notes?: string;
}

export interface ProficiencyLevel {
  value: number;
  label: string;
  description: string;
}

export interface EmployeeWithSkill {
  employeeId: number;
  employeeName: string;
  proficiencyLevel: number;
  acquiredDate?: Date;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillsService extends BaseApiService {

  // Skills CRUD operations
  getAllSkills(includeInactive: boolean = false, category?: string): Observable<Skill[]> {
    let params = new HttpParams();
    
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }
    
    if (category) {
      params = params.set('category', category);
    }

    const endpoint = `/skills${params.toString() ? '?' + params.toString() : ''}`;
    return this.get<Skill[]>(endpoint);
  }

  getSkillById(id: number): Observable<Skill> {
    return this.get<Skill>(`/skills/${id}`);
  }

  createSkill(skill: CreateSkill): Observable<Skill> {
    return this.post<Skill>('/skills', skill);
  }

  updateSkill(id: number, skill: UpdateSkill): Observable<Skill> {
    return this.put<Skill>(`/skills/${id}`, skill);
  }

  deactivateSkill(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/skills/${id}`);
  }

  getSkillCategories(): Observable<string[]> {
    return this.get<string[]>('/skills/categories');
  }

  getEmployeesWithSkill(skillId: number, minProficiencyLevel?: number): Observable<EmployeeWithSkill[]> {
    let params = new HttpParams();
    
    if (minProficiencyLevel !== undefined) {
      params = params.set('minProficiencyLevel', minProficiencyLevel.toString());
    }

    const endpoint = `/skills/${skillId}/employees${params.toString() ? '?' + params.toString() : ''}`;
    return this.get<EmployeeWithSkill[]>(endpoint);
  }

  // Employee Skills operations
  getEmployeeSkills(employeeId: number): Observable<EmployeeSkill[]> {
    return this.get<EmployeeSkill[]>(`/skills/employee/${employeeId}`);
  }

  addEmployeeSkill(employeeSkill: AddEmployeeSkill): Observable<EmployeeSkill> {
    return this.post<EmployeeSkill>('/skills/employee', employeeSkill);
  }

  updateEmployeeSkill(
    employeeId: number, 
    skillId: number, 
    update: UpdateEmployeeSkill
  ): Observable<EmployeeSkill> {
    return this.put<EmployeeSkill>(`/skills/employee/${employeeId}/skill/${skillId}`, update);
  }

  removeEmployeeSkill(employeeId: number, skillId: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/skills/employee/${employeeId}/skill/${skillId}`);
  }

  // Skill gap analysis
  getSkillGaps(employeeId: number, targetPositionId: number): Observable<SkillGap[]> {
    return this.get<SkillGap[]>(`/skills/employee/${employeeId}/gap-analysis/${targetPositionId}`);
  }

  // Utility methods
  getProficiencyLevels(): Observable<ProficiencyLevel[]> {
    return this.get<ProficiencyLevel[]>('/skills/proficiency-levels');
  }

  // Helper method to get proficiency level label
  getProficiencyLabel(level: number): string {
    const labels: { [key: number]: string } = {
      1: 'Beginner',
      2: 'Novice', 
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert'
    };
    return labels[level] || 'Unknown';
  }

  // Helper method to validate proficiency level
  isValidProficiencyLevel(level: number): boolean {
    return level >= 1 && level <= 5;
  }

  // Helper method to get skill gap priority color/class
  getGapPriorityClass(gap: number): string {
    if (gap >= 3) return 'high-priority';
    if (gap >= 2) return 'medium-priority';
    return 'low-priority';
  }

  // Helper method to format skill gap message
  getGapMessage(gap: SkillGap): string {
    if (gap.gap === 0) {
      return `You meet the required level for ${gap.skillName}`;
    }
    return `You need ${gap.gap} more level${gap.gap > 1 ? 's' : ''} in ${gap.skillName}`;
  }
}