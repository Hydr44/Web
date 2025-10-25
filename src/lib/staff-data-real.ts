import { supabaseAdmin } from '@/lib/supabase-admin';

export interface StaffLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  type: 'demo' | 'quote' | 'contact';
  status: 'new' | 'contacted' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  source: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  converted_at?: string;
}

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

class StaffDataManager {
  private static instance: StaffDataManager;

  private constructor() {}

  public static getInstance(): StaffDataManager {
    if (!StaffDataManager.instance) {
      StaffDataManager.instance = new StaffDataManager();
    }
    return StaffDataManager.instance;
  }

  // Get real leads from database
  public async getLeads(): Promise<StaffLead[]> {
    try {
      const { data: leads, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        return [];
      }

      return leads || [];
    } catch (error) {
      console.error('Error in getLeads:', error);
      return [];
    }
  }

  // Get real users from database
  public async getUsers(): Promise<StaffUser[]> {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, is_staff, staff_role, is_admin, created_at')
        .eq('is_staff', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return users || [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      return [];
    }
  }

  // Update lead status
  public async updateLeadStatus(leadId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('leads')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'contacted' && { contacted_at: new Date().toISOString() }),
          ...(status === 'converted' && { converted_at: new Date().toISOString() })
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLeadStatus:', error);
      return false;
    }
  }

  // Delete lead
  public async deleteLead(leadId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Error deleting lead:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteLead:', error);
      return false;
    }
  }

  // Get analytics data
  public async getAnalytics() {
    try {
      // Get leads count
      const { count: leadsCount } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Get users count
      const { count: usersCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_staff', true);

      // Get recent activity
      const { data: recentLeads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        leadsCount: leadsCount || 0,
        usersCount: usersCount || 0,
        recentLeads: recentLeads || []
      };
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      return {
        leadsCount: 0,
        usersCount: 0,
        recentLeads: []
      };
    }
  }
}

// Export singleton instance
export const staffData = StaffDataManager.getInstance();
