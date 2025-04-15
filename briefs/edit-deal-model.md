React Component Brief for Edit Deal Modal
Below is the component breakdown and implementation guide for the Edit Deal Modal in React. This follows a modern React approach with hooks, context, and styled components.

Component Structure
reasonml
Copy
EditDealModal/
├── components/
│   ├── ActivitySection/
│   │   ├── ActivityItem.jsx
│   │   └── index.jsx
│   ├── DealDetailsSection/
│   │   └── index.jsx
│   ├── LeadSourceSection/
│   │   ├── ChannelOption.jsx
│   │   └── index.jsx
│   ├── PipelineStageSection/
│   │   ├── StageOption.jsx
│   │   └── index.jsx
│   ├── FormFields/
│   │   ├── CurrencyInput.jsx
│   │   ├── DateInput.jsx
│   │   ├── Select.jsx
│   │   ├── TextArea.jsx
│   │   ├── TextInput.jsx
│   │   └── ProbabilitySlider.jsx
│   ├── SectionTab.jsx
│   └── SectionTabs.jsx
├── contexts/
│   └── EditDealContext.jsx
├── hooks/
│   └── useEditDealForm.js
├── styles/
│   └── EditDealStyles.js
├── utils/
│   └── formatters.js
├── EditDealModal.jsx
└── index.js
Key Components & Implementation
1. Main Modal Component
jsx
Copy
// EditDealModal.jsx
import React, { useState, useEffect } from 'react';
import { EditDealProvider } from './contexts/EditDealContext';
import SectionTabs from './components/SectionTabs';
import DealDetailsSection from './components/DealDetailsSection';
import PipelineStageSection from './components/PipelineStageSection';
import LeadSourceSection from './components/LeadSourceSection';
import ActivitySection from './components/ActivitySection';
import { 
  ModalBackdrop,
  Modal,
  ModalHeader,
  ModalTitle,
  TitleIcon,
  DealBadge,
  CloseButton,
  ModalBody,
  ModalFooter,
  DeleteButton,
  CancelButton,
  SaveButton
} from './styles/EditDealStyles';

const EditDealModal = ({ deal, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [currentStage, setCurrentStage] = useState(deal.stage);
  
  // Get stage name for display
  const getStageName = (stage) => {
    const stageMap = {
      'lead': 'Lead',
      'discovery': 'Discovery',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed': 'Closed/Won'
    };
    return stageMap[stage] || 'Unknown';
  };
  
  const handleSave = async (formData) => {
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      // Handle error (show toast, etc)
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      try {
        await onDelete(deal.id);
        onClose();
      } catch (error) {
        console.error('Error deleting deal:', error);
        // Handle error (show toast, etc)
      }
    }
  };
  
  return (
    <EditDealProvider deal={deal}>
      <ModalBackdrop>
        <Modal>
          <ModalHeader>
            <ModalTitle>
              <TitleIcon>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </TitleIcon>
              <span>{deal.dealName}</span>
              <DealBadge className={currentStage}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                </svg>
                <span>{getStageName(currentStage)}</span>
              </DealBadge>
            </ModalTitle>
            <CloseButton onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </CloseButton>
          </ModalHeader>
          
          <SectionTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
          
          <ModalBody>
            {activeTab === 'details' && <DealDetailsSection />}
            {activeTab === 'stage' && (
              <PipelineStageSection 
                onStageChange={(stage) => setCurrentStage(stage)} 
              />
            )}
            {activeTab === 'source' && <LeadSourceSection />}
            {activeTab === 'activity' && <ActivitySection />}
          </ModalBody>
          
          <ModalFooter>
            <DeleteButton onClick={handleDelete}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete Deal
            </DeleteButton>
            <CancelButton onClick={onClose}>Cancel</CancelButton>
            <SaveButton onClick={handleSave}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Save Changes
            </SaveButton>
          </ModalFooter>
        </Modal>
      </ModalBackdrop>
    </EditDealProvider>
  );
};

export default EditDealModal;
2. Context for Form State Management
jsx
Copy
// contexts/EditDealContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const EditDealContext = createContext();

