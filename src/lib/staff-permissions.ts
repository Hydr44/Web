// Staff Roles and Permissions System

export type StaffRole = 'super_admin' | 'admin' | 'marketing' | 'support' | 'sales' | 'staff';

export type Permission = 
  // User Management
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete' | 'users.suspend' | 'users.activate'
  // Organization Management  
  | 'organizations.view' | 'organizations.create' | 'organizations.edit' | 'organizations.delete'
  // Staff Management
  | 'staff.view' | 'staff.create' | 'staff.edit' | 'staff.delete' | 'staff.manage_roles'
  // Lead Management
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete' | 'leads.assign'
  // Analytics
  | 'analytics.view' | 'analytics.export' | 'analytics.advanced'
  // System
  | 'system.settings' | 'system.audit' | 'system.backup' | 'system.notifications'
  // Billing
  | 'billing.view' | 'billing.manage' | 'billing.export';

export interface RolePermissions {
  role: StaffRole;
  name: string;
  description: string;
  permissions: Permission[];
  level: number; // Higher number = more permissions
}

export const ROLE_PERMISSIONS: Record<StaffRole, RolePermissions> = {
  super_admin: {
    role: 'super_admin',
    name: 'Super Amministratore',
    description: 'Accesso completo al sistema',
    level: 100,
    permissions: [
      // All permissions
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.suspend', 'users.activate',
      'organizations.view', 'organizations.create', 'organizations.edit', 'organizations.delete',
      'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.manage_roles',
      'leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'leads.assign',
      'analytics.view', 'analytics.export', 'analytics.advanced',
      'system.settings', 'system.audit', 'system.backup', 'system.notifications',
      'billing.view', 'billing.manage', 'billing.export'
    ]
  },
  admin: {
    role: 'admin',
    name: 'Amministratore',
    description: 'Gestione utenti e organizzazioni',
    level: 80,
    permissions: [
      'users.view', 'users.create', 'users.edit', 'users.suspend', 'users.activate',
      'organizations.view', 'organizations.create', 'organizations.edit',
      'staff.view', 'staff.create', 'staff.edit',
      'leads.view', 'leads.create', 'leads.edit', 'leads.assign',
      'analytics.view', 'analytics.export',
      'system.notifications',
      'billing.view'
    ]
  },
  marketing: {
    role: 'marketing',
    name: 'Marketing',
    description: 'Gestione lead e campagne',
    level: 60,
    permissions: [
      'users.view',
      'organizations.view',
      'leads.view', 'leads.create', 'leads.edit', 'leads.assign',
      'analytics.view', 'analytics.export',
      'system.notifications'
    ]
  },
  support: {
    role: 'support',
    name: 'Supporto',
    description: 'Assistenza clienti',
    level: 40,
    permissions: [
      'users.view',
      'organizations.view',
      'leads.view', 'leads.edit',
      'analytics.view'
    ]
  },
  sales: {
    role: 'sales',
    name: 'Vendite',
    description: 'Gestione vendite e clienti',
    level: 50,
    permissions: [
      'users.view', 'users.edit',
      'organizations.view', 'organizations.edit',
      'leads.view', 'leads.create', 'leads.edit', 'leads.assign',
      'analytics.view', 'analytics.export',
      'billing.view'
    ]
  },
  staff: {
    role: 'staff',
    name: 'Staff',
    description: 'Accesso base al sistema',
    level: 20,
    permissions: [
      'users.view',
      'organizations.view',
      'leads.view',
      'analytics.view'
    ]
  }
};

export class PermissionManager {
  static hasPermission(userRole: StaffRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions.permissions.includes(permission);
  }

  static hasAnyPermission(userRole: StaffRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  static hasAllPermissions(userRole: StaffRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  static canAccessSection(userRole: StaffRole, section: string): boolean {
    const sectionPermissions: Record<string, Permission[]> = {
      'users': ['users.view'],
      'organizations': ['organizations.view'],
      'staff': ['staff.view'],
      'leads': ['leads.view'],
      'analytics': ['analytics.view'],
      'system': ['system.settings'],
      'billing': ['billing.view']
    };

    const requiredPermissions = sectionPermissions[section] || [];
    return this.hasAnyPermission(userRole, requiredPermissions);
  }

  static getRoleLevel(role: StaffRole): number {
    return ROLE_PERMISSIONS[role].level;
  }

  static canManageRole(managerRole: StaffRole, targetRole: StaffRole): boolean {
    const managerLevel = this.getRoleLevel(managerRole);
    const targetLevel = this.getRoleLevel(targetRole);
    return managerLevel > targetLevel;
  }

  static getAvailableRoles(userRole: StaffRole): StaffRole[] {
    const userLevel = this.getRoleLevel(userRole);
    return Object.values(ROLE_PERMISSIONS)
      .filter(role => role.level < userLevel)
      .map(role => role.role);
  }
}

// Permission decorator for API routes
export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request: Request, context: any) {
      // Get user role from request headers or session
      const userRole = request.headers.get('x-user-role') as StaffRole;
      
      if (!userRole || !PermissionManager.hasPermission(userRole, permission)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Permessi insufficienti' 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return originalMethod.call(this, request, context);
    };
  };
}

// Middleware for permission checking
export function checkPermission(permission: Permission) {
  return (userRole: StaffRole): boolean => {
    return PermissionManager.hasPermission(userRole, permission);
  };
}
