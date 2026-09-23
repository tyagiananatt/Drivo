import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.css'
})
export class DriversComponent implements OnInit {
  drivers: any[] = [];
  availableVehicles: any[] = [];
  
  showAddModal = false;
  newDriver = {
    name: '', email: '', phone: '', dateOfBirth: '', address: '',
    emergencyContact: '', licenseNumber: '', licenseExpiryDate: '',
    assignVehicleId: '' // Selected vehicle to instantly assign
  };

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadDrivers();
    if (this.authService.hasPermission('VEHICLE_VIEW')) {
      this.apiService.getVehicles().subscribe(data => this.availableVehicles = data);
    }
  }

  loadDrivers() {
    this.apiService.getDrivers().subscribe({
      next: (data) => this.drivers = data,
      error: (err) => this.toastService.error('Error', err.error?.message || 'Failed to load drivers')
    });
  }

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.newDriver = { name: '', email: '', phone: '', dateOfBirth: '', address: '', emergencyContact: '', licenseNumber: '', licenseExpiryDate: '', assignVehicleId: '' };
  }

  submitNewDriver() {
    const payload = { ...this.newDriver };
    if (payload.dateOfBirth) payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
    if (payload.licenseExpiryDate) payload.licenseExpiryDate = new Date(payload.licenseExpiryDate).toISOString();
    
    const vehicleIdToAssign = payload.assignVehicleId;
    delete (payload as any).assignVehicleId; // Don't send this to driver creation API

    this.apiService.createDriver(payload).subscribe({
      next: (createdDriver) => {
        // Driver created successfully
        if (vehicleIdToAssign && this.authService.hasPermission('VEHICLE_UPDATE')) {
          // Chain assignment
          this.apiService.assignDriver(vehicleIdToAssign, createdDriver.id).subscribe({
            next: () => {
              this.toastService.success('Success', 'Driver created & assigned to vehicle!');
              this.finishCreation(createdDriver);
            },
            error: (err) => {
              this.toastService.warning('Partial Success', 'Driver created, but vehicle assignment failed: ' + (err.error?.message || err.message));
              this.finishCreation(createdDriver);
            }
          });
        } else {
          this.toastService.success('Success', 'Driver added successfully!');
          this.finishCreation(createdDriver);
        }
      },
      error: (err) => this.toastService.error('Creation Failed', err.error?.message || 'Failed to add driver')
    });
  }

  finishCreation(createdDriver?: any) {
    this.closeAddModal();
    if (createdDriver) {
      this.drivers = [createdDriver, ...this.drivers];
    }
    this.loadDrivers();
  }

  approveDriver(id: string) {
    this.apiService.updateDriver(id, { status: 'ACTIVE' }).subscribe({
      next: () => {
        this.toastService.success('Success', 'Driver approved successfully!');
        this.loadDrivers();
      },
      error: (err) => this.toastService.error('Error', err.error?.message || 'Failed to approve driver')
    });
  }

  // PROFILE / EDIT MODAL
  selectedDriver: any = null;
  editMode = false;
  editPayload: any = {};
  newAssignmentVehicleId = '';

  openDriverProfile(driver: any) {
    console.log('Driver clicked:', driver);
    this.selectedDriver = driver;
    this.editMode = false;
    this.newAssignmentVehicleId = '';
    // Deep copy for editing
    this.editPayload = { 
      name: driver.name, 
      phone: driver.phone, 
      address: driver.address,
      licenseNumber: driver.licenseNumber,
      status: driver.status
    };
  }

  closeDriverProfile() {
    this.selectedDriver = null;
    this.editMode = false;
  }

  updateDriverProfile() {
    this.apiService.updateDriver(this.selectedDriver.id, this.editPayload).subscribe({
      next: () => {
        this.toastService.success('Success', 'Driver profile updated!');
        this.editMode = false;
        this.loadDrivers();
        this.closeDriverProfile();
      },
      error: (err) => this.toastService.error('Update Failed', err.error?.message || 'Could not update driver.')
    });
  }

  unassignVehicle(assignmentId: string) {
    this.apiService.endAssignment(assignmentId).subscribe({
      next: () => {
        this.toastService.success('Success', 'Driver unassigned from vehicle.');
        this.loadDrivers();
        this.closeDriverProfile(); // close and refresh
      },
      error: (err) => this.toastService.error('Error', err.error?.message || 'Failed to unassign vehicle.')
    });
  }

  assignNewVehicle() {
    if (!this.newAssignmentVehicleId) return;
    this.apiService.assignDriver(this.newAssignmentVehicleId, this.selectedDriver.id).subscribe({
      next: () => {
        this.toastService.success('Success', 'Driver assigned to new vehicle!');
        this.loadDrivers();
        this.closeDriverProfile();
      },
      error: (err) => this.toastService.error('Error', err.error?.message || 'Failed to assign vehicle.')
    });
  }
}
