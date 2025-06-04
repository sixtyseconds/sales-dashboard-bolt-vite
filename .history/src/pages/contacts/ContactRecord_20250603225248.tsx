import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MessageCircle, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContact } from '@/lib/hooks/useContacts';
import { ContactHeader } from './components/ContactHeader';
import { ContactTabs } from './components/ContactTabs';
import { ContactSidebar } from './components/ContactSidebar';
import { ContactMainContent } from './components/ContactMainContent';
import { ContactRightPanel } from './components/ContactRightPanel';

export default function ContactRecord() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contact, isLoading, error } = useContact(id || '', true);
  const [activeTab, setActiveTab] = useState('overview');

  const handleBack = () => {
    navigate('/crm/contacts');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
          <h3 className="text-red-400 font-medium mb-2">Error loading contact</h3>
          <p className="text-red-300 text-sm">{error?.message || 'Contact not found'}</p>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
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
        <ContactHeader contact={contact} />

        {/* Navigation Tabs */}
        <ContactTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
} 