const initialState = {
  dealName: '',
  company: '',
  contactName: '',
  closeDate: '',
  dealValue: 0,
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

function dealReducer(state, action) {
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

export const EditDealProvider = ({ children, deal }) => {
  const [state, dispatch] = useReducer(dealReducer, initialState);
  
  // Initialize the form with the deal data
  useEffect(() => {
    if (deal) {
      dispatch({ type: 'INITIALIZE_FORM', payload: deal });
    }
  }, [deal]);

  // Helper functions
  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };
  
  const updateLeadSource = (field, value) => {
    dispatch({ type: 'UPDATE_LEAD_SOURCE', field, value });
  };
  
  const setError = (field, message) => {
    dispatch({ type: 'SET_ERROR', field, message });
  };
  
  const clearError = (field) => {
    dispatch({ type: 'CLEAR_ERROR', field });
  };
  
  const validateForm = () => {
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
    
    if (!state.dealValue || state.dealValue <= 0) {
      setError('dealValue', 'Deal value must be greater than 0');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Prepare form data for submission
  const getFormData = () => {
    return {
      id: deal?.id, // Include the ID if it exists
      dealName: state.dealName,
      company: state.company,
      contactName: state.contactName,
      closeDate: state.closeDate,
      dealValue: parseFloat(state.dealValue),
      stage: state.stage,
      probability: parseInt(state.probability),
      priority: state.priority,
      dealSize: state.dealSize,
      leadSource: state.leadSource,
      nextAction: state.nextAction,
      description: state.description
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

export const useEditDeal = () => useContext(EditDealContext);

export default EditDealContext;
3. Tab Navigation Component
jsx
Copy
// components/SectionTabs.jsx
import React from 'react';
import SectionTab from './SectionTab';
import { SectionsTabsContainer } from '../styles/EditDealStyles';

const SectionTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'details', label: 'Deal Details' },
    { id: 'stage', label: 'Pipeline Stage' },
    { id: 'source', label: 'Lead Source' },
    { id: 'activity', label: 'Activity' }
  ];
  
  return (
    <SectionsTabsContainer>
      {tabs.map(tab => (
        <SectionTab 
          key={tab.id}
          id={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </SectionsTabsContainer>
  );
};

export default SectionTabs;
4. Deal Details Section Component
jsx
Copy
// components/DealDetailsSection/index.jsx
import React from 'react';
import { useEditDeal } from '../../contexts/EditDealContext';
import TextInput from '../FormFields/TextInput';
import DateInput from '../FormFields/DateInput';
import CurrencyInput from '../FormFields/CurrencyInput';
import Select from '../FormFields/Select';
import TextArea from '../FormFields/TextArea';
import { 
  SectionContainer, 
  SectionHeading, 
  SectionIcon, 
  FormGrid 
} from '../../styles/EditDealStyles';

const DealDetailsSection = () => {
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
    <SectionContainer>
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </SectionIcon>
        <span>Basic Information</span>
      </SectionHeading>
      
      <FormGrid>
        <TextInput
          id="dealName"
          label="Deal Name"
          value={state.dealName}
          onChange={(e) => updateField('dealName', e.target.value)}
          error={state.errors?.dealName}
          fullWidth
          required
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          }
        />
        
        <TextInput
          id="company"
          label="Company"
          value={state.company}
          onChange={(e) => updateField('company', e.target.value)}
          error={state.errors?.company}
          required
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          }
        />
        
        <TextInput
          id="contactName"
          label="Contact Name"
          value={state.contactName}
          onChange={(e) => updateField('contactName', e.target.value)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          }
        />
      </FormGrid>
      
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </SectionIcon>
        <span>Deal Timeline & Value</span>
      </SectionHeading>
      
      <FormGrid>
        <DateInput
          id="closeDate"
          label="Expected Close Date"
          value={state.closeDate}
          onChange={(date) => updateField('closeDate', date)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          }
        />

        <CurrencyInput
          id="dealValue"
          label="Deal Value"
          value={state.dealValue}
          onChange={(value) => updateField('dealValue', value)}
          error={state.errors?.dealValue}
          required
          currency="£"
        />

        <Select
          id="priority"
          label="Deal Priority"
          options={priorityOptions}
          value={state.priority}
          onChange={(e) => updateField('priority', e.target.value)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          }
        />

        <Select
          id="dealSize"
          label="Deal Size"
          options={dealSizeOptions}
          value={state.dealSize}
          onChange={(e) => updateField('dealSize', e.target.value)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          }
        />
      </FormGrid>
      
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="3" y2="18"></line>
          </svg>
        </SectionIcon>
        <span>Additional Details</span>
      </SectionHeading>
      
      <TextArea
        id="description"
        label="Description & Notes"
        value={state.description}
        onChange={(e) => updateField('description', e.target.value)}
        fullWidth
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="3" y2="18"></line>
          </svg>
        }
      />
    </SectionContainer>
  );
};

export default DealDetailsSection;
5. Pipeline Stage Section
jsx
Copy
// components/PipelineStageSection/index.jsx
import React from 'react';
import { useEditDeal } from '../../contexts/EditDealContext';
import StageOption from './StageOption';
import Select from '../FormFields/Select';
import ProbabilitySlider from '../FormFields/ProbabilitySlider';
import { 
  SectionContainer, 
  SectionHeading, 
  SectionIcon, 
  StageOptionsContainer 
} from '../../styles/EditDealStyles';

const PipelineStageSection = ({ onStageChange }) => {
  const { state, updateField } = useEditDeal();
  
  const stages = [
    { id: 'lead', name: 'Lead', probability: 20, color: 'lead-color' },
    { id: 'discovery', name: 'Discovery', probability: 40, color: 'discovery-color' },
    { id: 'proposal', name: 'Proposal', probability: 60, color: 'proposal-color' },
    { id: 'negotiation', name: 'Negotiation', probability: 80, color: 'negotiation-color' },
    { id: 'closed', name: 'Closed/Won', probability: 100, color: 'closed-color' }
  ];
  
  const nextActionOptions = [
    { value: '', label: 'Select next action' },
    { value: 'demo', label: 'Schedule Demo' },
    { value: 'proposal', label: 'Send Proposal' },
    { value: 'follow-up', label: 'Follow-up Call' },
    { value: 'quote', label: 'Send Quote' },
    { value: 'contract', label: 'Send Contract' },
    { value: 'meeting', label: 'Schedule Meeting' },
    { value: 'none', label: 'No Action Needed' }
  ];
  
  const handleStageChange = (stageId) => {
    updateField('stage', stageId);
    
    // Find the default probability for this stage
    const stage = stages.find(s => s.id === stageId);
    if (stage) {
      updateField('probability', stage.probability);
    }
    
    // Notify parent component
    if (onStageChange) {
      onStageChange(stageId);
    }
  };
  
  return (
    <SectionContainer>
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </SectionIcon>
        <span>Current Pipeline Stage</span>
      </SectionHeading>
      
      <StageOptionsContainer>
        {stages.map(stage => (
          <StageOption
            key={stage.id}
            id={stage.id}
            name={stage.name}
            probability={stage.probability}
            color={stage.color}
            isSelected={state.stage === stage.id}
            onClick={() => handleStageChange(stage.id)}
          />
        ))}
      </StageOptionsContainer>
      
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
          </svg>
        </SectionIcon>
        <span>Next Action</span>
      </SectionHeading>
      
      <Select
        id="nextAction"
        options={nextActionOptions}
        value={state.nextAction}
        onChange={(e) => updateField('nextAction', e.target.value)}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        }
      />
      
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </SectionIcon>
        <span>Win Probability</span>
      </SectionHeading>
      
      <ProbabilitySlider
        value={state.probability}
        onChange={(value) => updateField('probability', value)}
        hint={`Default probability based on selected stage is ${stages.find(s => s.id === state.stage)?.probability}%`}
      />
    </SectionContainer>
  );
};

export default PipelineStageSection;
6. Lead Source Section
jsx
Copy
// components/LeadSourceSection/index.jsx
import React from 'react';
import { useEditDeal } from '../../contexts/EditDealContext';
import ChannelOption from './ChannelOption';
import { 
  SectionContainer, 
  SectionHeading, 
  SectionIcon,
  SourceTabs,
  SourceTab,
  ChannelOptionsContainer,
  SectionAlert
} from '../../styles/EditDealStyles';

const LeadSourceSection = () => {
  const { state, updateLeadSource } = useEditDeal();
  
  const sourceTypes = [
    { id: 'inbound', label: 'Inbound' },
    { id: 'outbound', label: 'Outbound' },
    { id: 'event', label: 'Event' },
    { id: 'referral', label: 'Referral' }
  ];
  
  const channels = {
    inbound: [
      { id: 'facebook', label: 'Facebook' },
      { id: 'linkedin', label: 'LinkedIn' },
      { id: 'email', label: 'Email' }
    ],
    outbound: [
      { id: 'cold-call', label: 'Cold Call' },
      { id: 'linkedin', label: 'LinkedIn' },
      { id: 'other', label: 'Other' }
    ],
    event: [
      { id: 'webinar', label: 'Webinar' },
      { id: 'in-person', label: 'In Person' }
    ],
    referral: [
      { id: 'referral', label: 'Referral' }
    ]
  };
  
  const handleSourceTypeChange = (sourceType) => {
    updateLeadSource('type', sourceType);
    // Reset channel when changing source type
    updateLeadSource('channel', '');
  };
  
  return (
    <SectionContainer>
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
        </SectionIcon>
        <span>Lead Source</span>
      </SectionHeading>
      
      <SourceTabs>
        {sourceTypes.map(source => (
          <SourceTab
            key={source.id}
            isActive={state.leadSource.type === source.id}
            onClick={() => handleSourceTypeChange(source.id)}
          >
            {source.label}
          </SourceTab>
        ))}
      </SourceTabs>
      
      <ChannelOptionsContainer isActive={true}>
        {channels[state.leadSource.type]?.map(channel => (
          <ChannelOption
            key={channel.id}
            id={channel.id}
            label={channel.label}
            isSelected={state.leadSource.channel === channel.id}
            onClick={() => updateLeadSource('channel', channel.id)}
          />
        ))}
      </ChannelOptionsContainer>
      
      <SectionAlert>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Changing the lead source will update attribution reporting for this deal.</span>
      </SectionAlert>
    </SectionContainer>
  );
};

export default LeadSourceSection;
7. Activity Section
jsx
Copy
// components/ActivitySection/index.jsx
import React, { useState } from 'react';
import ActivityItem from './ActivityItem';
import TextArea from '../FormFields/TextArea';
import { 
  SectionContainer, 
  SectionHeading, 
  SectionIcon,
  QuickActions,
  ActionButton,
  ActivityList
} from '../../styles/EditDealStyles';

const ActivitySection = ({ activities = [], onAddActivity }) => {
  const [activityNote, setActivityNote] = useState('');
  
  const handleAddNote = () => {
    if (activityNote.trim()) {
      onAddActivity({
        type: 'note',
        content: activityNote,
        timestamp: new Date().toISOString()
      });
      setActivityNote('');
    }
  };
  
  return (
    <SectionContainer>
      <SectionHeading>
        <SectionIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </SectionIcon>
        <span>Deal Activity</span>
      </SectionHeading>
      
      <TextArea
        id="activityNote"
        label="Add Activity Note"
        value={activityNote}
        onChange={(e) => setActivityNote(e.target.value)}
        placeholder="Add a note about this deal..."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        }
      />
      
      <QuickActions>
        <ActionButton primary onClick={handleAddNote}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Add Note
        </ActionButton>
        <ActionButton>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Schedule Task
        </ActionButton>
        <ActionButton>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Log Call
        </ActionButton>
        <ActionButton>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          Log Email
        </ActionButton>
      </QuickActions>
      
      <ActivityList>
        {activities.map((activity, index) => (
          <ActivityItem
            key={index}
            activity={activity}
          />
        ))}
        
        {/* Default activities for demo/example */}
        {activities.length === 0 && (
          <>
            <ActivityItem
              activity={{
                type: 'stage_change',
                title: 'Stage updated to Proposal',
                description: 'Sarah changed the deal stage from Discovery to Proposal',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                user: 'Sarah'
              }}
            />
            <ActivityItem
              activity={{
                type: 'note',
                title: 'Note added',
                description: 'Had a detailed discovery call with John. They expressed strong interest in our Growth Plan and requested a detailed proposal to present to their leadership team next week.',
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                user: 'Sarah'
              }}
            />
            <ActivityItem
              activity={{
                type: 'creation',
                title: 'Deal created',
                description: 'Deal was created and assigned to Sarah',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                user: 'System'
              }}
            />
          </>
        )}
      </ActivityList>
    </SectionContainer>
  );
};

export default ActivitySection;
8. Styled Components Example
jsx
Copy
// styles/EditDealStyles.js
import styled from 'styled-components';

export const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

export const Modal = styled.div`
  background-color: var(--bg-modal, #111827);
  border-radius: 1rem;
  border: 1px solid rgba(75, 85, 99, 0.4);
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.125rem 1.5rem;
  border-bottom: 1px solid rgba(75, 85, 99, 0.2);
  position: relative;
  z-index: 5;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, var(--emerald-500, #10b981) 0%, var(--blue-500, #3b82f6) 50%, var(--violet-500, #8b5cf6) 100%);
    opacity: 0.3;
  }
`;

export const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #f3f4f6);
`;

export const TitleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  color: var(--emerald-400, #34d399);
  border: 1px solid rgba(16, 185, 129, 0.2);
`;

export const DealBadge = styled.div`
  padding: 0.25rem 0.625rem;
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--emerald-400, #34d399);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  
  &.lead {
    background-color: rgba(59, 130, 246, 0.15);
    color: var(--blue-400, #60a5fa);
  }
  
  &.discovery {
    background-color: rgba(139, 92, 246, 0.15);
    color: var(--violet-400, #a78bfa);
  }
  
  &.proposal {
    background-color: rgba(249, 115, 22, 0.15);
    color: var(--orange-400, #fb923c);
  }
  
  &.negotiation {
    background-color: rgba(234, 179, 8, 0.15);
    color: var(--yellow-400, #facc15);
  }
  
  &.closed {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--emerald-400, #34d399);
  }
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary, #9ca3af);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(75, 85, 99, 0.2);
    color: var(--text-primary, #f3f4f6);
  }
`;

// And so on for all other styled components...
Usage Example
jsx
Copy
// In your app
import React, { useState } from 'react';
import EditDealModal from './EditDealModal';

const PipelineTracker = () => {
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Example deals data
  const [deals, setDeals] = useState([
    {
      id: 1,
      dealName: 'Acme Corp - Growth Plan',
      company: 'Acme Corp',
      contactName: 'John Smith',
      closeDate: '2025-06-30',
      dealValue: 25000,
      stage: 'proposal',
      probability: 60,
      priority: 'high',
      dealSize: 'medium',
      leadSource: {
        type: 'outbound', 
        channel: 'linkedin'
      },
      nextAction: 'proposal',
      description: 'Acme Corp is looking to implement our Growth Plan to scale their marketing efforts.',
      activities: [
        // Activity history...
      ]
    }
    // More deals...
  ]);
  
  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setShowEditModal(true);
  };
  
  const handleSaveDeal = (updatedDeal) => {
    // Update the deal in your state or send to API
    setDeals(deals.map(deal => 
      deal.id === updatedDeal.id ? updatedDeal : deal
    ));
  };
  
  const handleDeleteDeal = (dealId) => {
    // Remove the deal from your state or send delete request to API
    setDeals(deals.filter(deal => deal.id !== dealId));
  };
  
  return (
    <div className="pipeline-tracker">
      <h1>Pipeline Tracker</h1>
      
      {/* Your deals cards/table here */}
      <div className="deals-grid">
        {deals.map(deal => (
          <div 
            key={deal.id} 
            className="deal-card"
            onClick={() => handleDealClick(deal)}
          >
            <h3>{deal.dealName}</h3>
            <p>{deal.company}</p>
            <div className={`stage-badge ${deal.stage}`}>
              {deal.stage}
            </div>
            <div className="deal-value">£{deal.dealValue.toLocaleString()}</div>
          </div>
        ))}
      </div>
      
      {/* Edit Deal Modal */}
      {showEditModal && selectedDeal && (
        <EditDealModal
          deal={selectedDeal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveDeal}
          onDelete={handleDeleteDeal}
        />
      )}
    </div>
  );
};

