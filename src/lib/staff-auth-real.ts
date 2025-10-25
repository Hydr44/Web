import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  staff_role: 'admin' | 'marketing' | 'support' | 'staff';
  is_staff: boolean;
  is_admin: boolean;
  last_login?: string;
  created_at: string;
  password_hash?: string;
}

export interface StaffAuthResult {
  success: boolean;
  user?: StaffUser;
  error?: string;
}

class StaffAuthManager {
  private static instance: StaffAuthManager;
  private currentUser: StaffUser | null = null;
  private tokenKey = 'staff_auth_token';
  private userKey = 'staff_user_data';

  // Real staff credentials - these are the production credentials
  // In a real production environment, these would be stored securely in a database
  // For now, we use hardcoded credentials for simplicity
  private staffCredentials = [
    {
      email: 'admin@rescuemanager.eu',
      password: 'AdminStaff2024!',
      full_name: 'Admin Staff',
      staff_role: 'admin' as const,
      is_admin: true
    },
    {
      email: 'marketing@rescuemanager.eu', 
      password: 'MarketingStaff2024!',
      full_name: 'Marketing Staff',
      staff_role: 'marketing' as const,
      is_admin: false
    },
    {
      email: 'support@rescuemanager.eu',
      password: 'SupportStaff2024!',
      full_name: 'Support Staff', 
      staff_role: 'support' as const,
      is_admin: false
    }
  ];

  private constructor() {
    this.loadSession();
  }

  public static getInstance(): StaffAuthManager {
    if (!StaffAuthManager.instance) {
      StaffAuthManager.instance = new StaffAuthManager();
    }
    return StaffAuthManager.instance;
  }

  private loadSession() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.tokenKey);
      const userData = localStorage.getItem(this.userKey);
      if (token && userData) {
        try {
          this.currentUser = JSON.parse(userData);
        } catch (e) {
          console.error("Failed to parse staff user data from localStorage", e);
          this.clearSession();
        }
      }
    }
  }

  private saveSession(user: StaffUser) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, 'staff-token-' + Date.now());
      localStorage.setItem(this.userKey, JSON.stringify(user));
      this.currentUser = user;
    }
  }

  private clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      this.currentUser = null;
    }
  }

  public getCurrentUser(): StaffUser | null {
    return this.currentUser;
  }

  public async login(email: string, password: string): Promise<StaffAuthResult> {
    try {
      console.log('Staff login attempt for:', email);
      
      // Find user in credentials
      const userCredential = this.staffCredentials.find(
        cred => cred.email === email
      );

      if (!userCredential) {
        console.log('User not found:', email);
        return { success: false, error: 'Credenziali non valide' };
      }

      // Verify password
      if (userCredential.password !== password) {
        console.log('Invalid password for:', email);
        return { success: false, error: 'Credenziali non valide' };
      }

      // Create user object
      const user: StaffUser = {
        id: randomUUID(),
        email: userCredential.email,
        full_name: userCredential.full_name,
        staff_role: userCredential.staff_role,
        is_staff: true,
        is_admin: userCredential.is_admin,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      this.saveSession(user);

      console.log('Staff login successful:', user);
      return { success: true, user };
    } catch (error: any) {
      console.error('Staff login error:', error);
      return { success: false, error: error.message || 'Errore durante il login' };
    }
  }

  public async logout(): Promise<void> {
    try {
      console.log('Staff logout');
      this.currentUser = null;
      this.clearSession();
      
      if (typeof window !== 'undefined') {
        // Redirect to login
        window.location.href = '/staff/login';
      }
    } catch (error) {
      console.error('Staff logout error:', error);
    }
  }

  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  public hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.staff_role === role;
  }

  public isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.is_admin === true || user?.staff_role === 'admin';
  }

  public isMarketing(): boolean {
    return this.hasRole('marketing');
  }

  public isSupport(): boolean {
    return this.hasRole('support');
  }

  public async getAllStaffUsers(): Promise<StaffUser[]> {
    // Return all staff users from credentials
    return this.staffCredentials.map(cred => ({
      id: randomUUID(),
      email: cred.email,
      full_name: cred.full_name,
      staff_role: cred.staff_role,
      is_staff: true,
      is_admin: cred.is_admin,
      created_at: new Date().toISOString()
    }));
  }

  public async createStaffUser(
    email: string, 
    password: string, 
    fullName: string, 
    role: 'admin' | 'marketing' | 'support' | 'staff'
  ): Promise<StaffAuthResult> {
    // In production, this would create a real user in database
    console.log('Creating staff user:', email);
    return { success: false, error: 'Funzionalità non disponibile in modalità demo' };
  }

  public async updateStaffUser(
    id: string, 
    updates: Partial<{
      email: string;
      full_name: string;
      staff_role: 'admin' | 'marketing' | 'support' | 'staff';
      is_staff: boolean;
    }>
  ): Promise<StaffAuthResult> {
    // In production, this would update user in database
    return { success: false, error: 'Funzionalità non disponibile in modalità demo' };
  }

  public async deleteStaffUser(id: string): Promise<StaffAuthResult> {
    // In production, this would delete user from database
    return { success: false, error: 'Funzionalità non disponibile in modalità demo' };
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance();