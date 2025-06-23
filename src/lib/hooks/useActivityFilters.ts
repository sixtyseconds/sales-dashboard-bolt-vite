import { create } from 'zustand';
import { startOfMonth, endOfMonth } from 'date-fns';

interface ActivityFilters {
  type?: string;
  salesRep?: string;
  meetingType?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  searchQuery: string;
}

interface ActivityFiltersStore {
  filters: ActivityFilters;
  setFilters: (filters: Partial<ActivityFilters>) => void;
  resetFilters: () => void;
}

export const useActivityFilters = create<ActivityFiltersStore>((set) => ({
  filters: {
    type: undefined,
    dateRange: {
      start: startOfMonth(new Date()),
      end: new Date(),
    },
    searchQuery: '',
    salesRep: undefined,
    meetingType: undefined
  },
  setFilters: (newFilters) => 
    set((state) => ({
      filters: { 
        // Keep existing filters
        ...state.filters,
        // Override with new filters
        ...newFilters
      }
    })),
  resetFilters: () =>
    set({
      filters: {
        type: undefined,
        dateRange: {
          start: startOfMonth(new Date()),
          end: new Date(),
        },
        searchQuery: '',
        salesRep: undefined,
        meetingType: undefined
      }
    }),
}));