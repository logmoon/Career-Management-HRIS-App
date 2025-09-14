import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected apiUrl = 'https://localhost:7130/api';

  constructor(protected http: HttpClient, protected authService: AuthService) {}

  protected getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  protected get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { 
      headers: this.getHeaders()
    });
  }

  protected post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, { 
      headers: this.getHeaders() 
    });
  }

  protected put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, { 
      headers: this.getHeaders() 
    });
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, { 
      headers: this.getHeaders() 
    });
  }
}