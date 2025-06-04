import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { ContactHeader } from './components/ContactHeader';
// import { ContactTabs } from './components/ContactTabs';
// import { ContactSidebar } from './components/ContactSidebar';
// import { ContactMainContent } from './components/ContactMainContent';
// import { ContactRightPanel } from './components/ContactRightPanel';
import { ApiContactService } from '@/lib/services/apiContactService';
import type { Contact } from '@/lib/database/models';

const ContactRecord: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchContact = async () => {
      if (!id) {
        setError('Contact ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching contact with ID:', id);
        const contactData = await ApiContactService.getContactById(id, true);
        
        if (!contactData) {
          setError('Contact not found');
          return;
        }
        
        console.log('Contact data received:', contactData);
        setContact(contactData);
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contact');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-gray-400">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="bg-red-900/20 border-red-700 text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <button 
              onClick={() => navigate('/crm/contacts')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              ← Back to Contacts
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Alert className="bg-gray-800/60 border-gray-600 text-gray-300">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <AlertDescription className="text-gray-300">
              Contact not found. It may have been deleted or moved.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <button 
              onClick={() => navigate('/crm/contacts')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              ← Back to Contacts
            </button>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact Header */}
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    Active
                  </span>
                  {contact.is_primary && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Primary Contact
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <span>Edit Contact</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                <span>Message</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                <span>Call</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-xl rounded-3xl p-6 border border-gray-800/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email</p>
                <p className="text-white">{contact.email}</p>
              </div>
            </div>
            
            {contact.phone && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-white">{contact.phone}</p>
                </div>
              </div>
            )}
            
            {contact.companies?.name && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Company</p>
                  <p className="text-white">{contact.companies.name}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Added on</p>
                <p className="text-white">{new Date(contact.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactRecord; 