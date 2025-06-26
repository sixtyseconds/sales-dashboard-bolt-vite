import { supabase } from '../supabase/clientV2';

interface AuthLogEvent {
  event_type: 'SIGNED_IN' | 'SIGNED_OUT' | 'SIGNED_UP' | 'PASSWORD_RECOVERY' | 'TOKEN_REFRESHED' | 'USER_UPDATED';
  user_id: string;
  email?: string;
  metadata?: Record<string, any>;
}

class AuthLogger {
  private static instance: AuthLogger;
  private isEnabled = true;

  static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  /**
   * Log authentication events to Edge Function for security monitoring
   */
  async logAuthEvent(event: AuthLogEvent): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const { data, error } = await supabase.functions.invoke('auth-logger', {
        body: event
      });

      if (error) {
        console.warn('Failed to log auth event:', error);
        // Don't throw - logging failures shouldn't break auth flow
      }
    } catch (error) {
      console.warn('Auth logger service error:', error);
      // Silently fail - don't interrupt auth operations
    }
  }

  /**
   * Disable logging (useful for testing or privacy mode)
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.isEnabled = true;
  }
}

export const authLogger = AuthLogger.getInstance(); 