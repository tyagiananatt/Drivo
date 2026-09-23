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
    this.toastService.success('Export Started', 'Your report is being generated and will download shortly.');
    // In a real app, this would trigger a download.
  }
}
