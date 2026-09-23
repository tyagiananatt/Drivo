import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../services/toast.service';

interface VendorNode {
  id: string;
  name: string;
  email?: string;
  status?: string;
  level?: number;
  children?: VendorNode[];
  expanded?: boolean;
}

@Component({
  selector: 'app-hierarchy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hierarchy.component.html',
  styleUrl: './hierarchy.component.css'
})
export class HierarchyComponent implements OnInit {
  
  vendorTree: VendorNode[] = [];
  flatVendors: VendorNode[] = [];
  viewMode: 'tree' | 'list' = 'tree';

  showDelegateModal = false;
  selectedVendorId = '';
  delegationData = { permissionIds: [] as string[], startDate: '', endDate: '' };

  showAddModal = false;
  newVendor = { name: '', email: '', firstName: '', lastName: '', password: '' };

  permissions: { id: string, name: string, description?: string }[] = [];

  constructor(
    private apiService: ApiService, 
    public authService: AuthService,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadTree();
    this.apiService.getPermissions().subscribe({
      next: (perms) => this.permissions = perms,
      error: () => this.toastService.error('Error', 'Failed to load permissions')
    });

    this.route.queryParams.subscribe(params => {
      if (params['add']) {
        this.openAddVendorModal();
      }
    });
  }

  isPermissionSelected(id: string): boolean {
    return this.delegationData.permissionIds.includes(id);
  }

  togglePermissionSelection(id: string) {
    const index = this.delegationData.permissionIds.indexOf(id);
    if (index > -1) {
      this.delegationData.permissionIds.splice(index, 1);
    } else {
      this.delegationData.permissionIds.push(id);
    }
  }

  openAddVendorModal() {
    this.showAddModal = true;
  }

  closeAddVendorModal() {
    this.showAddModal = false;
    this.newVendor = { name: '', email: '', firstName: '', lastName: '', password: '' };
  }

  submitNewVendor() {
    this.apiService.createVendor(this.newVendor).subscribe({
      next: () => {
        this.toastService.success('Success', 'Sub-vendor created successfully!');
        this.closeAddVendorModal();
        this.loadTree(); // Refresh list
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Failed to create sub-vendor';
        this.toastService.error('Creation Failed', msg);
      }
    });
  }

  loadTree() {
    this.apiService.getVendorTree().subscribe({
      next: (tree) => {
        // Expand root by default
        if (tree) tree.expanded = true;
        this.vendorTree = tree ? [tree] : [];
        this.flatVendors = this.flattenTree(this.vendorTree);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Failed to load tree';
        this.toastService.error('Error', msg);
      }
    });
  }

  flattenTree(nodes: VendorNode[]): VendorNode[] {
    let result: VendorNode[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = result.concat(this.flattenTree(node.children));
      }
    }
    return result;
  }

  toggleViewMode(mode: 'tree' | 'list') {
    this.viewMode = mode;
  }

  deleteVendor(id: string) {
    if (confirm('Are you sure you want to deactivate this vendor?')) {
      this.apiService.deleteVendor(id).subscribe({
        next: () => {
          this.toastService.success('Success', 'Vendor deactivated successfully!');
          this.loadTree(); // Refresh list
        },
        error: (err) => {
          const msg = err.error?.message || err.message || 'Failed to deactivate vendor';
          this.toastService.error('Deactivation Failed', msg);
        }
      });
    }
  }

  toggleExpand(node: VendorNode) {
    node.expanded = !node.expanded;
  }

  openDelegateModal(node: VendorNode) {
    this.selectedVendorId = node.id;
    this.showDelegateModal = true;
  }

  closeDelegateModal() {
    this.showDelegateModal = false;
    this.selectedVendorId = '';
    this.delegationData = { permissionIds: [], startDate: '', endDate: '' };
  }

  submitDelegation() {
    if (this.delegationData.permissionIds.length === 0) return;

    let successCount = 0;
    let failCount = 0;
    
    // Simple loop to create delegations one by one
    const requests = this.delegationData.permissionIds.map(permissionId => {
      const payload = {
        toVendorId: this.selectedVendorId,
        permissionId: permissionId,
        startDate: this.delegationData.startDate ? new Date(this.delegationData.startDate).toISOString() : new Date().toISOString(),
        endDate: this.delegationData.endDate ? new Date(this.delegationData.endDate).toISOString() : null
      };
      
      return new Promise<void>((resolve) => {
        this.apiService.createDelegation(payload).subscribe({
          next: () => { successCount++; resolve(); },
          error: () => { failCount++; resolve(); }
        });
      });
    });

    Promise.all(requests).then(() => {
      if (failCount === 0) {
        this.toastService.success('Success', `Successfully delegated ${successCount} permissions!`);
      } else {
        this.toastService.warning('Partial Success', `${successCount} succeeded, ${failCount} failed.`);
      }
      this.closeDelegateModal();
    });
  }
}
