import React, { useState, useEffect } from 'react';
import { X, Calendar, PoundSterling, Users, Building, FileText } from 'lucide-react';
import { useDealStages } from '@/lib/hooks/useDealStages';
import { IdentifierField, IdentifierType } from '@/components/IdentifierField';
import { toast } from 'sonner';

interface DealFormProps {
  deal?: any;
  onSave: (formData: any) => void;
  onCancel: () => void;
  initialStageId?: string | null;
}

interface FormData {
  name: string;
  company: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  value: string | number;
  stage_id: string;
  expected_close_date: string;
  description: string;
  probability: string | number;
  contactIdentifier: string;
  contactIdentifierType: IdentifierType;
}

export function DealForm({ 
  deal = null, 
  onSave, 
  onCancel, 
  initialStageId = null 
}: DealFormProps) {
  const { stages } = useDealStages();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    value: '',
    stage_id: '',
    expected_close_date: '',
    description: '',
    probability: '',
    contactIdentifier: '',
    contactIdentifierType: 'unknown'
  });
  
  // Initialize form with deal data if editing
  useEffect(() => {
    if (deal) {
      setFormData({
        name: deal.name || '',
        company: deal.company || '',
        contact_name: deal.contact_name || '',
        contact_email: deal.contact_email || '',
        contact_phone: deal.contact_phone || '',
        value: deal.value || '',
        stage_id: deal.stage_id || '',
        expected_close_date: deal.expected_close_date || '',
        description: deal.description || '',
        probability: deal.probability || '',
        contactIdentifier: deal.contact_identifier || deal.contactIdentifier || '',
        contactIdentifierType: deal.contact_identifier_type || deal.contactIdentifierType || 'unknown'
      });
    } else if (initialStageId) {
      setFormData(prev => ({
        ...prev,
        stage_id: initialStageId
      }));
    }
  }, [deal, initialStageId]);
  
  // Set default probability based on selected stage
  useEffect(() => {
    if (formData.stage_id && !formData.probability) {
      const selectedStage = stages?.find(s => s.id === formData.stage_id);
      if (selectedStage) {
        setFormData(prev => ({
          ...prev,
          probability: selectedStage.default_probability
        }));
      }
    }
  }, [formData.stage_id, stages, formData.probability]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if contact identifier is provided
    if (!formData.contactIdentifier) {
      toast.error('Please provide a contact identifier (email, phone number, or LinkedIn URL)');
      return;
    }
    
    // Validate the contact identifier if it's provided
    if (formData.contactIdentifierType === 'unknown') {
      toast.error('Please enter a valid email, phone number, or LinkedIn URL');
      return;
    }
    
    // Prepare data for saving, mapping camelCase to snake_case and ensuring empty date is null
    const { contactIdentifier, contactIdentifierType, ...otherFormData } = formData;
    
    const dataToSave = {
      ...otherFormData,
      expected_close_date: formData.expected_close_date === '' ? null : formData.expected_close_date,
      // Map camelCase frontend fields to snake_case database fields
      contact_identifier: contactIdentifier,
      contact_identifier_type: contactIdentifierType
    };
    
    onSave(dataToSave); // Pass the cleaned data
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          {deal ? 'Edit Deal' : 'New Deal'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Deal name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Deal Name
          </label>
          <div className="flex items-center border border-gray-700 rounded-lg
            bg-gray-900/80 focus-within:border-violet-500/50 transition-colors"
          >
            <span className="pl-3 text-gray-500">
              <FileText className="w-5 h-5" />
            </span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter deal name"
              className="w-full p-2.5 bg-transparent border-none
                outline-none text-white"
            />
          </div>
        </div>
        
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Company
          </label>
          <div className="flex items-center border border-gray-700 rounded-lg
            bg-gray-900/80 focus-within:border-violet-500/50 transition-colors"
          >
            <span className="pl-3 text-gray-500">
              <Building className="w-5 h-5" />
            </span>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              placeholder="Enter company name"
              className="w-full p-2.5 bg-transparent border-none
                outline-none text-white"
            />
          </div>
        </div>
        
        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Contact Name
          </label>
          <div className="flex items-center border border-gray-700 rounded-lg
            bg-gray-900/80 focus-within:border-violet-500/50 transition-colors"
          >
            <span className="pl-3 text-gray-500">
              <Users className="w-5 h-5" />
            </span>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              placeholder="Enter contact name"
              className="w-full p-2.5 bg-transparent border-none
                outline-none text-white"
            />
          </div>
        </div>
        
        {/* Contact Identifier Field with improved styling */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center">
            Email Address
            <span className="text-red-500 ml-1">*</span>
          </label>
          <IdentifierField
            value={formData.contactIdentifier}
            onChange={(value, type) => 
              setFormData({
                ...formData, 
                contactIdentifier: value, 
                contactIdentifierType: type
              })
            }
            required={true}
            placeholder="Required: Enter email address"
          />
        </div>
        
        {/* Deal Value and Stage side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Deal Value (£)
            </label>
            <div className="flex items-center border border-gray-700 rounded-lg
              bg-gray-900/80 focus-within:border-violet-500/50 transition-colors"
            >
              <span className="pl-3 text-gray-500">
                <PoundSterling className="w-5 h-5" />
              </span>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                required
                min="0"
                step="1"
                placeholder="Enter deal value"
                className="w-full p-2.5 bg-transparent border-none
                  outline-none text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Pipeline Stage
            </label>
            <select
              name="stage_id"
              value={formData.stage_id}
              onChange={handleChange}
              required
              className="w-full p-2.5 bg-gray-900/80 border border-gray-700
                rounded-lg text-white outline-none focus:border-violet-500/50
                transition-colors appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
            >
              <option value="">Select stage</option>
              {stages && stages.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Close Date and Probability side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Expected Close Date
            </label>
            <div className="flex items-center border border-gray-700 rounded-lg
              bg-gray-900/80 focus-within:border-violet-500/50 transition-colors"
            >
              <span className="pl-3 text-gray-500">
                <Calendar className="w-5 h-5" />
              </span>
              <input
                type="date"
                name="expected_close_date"
                value={formData.expected_close_date}
                onChange={handleChange}
                className="w-full p-2.5 bg-transparent border-none
                  outline-none text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Win Probability (%)
            </label>
            <input
              type="number"
              name="probability"
              value={formData.probability}
              onChange={handleChange}
              min="0"
              max="100"
              step="1"
              placeholder="Enter probability"
              className="w-full p-2.5 bg-gray-900/80 border border-gray-700
                rounded-lg text-white outline-none focus:border-violet-500/50
                transition-colors"
            />
            
            {/* Probability slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.probability || 0}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                probability: e.target.value
              }))}
              className="w-full mt-2 bg-gray-700 rounded-lg appearance-none h-2 outline-none"
            />
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Enter deal description"
            className="w-full p-2.5 bg-gray-900/80 border border-gray-700
              rounded-lg text-white outline-none focus:border-violet-500/50
              transition-colors resize-none"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg
            hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg
            border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
        >
          {deal ? 'Update Deal' : 'Create Deal'}
        </button>
      </div>
    </form>
  );
} 