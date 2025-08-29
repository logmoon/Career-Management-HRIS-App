import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { RegisterComponent } from './components/register/register.component';
import { RoleGuard } from './guards/role.guard';

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
      },
      {
        path: 'employees',
        loadComponent: () => import('./components/employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['Manager', 'HR', 'Admin'] }
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./components/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
        canActivate: [RoleGuard],
        data: { roles: ['Manager', 'HR', 'Admin'] }
      },
      {
        path: 'positions',
        loadComponent: () => import('./components/positions/positions.component').then(m => m.PositionsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['HR', 'Admin'] }
      },
      {
        path: 'positions/:id',
        loadComponent: () => import('./components/position-detail/position-detail.component').then(m => m.PositionDetailComponent),
        canActivate: [RoleGuard],
        data: { roles: ['HR', 'Admin'] }
      },
      {
        path: 'skills',
        loadComponent: () => import('./components/skills/skills.component').then(m => m.SkillsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['HR', 'Admin'] }
      },
      {
        path: 'skills/:id',
        loadComponent: () => import('./components/skill-detail/skill-detail.component').then(m => m.SkillDetailComponent),
        canActivate: [RoleGuard],
        data: { roles: ['HR', 'Admin'] }
      }
    ]
  },
  
  // Catch all route
  { path: '**', redirectTo: '/dashboard' }
];