'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Phone, FileText, Users, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivities } from '@/lib/hooks/useActivities';
import { toast } from 'sonner';

export function useQuickAdd() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openQuickAdd', handleOpen);
    return () => window.removeEventListener('openQuickAdd', handleOpen);
  }, []);

  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false)
  };
}

export function QuickAdd({ onClose, isOpen }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    amount: '',
    saleType: 'one-off',
  });

  const { addActivity } = useActivities();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const now = new Date();
    const activity = {
      type: selectedAction,
      clientName: formData.clientName,
      details: selectedAction === 'meeting' 
        ? formData.meetingType
        : selectedAction === 'proposal'
        ? `Proposal Value: £${formData.proposalValue}`
        : selectedAction === 'sale'
        ? `${formData.saleType} Sale`
        : formData.contactMethod || 'Phone Contact',
      amount: selectedAction === 'sale' 
        ? parseFloat(formData.amount)
        : selectedAction === 'proposal'
        ? parseFloat(formData.proposalValue)
        : undefined,
      priority: selectedAction === 'sale' ? 'high' : 'medium',
      date: now.toISOString()
    };

    addActivity(activity);
    toast.success('Activity added successfully');
    onClose();
    setSelectedAction(null);
    setFormData({
      clientName: '',
      amount: '',
      saleType: 'one-off',
      meetingType: 'discovery',
      contactMethod: 'phone',
      proposalValue: ''
    });
  };

  const handleOutboundCall = () => {
    addActivity({
      type: 'outbound',
      clientName: 'Quick Call',
      details: 'Phone Contact',
      priority: 'low',
      date: new Date().toISOString()
    });
    toast.success('Quick call logged successfully');
    onClose();
  };

  const quickActions = [
    { id: 'sale', icon: DollarSign, label: 'Add Sale', color: 'emerald' },
    { id: 'outbound', icon: Phone, label: 'Add Outbound', color: 'blue' },
    { id: 'meeting', icon: Users, label: 'Add Meeting', color: 'violet' },
    { id: 'proposal', icon: FileText, label: 'Add Proposal', color: 'orange' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            className="relative bg-gray-900/95 border border-gray-800/50 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-lg backdrop-blur-xl sm:m-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-900/30 rounded-3xl -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.15),transparent)] rounded-3xl -z-10" />
            
            <motion.div 
              className="w-12 h-1 rounded-full bg-gray-800 absolute -top-8 left-1/2 -translate-x-1/2 sm:hidden"
              initial={{ width: "2rem" }}
              animate={{ width: "3rem" }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div className="w-12 h-1 rounded-full bg-gray-800 absolute -top-8 left-1/2 -translate-x-1/2 sm:hidden" />
              <h2 className="text-xl font-semibold text-white/90 tracking-wide">Quick Add</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!selectedAction ? (
              <motion.div 
                className="grid grid-cols-2 gap-3 sm:gap-4"
                variants={{
                  show: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                animate="show"
              >
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      show: { y: 0, opacity: 1 }
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (action.id === 'outbound') {
                        handleOutboundCall();
                      } else {
                        setSelectedAction(action.id);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl ${
                      action.color === 'blue'
                        ? 'bg-blue-400/5'
                        : action.color === 'orange'
                          ? 'bg-orange-500/10'
                          : `bg-${action.color}-500/10`
                    } border ${
                      action.color === 'blue'
                        ? 'border-blue-500/10'
                        : action.color === 'orange'
                          ? 'border-orange-500/20'
                          : `border-${action.color}-500/20`
                    } hover:bg-${action.color}-500/20 transition-all duration-300 group backdrop-blur-sm`}
                  >
                    <div className={`p-3 rounded-xl ${
                      action.color === 'blue'
                        ? 'bg-blue-400/5'
                        : action.color === 'orange'
                          ? 'bg-orange-500/10'
                          : `bg-${action.color}-500/10`
                    } transition-all duration-300 group-hover:scale-110 group-hover:bg-${action.color}-500/20 ring-1 ${
                      action.color === 'blue'
                        ? 'ring-blue-500/50 group-hover:ring-blue-500/60'
                        : action.color === 'orange'
                          ? 'ring-orange-500/30 group-hover:ring-orange-500/50'
                          : `ring-${action.color}-500/30 group-hover:ring-${action.color}-500/50`
                    } backdrop-blur-sm mb-3`}>
                      <action.icon className={`w-6 h-6 ${
                        action.color === 'blue'
                          ? 'text-blue-500'
                          : action.color === 'orange'
                            ? 'text-orange-500'
                            : `text-${action.color}-500`
                      }`} />
                    </div>
                    <span className="text-sm font-medium text-white/90">{action.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {(selectedAction === 'sale' || selectedAction === 'outbound' || selectedAction === 'proposal') && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400/90">
                        {selectedAction === 'sale' ? 'Client Name' : 'Prospect Name'}
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white/90 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent transition-colors hover:bg-gray-800/50"
                        value={formData.clientName}
                        onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      />
                    </div>
                    {selectedAction === 'sale' && <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400/90">
                        Sale Type
                      </label>
                      <select
                        required
                        className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white/90 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent transition-colors hover:bg-gray-800/50"
                        value={formData.saleType}
                        onChange={(e) => setFormData({...formData, saleType: e.target.value})}
                      >
                        <option value="one-off">One-off</option>
                        <option value="subscription">Subscription</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>
                    }
                    {selectedAction === 'sale' && <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400/90">
                        Amount
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white/90 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors hover:bg-gray-800/50"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      />
                    </div>
                    }
                    {selectedAction === 'outbound' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400/90">
                          Contact Method
                        </label>
                        <select
                          required
                          className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white/90 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors hover:bg-gray-800/50"
                          value={formData.contactMethod}
                          onChange={(e) => setFormData({...formData, contactMethod: e.target.value})}
                        >
                          <option value="phone">Phone</option>
                          <option value="email">Email</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>
                    )}
                    {selectedAction === 'proposal' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400/90">
                          Proposal Value
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                         className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white/90 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors hover:bg-gray-800/50"
                          value={formData.proposalValue}
                          onChange={(e) => setFormData({...formData, proposalValue: e.target.value})}
                        />
                      </div>
                    )}
                  </>
                )}
                {selectedAction === 'meeting' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400/90">
                        Prospect Name
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white/90 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors hover:bg-gray-800/50"
                        value={formData.clientName}
                        onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400/90">
                        Meeting Type
                      </label>
                      <select
                        required
                        className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white/90 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors hover:bg-gray-800/50"
                        value={formData.meetingType}
                        onChange={(e) => setFormData({...formData, meetingType: e.target.value})}
                      >
                        <option value="discovery">Discovery</option>
                        <option value="demo">Demo</option>
                        <option value="follow-up">Follow-up</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedAction(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gray-800/50 text-gray-300 hover:bg-gray-800 transition-colors border border-gray-700/30"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#37bd7e] text-white hover:bg-[#2da76c] transition-colors shadow-lg shadow-[#37bd7e]/20"
                  >
                    Submit
                  </button>
                </div>
              </motion.form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}