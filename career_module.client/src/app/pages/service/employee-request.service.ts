import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee } from './employee.service';
import { CareerPath } from './career-path.service';
import { Department } from './department.service';

// Interfaces for the service
export interface EmployeeRequest {
  id: number;
  requesterId: number;
  targetEmployeeId?: number;
  requestType: string;
  status: string; // Pending, ManagerApproved, HRApproved, Rejected, AutoApproved
  approvedByManagerId?: number;
  approvedByHRId?: number;
  requestDate: string;
  managerApprovalDate?: string;
  hrApprovalDate?: string;
  processedDate?: string;
  rejectionReason?: string;
  notes?: string;
  requester: Employee;
  targetEmployee?: Employee;
  approvedByManager?: Employee;
  approvedByHR?: Employee;
}

export interface PromotionRequest extends EmployeeRequest {
  careerPathId: number;
  newManagerId?: number;
  proposedSalary?: number;
  justification?: string;
  effectiveDate?: string;
  careerPath: CareerPath;
  newManager?: Employee;
}

export interface DepartmentChangeRequest extends EmployeeRequest {
  newDepartmentId: number;
  newManagerId?: number;
  reason?: string;
  effectiveDate?: string;
  newDepartment: Department;
  newManager?: Employee;
}

export interface RequestType {
  value: string;
  label: string;
  description: string;
}

export interface ApprovalDto {
  notes?: string;
}

export interface RejectionDto {
  reason: string;
}

export interface CreatePromotionRequestDto {
  requesterId?: number;
  targetEmployeeId: number;
  careerPathId: number;
  newManagerId?: number;
  proposedSalary?: number;
  justification?: string;
}

export interface CreateDepartmentChangeRequestDto {
  requesterId?: number;
  targetEmployeeId: number;
  newDepartmentId: number;
  newManagerId?: number;
  reason?: string;
}

export interface CreateRequestDto {
  requestType: string;
  requesterId?: number;
  targetEmployeeId?: number;
  [key: string]: any; // Allow additional properties based on request type
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeRequestService extends BaseApiService {
  private readonly endpoint = '/employeerequests';

  /**
   * Create a new employee request
   * @param requestData The request data including requestType and specific fields
   */
  createRequest(requestData: CreateRequestDto): Observable<EmployeeRequest> {
    return this.post<EmployeeRequest>(this.endpoint, requestData);
  }

  /**
   * Cancel employee request
   */
  cancelRequest(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

  /**
   * Get a specific request by ID
   * @param id The request ID
   */
  getRequestById(id: number): Observable<EmployeeRequest> {
    return this.get<EmployeeRequest>(`${this.endpoint}/${id}`);
  }

  /**
   * Get all requests created by the current user
   */
  getMyRequests(): Observable<EmployeeRequest[]> {
    return this.get<EmployeeRequest[]>(`${this.endpoint}/my-requests`);
  }

  /**
   * Get pending requests that the current user can approve
   */
  getPendingRequests(): Observable<EmployeeRequest[]> {
    return this.get<EmployeeRequest[]>(`${this.endpoint}/pending`);
  }

  /**
   * Approve a request
   * @param id The request ID
   * @param approvalData Optional notes for the approval
   */
  approveRequest(id: number, approvalData: ApprovalDto = {}): Observable<EmployeeRequest> {
    return this.put<EmployeeRequest>(`${this.endpoint}/${id}/approve`, approvalData);
  }

  /**
   * Reject a request
   * @param id The request ID
   * @param rejectionData The rejection reason and optional notes
   */
  rejectRequest(id: number, rejectionData: RejectionDto): Observable<EmployeeRequest> {
    return this.put<EmployeeRequest>(`${this.endpoint}/${id}/reject`, rejectionData);
  }

  /**
   * Create a promotion request (convenience method)
   * @param requestData The promotion request data
   */
  createPromotionRequest(requestData: CreatePromotionRequestDto): Observable<PromotionRequest> {
    return this.post<PromotionRequest>(`${this.endpoint}/promotion`, requestData);
  }

  /**
   * Create a department change request (convenience method)
   * @param requestData The department change request data
   */
  createDepartmentChangeRequest(requestData: CreateDepartmentChangeRequestDto): Observable<DepartmentChangeRequest> {
    return this.post<DepartmentChangeRequest>(`${this.endpoint}/department-change`, requestData);
  }

  // Utility methods for working with requests

  /**
   * Check if a request can be approved by the current user as a manager
   * @param request The employee request
   * @param currentEmployeeId The current user's employee ID
   */
  canApproveAsManager(request: EmployeeRequest, currentEmployeeId: number): boolean {
    if (request.status === 'Canceled') return false;
    return request.requesterId !== request.targetEmployeeId && request.status === 'Pending' &&
           ((request.targetEmployee?.managerId === currentEmployeeId) ||
            (request.requester.managerId === currentEmployeeId));
  }

  /**
   * Check if a request can be approved by the current user as HR
   * @param request The employee request
   * @param currentUserRole The current user's role
   */
  canApproveAsHR(request: EmployeeRequest, currentUserRole: string): boolean {
    if (request.status === 'Canceled') return false;
    return request.requesterId !== request.targetEmployeeId && (request.status === 'ManagerApproved' || request.status === 'Pending') &&
           (currentUserRole === 'HR' || currentUserRole === 'Admin');
  }

  /**
   * Get the status display text for a request
   * @param status The request status
   */
  getStatusDisplayText(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Pending Approval';
      case 'ManagerApproved':
        return 'Manager Approved (Pending HR)';
      case 'HRApproved':
        return 'Approved & Processed';
      case 'Rejected':
        return 'Rejected';
      case 'AutoApproved':
        return 'Auto Approved & Processed';
      default:
        return status;
    }
  }

  /**
   * Check if a request is in a final state (approved or rejected)
   * @param status The request status
   */
  isRequestFinal(status: string): boolean {
    return status === 'HRApproved' || status === 'Rejected' || status === 'AutoApproved';
  }

  /**
   * Check if a request is still pending approval
   * @param status The request status
   */
  isRequestPending(status: string): boolean {
    return status === 'Pending' || status === 'ManagerApproved';
  }
}