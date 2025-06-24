import React from 'react';
import { useParams } from 'react-router-dom';
import ContactTaskList from '@/components/ContactTaskList';

const ContactTasksPage: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();

  if (!contactId) {
    // Show all contacts with their tasks
    return (
      <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <ContactTaskList showAllContacts={true} />
        </div>
      </div>
    );
  }

  // Show tasks for a specific contact
  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <ContactTaskList contactId={contactId} />
      </div>
    </div>
  );
};

export default ContactTasksPage; 