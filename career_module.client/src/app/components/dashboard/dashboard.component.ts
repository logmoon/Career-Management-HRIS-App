// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { PositionService } from '../../services/position.service';
import { User } from '../../models/auth.models';
import { EmployeeDto, PositionDto } from '../../models/base.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  dashboardStats = {
    totalEmployees: 0,
    openPositions: 0,
    keyPositions: 0,
    activeDepartments: 0
  };

  recentEmployees: EmployeeDto[] = [];
  recentPositions: PositionDto[] = [];

  quickActions = [
    {
      title: 'View My Profile',
      description: 'See your personal career information',
      href: '/profile',
      icon: 'user',
      color: 'bg-blue-500'
    },
    {
      title: 'Browse Employees',
      description: 'View and manage employee profiles',
      href: '/employees',
      icon: 'users',
      color: 'bg-green-500',
      roles: ['Manager', 'HR', 'Admin']
    },
    {
      title: 'Manage Positions',
      description: 'Add or edit job positions and requirements',
      href: '/positions',
      icon: 'briefcase',
      color: 'bg-purple-500',
      roles: ['HR', 'Admin']
    },
    {
      title: 'Find Candidates',
      description: 'Search for potential candidates for positions',
      href: '/candidates',
      icon: 'search',
      color: 'bg-orange-500',
      roles: ['Manager', 'HR', 'Admin']
    },
    {
      title: 'Skills Management',
      description: 'Manage skills and competencies',
      href: '/skills',
      icon: 'academic-cap',
      color: 'bg-indigo-500',
      roles: ['HR', 'Admin']
    },
    {
      title: 'Reports & Analytics',
      description: 'View career management reports',
      href: '/reports',
      icon: 'chart-bar',
      color: 'bg-red-500',
      roles: ['HR', 'Admin']
    }
  ];

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private positionService: PositionService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadDashboardData();
  }

  canShowAction(action: any): boolean {
    if (!action.roles) return true;
    return this.authService.hasAnyRole(action.roles);
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Load dashboard data in parallel
    forkJoin({
      employees: this.employeeService.getEmployees({ page: 1, pageSize: 5 }).pipe(
        catchError(() => of([]))
      ),
      positions: this.positionService.getPositions({ page: 1, pageSize: 5 }).pipe(
        catchError(() => of([]))
      ),
      allEmployees: this.employeeService.getEmployees({ page: 1, pageSize: 1000 }).pipe(
        catchError(() => of([]))
      ),
      allPositions: this.positionService.getPositions({ page: 1, pageSize: 1000 }).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: (data) => {
        this.recentEmployees = data.employees.slice(0, 3);
        this.recentPositions = data.positions.slice(0, 3);
        
        // Calculate stats
        this.dashboardStats = {
          totalEmployees: data.allEmployees.length,
          openPositions: data.allPositions.filter(p => p.isActive && p.currentEmployeeCount === 0).length,
          keyPositions: data.allPositions.filter(p => p.isKeyPosition).length,
          activeDepartments: this.getUniqueDepartments(data.allEmployees).length
        };
        
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Set mock data in case of error
        this.dashboardStats = {
          totalEmployees: 125,
          openPositions: 8,
          keyPositions: 15,
          activeDepartments: 6
        };
      }
    });
  }

  private getUniqueDepartments(employees: EmployeeDto[]): string[] {
    const departments = employees.map(emp => emp.department).filter(dept => dept);
    return [...new Set(departments)];
  }

  getFullName(employee: EmployeeDto): string {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }

  formatSalary(amount?: number): string {
    if (!amount) return 'N/A';
    return `$${amount.toLocaleString()}`;
  }

  getIconSvg(iconName: string): string {
    const icons: { [key: string]: string } = {
      'user': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>`,
      'users': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"></path>`,
      'briefcase': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2M8 6v2a2 2 0 002 2h4a2 2 0 002-2V6"></path>`,
      'search': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>`,
      'academic-cap': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>`,
      'chart-bar': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>`
    };
    return icons[iconName] || icons['user'];
  }
}