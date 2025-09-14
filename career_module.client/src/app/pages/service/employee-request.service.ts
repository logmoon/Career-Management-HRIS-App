import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Employee } from './employee.service';

export interface EmployeeRequest {
  id: number;
  requesterId: number;
  targetEmployeeId?: number;
  requestType: string;
  status: 'Pending' | 'ManagerApproved' | 'HRApproved' | 'Rejected' | 'AutoApproved';
  approvedByManagerId?: number;
  approvedByHRId?: number;
  requestDate: string;
  managerApprovalDate?: string;
  hrApprovalDate?: string;
  rejectionReason?: string;
  notes?: string;
  
  // Navigation properties
  requester: Employee;
  targetEmployee?: Employee;
  approvedByManager?: Employee;
  approvedByHR?: Employee;
}

export interface CreateRequestDto {
  requesterId: number;
  targetEmployeeId?: number;
  requestType: string;
  notes?: string;
}

export interface ApprovalDto {
  notes?: string;
}

export interface RejectionDto {
  reason: string;
}

export interface RequestType {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeRequestService extends BaseApiService {
  private readonly endpoint = '/EmployeeRequests';

  /**
   * Create a new employee request
   * @param request The request data
   * @returns Observable of the created request
   */
  createRequest(request: CreateRequestDto): Observable<EmployeeRequest> {
    return this.post<EmployeeRequest>(this.endpoint, request);
  }

  /**
   * Get a specific request by ID
   * @param id The request ID
   * @returns Observable of the request
   */
  getRequestById(id: number): Observable<EmployeeRequest> {
    return this.get<EmployeeRequest>(`${this.endpoint}/${id}`);
  }

  /**
   * Get all requests made by the current user
   * @returns Observable of the user's requests
   */
  getMyRequests(): Observable<EmployeeRequest[]> {
    return this.get<EmployeeRequest[]>(`${this.endpoint}/my-requests`);
  }

  /**
   * Get all pending requests that the current user can approve
   * @returns Observable of pending requests
   */
  getPendingRequests(): Observable<EmployeeRequest[]> {
    return this.get<EmployeeRequest[]>(`${this.endpoint}/pending`);
  }

  /**
   * Approve a request
   * @param id The request ID
   * @param approval Approval data with optional notes
   * @returns Observable of the updated request
   */
  approveRequest(id: number, approval: ApprovalDto = {}): Observable<EmployeeRequest> {
    return this.put<EmployeeRequest>(`${this.endpoint}/${id}/approve`, approval);
  }

  /**
   * Reject a request
   * @param id The request ID
   * @param rejection Rejection data with reason
   * @returns Observable of the updated request
   */
  rejectRequest(id: number, rejection: RejectionDto): Observable<EmployeeRequest> {
    return this.put<EmployeeRequest>(`${this.endpoint}/${id}/reject`, rejection);
  }

  /**
   * Get available request types
   * @returns Observable of request types
   */
  getRequestTypes(): Observable<RequestType[]> {
    return this.get<RequestType[]>(`${this.endpoint}/types`);
  }

  // Utility methods for better UX

  /**
   * Check if a request can be approved by the current user
   * @param request The employee request
   * @param currentEmployeeId Current user's employee ID
   * @param currentUserRole Current user's role
   * @returns True if the request can be approved
   */
  canApprove(request: EmployeeRequest, currentEmployeeId: number, currentUserRole: string): boolean {
    if (request.status === 'Pending') {
      // Can approve as manager
      const isManager = request.targetEmployee?.managerId === currentEmployeeId || 
                       request.requester.managerId === currentEmployeeId;
      // Can approve as HR/Admin
      const isHROrAdmin = currentUserRole === 'HR' || currentUserRole === 'Admin';
      
      return isManager || isHROrAdmin;
    } else if (request.status === 'ManagerApproved') {
      // Only HR/Admin can give final approval
      return currentUserRole === 'HR' || currentUserRole === 'Admin';
    }
    
    return false;
  }

  /**
   * Check if a request can be rejected by the current user
   * @param request The employee request
   * @param currentEmployeeId Current user's employee ID
   * @param currentUserRole Current user's role
   * @returns True if the request can be rejected
   */
  canReject(request: EmployeeRequest, currentEmployeeId: number, currentUserRole: string): boolean {
    if (request.status === 'Pending') {
      // Can reject as manager
      const isManager = request.targetEmployee?.managerId === currentEmployeeId || 
                       request.requester.managerId === currentEmployeeId;
      // Can reject as HR/Admin
      const isHROrAdmin = currentUserRole === 'HR' || currentUserRole === 'Admin';
      
      return isManager || isHROrAdmin;
    } else if (request.status === 'ManagerApproved') {
      // Only HR/Admin can reject after manager approval
      return currentUserRole === 'HR' || currentUserRole === 'Admin';
    }
    
    return false;
  }

  /**
   * Get a human-readable status description
   * @param status The request status
   * @returns Formatted status string
   */
  getStatusDisplay(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Pending Approval';
      case 'ManagerApproved':
        return 'Manager Approved';
      case 'HRApproved':
        return 'Approved';
      case 'Rejected':
        return 'Rejected';
      case 'AutoApproved':
        return 'Auto Approved';
      default:
        return status;
    }
  }

  /**
   * Get CSS class for status styling
   * @param status The request status
   * @returns CSS class name
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'ManagerApproved':
        return 'status-manager-approved';
      case 'HRApproved':
      case 'AutoApproved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Get the next approver information for a request
   * @param request The employee request
   * @returns Information about who needs to approve next
   */
  getNextApprover(request: EmployeeRequest): string {
    switch (request.status) {
      case 'Pending':
        if (request.targetEmployee?.managerId || request.requester.managerId) {
          return 'Awaiting Manager Approval';
        }
        return 'Awaiting HR Approval';
      case 'ManagerApproved':
        return 'Awaiting HR Approval';
      case 'HRApproved':
      case 'AutoApproved':
        return 'Fully Approved';
      case 'Rejected':
        return 'Rejected';
      default:
        return 'Unknown Status';
    }
  }

  /**
   * Format request type for display
   * @param requestType The request type value
   * @returns Formatted request type
   */
  formatRequestType(requestType: string): string {
    switch (requestType) {
      case 'Promotion':
        return 'Promotion Request';
      case 'DepartmentChange':
        return 'Department Change';
      case 'Training':
        return 'Training Request';
      case 'LeaveRequest':
        return 'Leave Request';
      case 'SalaryReview':
        return 'Salary Review';
      case 'RoleChange':
        return 'Role Change';
      case 'Other':
        return 'Other Request';
      default:
        return requestType;
    }
  }

  /**
   * Check if the current user can view a specific request
   * @param request The employee request
   * @param currentEmployeeId Current user's employee ID
   * @param currentUserRole Current user's role
   * @returns True if the user can view the request
   */
  canView(request: EmployeeRequest, currentEmployeeId: number, currentUserRole: string): boolean {
    // HR and Admin can view all requests
    if (currentUserRole === 'HR' || currentUserRole === 'Admin') {
      return true;
    }

    // Users can view their own requests
    if (request.requesterId === currentEmployeeId) {
      return true;
    }

    // Users can view requests targeting them
    if (request.targetEmployeeId === currentEmployeeId) {
      return true;
    }

    // Managers can view requests from their direct reports
    const isManagerOfRequester = request.requester.managerId === currentEmployeeId;
    const isManagerOfTarget = request.targetEmployee?.managerId === currentEmployeeId;

    return isManagerOfRequester || isManagerOfTarget;
  }
}