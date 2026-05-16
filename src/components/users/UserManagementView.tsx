import React, { useState, useEffect } from 'react';
import { Users, Share2, Search, Loader2, MoreVertical, Plus, X, KeyRound } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { delegatedAccessService } from '@/services/delegatedAccessService';
import DelegatedAccessSection from './DelegatedAccessSection';
import { notificationService } from '@/services/notificationService';

type PermissionLevel = 'view' | 'edit' | 'delete';

interface User {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  location?: string;
  mobile?: string;
  companyName?: string;
  isVerified?: boolean;
  createdAt: string;
}

const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState<'users' | 'delegated'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestModal, setRequestModal] = useState<{
    email: string;
    userId?: string;
    permissionLevel: PermissionLevel;
    reason: string;
  } | null>(null);
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'employee',
    mobile: '',
  });

  const resetForm = () => {
    setForm({ fullname: '', email: '', password: '', role: 'employee', mobile: '' });
  };

  const handleRequestAccess = (email: string, userId?: string) => {
    if (!email) return;

    const normalizedEmail = email.trim().toLowerCase();
    const myEmail = String(currentUser?.email || '').trim().toLowerCase();
    const myId = String(currentUser?._id || currentUser?.id || '');

    if (myEmail && normalizedEmail === myEmail) {
      toast('You are already signed in as this user.');
      return;
    }
    if (myId && userId && myId === userId) {
      toast('You are already signed in as this user.');
      return;
    }

    setRequestModal({
      email: normalizedEmail,
      userId,
      permissionLevel: 'view',
      reason: '',
    });
  };

  const submitRequestAccess = async () => {
    if (!requestModal) return;
    const { email, userId, permissionLevel, reason } = requestModal;
    try {
      setRequestingId(userId || email);
      await delegatedAccessService.requestAccess(email, permissionLevel, reason);
      toast.success(`Access request sent to ${email}. Awaiting their approval.`);
      setRequestModal(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send access request';
      toast.error(msg);
    } finally {
      setRequestingId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    // Self-check first - your own email shouldn't fall through to the
    // "not in your organisation" toast (you ARE in your org).
    const myEmail = String(currentUser?.email || '').trim().toLowerCase();
    if (myEmail && term === myEmail) {
      toast('You are already signed in as this user.');
      return;
    }

    // Only allow Enter to trigger a request when the email exactly matches a
    // user already loaded in the organisation list. This prevents blasting
    // access requests to arbitrary addresses outside the org.
    const exact = users.find((u: User) => u.email.toLowerCase() === term);
    if (exact) {
      handleRequestAccess(exact.email, exact._id);
      return;
    }
    if (term.includes('@')) {
      toast.error('That email is not in your organisation. Add the user first, or use the Request Access button on a row.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullname || !form.email || !form.password) {
      toast.error('Full name, email, and password are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/auth/users', form);
      toast.success('User created');
      setShowAddModal(false);
      resetForm();
      await loadUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create user';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Email is required');
      return;
    }

    try {
      setSubmitting(true);
      await notificationService.sendInvite(email);
      toast.success(`Invitation sent to ${email}`);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send invitation';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users/list');
      const userList = Array.isArray(response.data) ? response.data : response.data.users || [];
      setUsers(userList);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'employee': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={16} />
          User List
        </button>
        <button
          onClick={() => setActiveTab('delegated')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'delegated'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Share2 size={16} />
          Delegated Access
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or email (press Enter on an email to request access)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2"
              >
                <Plus size={16} />
                Add User
              </button>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-2"
              >
                <Share2 size={16} />
                Send Invite
              </button>
            </form>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No users found</div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-700">User</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700">Role</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700">Mobile</th>
                    <th className="px-6 py-3 text-right font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                            {user.fullname.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{user.fullname}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{user.mobile || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {currentUser?.email !== user.email && (
                            <button
                              onClick={() => handleRequestAccess(user.email, user._id)}
                              disabled={requestingId === user._id}
                              title={`Request access to ${user.fullname}'s dashboard`}
                              className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                              {requestingId === user._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <KeyRound size={14} />
                              )}
                              Request Access
                            </button>
                          )}
                          <button className="p-2 hover:bg-slate-100 rounded">
                            <MoreVertical size={16} className="text-slate-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add User</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullname}
                  onChange={e => setForm({ ...form, fullname: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">Min 8 chars with upper, lower, number, and symbol.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mobile</label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Send Invitation</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSendInvite} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">User email *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The user will see this invite globally in their header after they sign in.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delegated Access Tab */}
      {activeTab === 'delegated' && <DelegatedAccessSection />}

      {/* Request Access Modal */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Request Access</h3>
              <button
                onClick={() => setRequestModal(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                submitRequestAccess();
              }}
              className="px-5 py-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target user</label>
                <input
                  type="email"
                  value={requestModal.email}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">They must approve before you can open their dashboard.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Permission level</label>
                <select
                  value={requestModal.permissionLevel}
                  onChange={e =>
                    setRequestModal(m => (m ? { ...m, permissionLevel: e.target.value as PermissionLevel } : m))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="view">Can view (read-only)</option>
                  <option value="edit">Can edit (create / update)</option>
                  <option value="delete">Full control (incl. delete)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason (optional)</label>
                <textarea
                  rows={3}
                  value={requestModal.reason}
                  onChange={e =>
                    setRequestModal(m => (m ? { ...m, reason: e.target.value } : m))
                  }
                  placeholder="Why do you need this access?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRequestModal(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!requestingId}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
                >
                  {requestingId && <Loader2 size={14} className="animate-spin" />}
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;
