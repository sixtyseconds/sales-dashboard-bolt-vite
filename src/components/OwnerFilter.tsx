import React from 'react';
import { Users, User, Filter } from 'lucide-react';
import { useOwners } from '@/lib/hooks/useOwners';
import { useUser } from '@/lib/hooks/useUser';

interface OwnerFilterProps {
  selectedOwnerId?: string;
  onOwnerChange: (ownerId?: string) => void;
  placeholder?: string;
  className?: string;
}

export function OwnerFilter({ 
  selectedOwnerId, 
  onOwnerChange, 
  placeholder = "Filter by sales rep...",
  className = ""
}: OwnerFilterProps) {
  const { owners, isLoading } = useOwners();
  const { userData } = useUser();

  const getOwnerDisplayName = (owner: any) => {
    if (owner.full_name) return owner.full_name;
    if (owner.first_name || owner.last_name) {
      return `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
    }
    return owner.email;
  };

  const getOwnerInitials = (owner: any) => {
    if (owner.first_name && owner.last_name) {
      return `${owner.first_name[0]}${owner.last_name[0]}`.toUpperCase();
    }
    if (owner.first_name) return owner.first_name[0].toUpperCase();
    if (owner.last_name) return owner.last_name[0].toUpperCase();
    return owner.email[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedOwnerId || ''}
        onChange={(e) => onOwnerChange(e.target.value || undefined)}
        className="appearance-none w-full px-3 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 hover:bg-gray-800/70 transition-colors cursor-pointer"
      >
        <option value="" className="bg-gray-800 text-white">
          All Sales Reps
        </option>
        
        {userData && (
          <option value={userData.id} className="bg-gray-800 text-white">
            👤 My Items
          </option>
        )}
        
        <option disabled className="bg-gray-700 text-gray-400 font-medium">
          ──────────────
        </option>
        
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id} className="bg-gray-800 text-white">
            {getOwnerDisplayName(owner)} ({owner.stage})
          </option>
        ))}
      </select>
      
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <Filter className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Selected owner indicator */}
      {selectedOwnerId && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {selectedOwnerId === userData?.id ? (
            <User className="w-4 h-4 text-violet-400" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
              {owners.find(o => o.id === selectedOwnerId) && 
                getOwnerInitials(owners.find(o => o.id === selectedOwnerId)!)
              }
            </div>
          )}
        </div>
      )}
      
      {/* Dropdown arrow */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
} 