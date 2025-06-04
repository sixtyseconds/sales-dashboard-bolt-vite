import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MessageCircle, Phone, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useContact } from '@/lib/hooks/useContacts';
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

  const handleContactUpdate = (updatedContact: Contact) => {
    setContact(updatedContact);
  };

  const handleBack = () => {
    navigate('/crm/contacts');
  };

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
            onClick={handleBack}
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
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            ← Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Navigation */}
      <div className="sticky top-0 z-50 glassmorphism border-b border-gray-800/30 py-4 px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleBack}
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contacts
            </Button>
            <div className="h-6 w-px bg-gray-700" />
            <h1 className="text-xl font-bold text-white">Contact Record</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Contact
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button variant="outline" size="sm">
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Contact Header */}
        <ContactHeader 
          contact={contact} 
          onUpdate={handleContactUpdate}
        />

        {/* Navigation Tabs */}
        <ContactTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 contact-grid">
          {/* Left Column - Contact Information */}
          <ContactSidebar contact={contact} />

          {/* Middle Column - Main Content */}
          <ContactMainContent contact={contact} activeTab={activeTab} />

          {/* Right Column - Deals and Activity */}
          <ContactRightPanel contact={contact} />
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="floating-action-button">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ContactRecord; 