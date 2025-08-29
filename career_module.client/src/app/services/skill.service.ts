import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { 
  PaginatedResponse, 
  SkillDto, 
  SkillDetailDto, 
  CreateSkillDto, 
  UpdateSkillDto,
  SkillSummaryDto,
  CategoryStatsDto,
  SkillGapAnalysisDto
} from '../models/base.models';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private readonly API_SKILLS_URL = 'https://localhost:7130/api/Skills';

  constructor(private http: HttpClient) {}

  getSkills(params?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Observable<SkillDto[]> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<PaginatedResponse<SkillDto[]>>(this.API_SKILLS_URL, { params: httpParams })
    .pipe(
      map(response => response.data || [])
    );
  }

  getSkill(id: number): Observable<SkillDetailDto> {
    return this.http.get<SkillDetailDto>(`${this.API_SKILLS_URL}/${id}`);
  }

  createSkill(skill: CreateSkillDto): Observable<SkillDto> {
    return this.http.post<SkillDto>(this.API_SKILLS_URL, skill);
  }

  updateSkill(id: number, skill: UpdateSkillDto): Observable<void> {
    return this.http.put<void>(`${this.API_SKILLS_URL}/${id}`, skill);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_SKILLS_URL}/${id}`);
  }

  searchSkills(query: string): Observable<SkillSummaryDto[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<SkillSummaryDto[]>(`${this.API_SKILLS_URL}/search`, { params });
  }

  getCategories(): Observable<CategoryStatsDto[]> {
    return this.http.get<CategoryStatsDto[]>(`${this.API_SKILLS_URL}/categories`);
  }

  getSkillGapAnalysis(id: number): Observable<SkillGapAnalysisDto> {
    return this.http.get<SkillGapAnalysisDto>(`${this.API_SKILLS_URL}/${id}/gap-analysis`);
  }
}