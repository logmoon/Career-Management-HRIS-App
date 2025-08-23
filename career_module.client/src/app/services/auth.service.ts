import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResult } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://localhost:7130/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private readonly STORAGE_KEY = 'auth_data';

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(result => {
          if (result.success && result.token) {
            this.setSession(result);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  private setSession(authResult: AuthResult): void {
    this.currentUserSubject.next(authResult.user);
    this.isLoggedInSubject.next(true);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      user: authResult.user,
      token: authResult.token
    }));
  }

  private loadUserFromStorage(): void {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      try {
        const authData = JSON.parse(storedData);
        if (authData.user && authData.token) {
          this.currentUserSubject.next(authData.user);
          this.isLoggedInSubject.next(true);
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        this.logout();
      }
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}