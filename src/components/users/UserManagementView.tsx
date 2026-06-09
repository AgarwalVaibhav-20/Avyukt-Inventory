import React, { useState, useEffect } from 'react';
import { Users, Share2, Search, Loader2, MoreVertical, Plus, X, Trash2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { warehouseService } from '@/services/warehouseService';
import { delegatedAccessService } from '@/services/delegatedAccessService';
import DelegatedAccessSection from './DelegatedAccessSection';
import { notificationService } from '@/services/notificationService';
import { MENU_ITEMS } from '@/constants';

type PermissionLevel = 'view' | 'edit' | 'delete';
type PagePermission = { view: boolean; create: boolean; edit: boolean; delete: boolean };

const PAGE_OPTIONS = MENU_ITEMS.flatMap((item) =>
  (item.subMenus || []).map((sub) => ({
    id: sub.id,
    label: sub.label,
    group: item.label,
  })),
);

const normalizePagePermissions = (input: any): Record<string, PagePermission> => {
  if (!input) return {};
  const entries =
    input instanceof Map
      ? Array.from(input.entries())
      : typeof input === 'object'
        ? Object.entries(input)
        : [];

  return entries.reduce<Record<string, PagePermission>>((acc, [pageId, raw]) => {
    if (!pageId || !raw || typeof raw !== 'object') return acc;
    const value = raw as Partial<PagePermission>;
    const canMutate = Boolean(value.create || value.edit || value.delete);
    acc[String(pageId)] = {
      view: Boolean(value.view || canMutate),
      create: Boolean(value.create || canMutate),
      edit: Boolean(value.edit || canMutate),
      delete: Boolean(value.delete || canMutate),
    };
    return acc;
  }, {});
};

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
  warehouseAccess?: {
    warehouseId?: {
      _id?: string;
      name?: string;
      location?: string;
      active?: boolean;
    } | string;
    accessLevel?: 'view' | 'edit' | 'manage';
    active?: boolean;
  }[];
  approvalManagerId?: {
    _id: string;
    fullname: string;
    email: string;
    role: string;
  } | string | null;
  approvalLevel?: number;
  approvalLimit?: number;
  permissions?: Record<string, PagePermission>;
}

interface WarehouseOption {
  _id: string;
  id?: string;
  name: string;
  location?: string;
  active?: boolean;
}

