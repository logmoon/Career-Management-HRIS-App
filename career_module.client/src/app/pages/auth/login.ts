import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService, LoginRequest } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    RouterModule,
    RippleModule,
    MessageModule,
    ProgressSpinnerModule,
],
  template: `
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
            <div class="text-center mb-8">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Career Management</div>
              <span class="text-muted-color font-medium">Sign in to continue</span>
            </div>

            <!-- Error Messages -->
            <p-message 
              *ngIf="errorMessage" 
              severity="error" 
              [text]="errorMessage"
              class="w-full mb-4">
            </p-message>

            <!-- Login Form -->
            <form (ngSubmit)="onLogin()" #loginForm="ngForm">
              <div class="mb-6">
                <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username</label>
                <input 
                  pInputText 
                  id="username" 
                  name="username"
                  type="text" 
                  placeholder="Enter your username" 
                  class="w-full md:w-120"
                  [(ngModel)]="loginData.username"
                  required
                  [class.p-invalid]="isFormSubmitted && !loginData.username" />
              </div>

              <div class="mb-6">
                <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                <p-password 
                  id="password"
                  name="password"
                  [(ngModel)]="loginData.password" 
                  placeholder="Enter your password" 
                  [toggleMask]="true" 
                  [fluid]="true" 
                  [feedback]="false"
                  required
                  [class.p-invalid]="isFormSubmitted && !loginData.password">
                </p-password>
              </div>
              <p-button 
                label="Sign In" 
                icon="pi pi-sign-in"
                styleClass="w-full mb-4" 
                type="submit"
                [loading]="isLoading"
                [disabled]="isLoading">
              </p-button>

              <div class="text-center">
                <span class="text-600">Don't have an account? </span>
                <a routerLink="/auth/register" class="font-medium no-underline cursor-pointer text-primary">Create one</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-password {
      width: 100%;
    }
    
    :host ::ng-deep .p-password input {
      width: 100% !important;
    }
    
    :host ::ng-deep .p-button {
      padding: 0.75rem 1rem;
    }
  `]
})
export class Login implements OnInit {
  loginData: LoginRequest = {
    username: '',
    password: ''
  };
  
  rememberMe = false;
  isLoading = false;
  isFormSubmitted = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.getCurrentUser()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    this.isFormSubmitted = true;
    this.errorMessage = '';

    // Basic validation
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginData).subscribe({
      next: () => {
        this.isLoading = false;
        // Start notification polling immediately after login
        this.notificationService.startPolling();
        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        
        // Handle different error scenarios
        if (error.status === 401) {
          this.errorMessage = 'Invalid username or password.';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please try again later.';
        } else {
          this.errorMessage = error.error?.message || 'An error occurred during login. Please try again.';
        }
      }
    });
  }
}