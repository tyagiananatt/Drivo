import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit {
  mode: 'UPLOAD' | 'VERIFY' = 'UPLOAD';
  
  // Upload State
  entityType: 'DRIVER' | 'VEHICLE' = 'DRIVER';
  selectedEntityId: string = '';
  drivers: any[] = [];
  vehicles: any[] = [];
  
  driverDocTypes = ['Driving License (DL)', 'Police Verification', 'Medical'];
  vehicleDocTypes = ['Registration Certificate (RC)', 'Insurance', 'Permit', 'PUC'];
  
  // Map of docType -> { file, expiryDate }
  uploadPayload: { [key: string]: { file: File | null, expiryDate: string } } = {};
  isUploading = false;

  // Verify State
  documents: any[] = [];
  isLoadingDocs = false;
  previewUrl: SafeResourceUrl | null = null;
  showPreview = false;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    public authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadEntities();
    this.resetPayload();
    if (this.authService.hasPermission('DOCUMENT_VERIFY')) {
      this.loadPendingDocuments();
    }
  }

  loadEntities() {
    this.apiService.getDrivers().subscribe(res => this.drivers = res);
    this.apiService.getVehicles().subscribe(res => this.vehicles = res);
  }

  loadPendingDocuments() {
    this.isLoadingDocs = true;
    this.apiService.getDocuments().subscribe({
      next: (res) => {
        this.documents = res;
        this.isLoadingDocs = false;
      },
      error: () => this.isLoadingDocs = false
    });
  }

  get currentDocTypes() {
    return this.entityType === 'DRIVER' ? this.driverDocTypes : this.vehicleDocTypes;
  }

  onEntityTypeChange(type: 'DRIVER' | 'VEHICLE') {
    this.entityType = type;
    this.selectedEntityId = '';
    this.resetPayload();
  }

  resetPayload() {
    this.uploadPayload = {};
    for (const type of this.currentDocTypes) {
      this.uploadPayload[type] = { file: null, expiryDate: '' };
    }
  }

  onFileSelected(event: any, docType: string) {
    const file = event.target.files[0];
    if (file) {
      this.uploadPayload[docType].file = file;
    }
  }

  submitUpload() {
    if (!this.selectedEntityId) {
      this.toastService.error('Validation Error', 'Please select a Driver or Vehicle first.');
      return;
    }

    const tasks = [];
    
    for (const type of this.currentDocTypes) {
      const payload = this.uploadPayload[type];
      if (payload.file) {
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('entityType', this.entityType);
        formData.append('documentType', type);
        if (payload.expiryDate) {
          formData.append('expiryDate', payload.expiryDate);
        }
        
        if (this.entityType === 'DRIVER') {
          formData.append('driverId', this.selectedEntityId);
        } else {
          formData.append('vehicleId', this.selectedEntityId);
        }

        tasks.push(this.apiService.uploadDocument(formData));
      }
    }

    if (tasks.length === 0) {
      this.toastService.error('Validation Error', 'Please attach at least one document.');
      return;
    }

    this.isUploading = true;
    forkJoin(tasks).subscribe({
      next: () => {
        this.toastService.success('Success', `${tasks.length} document(s) uploaded successfully.`);
        this.isUploading = false;
        this.resetPayload(); // reset form
        this.selectedEntityId = '';
        if (this.authService.hasPermission('DOCUMENT_VERIFY')) {
          this.loadPendingDocuments();
        }
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to upload some documents.');
        this.isUploading = false;
      }
    });
  }

  verify(id: string, status: string) {
    this.apiService.verifyDocument(id, status).subscribe({
      next: () => {
        this.toastService.success('Success', `Document marked as ${status}`);
        this.loadPendingDocuments();
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Verification failed');
      }
    });
  }

  viewDocument(id: string) {
    this.apiService.getDocumentUrl(id).subscribe({
      next: (res) => {
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.url);
        this.showPreview = true;
      },
      error: (err) => {
        this.toastService.error('Error', err.error?.message || 'Failed to load document preview');
      }
    });
  }

  closePreview() {
    this.showPreview = false;
    this.previewUrl = null;
  }
}
