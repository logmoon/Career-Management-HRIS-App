import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface EmployeeRequest {
  id: number;
  requesterId: number;
  requesterName: string;
  targetEmployeeId?: number;
  targetEmployeeName?: string;
  requestType: string;
  status: string;
  requestDate: string;
  effectiveDate?: string;
  processedDate?: string;
  approvedByManagerName?: string;
  approvedByHRName?: string;
  managerApprovalDate?: string;
  hrApprovalDate?: string;
  rejectionReason?: string;
  notes?: string;
  requestData: { [key: string]: any }; // Dynamic request-specific data
}

// For creating new requests
export interface CreateEmployeeRequestDto {
  requestType: string;
  requesterId?: number; // 0 means current user
  targetEmployeeId?: number;
  effectiveDate?: string;
  notes?: string;

  // Promotion fields
  newPositionId?: number;
  proposedSalary?: number;
  justification?: string;

  // Department/Transfer fields
  newDepartmentId?: number;
  newManagerId?: number;
  reason?: string;
}

// Available request types
export interface RequestType {
  value: string;
  label: string;
  description: string;
}

// Action DTOs
export interface ApprovalDto {
  notes?: string;
}

export interface RejectionDto {
  reason: string;
}

// Convenience DTOs for specific request types
export interface CreatePositionChangeRequestDto {
  requesterId?: number;
  targetEmployeeId: number;
  newPositionId: number;
  newManagerId?: number;
  proposedSalary?: number;
  justification?: string;
  effectiveDate?: string;
}

