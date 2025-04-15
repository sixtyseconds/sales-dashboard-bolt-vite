import React, { RefObject } from 'react';
import { FileText, Building, User, Calendar, DollarSign, Star, Package2, AlignLeft } from 'lucide-react';
import { useEditDeal } from '../../contexts/EditDealContext';

interface DealDetailsSectionProps {
  initialFocusRef?: RefObject<HTMLInputElement>;
}

const DealDetailsSection: React.FC<DealDetailsSectionProps> = ({ initialFocusRef }) => {
  const { state, updateField } = useEditDeal();
  
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
  
  return (
    <div id="details-section" role="tabpanel" aria-labelledby="tab-details">
      <SectionHeading icon={<FileText className="w-4 h-4" />} title="Basic Information" />
      
      <FormField
        id="dealName"
        label="Deal Name"
        required
        error={state.errors?.dealName}
        className="mb-4"
      >
        <InputWithIcon 
          id="dealName"
          icon={<FileText className="w-4 h-4" />}
          value={state.dealName}
          onChange={(e) => updateField('dealName', e.target.value)}
          placeholder="Enter deal name"
          aria-required="true"
          aria-invalid={!!state.errors?.dealName}
          aria-describedby={state.errors?.dealName ? "dealName-error" : undefined}
          ref={initialFocusRef}
        />
        {state.errors?.dealName && (
          <ErrorMessage id="dealName-error">{state.errors.dealName}</ErrorMessage>
        )}
      </FormField>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FormField
          id="company"
          label="Company"
          required
          error={state.errors?.company}
        >
          <InputWithIcon
            id="company" 
            icon={<Building className="w-4 h-4" />}
            value={state.company}
            onChange={(e) => updateField('company', e.target.value)}
            placeholder="Enter company name"
            aria-required="true"
            aria-invalid={!!state.errors?.company}
            aria-describedby={state.errors?.company ? "company-error" : undefined}
          />
          {state.errors?.company && (
            <ErrorMessage id="company-error">{state.errors.company}</ErrorMessage>
          )}
        </FormField>
        
        <FormField
          id="contactName"
          label="Contact Name"
        >
          <InputWithIcon 
            id="contactName"
            icon={<User className="w-4 h-4" />}
            value={state.contactName}
            onChange={(e) => updateField('contactName', e.target.value)}
            placeholder="Enter contact name"
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
        >
          <InputWithIcon
            id="closeDate" 
            icon={<Calendar className="w-4 h-4" />}
            type="date"
            value={state.closeDate}
            onChange={(e) => updateField('closeDate', e.target.value)}
          />
        </FormField>
        
        <FormField
          id="dealValue"
          label="Deal Value"
          required
          error={state.errors?.dealValue}
        >
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="absolute left-9 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              £
            </div>
            <input
              id="dealValue"
              type="number"
              value={state.dealValue}
              onChange={(e) => updateField('dealValue', e.target.value)}
              placeholder="Enter deal value"
              min="0"
              step="1"
              aria-required="true"
              aria-invalid={!!state.errors?.dealValue}
              aria-describedby={state.errors?.dealValue ? "dealValue-error" : undefined}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 pl-14 pr-3 
                text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 
                focus:border-violet-500 transition-colors"
            />
          </div>
          {state.errors?.dealValue && (
            <ErrorMessage id="dealValue-error">{state.errors.dealValue}</ErrorMessage>
          )}
        </FormField>
        
        <FormField
          id="priority"
          label="Deal Priority"
        >
          <SelectWithIcon
            id="priority" 
            icon={<Star className="w-4 h-4" />}
            value={state.priority}
            onChange={(e) => updateField('priority', e.target.value)}
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectWithIcon>
        </FormField>
        
        <FormField
          id="dealSize"
          label="Deal Size"
        >
          <SelectWithIcon
            id="dealSize" 
            icon={<Package2 className="w-4 h-4" />}
            value={state.dealSize}
            onChange={(e) => updateField('dealSize', e.target.value)}
          >
            {dealSizeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectWithIcon>
        </FormField>
      </div>
      
      <SectionHeading 
        icon={<AlignLeft className="w-4 h-4" />} 
        title="Additional Details" 
      />
      
      <FormField
        id="description"
        label="Description & Notes"
        className="mb-4"
      >
        <TextAreaWithIcon 
          id="description"
          icon={<AlignLeft className="w-4 h-4" />}
          value={state.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Add description or notes about this deal..."
          rows={4}
        />
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

const SelectWithIcon: React.FC<SelectWithIconProps> = ({ icon, children, ...props }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
      {icon}
    </div>
    <select
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
);

interface TextAreaWithIconProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon: React.ReactNode;
}

const TextAreaWithIcon: React.FC<TextAreaWithIconProps> = ({ icon, ...props }) => (
  <div className="relative">
    <div className="absolute left-3 top-3 text-gray-500">
      {icon}
    </div>
    <textarea
      className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-2.5 pl-10 pr-3
        text-white placeholder-gray-500 focus:outline-none focus:ring-1 
        focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
      {...props}
    />
  </div>
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