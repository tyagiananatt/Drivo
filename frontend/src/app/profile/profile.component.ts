import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profile: any = null;
  isLoading = true;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.apiService.getFullProfile().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Error', 'Failed to load profile details.');
        this.isLoading = false;
      }
    });
  }
}
