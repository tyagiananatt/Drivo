import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  
  vendors: any[] = [];
  isLoading = true;
  error = '';
  
  // Modal state
  vendorToDelete: any = null;
  isDeleting = false;

  ngOnInit() {
    this.loadVendors();
  }

  loadVendors() {
    this.isLoading = true;
    this.apiService.getAllVendorsAdmin().subscribe({
      next: (res) => {
        this.vendors = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load vendors or you do not have permission.';
        this.isLoading = false;
      }
    });
  }

  confirmDelete(vendor: any) {
    this.vendorToDelete = vendor;
  }

  cancelDelete() {
    this.vendorToDelete = null;
  }

  executeDelete() {
    if (!this.vendorToDelete) return;
    this.isDeleting = true;
    
    this.apiService.deleteVendorAdmin(this.vendorToDelete.id).subscribe({
      next: (res) => {
        this.vendors = this.vendors.filter(v => v.id !== this.vendorToDelete.id);
        this.isDeleting = false;
        this.vendorToDelete = null;
      },
      error: (err) => {
        alert('Failed to delete vendor.');
        this.isDeleting = false;
      }
    });
  }
}
