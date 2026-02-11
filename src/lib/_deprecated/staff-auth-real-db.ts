import bcrypt from 'bcryptjs';

export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  staff_role: 'admin' | 'marketing' | 'support' | 'staff';
  is_staff: boolean;
  is_admin: boolean;
  last_login?: string;
  created_at: string;
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
          
          // For demo purposes, we'll use hardcoded credentials
          // In production, you'd verify the password against auth.users
          const validCredentials = [
            { email: 'admin@rescuemanager.eu', password: 'admin123!' },
            { email: 'marketing@rescuemanager.eu', password: 'marketing123!' }
          ];

          const isValidCredential = validCredentials.some(
            cred => cred.email === email && cred.password === password
          );

          if (!isValidCredential) {
            console.log('Invalid credentials for:', email);
            return { success: false, error: 'Credenziali non valide' };
          }

          // Create user object based on credentials
          const role = email === 'admin@rescuemanager.eu' ? 'admin' : 'marketing';
          const isAdmin = role === 'admin';
          
          const user: StaffUser = {
            id: `staff-${Date.now()}`, // Generate a temporary ID
            email,
            full_name: email === 'admin@rescuemanager.eu' ? 'Admin Staff' : 'Marketing Staff',
            staff_role: role,
            is_staff: true,
            is_admin: isAdmin,
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
    // Demo implementation - return hardcoded staff users
    return [
      {
        id: 'staff-admin',
        email: 'admin@rescuemanager.eu',
        full_name: 'Admin Staff',
        staff_role: 'admin',
        is_staff: true,
        is_admin: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'staff-marketing',
        email: 'marketing@rescuemanager.eu',
        full_name: 'Marketing Staff',
        staff_role: 'marketing',
        is_staff: true,
        is_admin: false,
        created_at: new Date().toISOString()
      }
    ];
  }

  public async createStaffUser(
    email: string, 
    password: string, 
    fullName: string, 
    role: 'admin' | 'marketing' | 'support' | 'staff'
  ): Promise<StaffAuthResult> {
    // Demo implementation - just return success
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
    // Demo implementation
    return { success: false, error: 'Funzionalità non disponibile in modalità demo' };
  }

  public async deleteStaffUser(id: string): Promise<StaffAuthResult> {
    // Demo implementation
    return { success: false, error: 'Funzionalità non disponibile in modalità demo' };
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance();
