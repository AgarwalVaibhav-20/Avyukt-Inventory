import api from './api';

const PATH = '/api/delegated-access';

interface AccessRequest {
  _id: string;
  requesterId: string;
  requesterEmail: string;
  targetUserId: string;
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
  targetUserId: {
    _id: string;
    fullname: string;
    email: string;
    profileImage?: string;
  };
  permissionLevel: 'view' | 'edit' | 'delete';
  approvedAt: string;
  expiresAt: string;
}

export const delegatedAccessService = {
  /**
   * Request access to another user's account
   */
  requestAccess: async (targetUserEmail: string, permissionLevel: 'view' | 'edit' | 'delete', reason?: string) => {
    const response = await api.post(`${PATH}/request`, {
      targetUserEmail,
      permissionLevel,
      reason: reason || ''
    });
    return response.data;
  },

  /**
   * Get all access requests received by current user
   */
  getReceivedRequests: async (status: string = 'all', page: number = 1, limit: number = 10) => {
    const response = await api.get(`${PATH}/received`, {
      params: { status, page, limit }
    });
    return response.data;
  },

  /**
   * Get all access requests sent by current user
   */
  getSentRequests: async (status: string = 'all', page: number = 1, limit: number = 10) => {
    const response = await api.get(`${PATH}/sent`, {
      params: { status, page, limit }
    });
    return response.data;
  },

  /**
   * Get all approved access for current user
   */
  getApprovedAccess: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`${PATH}/approved`, {
      params: { page, limit }
    });
    return response.data;
  },

  /**
   * Get details of a specific access request
   */
  getAccessDetail: async (requestId: string) => {
    const response = await api.get(`${PATH}/${requestId}`);
    return response.data;
  },

  /**
   * Approve an access request
   */
  approveAccess: async (requestId: string) => {
    const response = await api.post(`${PATH}/${requestId}/approve`);
    return response.data;
  },

  /**
   * Reject an access request
   */
  rejectAccess: async (requestId: string, rejectionReason?: string) => {
    const response = await api.post(`${PATH}/${requestId}/reject`, {
      rejectionReason: rejectionReason || ''
    });
    return response.data;
  },

  /**
   * Revoke an approved access
   */
  revokeAccess: async (requestId: string) => {
    const response = await api.post(`${PATH}/${requestId}/revoke`);
    return response.data;
  },

  /**
   * Start a delegated session for an approved request — returns a token
   * the frontend should swap in to act as the target user.
   */
  useAccess: async (requestId: string) => {
    const response = await api.post(`${PATH}/${requestId}/use`);
    return response.data as {
      token: string;
      user: any;
      permissionLevel: 'view' | 'edit' | 'delete';
      requestId: string;
    };
  }
};
