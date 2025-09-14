import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee } from './employee.service';
import { AuthService } from './auth.service';

// Interfaces
export interface PerformanceReview {
  id: number;
  employeeId: number;
  reviewerId: number;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  overallRating: number; // 1-5 scale
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  status: string; // Draft, Completed, Approved
  createdAt: Date;
  updatedAt: Date;
  employee?: Employee;
  reviewer?: Employee;
}


export interface CreatePerformanceReviewDto {
  employeeId: number;
  reviewerId: number;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
}

export interface UpdatePerformanceReviewDto {
  overallRating: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  status?: string;
}

export interface PerformanceHistoryDto {
  reviewId: number;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  rating: number;
  status: string;
}

export interface PerformanceAnalyticsDto {
  employeeId: number;
  employeeName: string;
  totalReviews: number;
  averageRating: number;
  latestRating: number;
  departmentAverage: number;
  ratingTrend: string; // Improving, Declining, Stable
  performanceHistory: PerformanceHistoryDto[];
}

export interface ReviewTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

export interface RatingScale {
  value: number;
  label: string;
  description: string;
  color: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  isSuccess: boolean;
  errorMessage?: string;
}

export interface AverageRatingResponse {
  employeeId: number;
  averageRating: number;
  reviewCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceReviewService extends BaseApiService {
  private readonly endpoint = '/PerformanceReview';

  constructor(http: HttpClient, authService: AuthService) {
    super(http, authService);
  }

  // Get reviews with optional filters
  getReviews(status?: string, employeeId?: number, reviewerId?: number): Observable<PerformanceReview[]> {
    let params = new HttpParams();
    
    if (status) {
      params = params.set('status', status);
    }
    if (employeeId) {
      params = params.set('employeeId', employeeId.toString());
    }
    if (reviewerId) {
      params = params.set('reviewerId', reviewerId.toString());
    }

    const url = params.toString() ? `${this.endpoint}?${params.toString()}` : this.endpoint;
    return this.get<PerformanceReview[]>(url);
  }

  // Get review by ID
  getReviewById(id: number): Observable<PerformanceReview> {
    return this.get<PerformanceReview>(`${this.endpoint}/${id}`);
  }

  // Create new review
  createReview(dto: CreatePerformanceReviewDto): Observable<PerformanceReview> {
    return this.post<PerformanceReview>(this.endpoint, dto);
  }

  // Update existing review
  updateReview(id: number, dto: UpdatePerformanceReviewDto): Observable<PerformanceReview> {
    return this.put<PerformanceReview>(`${this.endpoint}/${id}`, dto);
  }

  // Submit review
  submitReview(id: number): Observable<{ message: string; review: PerformanceReview }> {
    return this.post<{ message: string; review: PerformanceReview }>(`${this.endpoint}/${id}/submit`, {});
  }

  // Approve review (HR/Admin only)
  approveReview(id: number): Observable<{ message: string; review: PerformanceReview }> {
    return this.post<{ message: string; review: PerformanceReview }>(`${this.endpoint}/${id}/approve`, {});
  }

  // Get employee review history
  getEmployeeReviewHistory(employeeId: number): Observable<PerformanceReview[]> {
    return this.get<PerformanceReview[]>(`${this.endpoint}/employee/${employeeId}/history`);
  }

  // Get pending reviews for current user
  getPendingReviews(): Observable<PerformanceReview[]> {
    return this.get<PerformanceReview[]>(`${this.endpoint}/pending`);
  }

  // Get employee average rating
  getEmployeeAverageRating(employeeId: number, lastNReviews?: number): Observable<AverageRatingResponse> {
    let params = new HttpParams();
    if (lastNReviews) {
      params = params.set('lastNReviews', lastNReviews.toString());
    }

    const url = params.toString() 
      ? `${this.endpoint}/employee/${employeeId}/average-rating?${params.toString()}`
      : `${this.endpoint}/employee/${employeeId}/average-rating`;
    
    return this.get<AverageRatingResponse>(url);
  }

  // Get performance analytics
  getPerformanceAnalytics(employeeId: number): Observable<PerformanceAnalyticsDto> {
    return this.get<PerformanceAnalyticsDto>(`${this.endpoint}/employee/${employeeId}/analytics`);
  }

  // Get review templates
  getReviewTemplates(): Observable<ReviewTemplate[]> {
    return this.get<ReviewTemplate[]>(`${this.endpoint}/templates`);
  }

  // Get rating scale
  getRatingScale(): Observable<RatingScale[]> {
    return this.get<RatingScale[]>(`${this.endpoint}/rating-scale`);
  }

  // Delete review (HR/Admin only)
  deleteReview(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

  // Helper methods for common filtering
  getReviewsByEmployee(employeeId: number): Observable<PerformanceReview[]> {
    return this.getReviews(undefined, employeeId);
  }

  getReviewsByReviewer(reviewerId: number): Observable<PerformanceReview[]> {
    return this.getReviews(undefined, undefined, reviewerId);
  }

  getReviewsByStatus(status: string): Observable<PerformanceReview[]> {
    return this.getReviews(status);
  }

  getDraftReviews(): Observable<PerformanceReview[]> {
    return this.getReviewsByStatus('Draft');
  }

  getCompletedReviews(): Observable<PerformanceReview[]> {
    return this.getReviewsByStatus('Completed');
  }

  getApprovedReviews(): Observable<PerformanceReview[]> {
    return this.getReviewsByStatus('Approved');
  }
}