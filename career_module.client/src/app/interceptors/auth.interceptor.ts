import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // TODO: Add the JWT token to headers here, currently we're just passing through
    // Example:
    // const token = this.getTokenFromStorage();
    // if (token) {
    //   const authReq = req.clone({
    //     setHeaders: { Authorization: `Bearer ${token}` }
    //   });
    //   return next.handle(authReq);
    // }
    return next.handle(req);
  }
}