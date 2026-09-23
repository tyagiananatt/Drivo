import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  totalVehicles = 0;
  activeDrivers = 0;
  complianceAlerts = 0;
  subVendors = 0;
  vehicleStatusBreakdown = { active: 0, pending: 0, inactive: 0 };
  driverAssignment = { assigned: 0, unassigned: 0 };
  recentOnboardings: any[] = [];

  vendorName = 'Super Vendor';
  role = 'Super Vendor';
  superVendorName: string | null = null;
  directParentName: string | null = null;
  directSubVendors: any[] = [];

  // Chart Properties
  fleetGrowthChartData: any = null;
  vehicleTypesChartData: any = null;
  complianceChartData: any = null;

  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } }
    },
    plugins: { legend: { display: false } }
  };

  doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.8)' } }
    },
    cutout: '70%',
    borderWidth: 0
  };

  barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
    },
    plugins: { legend: { display: false } }
  };

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => {
        this.totalVehicles = data.totalVehicles;
        this.activeDrivers = data.activeDrivers;
        this.complianceAlerts = data.complianceAlerts;
        this.subVendors = data.subVendors;
        this.superVendorName = data.superVendorName;
        this.directParentName = data.directParentName;
        this.vehicleStatusBreakdown = data.vehicleStatusBreakdown || { active: 0, pending: 0, inactive: 0 };
        this.driverAssignment = data.driverAssignment || { assigned: 0, unassigned: 0 };
        this.recentOnboardings = data.recentOnboardings || [];

        if (data.charts) {
          this.fleetGrowthChartData = {
            labels: data.charts.fleetGrowth.labels,
            datasets: [{ data: data.charts.fleetGrowth.data, label: 'Vehicles Added', borderColor: '#d4ff00', backgroundColor: 'rgba(212,255,0,0.1)', fill: true }]
          };

          let vTypeColors = ['#d4ff00', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa'];
          this.vehicleTypesChartData = {
            labels: data.charts.vehicleTypes.labels,
            datasets: [{ data: data.charts.vehicleTypes.data, backgroundColor: vTypeColors.slice(0, data.charts.vehicleTypes.labels.length), borderWidth: 0 }]
          };

          this.complianceChartData = {
            labels: data.charts.compliance.labels,
            datasets: [{
              data: data.charts.compliance.data,
              backgroundColor: data.charts.compliance.labels.map((l: string) => {
                if (l === 'VERIFIED') return '#4ade80';
                if (l === 'PENDING') return '#facc15';
                if (l === 'EXPIRED' || l === 'REJECTED') return '#f87171';
                return '#9ca3af';
              }),
              borderRadius: 4
            }]
          };
        }
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Failed to load stats';
        this.toastService.error('Error', msg);
      }
    });

    this.apiService.getVendorTree().subscribe({
      next: (tree) => {
        if (tree && tree.name) {
          this.vendorName = tree.name;
          this.role = tree.level === 0 ? 'Super Vendor' : 'Sub Vendor';
          this.directSubVendors = tree.children || [];
        }
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Failed to load tree';
        this.toastService.error('Error', msg);
      }
    });
  }

  showAddModal = false;
  newVendor = { name: '', email: '', firstName: '', lastName: '', password: '' };

  openAddVendorModal() {
    this.showAddModal = true;
  }

  closeAddVendorModal() {
    this.showAddModal = false;
    this.newVendor = { name: '', email: '', firstName: '', lastName: '', password: '' };
  }

  submitNewVendor() {
    this.apiService.createVendor(this.newVendor).subscribe({
      next: (res) => {
        this.toastService.success('Success', 'Sub-vendor created successfully!');
        this.closeAddVendorModal();
        this.ngOnInit(); // Refresh stats
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Failed to create sub-vendor';
        this.toastService.error('Creation Failed', msg);
      }
    });
  }
}
