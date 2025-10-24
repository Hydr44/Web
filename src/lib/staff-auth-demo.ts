export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'marketing' | 'support' | 'staff';
  is_active: boolean;
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

  // Demo users (in production, these would come from database)
  private demoUsers: StaffUser[] = [
    {
      id: '1',
      email: 'admin@rescuemanager.eu',
      full_name: 'Admin Staff',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      email: 'marketing@rescuemanager.eu',
      full_name: 'Marketing Staff',
      role: 'marketing',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  private constructor() {}

  public static getInstance(): StaffAuthManager {
    if (!StaffAuthManager.instance) {
      StaffAuthManager.instance = new StaffAuthManager();
    }
    return StaffAuthManager.instance;
  }

  public async login(email: string, password: string): Promise<StaffAuthResult> {
    try {
      console.log('Staff login attempt for:', email);
      
      // Demo credentials
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

      // Find user
      const user = this.demoUsers.find(u => u.email === email);
      if (!user) {
        return { success: false, error: 'Utente non trovato' };
      }

      // Set current user
      this.currentUser = {
        ...user,
        last_login: new Date().toISOString()
      };

      // Store in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('staff_user', JSON.stringify(this.currentUser));
      }

      console.log('Staff login successful:', this.currentUser);
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Staff login error:', error);
      return { success: false, error: 'Errore durante il login' };
    }
  }

  public async logout(): Promise<void> {
    try {
      console.log('Staff logout');
      this.currentUser = null;
      
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('staff_user');
        // Redirect to login
        window.location.href = '/staff/login';
      }
    } catch (error) {
      console.error('Staff logout error:', error);
    }
  }

  public getCurrentUser(): StaffUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('staff_user');
        if (stored) {
          this.currentUser = JSON.parse(stored);
          return this.currentUser;
        }
      } catch (error) {
        console.error('Error parsing stored staff user:', error);
        sessionStorage.removeItem('staff_user');
      }
    }

    return null;
  }

  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  public hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  public isAdmin(): boolean {
    return this.hasRole('admin');
  }

  public isMarketing(): boolean {
    return this.hasRole('marketing');
  }

  public isSupport(): boolean {
    return this.hasRole('support');
  }

  public async getAllStaffUsers(): Promise<StaffUser[]> {
    return this.demoUsers;
  }

  public async createStaffUser(
    email: string, 
    password: string, 
    fullName: string, 
    role: 'admin' | 'marketing' | 'support' | 'staff'
  ): Promise<StaffAuthResult> {
    try {
      console.log('Creating staff user:', email);
      
      // Check if user already exists
      const existingUser = this.demoUsers.find(u => u.email === email);
      if (existingUser) {
        return { success: false, error: 'Utente già esistente' };
      }

      // Create new user
      const newUser: StaffUser = {
        id: (this.demoUsers.length + 1).toString(),
        email,
        full_name: fullName,
        role,
        is_active: true,
        created_at: new Date().toISOString()
      };

      this.demoUsers.push(newUser);
      
      console.log('Staff user created successfully:', newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Staff user creation error:', error);
      return { success: false, error: 'Errore durante la creazione utente' };
    }
  }

  public async updateStaffUser(
    id: string, 
    updates: Partial<{
      email: string;
      full_name: string;
      role: 'admin' | 'marketing' | 'support' | 'staff';
      is_active: boolean;
    }>
  ): Promise<StaffAuthResult> {
    try {
      const userIndex = this.demoUsers.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return { success: false, error: 'Utente non trovato' };
      }

      this.demoUsers[userIndex] = {
        ...this.demoUsers[userIndex],
        ...updates
      };

      return { success: true, user: this.demoUsers[userIndex] };
    } catch (error) {
      console.error('Staff user update error:', error);
      return { success: false, error: 'Errore durante l\'aggiornamento' };
    }
  }

  public async deleteStaffUser(id: string): Promise<StaffAuthResult> {
    try {
      const userIndex = this.demoUsers.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return { success: false, error: 'Utente non trovato' };
      }

      this.demoUsers.splice(userIndex, 1);
      return { success: true };
    } catch (error) {
      console.error('Staff user deletion error:', error);
      return { success: false, error: 'Errore durante l\'eliminazione' };
    }
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance();
