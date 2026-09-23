import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  private apiUrl = this.isProd ? 'https://drivo-im82.onrender.com/api' : 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getDashboardStats() {
    return this.http.get<any>(`${this.apiUrl}/vendors/stats`);
  }

  getAnalytics() {
    return this.http.get<any>(`${this.apiUrl}/analytics/dashboard`);
  }

  getVendorStats(id: string) {
    return this.http.get<any>(`${this.apiUrl}/vendors/${id}/stats`);
  }

  // Compliance
  getComplianceAlerts() {
    return this.http.get<any>(`${this.apiUrl}/compliance/alerts`);
  }

  runComplianceCheck() {
    return this.http.post<any>(`${this.apiUrl}/compliance/run-check`, {});
  }

  // Profile
  getFullProfile() {
    return this.http.get<any>('http://localhost:3000/api/auth/profile');
  }

  // Documents
  getDocuments() {
    return this.http.get<any[]>(`${this.apiUrl}/documents`);
  }
  
  uploadDocument(formData: FormData) {
    return this.http.post<any>(`${this.apiUrl}/documents/upload`, formData);
  }

  getDocumentUrl(id: string) {
    return this.http.get<{ url: string }>(`${this.apiUrl}/documents/${id}/url`);
  }

  verifyDocument(id: string, status: string) {
    return this.http.patch<any>(`${this.apiUrl}/documents/${id}/verify`, { status });
  }

  getVendorDetails(id: string) {
    return this.http.get<any>(`${this.apiUrl}/vendors/${id}`);
  }

  getVendorTree() {
    return this.http.get<any>(`${this.apiUrl}/vendors/my-tree`);
  }

  createVendor(data: any) {
    return this.http.post<any>(`${this.apiUrl}/vendors`, data);
  }

  createDelegation(data: any) {
    return this.http.post<any>(`${this.apiUrl}/delegations`, data);
  }

  getPermissions() {
    return this.http.get<any[]>(`${this.apiUrl}/delegations/permissions`);
  }

  // Vehicles
  getVehicles() {
    return this.http.get<any[]>(`${this.apiUrl}/vehicles`);
  }
  createVehicle(data: any) {
    return this.http.post<any>(`${this.apiUrl}/vehicles`, data);
  }
  updateVehicle(id: string, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/vehicles/${id}`, data);
  }

  // Drivers
  getDrivers() {
    return this.http.get<any[]>(`${this.apiUrl}/drivers`);
  }
  createDriver(data: any) {
    return this.http.post<any>(`${this.apiUrl}/drivers`, data);
  }
  updateDriver(id: string, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/drivers/${id}`, data);
  }
  assignDriver(vehicleId: string, driverId: string) {
    return this.http.post<any>(`${this.apiUrl}/vehicles/${vehicleId}/assign/${driverId}`, {});
  }

  deleteVendor(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/vendors/${id}`);
  }

  // Assignments
  getAssignments() {
    return this.http.get<any[]>(`${this.apiUrl}/assignments`);
  }

  createAssignment(driverId: string, vehicleId: string) {
    return this.http.post<any>(`${this.apiUrl}/assignments`, { driverId, vehicleId });
  }

  endAssignment(id: string) {
    return this.http.patch<any>(`${this.apiUrl}/assignments/${id}/end`, {});
  }
}
