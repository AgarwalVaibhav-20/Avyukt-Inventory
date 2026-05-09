import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2, Check, X, Trash2, AlertCircle, Clock, CheckCircle2,
  XCircle, Loader2, ChevronDown, Filter, Search, RefreshCw, LogIn
} from 'lucide-react';
import { delegatedAccessService } from '@/services/delegatedAccessService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { startDelegatedSession } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

interface AccessRequest {
  _id: string;
  requesterId?: { fullname: string; email: string; profileImage?: string };
  requesterEmail: string;
  targetUserId?: { fullname: string; email: string; profileImage?: string };
  targetUserEmail: string;
  permissionLevel: 'view' | 'edit' | 'delete';
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  reason?: string;
  createdAt: string;
  approvedAt?: string;
  expiresAt?: string;
}

interface ApprovedAccess {
  _id: string;
  targetUserEmail: string;
  targetUserId: { fullname: string; email: string; profileImage?: string };
  permissionLevel: 'view' | 'edit' | 'delete';
  approvedAt: string;
  expiresAt: string;
}

const DelegatedAccessSection: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleOpenDashboard = async (access: ApprovedAccess) => {
    if (!window.confirm(`Open ${access.targetUserEmail}'s dashboard with "${access.permissionLevel}" access?`)) {
      return;
    }
    try {
      setOpeningId(access._id);
      const { token, user: delegatedUser, permissionLevel } = await delegatedAccessService.useAccess(access._id);
      dispatch(startDelegatedSession({
        delegatedUser,
        token,
        requestId: access._id,
        permissionLevel,
      }));
      toast.success(`Signed in as ${delegatedUser.email} (${permissionLevel} access)`);
      navigate('/dashboard/dash-overview');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start delegated session');
    } finally {
      setOpeningId(null);
    }
  };

  // Request Access Tab
  const [targetEmail, setTargetEmail] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'edit' | 'delete'>('view');
  const [reason, setReason] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  // Received Requests
  const [receivedRequests, setReceivedRequests] = useState<AccessRequest[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedStatus, setReceivedStatus] = useState('pending');

  // Sent Requests
  const [sentRequests, setSentRequests] = useState<AccessRequest[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentStatus, setSentStatus] = useState('pending');

  // Approved Access
  const [approvedAccess, setApprovedAccess] = useState<ApprovedAccess[]>([]);
  const [approvedLoading, setApprovedLoading] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'request' | 'received' | 'sent' | 'approved'>('received');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadReceivedRequests(),
      loadSentRequests(),
      loadApprovedAccess()
    ]);
  };

  const loadReceivedRequests = async () => {
    try {
      setReceivedLoading(true);
      const data = await delegatedAccessService.getReceivedRequests(receivedStatus);
      setReceivedRequests(data.requests || []);
    } catch (err) {
      console.error('Error loading received requests:', err);
      toast.error('Failed to load received requests');
    } finally {
      setReceivedLoading(false);
    }
  };

  const loadSentRequests = async () => {
    try {
      setSentLoading(true);
      const data = await delegatedAccessService.getSentRequests(sentStatus);
      setSentRequests(data.requests || []);
    } catch (err) {
      console.error('Error loading sent requests:', err);
      toast.error('Failed to load sent requests');
    } finally {
      setSentLoading(false);
    }
  };

  const loadApprovedAccess = async () => {
    try {
      setApprovedLoading(true);
      const data = await delegatedAccessService.getApprovedAccess();
      setApprovedAccess(data.approvedAccess || []);
    } catch (err) {
      console.error('Error loading approved access:', err);
      toast.error('Failed to load approved access');
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = targetEmail.trim();
    if (!trimmed) {
      toast.error('Please enter target user email');
      return;
    }

    const myEmail = String(user?.email || '').trim().toLowerCase();
    if (myEmail && trimmed.toLowerCase() === myEmail) {
      toast.error("You can't request access to your own account.");
      return;
    }

    try {
      setRequestLoading(true);
      await delegatedAccessService.requestAccess(trimmed.toLowerCase(), permissionLevel, reason);
      toast.success('Access request sent successfully');
      setTargetEmail('');
      setReason('');
      setPermissionLevel('view');
      await loadSentRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request access');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await delegatedAccessService.approveAccess(requestId);
      toast.success('Access request approved');
      await loadReceivedRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve access');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await delegatedAccessService.rejectAccess(requestId, 'Request rejected');
      toast.success('Access request rejected');
      await loadReceivedRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject access');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to revoke this access?')) return;
    
    try {
      setProcessingId(requestId);
      await delegatedAccessService.revokeAccess(requestId);
      toast.success('Access revoked successfully');
      await loadApprovedAccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setProcessingId(null);
    }
  };

  const getPermissionBadgeColor = (level: string) => {
    switch (level) {
      case 'view': return 'bg-blue-100 text-blue-700';
      case 'edit': return 'bg-amber-100 text-amber-700';
      case 'delete': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'revoked': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Share2 size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Delegated Access</h2>
          <p className="text-sm text-slate-500">Request or manage temporary access to other user accounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'received', label: 'Received Requests', icon: Clock },
          { id: 'sent', label: 'Sent Requests', icon: Share2 },
          { id: 'approved', label: 'Active Access', icon: CheckCircle2 },
          { id: 'request', label: 'Request Access', icon: AlertCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon size={16} className="inline mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Request Access Tab */}
      {activeTab === 'request' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <form onSubmit={handleRequestAccess} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target User Email
              </label>
              <input
                type="email"
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={requestLoading}
              />
              <p className="text-xs text-slate-500 mt-1">Enter the email of the user whose account you want to access</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Permission Level
              </label>
              <select
                value={permissionLevel}
                onChange={e => setPermissionLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={requestLoading}
              >
                <option value="view">Can View (Read-only access)</option>
                <option value="edit">Can Edit (Modify records)</option>
                <option value="delete">Can Delete (Full control)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Select the level of access you're requesting</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Why do you need this access?"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={requestLoading}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={requestLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {requestLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Received Requests Tab */}
      {activeTab === 'received' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-medium text-slate-900">Access Requests From Team Members</h3>
            <button
              onClick={loadReceivedRequests}
              disabled={receivedLoading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={receivedLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {receivedLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Loading requests...</p>
              </div>
            ) : receivedRequests.length === 0 ? (
              <div className="p-8 text-center">
                <Share2 className="mx-auto h-12 w-12 text-slate-200 mb-2" />
                <p className="text-slate-500 text-sm">No access requests yet</p>
              </div>
            ) : (
              receivedRequests.map(req => (
                <div key={req._id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-900">{req.requesterEmail}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPermissionBadgeColor(req.permissionLevel)}`}>
                          {req.permissionLevel === 'view' ? 'Can View' : req.permissionLevel === 'edit' ? 'Can Edit' : 'Can Delete'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                      {req.reason && (
                        <p className="text-sm text-slate-600 mb-2">Reason: {req.reason}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Requested on {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={processingId === req._id}
                          className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {processingId === req._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          disabled={processingId === req._id}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          {processingId === req._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sent Requests Tab */}
      {activeTab === 'sent' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-medium text-slate-900">My Access Requests</h3>
            <button
              onClick={loadSentRequests}
              disabled={sentLoading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={sentLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {sentLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Loading requests...</p>
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="p-8 text-center">
                <Share2 className="mx-auto h-12 w-12 text-slate-200 mb-2" />
                <p className="text-slate-500 text-sm">You haven't sent any access requests</p>
              </div>
            ) : (
              sentRequests.map(req => (
                <div key={req._id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-900">{req.targetUserEmail}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPermissionBadgeColor(req.permissionLevel)}`}>
                          {req.permissionLevel === 'view' ? 'Can View' : req.permissionLevel === 'edit' ? 'Can Edit' : 'Can Delete'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                      {req.reason && (
                        <p className="text-sm text-slate-600 mb-2">Reason: {req.reason}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Requested on {new Date(req.createdAt).toLocaleDateString()}
                        {req.approvedAt && ` • Approved on ${new Date(req.approvedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Approved Access Tab */}
      {activeTab === 'approved' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-medium text-slate-900">Active Access Permissions</h3>
            <button
              onClick={loadApprovedAccess}
              disabled={approvedLoading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={approvedLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {approvedLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Loading access...</p>
              </div>
            ) : approvedAccess.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-200 mb-2" />
                <p className="text-slate-500 text-sm">No active access permissions</p>
              </div>
            ) : (
              approvedAccess.map(access => (
                <div key={access._id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-900">{access.targetUserEmail}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPermissionBadgeColor(access.permissionLevel)}`}>
                          {access.permissionLevel === 'view' ? 'Can View' : access.permissionLevel === 'edit' ? 'Can Edit' : 'Can Delete'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Approved on {new Date(access.approvedAt).toLocaleDateString()}
                        {access.expiresAt && ` • Expires on ${new Date(access.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDashboard(access)}
                        disabled={openingId === access._id}
                        className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="Open this user's dashboard"
                      >
                        {openingId === access._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <LogIn size={14} />
                        )}
                        Open Dashboard
                      </button>
                      <button
                        onClick={() => handleRevoke(access._id)}
                        disabled={processingId === access._id}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                        title="Revoke Access"
                      >
                        {processingId === access._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DelegatedAccessSection;
