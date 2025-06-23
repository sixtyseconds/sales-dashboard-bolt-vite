import { supabase } from '@/lib/supabase/client';

export interface DashboardMetrics {
  revenue: number;
  outbound: number;
  meetings: number;
  proposals: number;
}

export interface ActivityData {
  date: string;
  type: string;
  count: number;
  amount?: number;
}

export interface RecentDeal {
  id: string;
  client_name: string;
  amount: number;
  date: string;
  details: string;
}

export class DashboardService {
  // Get dashboard metrics for a user within a date range
  static async getMetrics(userId: string, startDate: Date, endDate: Date): Promise<DashboardMetrics> {
    try {
      // Fetch activities for outbound, meetings, proposals
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (activitiesError) {
        throw new Error(`Failed to fetch activities: ${activitiesError.message}`);
      }

      // Fetch deals for revenue (sales)
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('owner_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (dealsError) {
        throw new Error(`Failed to fetch deals: ${dealsError.message}`);
      }

      // Calculate metrics
      const revenue = (deals || [])
        .filter((deal: any) => deal.status === 'won')
        .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) +
        (activities || [])
        .filter((activity: any) => activity.type === 'sale')
        .reduce((sum: number, activity: any) => sum + (activity.amount || 0), 0);

      const outbound = (activities || [])
        .filter((activity: any) => activity.type === 'outbound')
        .length;

      const meetings = (activities || [])
        .filter((activity: any) => activity.type === 'meeting')
        .length;

      const proposals = (activities || [])
        .filter((activity: any) => activity.type === 'proposal')
        .length;

      return {
        revenue,
        outbound,
        meetings,
        proposals
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  // Get activity data for charts
  static async getActivityData(userId: string, startDate: Date, endDate: Date): Promise<ActivityData[]> {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) {
        throw new Error(`Failed to fetch activity data: ${error.message}`);
      }

      // Group activities by date and type
      const activityMap = new Map<string, Map<string, { count: number; amount: number }>>();

      (activities || []).forEach((activity: any) => {
        const date = new Date(activity.date).toISOString().split('T')[0];
        const type = activity.type;
        
        if (!activityMap.has(date)) {
          activityMap.set(date, new Map());
        }
        
        const dateMap = activityMap.get(date)!;
        if (!dateMap.has(type)) {
          dateMap.set(type, { count: 0, amount: 0 });
        }
        
        const typeData = dateMap.get(type)!;
        typeData.count += 1;
        typeData.amount += activity.amount || 0;
      });

      // Convert to array format
      const result_data: ActivityData[] = [];
      activityMap.forEach((dateMap, date) => {
        dateMap.forEach((data, type) => {
          result_data.push({
            date,
            type,
            count: data.count,
            amount: data.amount
          });
        });
      });

      return result_data.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  }

  // Get recent deals (sales activities)
  static async getRecentDeals(userId: string, limit: number = 10): Promise<RecentDeal[]> {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'sale')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent deals: ${error.message}`);
      }

      return (activities || []).map((activity: any) => ({
        id: activity.id,
        client_name: activity.client_name || 'Unknown Client',
        amount: activity.amount || 0,
        date: activity.date,
        details: activity.details || 'Sale activity'
      }));
    } catch (error) {
      console.error('Error fetching recent deals:', error);
      throw error;
    }
  }

  // Get trends by comparing current period to previous period
  static async getTrends(userId: string, currentStart: Date, currentEnd: Date): Promise<{
    revenue: string;
    outbound: string;
    meetings: string;
    proposals: string;
  }> {
    try {
      const periodLength = currentEnd.getTime() - currentStart.getTime();
      const previousStart = new Date(currentStart.getTime() - periodLength);
      const previousEnd = new Date(currentEnd.getTime() - periodLength);

      const [currentMetrics, previousMetrics] = await Promise.all([
        this.getMetrics(userId, currentStart, currentEnd),
        this.getMetrics(userId, previousStart, previousEnd)
      ]);

      const calculateTrend = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const change = ((current - previous) / previous) * 100;
        return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      };

      return {
        revenue: calculateTrend(currentMetrics.revenue, previousMetrics.revenue),
        outbound: calculateTrend(currentMetrics.outbound, previousMetrics.outbound),
        meetings: calculateTrend(currentMetrics.meetings, previousMetrics.meetings),
        proposals: calculateTrend(currentMetrics.proposals, previousMetrics.proposals)
      };
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  }
} 