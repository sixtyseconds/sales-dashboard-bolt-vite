import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Users as UsersIcon,
  Shield,
  UserCog,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Edit2,
  UserPlus,
  Star,
  Target,
  UserCheck,
  Trash2,
  PlusCircle,
  History,
  X
} from 'lucide-react';
import { useUsers, User, Target as TargetType } from '@/lib/hooks/useUsers';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

import { USER_STAGES } from '@/lib/hooks/useUser';
import { format, isValid, parseISO } from 'date-fns';

// Define more specific types for the editing state using discriminated union pattern
type EditingUserState =
  | { mode: 'closed' }
  | { mode: 'newUser' }
  | { mode: 'editTargets'; user: User }
  | { mode: 'editDetails'; user: User };

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStage, setSelectedStage] = useState('all');
  const [editingState, setEditingState] = useState<EditingUserState>({ mode: 'closed' });
  const [modalTargets, setModalTargets] = useState<TargetType[]>([]);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const { users, updateUser, impersonateUser, deleteUser } = useUsers();
  const navigate = useNavigate();

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = selectedStage === 'all' || user.stage === selectedStage;

      return matchesSearch && matchesStage;
    });
  }, [users, searchQuery, selectedStage]);

  useEffect(() => {
    if (editingState.mode === 'editTargets') {
      const user = editingState.user;
      const now = new Date();
      const activeTargets = user.targets.filter(target => {
        const startDate = target.start_date ? new Date(target.start_date) : null;
        if (startDate instanceof Date && isNaN(startDate.getTime())) {
            console.warn(`[Users Modal] Invalid start_date found for target ID ${target.id}: ${target.start_date}`);
            return false;
        }

        const endDate = target.end_date ? new Date(target.end_date) : null;
        if (endDate instanceof Date && isNaN(endDate.getTime())) {
            console.warn(`[Users Modal] Invalid end_date found for target ID ${target.id}: ${target.end_date}`);
            return false;
        }

        const isStarted = startDate instanceof Date && startDate <= now;
        const isNotEnded = !endDate || (endDate instanceof Date && endDate > now);

        const isActive = isStarted && isNotEnded;
        return isActive;
      });
      console.log("[Users Modal] Initializing with active targets:", activeTargets);

      setModalTargets(JSON.parse(JSON.stringify(activeTargets)));

    } else if (editingState.mode === 'editTargets') {
       console.log("[Users Modal] Initializing with empty targets array (no valid user/targets found).");
       setModalTargets([]);
    }
  }, [editingState]);

  const handleModalTargetChange = (index: number, field: string, value: string) => {
    setModalTargets(currentTargets => {
      const updatedTargets = [...currentTargets];
      if (!updatedTargets[index]) {
        updatedTargets[index] = { id: undefined } as TargetType;
      }
      const parsedValue = value === '' ? null : (field.includes('target') ? (field === 'revenue_target' ? parseFloat(value) : parseInt(value)) : value);

      updatedTargets[index] = {
        ...updatedTargets[index],
        [field]: parsedValue
      } as TargetType;
      return updatedTargets;
    });
  };

  const addTargetSet = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setModalTargets(currentTargets => [
      ...currentTargets,
      {
        id: `new_${Date.now()}`,
        revenue_target: null,
        outbound_target: null,
        meetings_target: null,
        proposal_target: null,
        start_date: today,
        end_date: null
      }
    ]);
  };

  const removeTargetSet = (index: number) => {
    setModalTargets(currentTargets => currentTargets.filter((_, i) => i !== index));
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    if (!userId) {
      console.error("handleUpdateUser called without userId");
      toast.error("Cannot update user: User ID missing.");
      return;
    }
    try {
      await updateUser({ userId, updates });
      setEditingState({ mode: 'closed' });
    } catch (error) {
      console.error('Update error caught in component handleUpdateUser:', error);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      await impersonateUser(userId);
      toast.success('Impersonation started');
      navigate('/');
    } catch (error) {
      toast.error('Failed to impersonate user');
      console.error('[Impersonation]', error);
    }
  };

  const handleExport = () => {
    type ExportRow = {
      'First Name': string | null;
      'Last Name': string | null;
      'Email': string;
      'Stage': string;
      'Admin': string;
      'Created': string;
    };

    const data: ExportRow[] = filteredUsers.map(user => ({
      'First Name': user.first_name,
      'Last Name': user.last_name,
      'Email': user.email,
      'Stage': user.stage,
      'Admin': user.is_admin ? 'Yes' : 'No',
      'Created': new Date(user.created_at).toLocaleDateString()
    }));

    const headers: (keyof ExportRow)[] = Object.keys(data[0] || {}) as (keyof ExportRow)[];
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header =>
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export completed successfully');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 mt-12 lg:mt-0 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-gray-400 mt-1">Manage users, roles, and permissions</p>
          </div>
          <button
            onClick={() => setEditingState({ mode: 'newUser' })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#37bd7e]/10 text-[#37bd7e] hover:bg-[#37bd7e]/20 transition-all duration-300 text-sm border border-[#37bd7e]/30 hover:border-[#37bd7e]/50"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UsersIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <div className="text-xl font-bold text-white">{users.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Shield className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Admins</p>
                <div className="text-xl font-bold text-white">
                  {users.filter(u => u.is_admin).length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Star className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <div className="text-xl font-bold text-white">
                  {users.filter(u => u.last_sign_in_at).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-800/50 overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 sm:p-6 border-b border-gray-800/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-[#37bd7e]/20 hover:text-white transition-all duration-300 text-sm border border-transparent hover:border-[#37bd7e]/30"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#37bd7e]/10 text-[#37bd7e] hover:bg-[#37bd7e]/20 transition-all duration-300 text-sm border border-[#37bd7e]/30 hover:border-[#37bd7e]/50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <select
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white text-sm"
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                    >
                      <option value="all">All Stages</option>
                      {USER_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-w-[800px] lg:min-w-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="text-left text-xs font-medium text-gray-400 px-4 sm:px-6 py-3 whitespace-nowrap">User</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 sm:px-6 py-3 whitespace-nowrap">Stage</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 sm:px-6 py-3 whitespace-nowrap">Targets</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 sm:px-6 py-3 whitespace-nowrap">Admin</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 sm:px-6 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#37bd7e]/10 border border-[#37bd7e]/20 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.first_name ?? 'User Avatar'}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-sm font-medium text-[#37bd7e]">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <select
                        value={user.stage}
                        onChange={(e) => handleUpdateUser(user.id, { stage: e.target.value })}
                        className="bg-gray-800/30 border border-gray-700/30 rounded-lg px-3 py-1 text-sm text-white"
                      >
                        {USER_STAGES.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => setEditingState({ mode: 'editTargets', user: user })}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-all duration-300 text-sm border border-violet-500/30"
                      >
                        <Target className="w-4 h-4" />
                        Edit Targets
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => handleUpdateUser(user.id, { is_admin: !user.is_admin })}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-lg transition-all duration-300 text-sm border",
                          user.is_admin
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20"
                        )}
                      >
                        <Shield className="w-4 h-4" />
                        {user.is_admin ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setHistoryUser(user)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View Target History"
                        >
                          <History className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleImpersonate(user.id)}
                          className="p-2 hover:bg-violet-500/20 rounded-lg transition-colors"
                          title="Impersonate User"
                        >
                          <UserCheck className="w-4 h-4 text-violet-500" />
                        </button>
                        <button
                          onClick={() => setEditingState({ mode: 'editDetails', user: user })}
                          className="p-2 hover:bg-[#37bd7e]/20 rounded-lg transition-colors"
                          title="Edit User Details"
                        >
                          <Edit2 className="w-4 h-4 text-[#37bd7e]" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.first_name} {user.last_name}? This action cannot be undone.
                                All their activities and targets will also be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-800/50 text-gray-300 hover:bg-gray-800">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser(user.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingState.mode !== 'closed' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-800/50 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-white">
              {editingState.mode === 'newUser' ? 'Add User'
               : editingState.mode === 'editTargets' ? `Edit Targets for ${editingState.user.first_name}`
               : editingState.mode === 'editDetails' ? `Edit User Details for ${editingState.user.first_name}`
               : 'Edit User'}
            </h2>

            {editingState.mode === 'editTargets' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser(editingState.user.id, { targets: modalTargets });
              }} className="space-y-6">
                {modalTargets.map((target: TargetType, index) => (
                  <div key={target.id || index} className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/20 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => removeTargetSet(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-500/20 rounded"
                      aria-label="Remove target set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">Revenue Target</label>
                        <input
                          type="number"
                          placeholder="e.g., 20000"
                          value={target.revenue_target ?? ''}
                          onChange={(e) => handleModalTargetChange(index, 'revenue_target', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">Outbound Target</label>
                        <input
                          type="number"
                          placeholder="e.g., 100"
                          value={target.outbound_target ?? ''}
                          onChange={(e) => handleModalTargetChange(index, 'outbound_target', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">Meetings Target</label>
                        <input
                          type="number"
                          placeholder="e.g., 20"
                          value={target.meetings_target ?? ''}
                          onChange={(e) => handleModalTargetChange(index, 'meetings_target', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">Proposal Target</label>
                        <input
                          type="number"
                          placeholder="e.g., 15"
                          value={target.proposal_target ?? ''}
                          onChange={(e) => handleModalTargetChange(index, 'proposal_target', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">Start Date</label>
                        <input
                          type="date"
                          value={target.start_date ?? ''}
                          onChange={(e) => handleModalTargetChange(index, 'start_date', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">End Date</label>
                        <input
                          type="date"
                          value={target.end_date ?? ''}
                          onChange={(e) => handleModalTargetChange(index, 'end_date', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTargetSet}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-700/50 text-gray-400 hover:border-[#37bd7e]/50 hover:text-[#37bd7e] transition-colors duration-200"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Target Set
                </button>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingState({ mode: 'closed' })}
                    className="px-4 py-2 rounded-xl bg-gray-800/50 text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#37bd7e] text-white hover:bg-[#2da76c] transition-colors"
                  >
                    Save Target Changes
                  </button>
                </div>
              </form>
            )}

            {(editingState.mode === 'newUser' || editingState.mode === 'editDetails') && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                if (editingState.mode === 'newUser') {
                  toast.info("New user creation not implemented.");
                } else {
                  handleUpdateUser(editingState.user.id, {
                    first_name: formData.get('first_name') as string,
                    last_name: formData.get('last_name') as string,
                    email: formData.get('email') as string,
                    stage: formData.get('stage') as string
                  });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    defaultValue={editingState.mode === 'editDetails' ? editingState.user.first_name ?? '' : ''}
                    className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    defaultValue={editingState.mode === 'editDetails' ? editingState.user.last_name ?? '' : ''}
                    className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingState.mode === 'editDetails' ? editingState.user.email : ''}
                    className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white"
                    readOnly={editingState.mode === 'editDetails'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Stage</label>
                  <select
                    name="stage"
                    defaultValue={editingState.mode === 'editDetails' ? editingState.user.stage : USER_STAGES[0]}
                    className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-2 text-white"
                  >
                    {USER_STAGES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingState({ mode: 'closed' })}
                    className="px-4 py-2 rounded-xl bg-gray-800/50 text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#37bd7e] text-white hover:bg-[#2da76c] transition-colors"
                  >
                    {editingState.mode === 'newUser' ? 'Create User' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Target History Modal */}
      {historyUser && (
        <TargetHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />
      )}
    </div>
  );
}

interface TargetHistoryModalProps {
  user: User;
  onClose: () => void;
}

function TargetHistoryModal({ user, onClose }: TargetHistoryModalProps) {
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const filteredSortedTargets = useMemo(() => {
    if (!user.targets) return [];

    const filterStart = filterStartDate ? new Date(`${filterStartDate}T00:00:00`) : null;
    const filterEnd = filterEndDate ? new Date(`${filterEndDate}T23:59:59`) : null;

    const isValidFilterStart = filterStart && isValid(filterStart);
    const isValidFilterEnd = filterEnd && isValid(filterEnd);

    const filtered = user.targets.filter(target => {
      const targetStart = target.start_date ? new Date(target.start_date) : null;
      const targetEnd = target.end_date ? new Date(target.end_date) : null;

      const isValidTargetStart = targetStart && isValid(targetStart);
      if (!isValidTargetStart) return false;
      const isValidTargetEnd = !targetEnd || isValid(targetEnd);

      const startsBeforeFilterEnd = !isValidFilterEnd || (isValidTargetStart && targetStart <= filterEnd);
      const endsAfterFilterStart = !isValidFilterStart || !isValidTargetEnd || targetEnd === null || (targetEnd >= filterStart);

      return startsBeforeFilterEnd && endsAfterFilterStart;
    });

    return filtered.sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [user.targets, filterStartDate, filterEndDate]);

  const isTargetCurrentlyActive = (target: TargetType): boolean => {
    const now = new Date();
    const startDate = target.start_date ? new Date(target.start_date) : null;
    const endDate = target.end_date ? new Date(target.end_date) : null;
    const isStarted = startDate instanceof Date && !isNaN(startDate.getTime()) && startDate <= now;
    const isNotEnded = !endDate || (endDate instanceof Date && !isNaN(endDate.getTime()) && endDate > now);
    return isStarted && isNotEnded;
  };

  const handleExportHistory = () => {
    if (filteredSortedTargets.length === 0) {
      toast.info("No history data to export.");
      return;
    }

    const headers = ["Revenue Target", "Outbound Target", "Meetings Target", "Proposal Target", "Start Date", "End Date", "Status"];
    const csvData = filteredSortedTargets.map(target => {
      const isActive = isTargetCurrentlyActive(target);
      return [
        target.revenue_target ?? '',
        target.outbound_target ?? '',
        target.meetings_target ?? '',
        target.proposal_target ?? '',
        target.start_date ? format(new Date(target.start_date), 'yyyy-MM-dd') : '',
        target.end_date ? format(new Date(target.end_date), 'yyyy-MM-dd') : '',
        isActive ? 'Active' : 'Inactive'
      ].map(value => `"${value.toString().replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = `target_history_${user.first_name}_${user.last_name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('History export complete');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-800/50 p-6 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold text-white">
            Target History for {user.first_name} {user.last_name}
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-auto"
              aria-label="Filter Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-auto"
              aria-label="Filter End Date"
            />
            <button
                onClick={handleExportHistory}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#37bd7e]/10 text-[#37bd7e] hover:bg-[#37bd7e]/20 transition-all duration-300 text-sm border border-[#37bd7e]/30 hover:border-[#37bd7e]/50 w-full sm:w-auto"
                title="Export Filtered History"
            >
                <Download className="w-4 h-4" />
                <span>Export</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-700">
                 <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow">
          {filteredSortedTargets.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No target history matches the selected filters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800/50 text-left text-xs font-medium text-gray-400">
                  <th className="px-4 py-2">Revenue</th>
                  <th className="px-4 py-2">Outbound</th>
                  <th className="px-4 py-2">Meetings</th>
                  <th className="px-4 py-2">Proposals</th>
                  <th className="px-4 py-2">Start Date</th>
                  <th className="px-4 py-2">End Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSortedTargets.map((target, index) => {
                  const isActive = isTargetCurrentlyActive(target);
                  return (
                    <tr key={target.id || `history-${index}`} className="border-b border-gray-800/50">
                      <td className="px-4 py-2 text-white">{target.revenue_target?.toLocaleString() ?? '-'}</td>
                      <td className="px-4 py-2 text-white">{target.outbound_target ?? '-'}</td>
                      <td className="px-4 py-2 text-white">{target.meetings_target ?? '-'}</td>
                      <td className="px-4 py-2 text-white">{target.proposal_target ?? '-'}</td>
                      <td className="px-4 py-2 text-white">{target.start_date ? format(new Date(target.start_date), 'yyyy-MM-dd') : '-'}</td>
                      <td className="px-4 py-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          isActive
                            ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/50"
                            : target.end_date ? "bg-red-600/20 text-red-200 border border-red-500/50" : "text-gray-500"
                        )}>
                          {target.end_date ? format(new Date(target.end_date), 'yyyy-MM-dd') : (isActive ? 'Active' : 'No End Date')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800/50 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}