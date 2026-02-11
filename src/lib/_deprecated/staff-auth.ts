import { supabaseBrowser } from "./supabase-browser";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'marketing' | 'support';
  is_active: boolean;
}

// Staff credentials (in production, use environment variables)
const STAFF_CREDENTIALS = {
  admin: {
    email: 'admin@rescuemanager.eu',
    password: 'admin123!', // Change this in production
    name: 'Admin',
    role: 'admin' as const
  },
  marketing: {
    email: 'marketing@rescuemanager.eu', 
    password: 'marketing123!', // Change this in production
    name: 'Marketing Team',
    role: 'marketing' as const
  }
};

export class StaffAuth {
  private static instance: StaffAuth;
  private currentUser: StaffUser | null = null;

  static getInstance(): StaffAuth {
    if (!StaffAuth.instance) {
      StaffAuth.instance = new StaffAuth();
    }
    return StaffAuth.instance;
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: StaffUser; error?: string }> {
    try {
      // Check against staff credentials
      const staffUser = Object.values(STAFF_CREDENTIALS).find(
        user => user.email === email && user.password === password
      );

      if (!staffUser) {
        return { success: false, error: 'Credenziali non valide' };
      }

      // Create staff user object
      const user: StaffUser = {
        id: `staff_${staffUser.role}`,
        email: staffUser.email,
        name: staffUser.name,
        role: staffUser.role,
        is_active: true
      };

      // Store in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('staff_user', JSON.stringify(user));
        this.currentUser = user;
      }

      return { success: true, user };
    } catch (error) {
      console.error('Staff login error:', error);
      return { success: false, error: 'Errore durante il login' };
    }
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('staff_user');
      this.currentUser = null;
    }
  }

  getCurrentUser(): StaffUser | null {
    if (typeof window === 'undefined') return null;

    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const stored = sessionStorage.getItem('staff_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error parsing staff user:', error);
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(role: 'admin' | 'marketing' | 'support'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role || user?.role === 'admin';
  }

  requireAuth(): StaffUser {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }
}

export const staffAuth = StaffAuth.getInstance();
