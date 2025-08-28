import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { RegisterComponent } from './components/register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Protected routes with layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
      }
      /*
      {
        path: 'employees',
        loadComponent: () => import('./components/employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [RoleGuard],
        redirectTo: '/dashboard',
        data: { roles: ['Manager', 'HR', 'Admin'] }
      }
      // ...
      */
    ]
  },
  
  // Catch all route
  { path: '**', redirectTo: '/dashboard' }
];