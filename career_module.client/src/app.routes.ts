import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AppLayout } from '@/layout/component/app.layout';
import { Notfound } from '@/pages/notfound/notfound';
import { Dashboard } from '@/pages/dashboard/dashboard';
import { Employees } from '@/pages/employee/employees';
import { EmployeeDetail } from '@/pages/employee/employee-detail';
import { Departments } from '@/pages/organization/departments';
import { Positions } from '@/pages/organization/positions';
import { Skills } from '@/pages/organization/skills';
import { CareerDevelopment } from '@/pages/career/career-path';
import { MyRequests } from '@/pages/requests/my-requests';
import { SuccessionPlanning } from '@/pages/career/succession-planning';
import { Approvals } from '@/pages/requests/approvals';
import { PerformanceReviews } from '@/pages/performance/performance-reviews';

// Components
/*
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeeListComponent } from './components/employees/employee-list/employee-list.component';
import { EmployeeDetailComponent } from './components/employees/employee-detail/employee-detail.component';
import { MyProfileComponent } from './components/employees/my-profile/my-profile.component';
import { DepartmentListComponent } from './components/departments/department-list/department-list.component';
import { DepartmentDetailComponent } from './components/departments/department-detail/department-detail.component';
*/

export const appRoutes: Routes = [
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    {
        path: '',
        component: AppLayout,
        canActivate: [AuthGuard],
        children: [

        { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
        { path: 'dashboard', component: Dashboard },

        { path: 'career-path', component: CareerDevelopment },
        { path: 'my-requests', component: MyRequests },

        { path: 'employees', component: Employees, canActivate: [AuthGuard], data: { roles: ['Admin', 'HR', 'Manager'] } },
        { path: 'employee-detail/:id', component: EmployeeDetail, canActivate: [AuthGuard], data: { roles: ['Admin', 'HR', 'Manager'] } },
        { path: 'profile', component: EmployeeDetail },
        { 
            path: 'departments', 
            component: Departments,
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'positions', 
            component: Positions,
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'skills', 
            component: Skills,
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'performance-reviews', 
            component: PerformanceReviews,
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'succession-planning', 
            component: SuccessionPlanning,
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'approvals', 
            component: Approvals,
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        /*
        // Department Management
        { 
            path: 'departments/:id', 
            component: DepartmentDetailComponent,
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },

        // Position Management
        { 
            path: 'positions',
            loadComponent: () => import('./components/positions/position-list/position-list.component').then(c => c.PositionListComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'positions/:id',
            loadComponent: () => import('./components/positions/position-detail/position-detail.component').then(c => c.PositionDetailComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },

        // Skills Management
        { 
            path: 'skills',
            loadComponent: () => import('./components/skills/skills-dashboard/skills-dashboard.component').then(c => c.SkillsDashboardComponent)
        },
        { 
            path: 'skills/manage',
            loadComponent: () => import('./components/skills/skills-management/skills-management.component').then(c => c.SkillsManagementComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR'] }
        },
        { 
            path: 'employees/:id/skills',
            loadComponent: () => import('./components/skills/employee-skills/employee-skills.component').then(c => c.EmployeeSkillsComponent)
        },
        { 
            path: 'skill-development',
            loadComponent: () => import('./components/skills/skill-development/skill-development.component').then(c => c.SkillDevelopmentComponent)
        },

        // Performance Management
        { 
            path: 'performance',
            loadComponent: () => import('./components/performance/performance-list/performance-list.component').then(c => c.PerformanceListComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'performance/create',
            loadComponent: () => import('./components/performance/performance-create/performance-create.component').then(c => c.PerformanceCreateComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'performance/:id',
            loadComponent: () => import('./components/performance/performance-form/performance-form.component').then(c => c.PerformanceFormComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'performance/analytics',
            loadComponent: () => import('./components/performance/performance-analytics/performance-analytics.component').then(c => c.PerformanceAnalyticsComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },

        // Career Development
        { 
            path: 'career-paths',
            loadComponent: () => import('./components/career/career-paths-list/career-paths-list.component').then(c => c.CareerPathsListComponent)
        },
        { 
            path: 'career-paths/create',
            loadComponent: () => import('./components/career/career-path-builder/career-path-builder.component').then(c => c.CareerPathBuilderComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR'] }
        },
        { 
            path: 'career-paths/:id',
            loadComponent: () => import('./components/career/career-path-detail/career-path-detail.component').then(c => c.CareerPathDetailComponent)
        },
        { 
            path: 'my-career',
            loadComponent: () => import('./components/career/my-career-journey/my-career-journey.component').then(c => c.MyCareerJourneyComponent)
        },
        { 
            path: 'opportunities',
            loadComponent: () => import('./components/career/career-opportunities/career-opportunities.component').then(c => c.CareerOpportunitiesComponent)
        },

        // Succession Planning
        { 
            path: 'succession',
            loadComponent: () => import('./components/succession/succession-dashboard/succession-dashboard.component').then(c => c.SuccessionDashboardComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'succession/plans',
            loadComponent: () => import('./components/succession/succession-plans-list/succession-plans-list.component').then(c => c.SuccessionPlansListComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'succession/plans/:id',
            loadComponent: () => import('./components/succession/succession-plan-detail/succession-plan-detail.component').then(c => c.SuccessionPlanDetailComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'succession/candidates',
            loadComponent: () => import('./components/succession/candidate-analysis/candidate-analysis.component').then(c => c.CandidateAnalysisComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },

        // Employee Requests
        { 
            path: 'requests',
            loadComponent: () => import('./components/requests/request-dashboard/request-dashboard.component').then(c => c.RequestDashboardComponent)
        },
        { 
            path: 'requests/create',
            loadComponent: () => import('./components/requests/create-request/create-request.component').then(c => c.CreateRequestComponent)
        },
        { 
            path: 'requests/:id',
            loadComponent: () => import('./components/requests/request-detail/request-detail.component').then(c => c.RequestDetailComponent)
        },
        { 
            path: 'approvals',
            loadComponent: () => import('./components/requests/approval-queue/approval-queue.component').then(c => c.ApprovalQueueComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },

        // Intelligence & Analytics
        { 
            path: 'intelligence',
            loadComponent: () => import('./components/intelligence/intelligence-hub/intelligence-hub.component').then(c => c.IntelligenceHubComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'talent-risks',
            loadComponent: () => import('./components/intelligence/talent-risk-management/talent-risk-management.component').then(c => c.TalentRiskManagementComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },
        { 
            path: 'team-analytics',
            loadComponent: () => import('./components/intelligence/team-analytics/team-analytics.component').then(c => c.TeamAnalyticsComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin', 'HR', 'Manager'] }
        },

        // Notifications & Communication
        { 
            path: 'notifications',
            loadComponent: () => import('./components/notifications/notifications-center/notifications-center.component').then(c => c.NotificationsCenterComponent)
        },

        // Administration
        { 
            path: 'admin',
            loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin'] }
        },
        { 
            path: 'admin/users',
            loadComponent: () => import('./components/admin/user-management/user-management.component').then(c => c.UserManagementComponent),
            canActivate: [AuthGuard],
            data: { roles: ['Admin'] }
        }
        */
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];