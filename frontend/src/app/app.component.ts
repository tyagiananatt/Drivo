import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { SseService } from './services/sse.service';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  notificationCount = 0;
  showProfileDropdown = false;

  constructor(
    private sseService: SseService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.initSse();
    }
  }

  initSse() {
    this.sseService.getServerSentEvent('http://localhost:3000/api/notifications/stream').subscribe({
      next: (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.notificationCount = data.unreadCount;
        } catch (e) {}
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
