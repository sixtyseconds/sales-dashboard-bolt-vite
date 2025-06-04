import React, { useState } from 'react';
import { Trophy, Plus, MessageCircle, Mail, Phone, Calendar, Sparkles, ExternalLink, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@/lib/database/models';

interface ContactRightPanelProps {
  contact: Contact;
}

export function ContactRightPanel({ contact }: ContactRightPanelProps) {
  // Mock data for deals (you can replace with real data from your deals service)
  const [deals] = useState([
    {
      id: 1,
      title: 'ICSC - Enterprise License',
      description: 'Enterprise software licensing deal',
      value: 30000,
      currency: '£',
      stage: 'Negotiation',
      probability: 85,
      stageColor: 'purple'
    },
    {
      id: 2,
      title: 'Channel Sales Pro - Upgrade',
      description: 'Software upgrade and training',
      value: 6000,
      currency: '£',
      stage: 'Proposal',
      probability: 60,
      stageColor: 'blue'
    },
    {
      id: 3,
      title: 'Talent Shore - Consulting',
      description: 'Implementation consulting services',
      value: 9500,
      currency: '£',
      stage: 'Won',
      probability: 100,
      stageColor: 'green'
    }
  ]);

  // Mock communications data
  const [communications] = useState([
    {
      id: 1,
      type: 'email',
      direction: 'from',
      title: 'Thank you for the detailed presentation',
      content: "Thank you for the detailed presentation. I'll discuss with my team and get back to you about the Enterprise option.",
      date: 'Jun 1',
      contact: contact.first_name || 'Contact'
    },
    {
      id: 2,
      type: 'meeting',
      direction: 'to',
      title: 'Demo Call',
      content: 'Presented Enterprise features and pricing. Contact showed strong interest in custom reporting.',
      date: 'May 31',
      contact: 'Demo Call'
    },
    {
      id: 3,
      type: 'call',
      direction: 'to',
      title: 'Discovery Call',
      content: 'Initial discovery call - 25 minutes. Discussed budget constraints and technical requirements.',
      date: 'May 15',
      contact: 'Discovery Call'
    }
  ]);

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'won': return 'border-l-green-500';
      case 'negotiation': return 'border-l-purple-500';
      case 'proposal': return 'border-l-blue-500';
      case 'qualified': return 'border-l-yellow-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'won': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Won</Badge>;
      case 'negotiation': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Negotiation</Badge>;
      case 'proposal': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Proposal</Badge>;
      case 'qualified': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Qualified</Badge>;
      default: return <Badge variant="outline">{stage}</Badge>;
    }
  };

  const getCommunicationType = (type: string) => {
    switch (type) {
      case 'email': return { icon: Mail, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' };
      case 'meeting': return { icon: Calendar, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' };
      case 'call': return { icon: Phone, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' };
      default: return { icon: MessageCircle, color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Deals */}
      <div className="section-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-400" />
            Active Deals
          </h2>
          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>

        <div className="space-y-3">
          {deals.map((deal) => (
            <div key={deal.id} className={`p-4 rounded-lg bg-gray-800/50 border-l-4 ${getStageColor(deal.stage)}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-medium text-sm">{deal.title}</h3>
                {getStageBadge(deal.stage)}
              </div>
              <p className="text-gray-400 text-xs mb-2">{deal.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">
                  {deal.currency}{deal.value.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xs">
                  {deal.probability}% probability
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Communications */}
      <div className="section-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          Recent Communications
        </h2>

        <div className="space-y-3">
          {communications.map((comm) => {
            const { icon: Icon, color, bgColor, borderColor } = getCommunicationType(comm.type);
            return (
              <div key={comm.id} className="p-3 rounded-lg bg-gray-800/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${bgColor} ${color} ${borderColor} text-xs`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}
                    </Badge>
                    <span className="text-white text-sm font-medium">
                      {comm.direction === 'from' ? `From: ${comm.contact}` : comm.title}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">{comm.date}</span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{comm.content}</p>
                <button className="text-blue-400 text-xs hover:underline">
                  {comm.type === 'email' ? 'Reply' : 'View Details'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div className="section-card bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Insights
        </h2>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-green-500/15 border border-green-500/30">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-green-400 text-xs font-medium mb-1">OPPORTUNITY</p>
                <p className="text-white text-sm">High engagement score suggests readiness to move forward. Consider scheduling contract discussion.</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-yellow-500/15 border border-yellow-500/30">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-yellow-400 text-xs font-medium mb-1">ATTENTION</p>
                <p className="text-white text-sm">Budget concerns mentioned in last call. Prepare value proposition focusing on ROI.</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/15 border border-blue-500/30">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-blue-400 text-xs font-medium mb-1">INSIGHT</p>
                <p className="text-white text-sm">Best contact time: Tuesday-Thursday, 10 AM - 3 PM based on response patterns.</p>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full mt-4 border-gray-600 text-gray-300 hover:bg-gray-800">
            <TrendingUp className="w-4 h-4 mr-2" />
            Generate More Insights
          </Button>
        </div>
      </div>
    </div>
  );
} 