import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../app/pages/service/auth.service';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isLoggedIn$.pipe(
      map(isLoggedIn => {
        if (isLoggedIn) {
          // Check if route requires specific roles
          const requiredRoles = route.data?.['roles'] as string[];
          if (requiredRoles && !this.authService.hasAnyRole(requiredRoles)) {
            this.router.navigate(['/unauthorized']);
            return false;
          }
          return true;
        } else {
          this.router.navigate(['auth/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      })
    );
  }
}