export default PipelineTracker;
Integration with API
To integrate with a backend API, modify the handleSave and handleDelete functions in your components:

jsx
Copy
// In EditDealModal.jsx
const handleSave = async () => {
  // First validate the form
  if (!validateForm()) {
    return;
  }
  
  try {
    const formData = getFormData();
    
    // API call
    const response = await fetch(`/api/deals/${formData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update deal');
    }
    
    const updatedDeal = await response.json();
    
    // Call the parent component's onSave handler
    onSave(updatedDeal);
    onClose();
    
    // Show success message
    toast.success('Deal updated successfully');
  } catch (error) {
    console.error('Error updating deal:', error);
    toast.error('Failed to update deal: ' + error.message);
  }
};

const handleDelete = async () => {
  if (window.confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
    try {
      // API call
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete deal');
      }
      
      // Call the parent component's onDelete handler
      onDelete(deal.id);
      onClose();
      
      // Show success message
      toast.success('Deal deleted successfully');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal: ' + error.message);
    }
  }
};
Installation Guide
Set up dependencies
bash
Copy
# Install required packages
npm install styled-components react-datepicker date-fns
Create necessary directories
bash
Copy
# Create component structure
mkdir -p src/components/EditDealModal/components/ActivitySection
mkdir -p src/components/EditDealModal/components/DealDetailsSection
mkdir -p src/components/EditDealModal/components/LeadSourceSection
mkdir -p src/components/EditDealModal/components/PipelineStageSection
mkdir -p src/components/EditDealModal/components/FormFields
mkdir -p src/components/EditDealModal/contexts
mkdir -p src/components/EditDealModal/hooks
mkdir -p src/components/EditDealModal/styles
mkdir -p src/components/EditDealModal/utils
Create the component files using the examples provided above
Add theme variables
Add the theme variables to your global CSS or theme provider:

jsx
Copy
// In your theme.js or CSS variables
const theme = {
  colors: {
    bgDark: '#0f172a',
    bgDarker: '#0d1424',
    bgModal: '#111827',
    bgInput: 'rgba(17, 24, 39, 0.5)',
    bgElement: 'rgba(31, 41, 55, 0.4)',
    borderColor: 'rgba(55, 65, 81, 0.4)',
    borderFocus: 'rgba(139, 92, 246, 0.5)',
    textPrimary: '#f3f4f6',
    textSecondary: '#9ca3af',
    textHint: '#6b7280',
    
    // Stage colors
    blue400: '#60a5fa',
    blue500: '#3b82f6',
    violet400: '#a78bfa',
    violet500: '#8b5cf6',
    orange400: '#fb923c',
    orange500: '#f97316',
    yellow400: '#facc15',
    yellow500: '#eab308',
    emerald400: '#34d399',
    emerald500: '#10b981',
    red400: '#f87171',
    red500: '#ef4444',
  }
};
Best Practices
Performance
Use React.memo() for components that don't change often
Optimize rerenders by properly structuring component tree
Use useMemo and useCallback for expensive calculations or callback functions
Accessibility
Add proper ARIA attributes to all interactive elements
Ensure keyboard navigation works correctly
Add proper focus management within the modal
Error Handling
Add comprehensive error handling for API calls
Display user-friendly error messages
Log errors to your monitoring system
Form Validation
Implement both client-side and server-side validation
Provide clear error messages
Validate fields on blur and before submission
User Experience
Add loading indicators for async operations
Provide feedback when actions are completed
Add confirmation for destructive actions
Ensure smooth transitions between tabs
This brief provides you with a comprehensive approach to implementing the Edit Deal Modal in React. You can adjust the components and styles to match your specific design system and requirements. The tabbed interface provides a clean and efficient way to organize deal information without requiring users to navigate through multiple steps.