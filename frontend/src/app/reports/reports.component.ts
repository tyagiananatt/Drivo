import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  stats: any = null;
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to load report data');
        this.isLoading = false;
      }
    });
  }

  exportCSV() {
    if (!this.stats) return;

    this.toastService.success('Export Started', 'Your report is being generated and will download shortly.');
    
    let csv = 'Report Category,Metric,Value\n';
    
    // Executive Summary
    csv += `Executive Summary,Total Vehicles,${this.stats.totalVehicles}\n`;
    csv += `Executive Summary,Active Drivers,${this.stats.activeDrivers}\n`;
    csv += `Executive Summary,Sub-Vendors,${this.stats.subVendors}\n`;
    csv += `Executive Summary,Compliance Alerts,${this.stats.complianceAlerts}\n`;
    
    // Vehicle Status
    csv += `Vehicle Status,Active,${this.stats.vehicleStatusBreakdown?.active || 0}\n`;
    csv += `Vehicle Status,Pending,${this.stats.vehicleStatusBreakdown?.pending || 0}\n`;
    csv += `Vehicle Status,Inactive,${this.stats.vehicleStatusBreakdown?.inactive || 0}\n`;

    // Driver Assignment
    csv += `Driver Assignment,Assigned,${this.stats.driverAssignment?.assigned || 0}\n`;
    csv += `Driver Assignment,Unassigned,${this.stats.driverAssignment?.unassigned || 0}\n`;

    // Create Blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
