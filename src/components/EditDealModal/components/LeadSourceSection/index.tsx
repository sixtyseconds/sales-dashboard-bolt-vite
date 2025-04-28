import React from 'react';
import { Map, AlertCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import ChannelOption from './ChannelOption';

interface SourceType {
  id: 'inbound' | 'outbound' | 'event' | 'referral';
  label: string;
}

interface Channel {
  id: string;
  label: string;
}

interface ChannelsMap {
  [key: string]: Channel[];
}

const LeadSourceSection: React.FC = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();

  const currentSourceType = watch('leadSourceType');
  const currentChannel = watch('leadSourceChannel');

  const sourceTypes: SourceType[] = [
    { id: 'inbound', label: 'Inbound' },
    { id: 'outbound', label: 'Outbound' },
    { id: 'event', label: 'Event' },
    { id: 'referral', label: 'Referral' }
  ];
  
  const channels: ChannelsMap = {
    inbound: [
      { id: 'website', label: 'Website' },
      { id: 'facebook', label: 'Facebook' },
      { id: 'linkedin', label: 'LinkedIn' },
      { id: 'twitter', label: 'Twitter' },
      { id: 'email', label: 'Email' },
      { id: 'organic-search', label: 'Organic Search' }
    ],
    outbound: [
      { id: 'cold-call', label: 'Cold Call' },
      { id: 'linkedin', label: 'LinkedIn' },
      { id: 'email', label: 'Email Campaign' },
      { id: 'other', label: 'Other' }
    ],
    event: [
      { id: 'webinar', label: 'Webinar' },
      { id: 'conference', label: 'Conference' },
      { id: 'trade-show', label: 'Trade Show' },
      { id: 'in-person', label: 'In Person' }
    ],
    referral: [
      { id: 'client', label: 'Client' },
      { id: 'partner', label: 'Partner' },
      { id: 'employee', label: 'Employee' },
      { id: 'other', label: 'Other' }
    ]
  };
  
  const handleSourceTypeChange = (sourceType: string) => {
    setValue('leadSourceType', sourceType, { shouldValidate: true });
    setValue('leadSourceChannel', '', { shouldValidate: true });
  };
  
  const handleChannelChange = (channelId: string) => {
    setValue('leadSourceChannel', channelId, { shouldValidate: true });
  };
  
  return (
    <div id="source-section" role="tabpanel" aria-labelledby="tab-source">
      <SectionHeading 
        icon={<Map className="w-4 h-4" />} 
        title="Lead Source"
      />
      
      <input type="hidden" {...register("leadSourceType")} />
      <input type="hidden" {...register("leadSourceChannel")} />

      <div className="flex flex-wrap gap-2 mb-4">
        {sourceTypes.map(source => (
          <button
            key={source.id}
            type="button"
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-all
              ${currentSourceType === source.id
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
              }`}
            onClick={() => handleSourceTypeChange(source.id)}
            aria-pressed={currentSourceType === source.id}
          >
            {source.label}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-6">
        {channels[currentSourceType]?.map(channel => (
          <ChannelOption
            key={channel.id}
            id={channel.id}
            label={channel.label}
            isSelected={currentChannel === channel.id}
            onClick={() => handleChannelChange(channel.id)}
          />
        ))}
      </div>
      
      <div className="flex items-start gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 text-sm mb-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Changing the lead source will update attribution reporting for this deal.
        </span>
      </div>
    </div>
  );
};

// Helper component
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

export default LeadSourceSection; 