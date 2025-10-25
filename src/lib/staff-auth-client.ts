// Client-side staff authentication - no Supabase imports
export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  staff_role: 'admin' | 'marketing' | 'support' | 'staff';
  is_staff: boolean;
  is_admin: boolean;
  last_login?: string;
  created_at: string;
  avatar_url?: string;
}

export interface StaffAuthResult {
  success: boolean;
  user?: StaffUser;
  error?: string;
}

class StaffAuthManager {
  private static instance: StaffAuthManager;
  private currentUser: StaffUser | null = null;

  private constructor() {
    // Initialize from sessionStorage if available
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('staff_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing stored staff user:', e);
        }
      }
    }
  }

  public static getInstance(): StaffAuthManager {
    if (!StaffAuthManager.instance) {
      StaffAuthManager.instance = new StaffAuthManager();
    }
    return StaffAuthManager.instance;
  }

  // Login via API
  public async login(email: string, password: string): Promise<StaffAuthResult> {
    try {
      const response = await fetch('/api/staff/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        this.currentUser = result.user;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('staff_user', JSON.stringify(result.user));
        }
        return { success: true, user: result.user };
      }

      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      console.error('Staff login error:', error);
      return { success: false, error: 'Errore di connessione' };
    }
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      await fetch('/api/staff/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('staff_user');
      }
    }
  }

  // Get current user
  public getCurrentUser(): StaffUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Check if user is admin
  public isAdmin(): boolean {
    return this.currentUser?.is_admin || false;
  }

  // Get all staff users via API
  public async getAllStaffUsers(): Promise<StaffUser[]> {
    try {
      const response = await fetch('/api/staff/users');
      const result = await response.json();
      
      if (result.success) {
        return result.users || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching staff users:', error);
      return [];
    }
  }

  // Create staff user via API
  public async createStaffUser(userData: Partial<StaffUser>): Promise<StaffAuthResult> {
    try {
      const response = await fetch('/api/staff/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating staff user:', error);
      return { success: false, error: 'Errore di connessione' };
    }
  }

  // Update staff user via API
  public async updateStaffUser(id: string, userData: Partial<StaffUser>): Promise<StaffAuthResult> {
    try {
      const response = await fetch('/api/staff/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...userData }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating staff user:', error);
      return { success: false, error: 'Errore di connessione' };
    }
  }

  // Delete staff user via API
  public async deleteStaffUser(id: string): Promise<StaffAuthResult> {
    try {
      const response = await fetch('/api/staff/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting staff user:', error);
      return { success: false, error: 'Errore di connessione' };
    }
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance();
