import { supabaseAdmin } from './supabase-admin';
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
      
      const supabase = supabaseAdmin();
      
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

      // Check if user exists in profiles and is staff
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, staff_role, is_staff, is_admin')
        .eq('email', email)
        .single();

      let user: StaffUser;

      if (profileError || !profileData) {
        // Create staff user if doesn't exist
        console.log('Creating staff user for:', email);
        
        const role = email === 'admin@rescuemanager.eu' ? 'admin' : 'marketing';
        const isAdmin = role === 'admin';
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            email,
            full_name: email === 'admin@rescuemanager.eu' ? 'Admin Staff' : 'Marketing Staff',
            staff_role: role,
            is_staff: true,
            is_admin: isAdmin,
            provider: 'email'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating staff user:', createError);
          return { success: false, error: 'Errore durante la creazione utente staff' };
        }

        user = {
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          staff_role: newProfile.staff_role,
          is_staff: newProfile.is_staff,
          is_admin: newProfile.is_admin,
          last_login: new Date().toISOString(),
          created_at: newProfile.created_at
        };
      } else {
        // Update existing user to be staff if not already
        if (!profileData.is_staff) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              is_staff: true, 
              staff_role: email === 'admin@rescuemanager.eu' ? 'admin' : 'marketing',
              is_admin: email === 'admin@rescuemanager.eu'
            })
            .eq('id', profileData.id);

          if (updateError) {
            console.error('Error updating user to staff:', updateError);
          }
        }

        user = {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name || profileData.email,
          staff_role: profileData.staff_role || (email === 'admin@rescuemanager.eu' ? 'admin' : 'marketing'),
          is_staff: true,
          is_admin: profileData.is_admin || email === 'admin@rescuemanager.eu',
          last_login: new Date().toISOString(),
          created_at: profileData.created_at || new Date().toISOString()
        };
      }

      this.saveSession(user);

      // Update last login in database
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);

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
    try {
      const supabase = supabaseAdmin();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, staff_role, is_staff, is_admin, created_at')
        .eq('is_staff', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staff users:', error);
        return [];
      }

      return data.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.email,
        staff_role: user.staff_role || 'staff',
        is_staff: user.is_staff,
        is_admin: user.is_admin,
        created_at: user.created_at
      }));
    } catch (error) {
      console.error('Error fetching staff users:', error);
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
      console.log('Creating staff user:', email);
      
      const supabase = supabaseAdmin();
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return { success: false, error: 'Utente già esistente' };
      }

      // Create user in auth.users (this would normally be done through Supabase Auth)
      // For demo purposes, we'll just create the profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email,
          full_name: fullName,
          staff_role: role,
          is_staff: true,
          is_admin: role === 'admin',
          provider: 'email'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating staff user:', profileError);
        return { success: false, error: 'Errore durante la creazione utente' };
      }

      const newUser: StaffUser = {
        id: newProfile.id,
        email: newProfile.email,
        full_name: newProfile.full_name,
        staff_role: newProfile.staff_role,
        is_staff: newProfile.is_staff,
        is_admin: newProfile.is_admin,
        created_at: newProfile.created_at
      };

      console.log('Staff user created successfully:', newUser);
      return { success: true, user: newUser };
    } catch (error: any) {
      console.error('Staff user creation error:', error);
      return { success: false, error: error.message || 'Errore durante la creazione utente' };
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
      const supabase = supabaseAdmin();
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_staff', true)
        .select()
        .single();

      if (error) {
        console.error('Error updating staff user:', error);
        return { success: false, error: 'Errore durante l\'aggiornamento' };
      }

      return { success: true, user: data };
    } catch (error: any) {
      console.error('Staff user update error:', error);
      return { success: false, error: error.message || 'Errore durante l\'aggiornamento' };
    }
  }

  public async deleteStaffUser(id: string): Promise<StaffAuthResult> {
    try {
      const supabase = supabaseAdmin();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_staff: false,
          staff_role: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting staff user:', error);
        return { success: false, error: 'Errore durante l\'eliminazione' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Staff user deletion error:', error);
      return { success: false, error: error.message || 'Errore durante l\'eliminazione' };
    }
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance();
