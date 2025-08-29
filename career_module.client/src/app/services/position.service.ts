import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { 
  PositionDto, 
  PositionDetailDto, 
  CreatePositionDto, 
  UpdatePositionDto,
  PositionFilters,
  CandidateMatchDto,
  AddPositionSkillDto,
  PaginatedResponse
} from '../models/base.models';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private readonly API_POSITIONS_URL = 'https://localhost:7130/api/Positions';

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

    return this.http.get<PaginatedResponse<PositionDto[]>>(this.API_POSITIONS_URL, { params })
    .pipe(
      map(response => response.data || [])
    );
  }

  getPosition(id: number): Observable<PositionDetailDto> {
    return this.http.get<PositionDetailDto>(`${this.API_POSITIONS_URL}/${id}`);
  }

  createPosition(position: CreatePositionDto): Observable<PositionDto> {
    return this.http.post<PositionDto>(this.API_POSITIONS_URL, position);
  }

  updatePosition(id: number, position: UpdatePositionDto): Observable<void> {
    return this.http.put<void>(`${this.API_POSITIONS_URL}/${id}`, position);
  }

  deletePosition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_POSITIONS_URL}/${id}`);
  }

  getPositionCandidates(positionId: number): Observable<CandidateMatchDto[]> {
    return this.http.get<CandidateMatchDto[]>(`${this.API_POSITIONS_URL}/${positionId}/candidates`);
  }

  getPositionLevels(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_POSITIONS_URL}/levels`);
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_POSITIONS_URL}/departments`);
  }

  addPositionSkill(positionId: number, skill: AddPositionSkillDto): Observable<void> {
    return this.http.post<void>(`${this.API_POSITIONS_URL}/${positionId}/skills`, skill);
  }

  removePositionSkill(positionId: number, skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_POSITIONS_URL}/${positionId}/skills/${skillId}`);
  }
}