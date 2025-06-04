import React from 'react';
import { User, Users, Mail, Phone, Building2, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Contact } from '@/lib/database/models';

interface ContactSidebarProps {
  contact: Contact;
}

export function ContactSidebar({ contact }: ContactSidebarProps) {
  // Mock data for lead owner and activity (you can replace with real data)
  const leadOwner = {
    name: 'Sarah Johnson',
    title: 'Senior Sales Rep',
    email: 'sarah.johnson@company.com',
    assignedDate: 'May 10, 2025',
    lastContact: '2 days ago'
  };

  const activitySummary = {
    meetings: 12,
    emails: 28,
    calls: 7,
    deals: 3,
    engagementScore: 87,
    engagementChange: '+12%'
  };

  return (
    <div className="space-y-6">
      {/* Lead Owner Card */}
      <div className="section-card bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <User className="w-5 h-5 text-blue-400" />
          Lead Owner
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            SJ
          </div>
          <div>
            <p className="text-white font-medium">{leadOwner.name}</p>
            <p className="text-gray-400 text-sm">{leadOwner.title}</p>
            <p className="text-gray-400 text-xs">{leadOwner.email}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-500/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Assigned</p>
              <p className="text-white">{leadOwner.assignedDate}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Last Contact</p>
              <p className="text-white">{leadOwner.lastContact}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="section-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Contact Information
        </h2>
        <div className="space-y-4 text-sm">
          {/* Email */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email</p>
              <p className="text-white">{contact.email}</p>
            </div>
            <Button size="sm" variant="ghost" className="p-2">
              <Mail className="w-4 h-4 text-gray-400 hover:text-blue-400" />
            </Button>
          </div>

          {/* Phone */}
          {contact.phone && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Phone</p>
                <p className="text-white">{contact.phone}</p>
              </div>
              <Button size="sm" variant="ghost" className="p-2">
                <Phone className="w-4 h-4 text-gray-400 hover:text-blue-400" />
              </Button>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 gap-3">
            {contact.companies && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Company</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{contact.companies.name}</span>
                  {contact.companies.website && (
                    <a
                      href={contact.companies.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Added on</p>
              <p className="text-white">
                {new Date(contact.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="section-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Activity Summary
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="activity-metric text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
            <div className="text-2xl font-bold text-white mb-1">{activitySummary.meetings}</div>
            <div className="text-xs text-gray-400">Meetings</div>
          </div>
          <div className="activity-metric text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
            <div className="text-2xl font-bold text-white mb-1">{activitySummary.emails}</div>
            <div className="text-xs text-gray-400">Emails</div>
          </div>
          <div className="activity-metric text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
            <div className="text-2xl font-bold text-white mb-1">{activitySummary.calls}</div>
            <div className="text-xs text-gray-400">Calls</div>
          </div>
          <div className="activity-metric text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
            <div className="text-2xl font-bold text-white mb-1">{activitySummary.deals}</div>
            <div className="text-xs text-gray-400">Deals</div>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-sm font-medium">Engagement Score</span>
          </div>
          <div className="text-2xl font-bold text-white">{activitySummary.engagementScore}%</div>
          <div className="text-xs text-gray-400">{activitySummary.engagementChange} from last month</div>
        </div>
      </div>
    </div>
  );
} 