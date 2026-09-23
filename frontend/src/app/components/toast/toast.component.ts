import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div class="toast-card" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            <span *ngIf="toast.type === 'success'">✓</span>
            <span *ngIf="toast.type === 'error'">✕</span>
            <span *ngIf="toast.type === 'warning'">!</span>
            <span *ngIf="toast.type === 'info'">i</span>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <div class="toast-close" (click)="remove(toast.id)">✕</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .toast-card {
      display: flex;
      align-items: flex-start;
      background: rgba(20, 21, 19, 0.95);
      border: 1px solid var(--border);
      border-radius: var(--border-radius-sm);
      padding: 16px 20px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 15px 45px rgba(0,0,0,0.9);
      backdrop-filter: blur(20px);
      animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .toast-success { border-left: 4px solid var(--success); }
    .toast-error { border-left: 4px solid var(--danger); }
    .toast-warning { border-left: 4px solid var(--warning); }
    .toast-info { border-left: 4px solid var(--primary); }
    
    .toast-icon {
      font-size: 18px;
      font-weight: bold;
      margin-right: 16px;
      margin-top: 2px;
    }
    .toast-success .toast-icon { color: var(--success); }
    .toast-error .toast-icon { color: var(--danger); }
    .toast-warning .toast-icon { color: var(--warning); }
    .toast-info .toast-icon { color: var(--primary); }

    .toast-content { flex: 1; }
    .toast-title { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
    .toast-message { font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
    .toast-close { cursor: pointer; color: var(--text-muted); font-size: 14px; margin-left: 16px; padding: 4px; }
    .toast-close:hover { color: var(--text-primary); }

    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toastSubject.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  remove(id: string) {
    this.toastService.remove(id);
  }
}
