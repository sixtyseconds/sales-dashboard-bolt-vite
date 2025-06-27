import React, { RefObject, useState } from 'react';
import { FileText, Building, User, Calendar, PoundSterling, Star, Package2, AlignLeft, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { format, addDays, addWeeks, startOfWeek, addMonths, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DealDetailsSectionProps {
  initialFocusRef?: RefObject<HTMLInputElement>;
}

const DealDetailsSection: React.FC<DealDetailsSectionProps> = ({ initialFocusRef }) => {
  const { register, watch, getValues, formState: { errors } } = useFormContext();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    watch('closeDate') ? new Date(watch('closeDate')) : undefined
  );
  
  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'critical', label: 'Critical Priority' }
  ];
  
  const dealSizeOptions = [
    { value: 'small', label: 'Small Deal (< £10k)' },
    { value: 'medium', label: 'Medium Deal (£10k - £50k)' },
    { value: 'large', label: 'Large Deal (£50k - £100k)' },
    { value: 'strategic', label: 'Strategic Deal (> £100k)' }
  ];

  const currentDealSize = watch('dealSize');

  // Smart quick date options for deal close dates
  const getSmartQuickDates = () => {
    const now = new Date();
    return [
      {
        label: 'End of Week',
        value: format(addDays(startOfWeek(now, { weekStartsOn: 1 }), 4), 'yyyy-MM-dd'), // Friday
        icon: '📅',
        description: 'This Friday'
      },
      {
        label: 'End of Month',
        value: format(addDays(addMonths(now, 1), -1), 'yyyy-MM-dd'),
        icon: '📊',
        description: 'Month end'
      },
      {
        label: 'Next Month',
        value: format(addDays(addMonths(now, 1), 15), 'yyyy-MM-dd'),
        icon: '🗓️',
        description: 'Mid next month'
      },
      {
        label: 'Next Quarter',
        value: format(addDays(addMonths(now, 3), 0), 'yyyy-MM-dd'),
        icon: '📈',
        description: 'Q+1 target'
      }
    ];
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
    
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      // Manually trigger the form field update
      const event = {
        target: {
          name: 'closeDate',
          value: formattedDate
        }
      } as any;
      register('closeDate').onChange(event);
    }
  };

  const handleQuickDate = (dateValue: string) => {
    const date = new Date(dateValue);
    setSelectedDate(date);
    
    const event = {
      target: {
        name: 'closeDate',
        value: dateValue
      }
    } as any;
    register('closeDate').onChange(event);
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return 'Select expected close date...';
    
    const formatted = format(date, 'MMM dd, yyyy');
    
    if (isToday(date)) return `${formatted} (Today)`;
    if (isTomorrow(date)) return `${formatted} (Tomorrow)`;
    if (isThisWeek(date)) return `${formatted} (This Week)`;
    if (isThisMonth(date)) return `${formatted} (This Month)`;
    
    return formatted;
  };

  return (
    <div id="details-section" role="tabpanel" aria-labelledby="tab-details">
      <SectionHeading icon={<FileText className="w-4 h-4" />} title="Basic Information" />
      
      <FormField
        id="dealName"
        label="Deal Name"
        required
        error={errors?.name?.message as string}
        className="mb-4"
      >
                <InputWithIcon
          id="name"
          icon={<FileText className="w-4 h-4" />}
          placeholder="Enter deal name"
          aria-required="true"
          aria-invalid={!!errors?.name}
          aria-describedby={errors?.name ? "name-error" : undefined}
          {...register("name", { required: "Deal name is required." })}
        />
        {errors?.name && (
          <ErrorMessage id="name-error">{errors.name.message as string}</ErrorMessage>
        )}
      </FormField>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FormField
          id="company"
          label="Company"
          required
          error={errors?.company?.message as string}
        >
          <InputWithIcon
            id="company" 
            icon={<Building className="w-4 h-4" />}
            placeholder="Enter company name"
            aria-required="true"
            aria-invalid={!!errors?.company}
            aria-describedby={errors?.company ? "company-error" : undefined}
            {...register("company", { required: "Company name is required." })}
          />
          {errors?.company && (
            <ErrorMessage id="company-error">{errors.company.message as string}</ErrorMessage>
          )}
        </FormField>
        
        <FormField
          id="contactName"
          label="Contact Name"
        >
          <InputWithIcon 
            id="contactName"
            icon={<User className="w-4 h-4" />}
            placeholder="Enter contact name"
            {...register("contactName")}
          />
        </FormField>
      </div>
      
      <SectionHeading 
        icon={<Calendar className="w-4 h-4" />} 
        title="Deal Timeline & Value" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FormField
          id="closeDate"
          label="Expected Close Date"
          error={errors?.closeDate?.message as string}
        >
          <div className="space-y-3">
            {/* Smart Quick Date Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {getSmartQuickDates().map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => handleQuickDate(quick.value)}
                  className={`p-2.5 rounded-lg border transition-all duration-200 group text-left hover:scale-[1.02] ${
                    watch('closeDate') === quick.value
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-lg shadow-violet-500/10'
                      : 'bg-gray-800/30 border-gray-600/30 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm group-hover:scale-110 transition-transform duration-200">{quick.icon}</span>
                    <div>
                      <div className="text-xs font-medium">{quick.label}</div>
                      <div className="text-xs opacity-70">{quick.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Custom Date Picker */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 px-3 
                    text-white hover:bg-gray-800/80 hover:border-gray-600 focus:outline-none 
                    focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200
                    flex items-center gap-3 text-left hover:shadow-lg hover:scale-[1.01] group"
                >
                  <Calendar className="w-4 h-4 text-gray-400 group-hover:text-violet-400 transition-colors duration-200" />
                  <span className={`transition-colors duration-200 ${selectedDate ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}`}>
                    {formatDateDisplay(selectedDate)}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl shadow-black/20" 
                align="start"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-violet-400" />
                      <span className="font-medium text-white">Expected Close Date</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(undefined);
                        const event = {
                          target: {
                            name: 'closeDate',
                            value: ''
                          }
                        } as any;
                        register('closeDate').onChange(event);
                      }}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    className="rounded-md"
                    classNames={{
                      months: "text-white",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center text-white",
                      caption_label: "text-sm font-medium text-white",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-md transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal text-white hover:bg-violet-500/20 rounded-md transition-colors",
                      day_selected: "bg-violet-500 text-white hover:bg-violet-600 focus:bg-violet-500 focus:text-white",
                      day_today: "bg-gray-800/70 text-white font-medium",
                      day_outside: "text-gray-500 opacity-50",
                      day_disabled: "text-gray-500 opacity-30 cursor-not-allowed",
                      day_hidden: "invisible",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                      IconRight: () => <ChevronRight className="h-4 w-4" />,
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Hidden input for form registration */}
            <input
              type="hidden"
              {...register("closeDate")}
              aria-invalid={!!errors?.closeDate}
              aria-describedby={errors?.closeDate ? "closeDate-error" : undefined}
            />
          </div>
          
          {errors?.closeDate && (
            <ErrorMessage id="closeDate-error">{errors.closeDate.message as string}</ErrorMessage>
          )}
        </FormField>
        
        <FormField
          id="amount"
          label="Deal Value"
          required
          error={errors?.amount?.message as string}
        >
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <PoundSterling className="w-4 h-4" />
            </div>
            <div className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              £
            </div>
            <input
              id="amount"
              type="number"
              placeholder="Enter deal value"
              min="0"
              step="1"
              aria-required="true"
              aria-invalid={!!errors?.amount}
              aria-describedby={errors?.amount ? "amount-error" : undefined}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 pl-14 pr-3 
                text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 
                focus:border-violet-500 transition-colors"
              {...register("amount", { 
                required: "Deal value is required.",
                valueAsNumber: true,
                min: { value: 0, message: "Value must be non-negative." } 
              })}
            />
          </div>
          {errors?.amount && (
            <ErrorMessage id="amount-error">{errors.amount.message as string}</ErrorMessage>
          )}
        </FormField>
        
        <FormField
          id="priority" 
          label="Deal Priority"
          error={errors?.priority?.message as string}
        >
          <SelectWithIcon
            id="priority" 
            icon={<Star className="w-4 h-4" />}
            value={watch('priority') || ''}
            {...register("priority")}
          >
            <option value="">Select Priority</option>
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectWithIcon>
          {errors?.priority && (
            <ErrorMessage id="priority-error">{errors.priority.message as string}</ErrorMessage>
          )}
        </FormField>
        
        <FormField
          id="dealSize"
          label="Deal Size"
          error={errors?.dealSize?.message as string}
        >
          <SelectWithIcon
            id="dealSize" 
            icon={<Package2 className="w-4 h-4" />}
            value={watch('dealSize') || ''}
            {...register("dealSize")}
          >
            <option value="">Select Size</option>
            {dealSizeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectWithIcon>
          {errors?.dealSize && (
            <ErrorMessage id="dealSize-error">{errors.dealSize.message as string}</ErrorMessage>
          )}
        </FormField>
      </div>
      
      <SectionHeading 
        icon={<AlignLeft className="w-4 h-4" />} 
        title="Additional Details" 
      />
      
      <FormField
        id="notes"
        label="Description & Notes"
        className="mb-4"
        error={errors?.notes?.message as string}
      >
        <TextAreaWithIcon 
          id="notes"
          icon={<AlignLeft className="w-4 h-4" />}
          placeholder="Add description or notes about this deal..."
          rows={4}
          defaultValue={getValues('notes')}
          {...register("notes")}
        />
        {errors?.notes && (
          <ErrorMessage id="notes-error">{errors.notes.message as string}</ErrorMessage>
        )}
      </FormField>

      {/* Next Action Field */}
      <FormField
        id="nextAction"
        label="Next Action"
        className="mb-4"
        error={errors?.nextAction?.message as string}
      >
        <textarea
          id="nextAction"
          placeholder="Add next action for this deal..."
          rows={2}
          className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 pl-3 pr-3
            text-white placeholder-gray-500 focus:outline-none focus:ring-1 
            focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
          {...register("nextAction")}
        />
        {errors?.nextAction && (
          <ErrorMessage id="nextAction-error">{errors.nextAction.message as string}</ErrorMessage>
        )}
      </FormField>
    </div>
  );
};

