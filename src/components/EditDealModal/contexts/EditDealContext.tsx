import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Define types for the form state
export interface LeadSource {
  type: 'inbound' | 'outbound' | 'event' | 'referral';
  channel: string;
}

export interface DealFormState {
  dealName: string;
  company: string;
  contactName: string;
  closeDate: string;
  dealValue: number | string;
  stage: string;
  probability: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dealSize: 'small' | 'medium' | 'large' | 'strategic';
  leadSource: LeadSource;
  nextAction: string;
  description: string;
  errors: Record<string, string | undefined>;
}

interface EditDealContextType {
  state: DealFormState;
  updateField: (field: keyof DealFormState, value: any) => void;
  updateLeadSource: (field: keyof LeadSource, value: string) => void;
  setError: (field: keyof DealFormState, message: string) => void;
  clearError: (field: keyof DealFormState) => void;
  validateForm: () => boolean;
  getFormData: () => Omit<DealFormState, 'errors'>;
}

const EditDealContext = createContext<EditDealContextType | undefined>(undefined);

// Initial state for the form
const initialState: DealFormState = {
  dealName: '',
  company: '',
  contactName: '',
  closeDate: '',
  dealValue: '',
  stage: 'lead',
  probability: 20,
  priority: 'medium',
  dealSize: 'medium',
  leadSource: {
    type: 'inbound',
    channel: ''
  },
  nextAction: '',
  description: '',
  errors: {}
};

// Action types for the reducer
type ActionType =
  | { type: 'INITIALIZE_FORM'; payload: Partial<DealFormState> }
  | { type: 'UPDATE_FIELD'; field: keyof DealFormState; value: any }
  | { type: 'UPDATE_LEAD_SOURCE'; field: keyof LeadSource; value: string }
  | { type: 'SET_ERROR'; field: keyof DealFormState; message: string }
  | { type: 'CLEAR_ERROR'; field: keyof DealFormState };

// Reducer to handle state updates
function dealReducer(state: DealFormState, action: ActionType): DealFormState {
  switch (action.type) {
    case 'INITIALIZE_FORM':
      return { ...initialState, ...action.payload };
    
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        errors: {
          ...state.errors,
          [action.field]: undefined
        }
      };
    
    case 'UPDATE_LEAD_SOURCE':
      return {
        ...state,
        leadSource: {
          ...state.leadSource,
          [action.field]: action.value
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.message
        }
      };
    
    case 'CLEAR_ERROR':
      const updatedErrors = { ...state.errors };
      delete updatedErrors[action.field];
      return {
        ...state,
        errors: updatedErrors
      };
    
    default:
      return state;
  }
}

interface EditDealProviderProps {
  children: React.ReactNode;
  deal: any;
}

export const EditDealProvider: React.FC<EditDealProviderProps> = ({ children, deal }) => {
  const [state, dispatch] = useReducer(dealReducer, initialState);
  
  // Initialize the form with deal data
  useEffect(() => {
    if (deal) {
      dispatch({ 
        type: 'INITIALIZE_FORM', 
        payload: {
          dealName: deal.dealName || deal.name || '',
          company: deal.company || '',
          contactName: deal.contactName || deal.contact_name || '',
          closeDate: deal.closeDate || deal.expected_close_date || '',
          dealValue: deal.dealValue || deal.value || '',
          stage: deal.stage || 'lead',
          probability: deal.probability || 20,
          priority: deal.priority || 'medium',
          dealSize: deal.dealSize || deal.size || 'medium',
          leadSource: deal.leadSource || {
            type: 'inbound',
            channel: ''
          },
          nextAction: deal.nextAction || '',
          description: deal.description || ''
        }
      });
    }
  }, [deal]);

  // Helper functions for the context
  const updateField = (field: keyof DealFormState, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };
  
  const updateLeadSource = (field: keyof LeadSource, value: string) => {
    dispatch({ type: 'UPDATE_LEAD_SOURCE', field, value });
  };
  
  const setError = (field: keyof DealFormState, message: string) => {
    dispatch({ type: 'SET_ERROR', field, message });
  };
  
  const clearError = (field: keyof DealFormState) => {
    dispatch({ type: 'CLEAR_ERROR', field });
  };
  
  // Validate the form before submission
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Required fields validation
    if (!state.dealName) {
      setError('dealName', 'Deal name is required');
      isValid = false;
    }
    
    if (!state.company) {
      setError('company', 'Company is required');
      isValid = false;
    }
    
    // Deal value validation
    const dealValue = parseFloat(state.dealValue as string);
    if (!state.dealValue || isNaN(dealValue) || dealValue <= 0) {
      setError('dealValue', 'Deal value must be greater than 0');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Prepare form data for submission
  const getFormData = () => {
    // Omit errors from the state
    const { errors, ...formData } = state;
    return {
      ...formData,
      dealValue: parseFloat(state.dealValue as string) || 0,
      probability: parseInt(state.probability.toString())
    };
  };
  
  return (
    <EditDealContext.Provider
      value={{
        state,
        updateField,
        updateLeadSource,
        setError,
        clearError,
        validateForm,
        getFormData
      }}
    >
      {children}
    </EditDealContext.Provider>
  );
};

// Custom hook to use the EditDeal context
export const useEditDeal = (): EditDealContextType => {
  const context = useContext(EditDealContext);
  if (context === undefined) {
    throw new Error('useEditDeal must be used within an EditDealProvider');
  }
  return context;
};

export default EditDealContext; 