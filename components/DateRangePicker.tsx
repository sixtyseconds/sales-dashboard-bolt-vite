'use client';

import * as React from 'react';
import { format, startOfToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn('w-full justify-start text-left font-normal bg-gray-900/50 backdrop-blur-xl border-0 hover:bg-gray-800/70 transition-all duration-300 rounded-xl px-4 py-3',
              !dateRange && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-3 h-5 w-5 text-gray-400" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  <span className="text-white">{format(dateRange.from, 'LLL dd, y')}</span>
                  <span className="mx-2 text-gray-500">→</span>
                  <span className="text-white">{format(dateRange.to, 'LLL dd, y')}</span>
                </>
              ) : (
                <span className="text-white">{format(dateRange.from, 'LLL dd, y')}</span>
              )
            ) : (
              <span className="text-gray-400">Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="relative z-50 w-auto p-0 bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl shadow-black/20" 
          align="start"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10" />
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-[#37bd7e]" />
                <span className="font-medium text-white">Date Range</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 bg-gray-800/50 hover:bg-[#37bd7e]/20 text-white hover:text-white rounded-lg border border-gray-700/50 hover:border-[#37bd7e]/50 transition-all duration-300"
                  onClick={() => {
                    const today = new Date();
                    const lastWeek = new Date(today);
                    lastWeek.setDate(today.getDate() - 7);
                    onDateRangeChange({ from: lastWeek, to: today });
                  }}
                >
                  <span className="text-xs font-medium">Last 7 days</span>
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 bg-gray-800/50 hover:bg-[#37bd7e]/20 text-white hover:text-white rounded-lg border border-gray-700/50 hover:border-[#37bd7e]/50 transition-all duration-300"
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today);
                    lastMonth.setDate(today.getDate() - 30);
                    onDateRangeChange({ from: lastMonth, to: today });
                  }}
                >
                  <span className="text-xs font-medium">Last 30 days</span>
                </Button>
              </div>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            weekStartsOn={1}
            numberOfMonths={2}
            className="p-4 bg-transparent [&_.rdp-day]:text-white [&_.rdp-day_button:hover]:bg-[#37bd7e]/20 [&_.rdp-day_button:focus]:bg-[#37bd7e]/20 [&_.rdp-day_selected]:!bg-[#37bd7e] [&_.rdp-day_selected]:hover:!bg-[#2da76c]"
            classNames={{
              months: "flex flex-col md:flex-row space-y-4 md:space-x-4 md:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center gap-2",
              caption_label: "font-medium text-white text-sm",
              nav: "flex items-center gap-1",
              nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-[#37bd7e]/20 text-white rounded-lg transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex gap-1",
              head_cell: "text-gray-400 rounded-md w-9 font-medium text-xs",
              row: "flex w-full gap-1 mt-2",
              cell: "text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal text-white hover:bg-[#37bd7e]/20 transition-colors",
              day_range_end: "day-range-end",
              day_selected: "!bg-[#37bd7e] text-white hover:!bg-[#2da76c] hover:text-white focus:!bg-[#37bd7e] focus:text-white",
              day_today: "bg-gray-800/50 text-white",
              day_outside: "text-gray-500",
              day_disabled: "text-gray-500",
              day_range_middle: "aria-selected:!bg-[#37bd7e]/20 aria-selected:text-white",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
          <div className="p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-xs hover:bg-gray-800/50 text-gray-400 hover:text-white"
              onClick={() => onDateRangeChange(undefined)}
            >
              Clear
            </Button>
            <Button
              variant="default"
              className="bg-[#37bd7e] hover:bg-[#2da76c] text-white"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}