const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState<'users' | 'delegated'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState<Record<string, PagePermission>>({});
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
    approvalManagerId: '',
    approvalLevel: 1,
    approvalLimit: 0,
    warehouseAccess: [] as { warehouseId: string; accessLevel: 'view' | 'edit' | 'manage'; active: boolean }[],
    permissions: {} as Record<string, PagePermission>,
  });

  const resetForm = () => {
    setForm({
      fullname: '',
      email: '',
      password: '',
      role: 'employee',
      mobile: '',
      approvalManagerId: '',
      approvalLevel: 1,
      approvalLimit: 0,
      warehouseAccess: [],
      permissions: {},
    });
  };

  const normalizeUser = (user: Partial<User> & Record<string, any>): User => ({
    _id: String(user._id || user.id || ''),
    fullname: String(user.fullname || user.name || 'Unknown User'),
    email: String(user.email || ''),
    role: String(user.role || 'employee'),
    location: (user.location as any)?._id
      ? String((user.location as any)._id)
      : user.location
        ? String(user.location)
        : undefined,
    mobile: user.mobile || '',
    companyName: user.companyName || '',
    isVerified: Boolean(user.isVerified),
    createdAt: user.createdAt || new Date().toISOString(),
    warehouseAccess: Array.isArray(user.warehouseAccess) ? user.warehouseAccess : [],
    approvalManagerId: user.approvalManagerId || null,
    approvalLevel: Number(user.approvalLevel || 1),
    approvalLimit: Number(user.approvalLimit || 0),
    permissions: normalizePagePermissions(user.permissions),
  });

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      fullname: user.fullname || '',
      email: user.email || '',
      password: '',
      role: user.role || 'employee',
      mobile: user.mobile || '',
      approvalManagerId:
        typeof user.approvalManagerId === 'string'
          ? user.approvalManagerId
          : user.approvalManagerId?._id || '',
      approvalLevel: Number(user.approvalLevel || 1),
      approvalLimit: Number(user.approvalLimit || 0),
      warehouseAccess: (user.warehouseAccess || []).map((entry) => ({
        warehouseId: String(
          typeof entry.warehouseId === 'string'
            ? entry.warehouseId
            : entry.warehouseId?._id || '',
        ),
        accessLevel: (entry.accessLevel || 'view') as 'view' | 'edit' | 'manage',
        active: entry.active !== false,
      })),
      permissions: normalizePagePermissions(user.permissions),
    });
    setShowAddModal(true);
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

    /* Request access from search disabled for now
    const exact = users.find((u: User) => String(u.email || '').toLowerCase() === term);
    if (exact) {
      handleRequestAccess(exact.email, exact._id);
      return;
    }
    */
    if (term.includes('@')) {
      toast.error('That email is not in your organisation. Add the user first.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullname.trim() || !form.email.trim()) {
      toast.error('Full name and email are required');
      return;
    }
    if (!editingUser && !form.password) {
      toast.error('Password is required for new users');
      return;
    }

    const payload = {
      fullname: form.fullname.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      mobile: form.mobile.trim(),
      warehouseAccess: form.warehouseAccess
        .filter((entry) => entry.warehouseId)
        .map((entry) => ({
          warehouseId: entry.warehouseId,
          accessLevel: entry.accessLevel,
          active: entry.active,
        })),
      approvalManagerId: form.approvalManagerId || null,
      approvalLevel: Number(form.approvalLevel || 1),
      approvalLimit: Number(form.approvalLimit || 0),
      permissions: normalizePagePermissions(form.permissions),
    };

    try {
      setSubmitting(true);
      if (editingUser) {
        await api.put('/auth/users/update-permissions', {
          userId: editingUser._id,
          fullname: payload.fullname,
          mobile: payload.mobile,
          role: payload.role,
          location: editingUser.location || null,
          warehouseAccess: payload.warehouseAccess,
          approvalManagerId: payload.approvalManagerId,
          approvalLevel: payload.approvalLevel,
          approvalLimit: payload.approvalLimit,
          permissions: payload.permissions,
          password: payload.password,
        });
        toast.success('User access updated');
      } else {
        await api.post('/auth/users', payload);
        toast.success('User created');
      }
      setShowAddModal(false);
      setEditingUser(null);
      resetForm();
      await loadUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (editingUser ? 'Failed to update user' : 'Failed to create user');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/auth/users/${userId}`);
      toast.success('User deleted successfully');
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    if (Object.keys(invitePermissions).length === 0) {
      toast.error('Select at least one page access');
      return;
    }

    try {
      setSubmitting(true);
      await notificationService.sendInvite(email, invitePermissions);
      toast.success(`Invitation sent to ${email}`);
      setInviteEmail('');
      setInvitePermissions({});
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

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setWarehouseLoading(true);
      const data = await warehouseService.getAllWarehouses();
      setWarehouses(Array.isArray(data) ? (data as any[]) : []);
    } catch (err) {
      console.error('Error loading warehouses:', err);
      toast.error('Failed to load warehouses');
    } finally {
      setWarehouseLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users/list');
      const userList = Array.isArray(response.data)
        ? response.data
        : response.data?.users || response.data?.data || [];
      setUsers(userList.map((user: any) => normalizeUser(user)));
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const name = String(user.fullname || '').toLowerCase();
    const email = String(user.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'employee': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getWarehouseSummary = (user: User) => {
    const access = user.warehouseAccess || [];
    if (!access.length) return 'All warehouses';
    return access
      .map((entry) => {
        const warehouseName =
          typeof entry.warehouseId === 'string'
            ? warehouses.find((w) => w._id === entry.warehouseId || w.id === entry.warehouseId)?.name || entry.warehouseId
            : entry.warehouseId?.name || 'Warehouse';
        return `${warehouseName} (${entry.accessLevel || 'view'})`;
      })
      .join(', ');
  };

  const getManagerLabel = (user: User) => {
    if (!user.approvalManagerId) return 'Unassigned';
    if (typeof user.approvalManagerId === 'string') return user.approvalManagerId;
    return user.approvalManagerId.fullname || user.approvalManagerId.email || 'Unassigned';
  };

  const toggleInvitePage = (pageId: string, checked: boolean) => {
    setInvitePermissions((prev) => {
      const next = { ...prev };
      if (checked) {
        next[pageId] = { view: true, create: false, edit: false, delete: false };
      } else {
        delete next[pageId];
      }
      return next;
    });
  };

  const toggleInviteEditDelete = (pageId: string, checked: boolean) => {
    setInvitePermissions((prev) => ({
      ...prev,
      [pageId]: {
        view: true,
        create: checked,
        edit: checked,
        delete: checked,
      },
    }));
  };

  const toggleFormPage = (pageId: string, checked: boolean) => {
    setForm((prev) => {
      const nextPermissions = { ...prev.permissions };
      if (checked) {
        nextPermissions[pageId] = { view: true, create: false, edit: false, delete: false };
      } else {
        delete nextPermissions[pageId];
      }
      return { ...prev, permissions: nextPermissions };
    });
  };

  const toggleFormEditDelete = (pageId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [pageId]: {
          view: true,
          create: checked,
          edit: checked,
          delete: checked,
        },
      },
    }));
  };
  //Email validation 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (e) => {
    const email = e.target.value;

    setForm({ ...form, email });

    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email");
    } else {
      setEmailError("");
    }
  };
  const renderPagePermissionPicker = (
    permissions: Record<string, PagePermission>,
    onTogglePage: (pageId: string, checked: boolean) => void,
    onToggleEditDelete: (pageId: string, checked: boolean) => void,
    title = 'Page access',
    description = 'Select a page, then choose view-only or edit/delete.',
  ) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-500 border border-slate-200">
          {Object.keys(permissions).length} selected
        </span>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {PAGE_OPTIONS.map((page) => {
          const selected = permissions[page.id];
          const canMutate = Boolean(selected?.edit || selected?.delete || selected?.create);
          return (
            <div key={page.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={(event) => onTogglePage(page.id, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{page.label}</p>
                  <p className="text-[11px] text-slate-500">{page.group}</p>
                  {selected && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected.view}
                          disabled
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        View only
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={canMutate}
                          onChange={(event) => onToggleEditDelete(page.id, event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Edit / Delete
                      </label>
                    </div>
                  )}
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'users'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Users size={16} />
          User List
        </button>
        <button
          onClick={() => setActiveTab('delegated')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'delegated'
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
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={openCreateModal}
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
                    <th className="px-6 py-3 text-left font-medium text-slate-700">Warehouses</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700">Approver</th>
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
                      <td className="px-6 py-4 text-slate-600 text-sm max-w-xs">
                        <div className="truncate" title={getWarehouseSummary(user)}>
                          {getWarehouseSummary(user)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        <div className="flex flex-col">
                          <span>{getManagerLabel(user)}</span>
                          <span className="text-[11px] text-slate-400">
                            Level {user.approvalLevel || 1}
                            {user.approvalLimit ? ` • Limit ${user.approvalLimit}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{user.mobile || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Request Access button disabled for now
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
                                <span />
                              )}
                              Request Access
                            </button>
                          )}
                          */}
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                          >
                            Edit Access
                          </button>
                          {currentUser?.email !== user.email && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user._id)}
                              className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={16} className="text-slate-400 hover:text-red-600" />
                            </button>
                          )}
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

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingUser ? 'Edit User Access' : 'Add User'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="px-5 py-4 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email *
                  </label>

                  <input
                    type="email"
                    required
                    readOnly={!!editingUser}
                    value={form.email}
                    onChange={handleEmailChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${editingUser
                      ? "border-slate-200 bg-slate-50 text-slate-500"
                      : emailError
                        ? "border-red-500"
                        : "border-slate-300"
                      }`}
                  />

                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Min 8 chars with upper, lower, number, and symbol.</p>
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Approval Level</label>
                  <input
                    type="number"
                    min={1}
                    value={form.approvalLevel}
                    onChange={e => setForm({ ...form, approvalLevel: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Approval Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={form.approvalLimit}
                    onChange={e => setForm({ ...form, approvalLimit: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Approval Manager
                  </label>

                  <select
                    value={form.approvalManagerId}
                    onChange={e =>
                      setForm({ ...form, approvalManagerId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">No manager assigned</option>

                    {users
                      .filter(
                        (u) =>
                          u._id !== editingUser?._id &&
                          u.role?.toLowerCase() === "manager"
                      )
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullname} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {renderPagePermissionPicker(
                form.permissions,
                toggleFormPage,
                toggleFormEditDelete,
                'Page permissions',
                'All pages are shown here. Previously saved permissions are pre-selected.',
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Warehouse-wise access</h4>
                    <p className="text-xs text-slate-500">Leave everything unchecked for full access.</p>
                  </div>
                  {warehouseLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                </div>

                {warehouses.length === 0 ? (
                  <p className="text-sm text-slate-500">No warehouses found.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {warehouses.map((warehouse) => {
                      const selected = form.warehouseAccess.find((entry) => entry.warehouseId === warehouse._id);
                      return (
                        <div key={warehouse._id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm((prev) => ({
                                    ...prev,
                                    warehouseAccess: [
                                      ...prev.warehouseAccess,
                                      { warehouseId: warehouse._id, accessLevel: 'view', active: true },
                                    ],
                                  }));
                                } else {
                                  setForm((prev) => ({
                                    ...prev,
                                    warehouseAccess: prev.warehouseAccess.filter((entry) => entry.warehouseId !== warehouse._id),
                                  }));
                                }
                              }}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-slate-900 truncate">{warehouse.name}</p>
                                  <p className="text-xs text-slate-500 truncate">{warehouse.location || 'No location set'}</p>
                                </div>
                                <span className={`text-[11px] px-2 py-1 rounded-full ${warehouse.active === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {warehouse.active === false ? 'Inactive' : 'Active'}
                                </span>
                              </div>
                              <div className="mt-2">
                                <label className="block text-[11px] font-medium text-slate-600 mb-1">Access level</label>
                                <select
                                  value={selected?.accessLevel || 'view'}
                                  disabled={!selected}
                                  onChange={(e) => {
                                    const accessLevel = e.target.value as 'view' | 'edit' | 'manage';
                                    setForm((prev) => ({
                                      ...prev,
                                      warehouseAccess: prev.warehouseAccess.map((entry) =>
                                        entry.warehouseId === warehouse._id
                                          ? { ...entry, accessLevel }
                                          : entry,
                                      ),
                                    }));
                                  }}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs disabled:bg-slate-100"
                                >
                                  <option value="view">View only</option>
                                  <option value="edit">View + Edit</option>
                                  <option value="manage">Full manage</option>
                                </select>
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
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
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Send Invitation</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInvitePermissions({});
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
                  The user will get only the page access selected below after accepting.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Page access</h4>
                    <p className="text-xs text-slate-500">Select a page, then choose view-only or edit/delete.</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-500 border border-slate-200">
                    {Object.keys(invitePermissions).length} selected
                  </span>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {PAGE_OPTIONS.map((page) => {
                    const selected = invitePermissions[page.id];
                    const canMutate = Boolean(selected?.edit || selected?.delete || selected?.create);
                    return (
                      <div key={page.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={(event) => toggleInvitePage(page.id, event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900">{page.label}</p>
                            <p className="text-[11px] text-slate-500">{page.group}</p>
                            {selected && (
                              <div className="mt-3 flex flex-wrap gap-3">
                                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={selected.view}
                                    disabled
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                                  />
                                  View only
                                </label>
                                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={canMutate}
                                    onChange={(event) => toggleInviteEditDelete(page.id, event.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  Edit / Delete
                                </label>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInvitePermissions({});
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
