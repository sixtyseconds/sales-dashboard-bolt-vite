import { create } from 'zustand';
import { startOfMonth, endOfMonth } from 'date-fns';

interface ActivityFilters {
  type?: string;
  salesRep?: string;
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
    salesRep: undefined
  },
  setFilters: (newFilters) => 
    set((state) => ({
      filters: { 
        // Start with default state
        type: undefined,
        salesRep: undefined,
        dateRange: state.filters.dateRange,
        searchQuery: '',
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
        salesRep: undefined
      }
    }),
}));