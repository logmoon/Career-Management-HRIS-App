import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../pages/service/auth.service';

export interface MenuItemWithRole extends MenuItem {
  allowedRoles?: string[];
  adminOnly?: boolean;
  hrOnly?: boolean;
  managerOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private currentUserRole = signal<string | null>(null);
  private baseMenuItems = signal<MenuItemWithRole[]>([]);

  // Computed filtered menu based on user role
  filteredMenuItems = computed(() => {
    const userRole = this.currentUserRole();
    if (!userRole) return [];

    return this.baseMenuItems().map(section => {
      if (!section.items) return section;

      const visibleItems = section.items.filter(item => 
        this.hasAccess(item as MenuItemWithRole, userRole)
      );

      return visibleItems.length > 0 ? {
        ...section,
        items: visibleItems
      } : null;
    }).filter(section => section !== null) as MenuItemWithRole[];
  });

  constructor(private authService: AuthService) {
    this.initializeMenu();
    this.updateUserRole();
    
    // Subscribe to auth changes
    this.authService.user$.subscribe(user => {
      this.currentUserRole.set(user?.role || null);
    });
  }

  private initializeMenu(): void {
    const menuItems: MenuItemWithRole[] = [
      {
        label: 'Home',
        items: [
          { 
            label: 'Dashboard', 
            icon: 'pi pi-fw pi-home', 
            routerLink: ['/dashboard']
            // Available to all authenticated users
          }
        ]
      },
      {
        label: 'Organization',
        items: [
          { 
            label: 'Employees', 
            icon: 'pi pi-fw pi-users', 
            routerLink: ['/employees'],
            allowedRoles: ['Admin', 'HR', 'Manager']
          },
          { 
            label: 'Departments', 
            icon: 'pi pi-fw pi-objects-column', 
            routerLink: ['/departments'],
            allowedRoles: ['Admin', 'HR', 'Manager']
          },
          { 
            label: 'Positions', 
            icon: 'pi pi-fw pi-briefcase', 
            routerLink: ['/positions'],
            allowedRoles: ['Admin', 'HR', 'Manager']
          },
          { 
            label: 'Skills', 
            icon: 'pi pi-fw pi-trophy', 
            routerLink: ['/skills'],
            allowedRoles: ['Admin', 'HR', 'Manager']
          },
          { 
            label: 'Performance Reviews', 
            icon: 'pi pi-fw pi-book', 
            routerLink: ['/performance-reviews'],
            allowedRoles: ['Admin', 'HR', 'Manager']
          },
        ]
      },
      {
        label: 'Career',
        items: [
          { 
            label: 'Career Development', 
            icon: 'pi pi-fw pi-sitemap', 
            routerLink: ['/career-path']
            // Available to all users
          },
          { 
            label: 'Succession Planning', 
            icon: 'pi pi-fw pi-star', 
            routerLink: ['/succession-planning'],
            allowedRoles: ['Admin', 'HR', 'Manager']
          }
        ]
      },
      {
        label: 'Requests',
        items: [
          {
            label: 'My Requests', 
            icon: 'pi pi-fw pi-inbox', 
            routerLink: ['/my-requests']
            // Available to all users
          },
          { 
            label: 'Approvals', 
            icon: 'pi pi-fw pi-check-square', 
            routerLink: ['/approvals'],
            allowedRoles: ['Admin', 'HR', 'Manager']
          }
        ]
      },
      {
        label: 'Me',
        items: [
          { 
            label: 'Profile', 
            icon: 'pi pi-fw pi-user', 
            routerLink: ['/profile']
            // Available to all users
          },
          { 
            label: 'Logout', 
            icon: 'pi pi-fw pi-sign-out', 
            command: () => this.handleLogout(),
            // Available to all users
          }
        ]
      }
    ];

    this.baseMenuItems.set(menuItems);
  }

  private updateUserRole(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole.set(user?.role || null);
  }

  private hasAccess(item: MenuItemWithRole, userRole: string): boolean {
    // Admin only items
    if (item.adminOnly && userRole !== 'Admin') {
      return false;
    }

    // HR only items  
    if (item.hrOnly && userRole !== 'HR') {
      return false;
    }

    // Manager only items
    if (item.managerOnly && userRole !== 'Manager') {
      return false;
    }

    // Check allowedRoles array
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      return item.allowedRoles.includes(userRole);
    }

    // If no restrictions specified, allow access
    return true;
  }

  // Handle logout action
  private handleLogout(): void {
    this.authService.logout();
  }

  // Method to refresh menu (useful for role changes)
  refreshMenu(): void {
    this.updateUserRole();
  }
}