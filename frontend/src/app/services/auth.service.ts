import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('user_profile', JSON.stringify(res.data.user));
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  register(data: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, data).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('user_profile', JSON.stringify(res.data.user));
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');
    this.router.navigate(['/login']);
  }

  getProfile() {
    const profile = localStorage.getItem('user_profile');
    return profile ? JSON.parse(profile) : null;
  }

  getToken() {
    return localStorage.getItem('access_token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  hasPermission(permission: string): boolean {
    const profile = this.getProfile();
    if (!profile || !profile.permissions) return false;
    
    // Super vendor has all permissions flag
    if (profile.permissions.includes('*')) return true;
    
    return profile.permissions.includes(permission);
  }
}