// Helper components
interface SectionHeadingProps {
  icon: React.ReactNode;
  title: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-medium">
    <div className="flex items-center justify-center">
      {icon}
    </div>
    <span>{title}</span>
  </div>
);

interface FormFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ 
  id, 
  label, 
  children, 
  required, 
  error, 
  className 
}) => (
  <div className={className}>
    <label 
      htmlFor={id} 
      className="block text-sm font-medium text-gray-400 mb-1.5"
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon, className, ...props }, ref) => (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        {icon}
      </div>
      <input
        ref={ref}
        className={`w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 
          text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 
          focus:border-violet-500 transition-colors ${className || ''}`}
        {...props}
      />
    </div>
  )
);

interface SelectWithIconProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SelectWithIcon = React.forwardRef<HTMLSelectElement, SelectWithIconProps>(
  ({ icon, children, ...props }, ref) => (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        {icon}
      </div>
      <select
        ref={ref}
        className="w-full appearance-none bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 pl-10 pr-9
          text-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors"
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  )
);

interface TextAreaWithIconProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon: React.ReactNode;
}

const TextAreaWithIcon = React.forwardRef<HTMLTextAreaElement, TextAreaWithIconProps>(
  ({ icon, ...props }, ref) => (
    <div className="relative">
      <div className="absolute left-3 top-3 text-gray-500">
        {icon}
      </div>
      <textarea
        ref={ref}
        className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 pl-10 pr-3
          text-white placeholder-gray-500 focus:outline-none focus:ring-1 
          focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
        {...props}
      />
    </div>
  )
);

interface ErrorMessageProps {
  id: string;
  children: React.ReactNode;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ id, children }) => (
  <p id={id} className="mt-1.5 text-sm text-red-400">
    {children}
  </p>
);

export default DealDetailsSection; 