export interface CreateDepartmentChangeRequestDto {
  requesterId?: number;
  targetEmployeeId: number;
  newDepartmentId: number;
  newManagerId?: number;
  reason?: string;
  effectiveDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeRequestService extends BaseApiService {
  private readonly endpoint = '/employeerequests';

  /**
   * Get available request types
   */
  getRequestTypes(): Observable<RequestType[]> {
    return this.get<RequestType[]>(`${this.endpoint}/types`);
  }

  /**
   * Create a new employee request
   * @param requestData The request data including requestType and specific fields
   */
  createRequest(requestData: CreateEmployeeRequestDto): Observable<EmployeeRequest> {
    return this.post<EmployeeRequest>(this.endpoint, requestData);
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
   * Cancel a request (only by the requester)
   * @param id The request ID
   */
  cancelRequest(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

   /**
   * Check if a request can be canceled
   * @param request The employee request
   * @param currentUserId The current user's ID
   */
  canCancelRequest(request: EmployeeRequest, currentUserId: number): boolean {
    return request.requesterId === currentUserId && 
           (request.status === 'Pending' || request.status === 'ManagerApproved');
  }

  /**
   * Check if a request can be approved by the current user as a manager
   * @param request The employee request
   * @param currentEmployeeId The current user's employee ID
   * @param targetEmployeeManagerId The target employee's manager ID (optional, for optimization)
   * @param requesterManagerId The requester's manager ID (optional, for optimization)
   */
  canApproveAsManager(request: EmployeeRequest, currentEmployeeId: number, targetEmployeeManagerId?: number, requesterManagerId?: number): boolean {
    if (request.status === 'Canceled') return false;

    return request.status === 'Pending' &&
           request.requesterId !== request.targetEmployeeId &&
           (
             // Manager of the target employee (if different from requester)
             (request.targetEmployeeId && targetEmployeeManagerId === currentEmployeeId) ||
             // Manager of the requester (for self-requests or when target is same as requester)
             (requesterManagerId === currentEmployeeId)
           );
  }

  /**
   * Check if a request can be approved by the current user as HR
   * @param request The employee request
   * @param currentUserRole The current user's role
   */
  canApproveAsHR(request: EmployeeRequest, currentUserRole: string): boolean {
    if (request.status === 'Canceled') return false;

    return (request.status === 'ManagerApproved' || request.status === 'Pending') &&
           (currentUserRole === 'HR' || currentUserRole === 'Admin') && 
           request.requesterId !== request.targetEmployeeId;
  }

  /**
   * Check if the current user can reject a request
   * @param request The employee request
   * @param currentEmployeeId The current user's employee ID
   * @param currentUserRole The current user's role
   * @param targetEmployeeManagerId The target employee's manager ID (optional)
   * @param requesterManagerId The requester's manager ID (optional)
   */
  canRejectRequest(request: EmployeeRequest, currentEmployeeId: number, currentUserRole: string, targetEmployeeManagerId?: number, requesterManagerId?: number): boolean {
    if (request.status === 'Canceled') return false;

    // Can reject if they can approve as manager or HR
    return this.canApproveAsManager(request, currentEmployeeId, targetEmployeeManagerId, requesterManagerId) ||
           this.canApproveAsHR(request, currentUserRole);
  }

  /**
   * Create a promotion request (convenience method)
   * @param requestData The promotion request data
   */
  createPositionChangeRequest(requestData: CreatePositionChangeRequestDto): Observable<EmployeeRequest> {
    return this.post<EmployeeRequest>(`${this.endpoint}/position-change`, requestData);
  }

  /**
   * Create a department change request (convenience method)
   * @param requestData The department change request data
   */
  createDepartmentChangeRequest(requestData: CreateDepartmentChangeRequestDto): Observable<EmployeeRequest> {
    return this.post<EmployeeRequest>(`${this.endpoint}/department-change`, requestData);
  }

  /**
   * Get request-specific data with type safety
   * @param request The employee request
   * @param key The key to retrieve from requestData
   */
  getRequestData<T = any>(request: EmployeeRequest, key: string): T | undefined {
    return request.requestData[key] as T;
  }

  /**
   * Check if request has specific data field
   * @param request The employee request
   * @param key The key to check
   */
  hasRequestData(request: EmployeeRequest, key: string): boolean {
    return key in request.requestData && request.requestData[key] !== null && request.requestData[key] !== undefined;
  }

  /**
   * Get promotion-specific data from request
   * @param request The employee request (should be promotion type)
   */
  getPositionChangeData(request: EmployeeRequest): {
    newPositionId?: number;
    proposedSalary?: number;
    justification?: string;
    newManagerId?: number;
  } {
    return {
      newPositionId: this.getRequestData<number>(request, 'newPositionId'),
      proposedSalary: this.getRequestData<number>(request, 'proposedSalary'),
      justification: this.getRequestData<string>(request, 'justification'),
      newManagerId: this.getRequestData<number>(request, 'newManagerId')
    };
  }

  /**
   * Get department change specific data from request
   * @param request The employee request (should be department change type)
   */
  getDepartmentChangeData(request: EmployeeRequest): {
    newDepartmentId?: number;
    newManagerId?: number;
    reason?: string;
  } {
    return {
      newDepartmentId: this.getRequestData<number>(request, 'newDepartmentId'),
      newManagerId: this.getRequestData<number>(request, 'newManagerId'),
      reason: this.getRequestData<string>(request, 'reason')
    };
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
      case 'Canceled':
        return 'Canceled';
      default:
        return status;
    }
  }

  /**
   * Get status badge class for styling
   * @param status The request status
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'ManagerApproved':
        return 'badge-info';
      case 'HRApproved':
      case 'AutoApproved':
        return 'badge-success';
      case 'Rejected':
        return 'badge-danger';
      case 'Canceled':
        return 'badge-secondary';
      default:
        return 'badge-light';
    }
  }

  /**
   * Check if a request is in a final state (approved, rejected, or canceled)
   * @param status The request status
   */
  isRequestFinal(status: string): boolean {
    return ['HRApproved', 'Rejected', 'AutoApproved', 'Canceled'].includes(status);
  }

  /**
   * Check if a request is still pending approval
   * @param status The request status
   */
  isRequestPending(status: string): boolean {
    return status === 'Pending' || status === 'ManagerApproved';
  }

  /**
   * Get request type display information
   * @param requestType The request type string
   */
  getRequestTypeInfo(requestType: string): { label: string; icon: string; color: string } {
    switch (requestType) {
      case 'PositionChange':
        return { label: 'Position Change', icon: 'trending-up', color: 'success' };
      case 'DepartmentChange':
        return { label: 'Department Change', icon: 'shuffle', color: 'info' };
      case 'Transfer':
        return { label: 'Transfer', icon: 'move', color: 'warning' };
      default:
        return { label: requestType, icon: 'help-circle', color: 'secondary' };
    }
  }

  /**
   * Format request summary for display
   * @param request The employee request
   */
  getRequestSummary(request: EmployeeRequest): string {
    const targetName = request.targetEmployeeName || request.requesterName;
    
    switch (request.requestType) {
      case 'PositionChange':
        const data = this.getPositionChangeData(request);
        return `Position change request for ${targetName}${data.proposedSalary ? ` (${data.proposedSalary})` : ''}`;
      
      case 'DepartmentChange':
        return `Department change request for ${targetName}`;
      
      case 'Transfer':
        return `Transfer request for ${targetName}`;
      
      default:
        return `${request.requestType} request for ${targetName}`;
    }
  }

  /**
   * Build create request DTO for specific request type
   * @param requestType The type of request
   * @param baseData Common request data
   * @param specificData Request-type specific data
   */
  buildCreateRequestDto(
    requestType: string,
    baseData: Partial<CreateEmployeeRequestDto>,
    specificData: any
  ): CreateEmployeeRequestDto {
    const dto: CreateEmployeeRequestDto = {
      ...baseData,
      requestType
    };

    // Add type-specific fields
    switch (requestType) {
      case 'PositionChange':
        Object.assign(dto, {
          newPositionId: specificData.newPositionId,
          proposedSalary: specificData.proposedSalary,
          justification: specificData.justification,
          newManagerId: specificData.newManagerId
        });
        break;

      case 'DepartmentChange':
      case 'Transfer':
        Object.assign(dto, {
          newDepartmentId: specificData.newDepartmentId,
          newManagerId: specificData.newManagerId,
          reason: specificData.reason
        });
        break;
    }

    return dto;
  }
}