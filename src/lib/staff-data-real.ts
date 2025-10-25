// Remove direct Supabase import - use API routes instead

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

  // Get real leads from database via API
  public async getLeads(): Promise<StaffLead[]> {
    try {
      const response = await fetch('/api/staff/leads');
      const result = await response.json();
      
      if (result.success) {
        return result.leads || [];
      }
      
      console.error('Error fetching leads:', result.error);
      return [];
    } catch (error) {
      console.error('Error in getLeads:', error);
      return [];
    }
  }

  // Get real users from database via API
  public async getUsers(): Promise<StaffUser[]> {
    try {
      const response = await fetch('/api/staff/users');
      const result = await response.json();
      
      if (result.success) {
        return result.users || [];
      }
      
      console.error('Error fetching users:', result.error);
      return [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      return [];
    }
  }

  // Update lead status via API
  public async updateLeadStatus(leadId: string, status: string): Promise<boolean> {
    try {
      const response = await fetch('/api/staff/leads/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, status }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error in updateLeadStatus:', error);
      return false;
    }
  }

  // Delete lead via API
  public async deleteLead(leadId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/staff/leads/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error in deleteLead:', error);
      return false;
    }
  }

  // Get analytics data via API
  public async getAnalytics() {
    try {
      const response = await fetch('/api/staff/analytics');
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      
      return {
        leadsCount: 0,
        usersCount: 0,
        recentLeads: []
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
