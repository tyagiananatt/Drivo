import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
  entityType: 'DRIVER' | 'VEHICLE' = 'DRIVER';
  documentType: string = 'LICENSE';
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  uploadStatus: string = '';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Simulated upload to MinIO via backend
  uploadDocument() {
    if (!this.selectedFile) return;

    this.uploadStatus = 'Uploading...';
    this.uploadProgress = 0;
    
    // Fake progress animation
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.uploadStatus = 'Upload Complete! Saved to MinIO.';
        
        // Reset after 3 seconds
        setTimeout(() => {
          this.uploadStatus = '';
          this.uploadProgress = 0;
          this.selectedFile = null;
        }, 3000);
      }
    }, 150);
  }
}
