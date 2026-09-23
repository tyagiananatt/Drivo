import { Routes } from '@angular/router'; 
import { DashboardComponent } from './dashboard/dashboard.component';
import { HierarchyComponent } from './hierarchy/hierarchy.component';
import { UploadComponent } from './upload/upload.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { authGuard } from './guards/auth.guard';

import { LandingComponent } from './landing/landing.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'hierarchy', component: HierarchyComponent, canActivate: [authGuard] },
  { path: 'vendor/:id', loadComponent: () => import('./vendor-detail/vendor-detail.component').then(m => m.VendorDetailComponent), canActivate: [authGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [authGuard] },
  { path: 'vehicles', loadComponent: () => import('./vehicles/vehicles.component').then(m => m.VehiclesComponent), canActivate: [authGuard] },
  { path: 'drivers', loadComponent: () => import('./drivers/drivers.component').then(m => m.DriversComponent), canActivate: [authGuard] },
  { path: 'documents', loadComponent: () => import('./documents/documents.component').then(m => m.DocumentsComponent), canActivate: [authGuard] },
  { path: 'compliance', loadComponent: () => import('./compliance/compliance.component').then(m => m.ComplianceComponent), canActivate: [authGuard] },
  { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'assignments', loadComponent: () => import('./assignments/assignments.component').then(m => m.AssignmentsComponent), canActivate: [authGuard] },
];
