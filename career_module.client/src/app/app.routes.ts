import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Protected routes with layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      }
      /*
      {
        path: 'career',
        loadComponent: () => import('./components/career/career.component').then(m => m.CareerComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./components/employees/employees.component').then(m => m.EmployeesComponent),
        data: { roles: ['Manager', 'HR', 'Admin'] }
      },
      {
        path: 'positions',
        loadComponent: () => import('./components/positions/positions.component').then(m => m.PositionsComponent),
        data: { roles: ['HR', 'Admin'] }
      },
      {
        path: 'succession',
        loadComponent: () => import('./components/succession/succession.component').then(m => m.SuccessionComponent),
        data: { roles: ['HR', 'Admin'] }
      },
      {
        path: 'skills',
        loadComponent: () => import('./components/skills/skills.component').then(m => m.SkillsComponent),
        data: { roles: ['HR', 'Admin'] }
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent),
        data: { roles: ['Manager', 'HR', 'Admin'] }
      }
      */
    ]
  },
  
  // Catch all route
  { path: '**', redirectTo: '/dashboard' }
];