import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContactHeader } from './components/ContactHeader';
import { ContactTabs } from './components/ContactTabs';
import { ContactSidebar } from './components/ContactSidebar';
import { ContactMainContent } from './components/ContactMainContent';
import { ContactRightPanel } from './components/ContactRightPanel';
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/crm/contacts')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            ← Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Contact not found. It may have been deleted or moved.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <button 
            onClick={() => navigate('/crm/contacts')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            ← Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Contact Header */}
        <ContactHeader contact={contact} />

        {/* Navigation Tabs */}
        <ContactTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3">
            <ContactSidebar contact={contact} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            <ContactMainContent 
              contact={contact} 
              activeTab={activeTab} 
            />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3">
            <ContactRightPanel contact={contact} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactRecord; 