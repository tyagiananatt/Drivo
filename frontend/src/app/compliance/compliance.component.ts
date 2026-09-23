import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compliance.component.html',
  styleUrl: './compliance.component.css'
})
export class ComplianceComponent implements OnInit {
  documents: any[] = [];
  blockedDrivers: any[] = [];
  blockedVehicles: any[] = [];
  isLoading = true;
  isRunningCheck = false;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.isLoading = true;
    this.apiService.getComplianceAlerts().subscribe({
      next: (data) => {
        this.documents = data.documents;
        this.blockedDrivers = data.blockedDrivers;
        this.blockedVehicles = data.blockedVehicles;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to load compliance alerts');
        this.isLoading = false;
      }
    });
  }

  runCheck() {
    this.isRunningCheck = true;
    this.apiService.runComplianceCheck().subscribe({
      next: () => {
        this.toastService.success('Success', 'Compliance scanner finished running.');
        this.loadAlerts();
        this.isRunningCheck = false;
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to run compliance check');
        this.isRunningCheck = false;
      }
    });
  }
}
