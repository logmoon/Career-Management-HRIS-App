import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  
  // Mock data for quick demo
  dashboardStats = {
    totalEmployees: 125,
    openPositions: 8,
    pendingReviews: 15,
    successionPlans: 6
  };

  recentActivities = [
    { 
      type: 'promotion', 
      message: 'John Doe promoted to Senior Developer',
      timestamp: '2 hours ago',
      icon: 'trending-up'
    },
    { 
      type: 'review', 
      message: 'Performance review completed for Jane Smith',
      timestamp: '1 day ago',
      icon: 'clipboard-check'
    },
    { 
      type: 'succession', 
      message: 'New succession plan created for Team Lead position',
      timestamp: '2 days ago',
      icon: 'users'
    },
    { 
      type: 'training', 
      message: '5 employees enrolled in Leadership training',
      timestamp: '3 days ago',
      icon: 'academic-cap'
    }
  ];

  quickActions = [
    {
      title: 'View My Career Path',
      description: 'See your career progression and goals',
      href: '/career',
      icon: 'chart-line',
      color: 'bg-blue-500'
    },
    {
      title: 'Find Internal Candidates',
      description: 'Search for potential candidates for open positions',
      href: '/employees',
      icon: 'search',
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
      title: 'Succession Planning',
      description: 'Plan succession for key positions',
      href: '/succession',
      icon: 'arrow-right',
      color: 'bg-orange-500',
      roles: ['HR', 'Admin']
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  canShowAction(action: any): boolean {
    if (!action.roles) return true;
    return this.authService.hasAnyRole(action.roles);
  }

  getIconSvg(iconName: string): string {
    const icons: { [key: string]: string } = {
      'trending-up': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>`,
      'clipboard-check': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>`,
      'users': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"></path>`,
      'academic-cap': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>`,
      'chart-line': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>`,
      'search': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>`,
      'briefcase': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2M8 6v2a2 2 0 002 2h4a2 2 0 002-2V6"></path>`,
      'arrow-right': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>`
    };
    return icons[iconName] || icons['chart-line'];
  }
}