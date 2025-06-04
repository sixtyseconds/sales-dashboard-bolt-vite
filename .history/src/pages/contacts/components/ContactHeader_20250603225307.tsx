import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MessageCircle, Phone } from 'lucide-react';
import type { Contact } from '@/lib/database/models';

interface ContactHeaderProps {
  contact: Contact;
}

export function ContactHeader({ contact }: ContactHeaderProps) {
  const getDisplayName = () => {
    if (contact.full_name) return contact.full_name;
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    return contact.email;
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Profile Picture */}
          <div className="w-20 h-20 rounded-full border-3 border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
            {getInitials()}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{getDisplayName()}</h1>
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              {contact.title && (
                <>
                  <span className="text-lg">{contact.title}</span>
                  <span className="text-gray-600">•</span>
                </>
              )}
              {contact.companies?.name && (
                <span className="text-lg">{contact.companies.name}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Active
              </Badge>
              {contact.is_primary && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Primary Contact
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Edit className="w-4 h-4 mr-2" />
            Edit Contact
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        </div>
      </div>
    </div>
  );
} 