import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DatePickerModule } from 'primeng/datepicker';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService, RegisterRequest } from '../service/auth.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DatePickerModule,
    FormsModule,
    RouterModule,
    StepsModule,
    CardModule,
    MessageModule,
    ProgressSpinnerModule
  ],
  template: `
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden py-4">
      <div class="flex flex-col items-center justify-center w-full max-w-4xl">
        <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)" class="w-full">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-8 px-8 sm:px-12" style="border-radius: 53px">
            <div class="text-center mb-8">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Create Account</div>
              <span class="text-muted-color font-medium">Join our career management platform</span>
            </div>

            <!-- Steps -->
            <p-steps [model]="steps" [activeIndex]="activeIndex" [readonly]="false" styleClass="mb-6"></p-steps>

            <!-- Error Messages -->
            <p-message 
              *ngIf="errorMessage" 
              severity="error" 
              [text]="errorMessage"
              class="w-full mb-4">
            </p-message>

            <!-- Success Message -->
            <p-message 
              *ngIf="successMessage" 
              severity="success" 
              [text]="successMessage"
              class="w-full mb-4">
            </p-message>

            <!-- Registration Form -->
            <form (ngSubmit)="onNext()" #registerForm="ngForm">
              
              <!-- Step 1: Basic Information -->
              <div *ngIf="activeIndex === 0">
                <p-card header="Basic Information" class="mb-4">
                  <div>
                    <div>
                      <label for="firstName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">First Name *</label>
                      <input 
                        pInputText 
                        id="firstName" 
                        name="firstName"
                        type="text" 
                        placeholder="Enter first name" 
                        class="w-full"
                        [(ngModel)]="registerData.firstName"
                        required
                        [class.p-invalid]="isFormSubmitted && !registerData.firstName" />
                    </div>
                    
                    <div>
                      <label for="lastName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Last Name *</label>
                      <input 
                        pInputText 
                        id="lastName" 
                        name="lastName"
                        type="text" 
                        placeholder="Enter last name" 
                        class="w-full"
                        [(ngModel)]="registerData.lastName"
                        required
                        [class.p-invalid]="isFormSubmitted && !registerData.lastName" />
                    </div>
                    
                    <div>
                      <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email *</label>
                      <input 
                        pInputText 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder="Enter email address" 
                        class="w-full"
                        [(ngModel)]="registerData.email"
                        required
                        email
                        [class.p-invalid]="isFormSubmitted && (!registerData.email || !isEmailValid())" />
                    </div>
                    
                    <div>
                      <label for="phone" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Phone</label>
                      <input 
                        pInputText 
                        id="phone" 
                        name="phone"
                        type="tel" 
                        placeholder="Enter phone number" 
                        class="w-full"
                        [(ngModel)]="registerData.phone" />
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- Step 2: Account Details -->
              <div *ngIf="activeIndex === 1">
                <p-card header="Account Details" styleClass="mb-4">
                  <div>
                    <div>
                      <label for="username" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Username *</label>
                      <input 
                        pInputText 
                        id="username" 
                        name="username"
                        type="text" 
                        placeholder="Choose a username" 
                        class="w-full"
                        [(ngModel)]="registerData.username"
                        required
                        minlength="3"
                        [class.p-invalid]="isFormSubmitted && (!registerData.username || registerData.username.length < 3)" />
                    </div>
                    
                    <div>
                      <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Password *</label>
                      <p-password 
                        id="password"
                        name="password"
                        [(ngModel)]="registerData.password" 
                        placeholder="Create a password" 
                        [toggleMask]="true" 
                        [fluid]="true" 
                        [feedback]="true"
                        required
                        [class.p-invalid]="isFormSubmitted && (!registerData.password || registerData.password.length < 6)">
                      </p-password>
                    </div>
                    
                    <div>
                      <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Confirm Password *</label>
                      <p-password 
                        id="confirmPassword"
                        name="confirmPassword"
                        [(ngModel)]="confirmPassword" 
                        placeholder="Confirm your password" 
                        [toggleMask]="true" 
                        [fluid]="true" 
                        [feedback]="false"
                        required
                        [class.p-invalid]="isFormSubmitted && (!confirmPassword || confirmPassword !== registerData.password)">
                      </p-password>
                      <small class="p-error" *ngIf="isFormSubmitted && confirmPassword && confirmPassword !== registerData.password">
                        Passwords do not match
                      </small>
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- Step 3: Employment Details -->
              <div *ngIf="activeIndex === 2">
                <p-card header="Employment Information" styleClass="mb-4">
                  <div>
                    <div>
                      <label for="hireDate" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Hire Date</label>
                      <p-datepicker
                        id="hireDate"
                        name="hireDate"
                        [(ngModel)]="registerData.hireDate"
                        placeholder="Select hire date"
                        [showIcon]="true"
                        dateFormat="mm/dd/yy"
                        class="w-full">
                      </p-datepicker>
                      <small class="text-muted-color">Leave empty if you're not yet employed</small>
                    </div>
                  </div>
                  
                  <div class="mt-4 p-3 surface-100 border-round">
                    <h5 class="mt-0">Review Your Information</h5>
                    <div>
                      <div class="col-6">
                        <strong>Name:</strong> {{ registerData.firstName }} {{ registerData.lastName }}
                      </div>
                      <div class="col-6">
                        <strong>Email:</strong> {{ registerData.email }}
                      </div>
                      <div class="col-6">
                        <strong>Username:</strong> {{ registerData.username }}
                      </div>
                      <div class="col-6" *ngIf="registerData.phone">
                        <strong>Phone:</strong> {{ registerData.phone }}
                      </div>
                      <div class="col-6" *ngIf="registerData.hireDate">
                        <strong>Hire Date:</strong> {{ registerData.hireDate | date:'mediumDate' }}
                      </div>
                    </div>
                  </div>
                </p-card>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex justify-content-between mt-6">
                <p-button 
                  *ngIf="activeIndex > 0"
                  label="Previous" 
                  icon="pi pi-arrow-left"
                  styleClass="p-button-outlined" 
                  (onClick)="onPrevious()"
                  type="button">
                </p-button>
                
                <div class="ml-auto">
                  <p-button 
                    *ngIf="activeIndex < 2"
                    label="Next" 
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    type="submit">
                  </p-button>
                  
                  <p-button 
                    *ngIf="activeIndex === 2"
                    label="Create Account" 
                    icon="pi pi-check"
                    type="submit"
                    [loading]="isLoading"
                    [disabled]="isLoading">
                  </p-button>
                </div>
              </div>
            </form>

            <div class="text-center mt-6">
              <span class="text-600">Already have an account? </span>
              <a routerLink="/auth/login" class="font-medium no-underline cursor-pointer text-primary">Sign in</a>
            </div>
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
    
    :host ::ng-deep .p-dropdown {
      width: 100%;
    }
    
    :host ::ng-deep .p-calendar {
      width: 100%;
    }
    
    :host ::ng-deep .p-steps .p-steps-item .p-menuitem-link {
      padding: 1rem;
    }
  `]
})
export class Register implements OnInit {
  registerData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    role: '',
    firstName: '',
    lastName: '',
    phone: '',
    hireDate: undefined
  };
  
  confirmPassword = '';
  activeIndex = 0;
  isLoading = false;
  isFormSubmitted = false;
  errorMessage = '';
  successMessage = '';

  steps: MenuItem[] = [
    { label: 'Personal Info' },
    { label: 'Account Setup' },
    { label: 'Employment' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // If user is already logged in, redirect to dashboard
    if (this.authService.getCurrentUser()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onNext() {
    this.isFormSubmitted = true;
    this.errorMessage = '';

    if (this.activeIndex === 0) {
      if (this.validateStep1()) {
        this.activeIndex++;
        this.isFormSubmitted = false;
      }
    } else if (this.activeIndex === 1) {
      if (this.validateStep2()) {
        this.activeIndex++;
        this.isFormSubmitted = false;
      }
    } else if (this.activeIndex === 2) {
      this.onRegister();
    }
  }

  onPrevious() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
      this.isFormSubmitted = false;
      this.errorMessage = '';
    }
  }

  onRegister() {
    if (!this.validateStep2()) {
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Redirecting to login...';
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid registration data. Please check your inputs.';
        } else if (error.status === 409) {
          this.errorMessage = 'Username or email already exists. Please choose different values.';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please try again later.';
        } else {
          this.errorMessage = error.error?.message || 'An error occurred during registration. Please try again.';
        }
      }
    });
  }

  private validateStep1(): boolean {
    return !!(this.registerData.firstName && 
             this.registerData.lastName && 
             this.registerData.email && 
             this.isEmailValid());
  }

  private validateStep2(): boolean {
    return !!(this.registerData.username && 
             this.registerData.username.length >= 3 &&
             this.registerData.password && 
             this.registerData.password.length >= 6 &&
             this.confirmPassword === this.registerData.password &&
             this.registerData.role);
  }

  isEmailValid(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(this.registerData.email);
  }
}