import { supabaseAdmin } from './supabase-admin';
import bcrypt from 'bcryptjs';

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
      
      const supabase = supabaseAdmin();
      
      // Get staff user from database
      const { data: staffUser, error: fetchError } = await supabase
        .from('staff_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (fetchError || !staffUser) {
        console.log('Staff user not found or inactive:', fetchError);
        return { success: false, error: 'Credenziali non valide' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, staffUser.password_hash);
      if (!isValidPassword) {
        console.log('Invalid password for staff user:', email);
        return { success: false, error: 'Credenziali non valide' };
      }

      // Update last login
      await supabase
        .from('staff_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', staffUser.id);

      // Set current user
      this.currentUser = {
        id: staffUser.id,
        email: staffUser.email,
        full_name: staffUser.full_name,
        role: staffUser.role,
        is_active: staffUser.is_active,
        last_login: staffUser.last_login,
        created_at: staffUser.created_at
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

  public async createStaffUser(
    email: string, 
    password: string, 
    fullName: string, 
    role: 'admin' | 'marketing' | 'support' | 'staff'
  ): Promise<StaffAuthResult> {
    try {
      console.log('Creating staff user:', email);
      
      const supabase = supabaseAdmin();
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Insert new staff user
      const { data, error } = await supabase
        .from('staff_users')
        .insert({
          email,
          password_hash: passwordHash,
          full_name: fullName,
          role,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating staff user:', error);
        return { success: false, error: 'Errore durante la creazione utente' };
      }

      console.log('Staff user created successfully:', data);
      return { success: true, user: data };
    } catch (error) {
      console.error('Staff user creation error:', error);
      return { success: false, error: 'Errore durante la creazione utente' };
    }
  }

  public async getAllStaffUsers(): Promise<StaffUser[]> {
    try {
      const supabase = supabaseAdmin();
      
      const { data, error } = await supabase
        .from('staff_users')
        .select('id, email, full_name, role, is_active, last_login, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staff users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching staff users:', error);
      return [];
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
      const supabase = supabaseAdmin();
      
      const { data, error } = await supabase
        .from('staff_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating staff user:', error);
        return { success: false, error: 'Errore durante l\'aggiornamento' };
      }

      return { success: true, user: data };
    } catch (error) {
      console.error('Staff user update error:', error);
      return { success: false, error: 'Errore durante l\'aggiornamento' };
    }
  }

  public async deleteStaffUser(id: string): Promise<StaffAuthResult> {
    try {
      const supabase = supabaseAdmin();
      
      const { error } = await supabase
        .from('staff_users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting staff user:', error);
        return { success: false, error: 'Errore durante l\'eliminazione' };
      }

      return { success: true };
    } catch (error) {
      console.error('Staff user deletion error:', error);
      return { success: false, error: 'Errore durante l\'eliminazione' };
    }
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance();
