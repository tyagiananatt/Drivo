import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assignments.component.html',
  styleUrl: './assignments.component.css'
})
export class AssignmentsComponent implements OnInit {
  assignments: any[] = [];
  drivers: any[] = [];
  vehicles: any[] = [];

  selectedDriverId = '';
  selectedVehicleId = '';
  isAssigning = false;
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    // We will need to implement getAssignments in ApiService
    this.apiService.getAssignments().subscribe({
      next: (res) => {
        this.assignments = res;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });

    this.apiService.getDrivers().subscribe(res => this.drivers = res);
    this.apiService.getVehicles().subscribe(res => this.vehicles = res);
  }

  assign() {
    if (!this.selectedDriverId || !this.selectedVehicleId) {
      this.toastService.error('Error', 'Please select both a driver and a vehicle');
      return;
    }

    this.isAssigning = true;
    this.apiService.createAssignment(this.selectedDriverId, this.selectedVehicleId).subscribe({
      next: () => {
        this.toastService.success('Success', 'Driver assigned to vehicle successfully');
        this.selectedDriverId = '';
        this.selectedVehicleId = '';
        this.isAssigning = false;
        this.loadData();
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to assign');
        this.isAssigning = false;
      }
    });
  }

  endAssignment(id: string) {
    this.apiService.endAssignment(id).subscribe({
      next: () => {
        this.toastService.success('Success', 'Assignment ended');
        this.loadData();
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to end assignment');
      }
    });
  }
}
