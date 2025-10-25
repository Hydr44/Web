// Staff Audit Log System

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

export type AuditAction = 
  | 'user.login' | 'user.logout' | 'user.create' | 'user.edit' | 'user.delete' | 'user.suspend' | 'user.activate'
  | 'organization.create' | 'organization.edit' | 'organization.delete' | 'organization.member_add' | 'organization.member_remove'
  | 'staff.create' | 'staff.edit' | 'staff.delete' | 'staff.role_change'
  | 'lead.create' | 'lead.edit' | 'lead.delete' | 'lead.assign' | 'lead.status_change'
  | 'system.settings_change' | 'system.backup' | 'system.export'
  | 'billing.payment' | 'billing.subscription_change'
  | 'permission.denied' | 'security.breach_attempt';

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLogEntry[] = [];

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(
    userId: string,
    userName: string,
    userRole: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    resourceName: string,
    details: Record<string, any> = {},
    request?: Request,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      details,
      ip_address: this.getClientIP(request),
      user_agent: this.getUserAgent(request),
      timestamp: new Date().toISOString(),
      success,
      error_message: errorMessage
    };

    this.logs.push(entry);
    
    // In a real implementation, you would save to database here
    console.log('Audit Log:', entry);
  }

  async getLogs(
    userId?: string,
    action?: AuditAction,
    resourceType?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    let filteredLogs = [...this.logs];

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.user_id === userId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resource_type === resourceType);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    return filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getLogStats(
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalLogs: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ user: string; count: number }>;
    errorRate: number;
  }> {
    let filteredLogs = [...this.logs];

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }

    const totalLogs = filteredLogs.length;
    const successfulLogs = filteredLogs.filter(log => log.success).length;
    const successRate = totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0;

    // Top actions
    const actionCounts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top users
    const userCounts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      userCounts[log.user_name] = (userCounts[log.user_name] || 0) + 1;
    });

    const topUsers = Object.entries(userCounts)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorRate = totalLogs > 0 ? ((totalLogs - successfulLogs) / totalLogs) * 100 : 0;

    return {
      totalLogs,
      successRate,
      topActions,
      topUsers,
      errorRate
    };
  }

  private generateId(): string {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getClientIP(request?: Request): string {
    if (!request) return 'unknown';
    
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  private getUserAgent(request?: Request): string {
    if (!request) return 'unknown';
    return request.headers.get('user-agent') || 'unknown';
  }
}

// Audit decorator for API routes
export function auditLog(
  action: AuditAction,
  resourceType: string,
  getResourceId: (request: Request, context: any) => string,
  getResourceName: (request: Request, context: any) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request: Request, context: any) {
      const auditLogger = AuditLogger.getInstance();
      
      try {
        const result = await originalMethod.call(this, request, context);
        
        // Log successful action
        await auditLogger.log(
          'system', // This should come from authentication
          'System',
          'system',
          action,
          resourceType,
          getResourceId(request, context),
          getResourceName(request, context),
          { success: true },
          request,
          true
        );
        
        return result;
      } catch (error) {
        // Log failed action
        await auditLogger.log(
          'system',
          'System',
          'system',
          action,
          resourceType,
          getResourceId(request, context),
          getResourceName(request, context),
          { error: error.message },
          request,
          false,
          error.message
        );
        
        throw error;
      }
    };
  };
}

// Helper function to create audit log entries
export async function createAuditLog(
  userId: string,
  userName: string,
  userRole: string,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  resourceName: string,
  details: Record<string, any> = {},
  request?: Request,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  const auditLogger = AuditLogger.getInstance();
  await auditLogger.log(
    userId,
    userName,
    userRole,
    action,
    resourceType,
    resourceId,
    resourceName,
    details,
    request,
    success,
    errorMessage
  );
}
