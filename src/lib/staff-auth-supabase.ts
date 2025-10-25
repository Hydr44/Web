import { supabaseBrowser } from '@/lib/supabase-browser';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
      
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.log('Supabase auth error:', authError);
        return { success: false, error: 'Credenziali non valide' };
      }

      if (!authData.user) {
        return { success: false, error: 'Utente non trovato' };
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.log('Profile not found:', profileError);
        return { success: false, error: 'Profilo utente non trovato' };
      }

      // Check if user is staff
      if (!profile.is_staff) {
        console.log('User is not staff:', email);
        return { success: false, error: 'Accesso negato: utente non autorizzato' };
      }

      // Create staff user object
      const user: StaffUser = {
        id: profile.id,
        email: profile.email || authData.user.email || '',
        full_name: profile.full_name || '',
        staff_role: profile.staff_role || 'staff',
        is_staff: profile.is_staff,
        is_admin: profile.is_admin || false,
        last_login: new Date().toISOString(),
        created_at: profile.created_at,
        avatar_url: profile.avatar_url
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
      
      // Sign out from Supabase
      await supabaseBrowser.auth.signOut();
      
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
    try {
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('is_staff', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staff users:', error);
        return [];
      }

      return profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        staff_role: profile.staff_role || 'staff',
        is_staff: profile.is_staff,
        is_admin: profile.is_admin || false,
        created_at: profile.created_at,
        avatar_url: profile.avatar_url
      })) || [];
    } catch (error) {
      console.error('Error in getAllStaffUsers:', error);
      return [];
    }
  }

  public async createStaffUser(
    email: string, 
    password: string, 
    fullName: string, 
    role: 'admin' | 'marketing' | 'support' | 'staff'
  ): Promise<StaffAuthResult> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Errore nella creazione utente' };
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          staff_role: role,
          is_staff: true,
          is_admin: role === 'admin',
          provider: 'email'
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: profileError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error creating staff user:', error);
      return { success: false, error: error.message || 'Errore nella creazione utente' };
    }
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
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating staff user:', error);
      return { success: false, error: error.message || 'Errore nell\'aggiornamento utente' };
    }
  }

  public async deleteStaffUser(id: string): Promise<StaffAuthResult> {
    try {
      // Delete profile first
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Delete auth user
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      
      if (authError) {
        return { success: false, error: authError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting staff user:', error);
      return { success: false, error: error.message || 'Errore nell\'eliminazione utente' };
    }
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance();
