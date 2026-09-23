import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  data = { firstName: '', lastName: '', companyName: '', email: '', password: '' };
  error = '';

  constructor(private authService: AuthService) {}

  register() {
    this.authService.register(this.data).subscribe({
      error: err => {
        if (err.status === 0) {
          this.error = 'Backend server is down. Please restart pnpm start:dev';
        } else {
          this.error = err.error?.message || err.message || 'Registration failed.';
        }
      }
    });
  }
}
