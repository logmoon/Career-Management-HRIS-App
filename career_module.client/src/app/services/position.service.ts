import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  PositionDto, 
  PositionDetailDto, 
  CreatePositionDto, 
  UpdatePositionDto,
  PositionFilters,
  CandidateMatchDto,
  AddPositionSkillDto
} from '../models/base.models';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = '/api/Positions';

  constructor(private http: HttpClient) {}

  getPositions(filters?: PositionFilters): Observable<PositionDto[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.department) params = params.set('department', filters.department);
      if (filters.level) params = params.set('level', filters.level);
      if (filters.isKeyPosition !== undefined) params = params.set('isKeyPosition', filters.isKeyPosition.toString());
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    }

    return this.http.get<PositionDto[]>(this.apiUrl, { params });
  }

  getPosition(id: number): Observable<PositionDetailDto> {
    return this.http.get<PositionDetailDto>(`${this.apiUrl}/${id}`);
  }

  createPosition(position: CreatePositionDto): Observable<PositionDto> {
    return this.http.post<PositionDto>(this.apiUrl, position);
  }

  updatePosition(id: number, position: UpdatePositionDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, position);
  }

  deletePosition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPositionCandidates(positionId: number): Observable<CandidateMatchDto[]> {
    return this.http.get<CandidateMatchDto[]>(`${this.apiUrl}/${positionId}/candidates`);
  }

  getPositionLevels(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/levels`);
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departments`);
  }

  addPositionSkill(positionId: number, skill: AddPositionSkillDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${positionId}/skills`, skill);
  }

  removePositionSkill(positionId: number, skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${positionId}/skills/${skillId}`);
  }
}