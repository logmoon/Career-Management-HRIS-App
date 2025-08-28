import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SkillDto } from '../models/base.models';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private apiUrl = '/api/Skills';

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

    return this.http.get<SkillDto[]>(this.apiUrl, { params: httpParams });
  }

  searchSkills(query: string): Observable<SkillDto[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<SkillDto[]>(`${this.apiUrl}/search`, { params });
  }
}