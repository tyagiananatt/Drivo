import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-detail.component.html',
  styleUrl: './vendor-detail.component.css'
})
export class VendorDetailComponent implements OnInit {
  vendorId: string | null = null;
  vendorDetails: any = null;
  stats: any = null;

  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.vendorId = params.get('id');
      if (this.vendorId) {
        this.loadVendorData();
      }
    });
  }

  loadVendorData() {
    this.isLoading = true;
    
    // Load Details
    this.apiService.getVendorDetails(this.vendorId!).subscribe({
      next: (details) => {
        this.vendorDetails = details;
        
        // Load Stats
        this.apiService.getVendorStats(this.vendorId!).subscribe({
          next: (stats) => {
            this.stats = stats;
            // Ensure default structures exist
            this.stats.vehicleStatusBreakdown = this.stats.vehicleStatusBreakdown || { active: 0, pending: 0, inactive: 0 };
            this.stats.driverAssignment = this.stats.driverAssignment || { assigned: 0, unassigned: 0 };
            this.stats.recentOnboardings = this.stats.recentOnboardings || [];
            this.isLoading = false;
          },
          error: (err) => {
            this.toastService.error('Error', err.error?.message || 'Failed to load vendor stats');
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to load vendor details');
        this.isLoading = false;
      }
    });
  }
}
