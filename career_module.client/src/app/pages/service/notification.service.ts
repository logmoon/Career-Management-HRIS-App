import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, interval } from 'rxjs';
import { tap, switchMap, startWith, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { AuthService, User } from './auth.service';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  actionType: string; // PromotionRequest, TrainingRequest, PerformanceReview, etc.
  relatedEntityId?: number;
  isRead: boolean;
  createdAt: Date;
  user?: User;
}

// DTO Interfaces
export interface SendNotificationDto {
  userId: number;
  title: string;
  message: string;
  actionType?: string;
  relatedEntityId?: number;
}

export interface SendBulkNotificationDto {
  title: string;
  message: string;
  actionType?: string;
  relatedEntityId?: number;
}

export interface SendRoleNotificationDto extends SendBulkNotificationDto {
  role: string;
}

export interface NotifyManagerDto extends SendBulkNotificationDto {
  employeeId: number;
}

export interface NotificationResponse {
  message: string;
  notification?: Notification;
  notifications?: Notification[];
  count?: number;
}

/*
USAGE:

// Initialize and start real-time updates
this.notificationService.startPolling();

// Get notifications with reactive updates
this.notificationService.notifications$.subscribe(notifications => {
  this.notifications = notifications;
});

// Monitor unread count
this.notificationService.unreadCount$.subscribe(count => {
  this.unreadCount = count;
});

// Mark notification as read
this.notificationService.markAsRead(notificationId).subscribe();

// Send notification to HR (admin only)
this.notificationService.sendToHR({
  title: 'System Maintenance',
  message: 'Scheduled maintenance tonight at 2 AM',
  actionType: 'SystemAlert'
}).subscribe();

// Use notification templates
this.notificationService.notifyPerformanceReviewDue(employeeId, reviewId)
  .subscribe();
*/

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends BaseApiService {
  private readonly endpoint = '/Notifications';
  
  // Reactive state management
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private newNotificationSubject = new Subject<Notification>();

  // Public observables
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public newNotification$ = this.newNotificationSubject.asObservable();

  // Polling configuration
  private pollingInterval = 30000; // 30 seconds
  private isPollingActive = false;

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  // Core Notification Operations
  getMyNotifications(unreadOnly: boolean = false, limit: number = 50): Observable<Notification[]> {
    let params = new HttpParams();
    if (unreadOnly) {
      params = params.set('unreadOnly', 'true');
    }
    if (limit !== 50) {
      params = params.set('limit', limit.toString());
    }

    const url = params.toString() ? `${this.endpoint}/me?${params.toString()}` : `${this.endpoint}/me`;
    
    return this.get<Notification[]>(url).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unreadCount);
      })
    );
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.get<{ count: number }>(`${this.endpoint}/unread-count`).pipe(
      tap(response => this.unreadCountSubject.next(response.count))
    );
  }

  markAsRead(notificationId: number): Observable<NotificationResponse> {
    return this.put<NotificationResponse>(`${this.endpoint}/${notificationId}/mark-read`, {}).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(updatedNotifications);
        
        // Update unread count
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unreadCount);
      })
    );
  }

  markAllAsRead(): Observable<NotificationResponse> {
    return this.put<NotificationResponse>(`${this.endpoint}/mark-all-read`, {}).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  // Admin/HR Operations
  sendNotification(dto: SendNotificationDto): Observable<NotificationResponse> {
    return this.post<NotificationResponse>(`${this.endpoint}/send`, dto);
  }

  sendToHR(dto: SendBulkNotificationDto): Observable<NotificationResponse> {
    return this.post<NotificationResponse>(`${this.endpoint}/send-to-hr`, dto);
  }

  sendToRole(dto: SendRoleNotificationDto): Observable<NotificationResponse> {
    return this.post<NotificationResponse>(`${this.endpoint}/send-to-role`, dto);
  }

  notifyManager(dto: NotifyManagerDto): Observable<NotificationResponse> {
    return this.post<NotificationResponse>(`${this.endpoint}/notify-manager`, dto);
  }

  getAllNotifications(userId?: number, unreadOnly: boolean = false): Observable<Notification[]> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId.toString());
    }
    if (unreadOnly) {
      params = params.set('unreadOnly', 'true');
    }

    const url = params.toString() ? `${this.endpoint}?${params.toString()}` : this.endpoint;
    return this.get<Notification[]>(url);
  }

  deleteNotification(id: number): Observable<NotificationResponse> {
    return this.delete<NotificationResponse>(`${this.endpoint}/${id}`);
  }

  // Real-time Features
  startPolling(): void {
    if (this.isPollingActive) {
      return;
    }

    this.isPollingActive = true;
    
    // Initial load
    this.refreshNotifications();

    // Set up polling
    interval(this.pollingInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.getUnreadCount())
      )
      .subscribe();
  }

  stopPolling(): void {
    this.isPollingActive = false;
  }

  refreshNotifications(): void {
    this.getMyNotifications().subscribe();
  }

  // Helper Methods
  getNotificationsByType(actionType: string): Observable<Notification[]> {
    return this.getMyNotifications().pipe(
      tap(notifications => notifications.filter(n => n.actionType === actionType))
    );
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.getMyNotifications(true);
  }

  hasUnreadNotifications(): Observable<boolean> {
    return this.unreadCount$.pipe(
      map(count => count > 0)
    );
  }

  // Notification Type Helpers
  getPerformanceReviewNotifications(): Observable<Notification[]> {
    return this.getNotificationsByType('PerformanceReview');
  }

  getCareerRequestNotifications(): Observable<Notification[]> {
    return this.getNotificationsByType('CareerRequest');
  }

  getTrainingNotifications(): Observable<Notification[]> {
    return this.getNotificationsByType('Training');
  }

  getPromotionNotifications(): Observable<Notification[]> {
    return this.getNotificationsByType('Promotion');
  }

  // Bulk Operations
  markMultipleAsRead(notificationIds: number[]): Observable<void> {
    const markPromises = notificationIds.map(id => this.markAsRead(id).toPromise());
    return new Observable(observer => {
      Promise.all(markPromises)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  deleteMultipleNotifications(notificationIds: number[]): Observable<void> {
    const deletePromises = notificationIds.map(id => this.deleteNotification(id).toPromise());
    return new Observable(observer => {
      Promise.all(deletePromises)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  // Search and Filter
  searchNotifications(query: string, type?: string): Observable<Notification[]> {
    return this.getMyNotifications().pipe(
      tap(notifications => {
        let filtered = notifications.filter(n => 
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.message.toLowerCase().includes(query.toLowerCase())
        );

        if (type) {
          filtered = filtered.filter(n => n.actionType === type);
        }

        return filtered;
      })
    );
  }

  filterNotifications(filters: {
    actionType?: string;
    isRead?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }): Observable<Notification[]> {
    return this.getMyNotifications().pipe(
      tap(notifications => {
        let filtered = notifications;

        if (filters.actionType) {
          filtered = filtered.filter(n => n.actionType === filters.actionType);
        }

        if (filters.isRead !== undefined) {
          filtered = filtered.filter(n => n.isRead === filters.isRead);
        }

        if (filters.dateFrom) {
          filtered = filtered.filter(n => new Date(n.createdAt) >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          filtered = filtered.filter(n => new Date(n.createdAt) <= filters.dateTo!);
        }

        return filtered;
      })
    );
  }

  // Notification Templates for Common Actions
  notifyPerformanceReviewDue(employeeId: number, reviewId: number): Observable<NotificationResponse> {
    return this.notifyManager({
      employeeId,
      title: 'Performance Review Due',
      message: 'A performance review is due for your direct report',
      actionType: 'PerformanceReview',
      relatedEntityId: reviewId
    });
  }

  notifyCareerRequestSubmitted(requestId: number): Observable<NotificationResponse> {
    return this.sendToHR({
      title: 'New Career Request Submitted',
      message: 'A new career development request has been submitted and requires review',
      actionType: 'CareerRequest',
      relatedEntityId: requestId
    });
  }

  notifyTrainingCompleted(employeeId: number, trainingId: number): Observable<NotificationResponse> {
    return this.notifyManager({
      employeeId,
      title: 'Training Completed',
      message: 'Your direct report has completed a training program',
      actionType: 'Training',
      relatedEntityId: trainingId
    });
  }

  notifyPromotionApproved(employeeId: number, promotionId: number): Observable<NotificationResponse> {
    return this.sendNotification({
      userId: employeeId,
      title: 'Promotion Approved!',
      message: 'Congratulations! Your promotion request has been approved',
      actionType: 'Promotion',
      relatedEntityId: promotionId
    });
  }

  // Utility Methods
  formatNotificationDate(notification: Notification): string {
    const now = new Date();
    const notificationDate = new Date(notification.createdAt);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  }

  getNotificationIcon(actionType: string): string {
    const iconMap: { [key: string]: string } = {
      'PerformanceReview': 'assessment',
      'CareerRequest': 'trending_up',
      'Training': 'school',
      'Promotion': 'star',
      'SuccessionPlanning': 'people',
      'SkillDevelopment': 'psychology',
      'Default': 'notifications'
    };

    return iconMap[actionType] || iconMap['Default'];
  }

  getNotificationColor(actionType: string): string {
    const colorMap: { [key: string]: string } = {
      'PerformanceReview': '#2196F3',
      'CareerRequest': '#FF9800',
      'Training': '#4CAF50',
      'Promotion': '#9C27B0',
      'SuccessionPlanning': '#607D8B',
      'SkillDevelopment': '#3F51B5',
      'Default': '#757575'
    };

    return colorMap[actionType] || colorMap['Default'];
  }

  // Cleanup method
  destroy(): void {
    this.stopPolling();
    this.unreadCountSubject.complete();
    this.notificationsSubject.complete();
    this.newNotificationSubject.complete();
  }
}