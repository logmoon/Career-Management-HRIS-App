import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  standalone: true,
  selector: 'app-talent-risks-widget',
  imports: [CommonModule, TableModule, ButtonModule, TagModule, AvatarModule, ProgressBarModule],
  template: `
    <div class="card mb-0">
      <div class="font-semibold text-xl mb-4">Talent & Attrition Risks</div>
      
      <!-- Talent Risks Table -->
      <div *ngIf="talentRisks && talentRisks.length > 0" class="mb-6">
        <h5 class="font-medium mb-3">High-Risk Employees</h5>
        <p-table [value]="talentRisks.slice(0, 5)" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>Employee</th>
              <th>Risk Type</th>
              <th>Level</th>
              <th>Impact</th>
              <th>Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-risk>
            <tr>
              <td>
                <div class="flex items-center gap-2">
                  <p-avatar [label]="getEmployeeInitials(risk.employee)" size="normal"></p-avatar>
                  <span class="font-medium">{{ risk.employee?.firstName }} {{ risk.employee?.lastName }}</span>
                </div>
              </td>
              <td>{{ risk.riskType }}</td>
              <td>
                <p-tag [value]="risk.riskLevel" [severity]="getRiskSeverity(risk.riskLevel)"></p-tag>
              </td>
              <td class="text-sm">{{ risk.impact }}</td>
              <td>
                <button pButton type="button" icon="pi pi-eye" 
                        class="p-button-text p-button-sm"
                        pTooltip="View Details">
                </button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Attrition Risks -->
      <div *ngIf="attritionRisks && attritionRisks.length > 0">
        <h5 class="font-medium mb-3">Attrition Risk Assessment</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let risk of attritionRisks.slice(0, 4)" 
               class="border border-surface-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <h6 class="font-medium m-0">
                {{ risk.employee?.firstName }} {{ risk.employee?.lastName }}
              </h6>
              <p-tag [value]="risk.riskLevel" [severity]="getRiskSeverity(risk.riskLevel)"></p-tag>
            </div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm">Risk Score:</span>
              <p-progressBar [value]="risk.riskScore" styleClass="flex-grow-1" style="height: 6px;"></p-progressBar>
              <span class="text-sm font-bold">{{ risk.riskScore }}%</span>
            </div>
            <div class="text-sm text-muted-color">
              <div *ngFor="let factor of risk.riskFactors.slice(0, 2)">• {{ factor }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="(!talentRisks || talentRisks.length === 0) && (!attritionRisks || attritionRisks.length === 0)" 
           class="text-center py-8">
        <i class="pi pi-shield text-4xl text-green-500 mb-4"></i>
        <div class="text-lg font-medium text-surface-900 mb-2">No Immediate Risks Detected</div>
        <p class="text-muted-color">All employees appear to be performing well with low attrition risk.</p>
      </div>
    </div>
  `
})
export class TalentRisksWidget {
  @Input() talentRisks: any[] = [];
  @Input() attritionRisks: any[] = [];

  getRiskSeverity(riskLevel: string): string {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  }

  getEmployeeInitials(employee: any): string {
    if (!employee) return 'U';
    const firstName = employee.firstName || '';
    const lastName = employee.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
}