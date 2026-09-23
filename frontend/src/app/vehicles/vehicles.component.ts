import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.css'
})
export class VehiclesComponent implements OnInit {
  vehicles: any[] = [];
  showAddModal = false;
  newVehicle = {
    registrationNumber: '', manufacturer: '', model: '',
    vehicleType: 'Sedan', seatingCapacity: 4, fuelType: 'Petrol', manufacturingYear: new Date().getFullYear()
  };

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.apiService.getVehicles().subscribe({
      next: (data) => this.vehicles = data,
      error: (err) => this.toastService.error('Error', err.error?.message || 'Failed to load vehicles')
    });
  }

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.newVehicle = { registrationNumber: '', manufacturer: '', model: '', vehicleType: 'Sedan', seatingCapacity: 4, fuelType: 'Petrol', manufacturingYear: new Date().getFullYear() };
  }

  submitNewVehicle() {
    this.apiService.createVehicle(this.newVehicle).subscribe({
      next: () => {
        this.toastService.success('Success', 'Vehicle added successfully!');
        this.closeAddModal();
        this.loadVehicles();
      },
      error: (err) => this.toastService.error('Error', err.error?.message || 'Failed to add vehicle')
    });
  }

  approveVehicle(id: string) {
    this.apiService.updateVehicle(id, { status: 'ACTIVE' }).subscribe({
      next: () => {
        this.toastService.success('Success', 'Vehicle approved successfully!');
        this.loadVehicles();
      },
      error: (err) => this.toastService.error('Error', err.error?.message || 'Failed to approve vehicle')
    });
  }
}
