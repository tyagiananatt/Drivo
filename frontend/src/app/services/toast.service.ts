import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Toast[] = [];
  toastSubject = new Subject<Toast[]>();

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) {
    const toast: Toast = { id: Math.random().toString(36).substr(2, 9), type, title, message };
    this.toasts.push(toast);
    this.toastSubject.next(this.toasts);
    setTimeout(() => this.remove(toast.id), 5000);
  }

  success(title: string, message: string) { this.show('success', title, message); }
  error(title: string, message: string) { this.show('error', title, message); }
  warning(title: string, message: string) { this.show('warning', title, message); }
  info(title: string, message: string) { this.show('info', title, message); }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastSubject.next(this.toasts);
  }
}
