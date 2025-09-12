import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hireDate?: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  departmentId?: number;
  positionId?: number;
}

export interface JwtPayload {
  nameid: string;
  unique_name: string;
  email: string;
  role: string;
  exp: number;
  iss: string;
  aud: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7049/api';
  private tokenKey = 'career_app_token';
  private userSubject = new BehaviorSubject<User | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  public user$ = this.userSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token && this.isTokenValid(token)) {
      const decodedToken = this.decodeToken(token);
      if (decodedToken) {
        this.setAuthState(true, this.createUserFromToken(decodedToken));
      }
    } else {
      this.clearAuthState();
    }
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/login`, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
          const decodedToken = this.decodeToken(response.token);
          if (decodedToken) {
            this.setAuthState(true, this.createUserFromToken(decodedToken));
          }
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/register`, userData);
  }

  logout(): void {
    this.clearToken();
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return new BehaviorSubject(false).asObservable();

    return this.http.get(`${this.apiUrl}/Auth/validate-token?token=${token}`).pipe(
      map(() => true),
      tap(() => this.setAuthState(true, this.getCurrentUser())),
      // If validation fails, clear auth state
    );
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private isTokenValid(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  private createUserFromToken(decodedToken: JwtPayload): User {
    return {
        id: parseInt(decodedToken.nameid),
        username: decodedToken.unique_name,
        email: decodedToken.email,
        firstName: '', // Will be populated from API call if needed
        lastName: '',
        role: decodedToken.role
    };
  }

  private setAuthState(isLoggedIn: boolean, user: User | null): void {
    this.isLoggedInSubject.next(isLoggedIn);
    this.userSubject.next(user);
  }

  private clearAuthState(): void {
    this.setAuthState(false, null);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  isHR(): boolean {
    return this.hasRole('HR');
  }

  isManager(): boolean {
    return this.hasRole('Manager');
  }

  isEmployee(): boolean {
    return this.hasRole('Employee');
  }

  canAccessAdminFeatures(): boolean {
    return this.hasAnyRole(['Admin', 'HR']);
  }

  canAccessManagerFeatures(): boolean {
    return this.hasAnyRole(['Admin', 'HR', 'Manager']);
  }
}