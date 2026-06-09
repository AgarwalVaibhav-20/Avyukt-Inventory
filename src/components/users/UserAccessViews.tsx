import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Loader2,
  Search,
  Shield,
  ShieldCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import api from '@/services/api';
import { warehouseService } from '@/services/warehouseService';
import { MENU_ITEMS } from '@/constants';

interface UserRecord {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  approvalManagerId?: {
    _id: string;
    fullname?: string;
    email?: string;
    role?: string;
  } | string | null;
  approvalLevel?: number;
  approvalLimit?: number;
  permissions?: Record<string, {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  }>;
  warehouseAccess?: {
    warehouseId?: {
      _id?: string;
      id?: string;
      name?: string;
      location?: string;
      active?: boolean;
    } | string;
    accessLevel?: 'view' | 'edit' | 'manage';
    active?: boolean;
  }[];
}

interface WarehouseRecord {
  _id: string;
  id?: string;
  name: string;
  location?: string;
  active?: boolean;
}

const normalizeUsers = (input: any): UserRecord[] => {
  const list = Array.isArray(input) ? input : input?.users || input?.data || [];
  return list.map((user: any) => ({
    _id: String(user._id || user.id || ''),
    fullname: String(user.fullname || user.name || 'Unknown User'),
    email: String(user.email || ''),
    role: String(user.role || 'employee'),
    approvalManagerId: user.approvalManagerId || null,
    approvalLevel: Number(user.approvalLevel || 1),
    approvalLimit: Number(user.approvalLimit || 0),
    permissions: user.permissions || {},
    warehouseAccess: Array.isArray(user.warehouseAccess) ? user.warehouseAccess : [],
  }));
};

const pageLabelById = MENU_ITEMS.flatMap((item) =>
  (item.subMenus || []).map((sub) => [sub.id, `${item.label} / ${sub.label}`] as const),
).reduce<Record<string, string>>((acc, [id, label]) => {
  acc[id] = label;
  return acc;
}, {});

const useUserAccessData = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersResponse, warehouseResponse] = await Promise.all([
          api.get('/auth/users/list'),
          warehouseService.getAllWarehouses(),
        ]);

        if (!alive) return;
        setUsers(normalizeUsers(usersResponse.data));
        setWarehouses(Array.isArray(warehouseResponse) ? (warehouseResponse as any[]) : []);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.response?.data?.message || 'Failed to load user access data');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  return { users, warehouses, loading, error, reload: async () => {} };
};

const PageShell: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
    {children}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  note?: string;
  tone?: 'indigo' | 'emerald' | 'amber' | 'slate';
}> = ({ label, value, note, tone = 'slate' }) => {
  const toneClass =
    tone === 'indigo'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {note && <div className="mt-1 text-xs opacity-80">{note}</div>}
    </div>
  );
};

const getWarehouseLabel = (
  entry: UserRecord['warehouseAccess'][number],
  warehouses: WarehouseRecord[],
) => {
  const warehouseId =
    typeof entry.warehouseId === 'string'
      ? entry.warehouseId
      : entry.warehouseId?._id || entry.warehouseId?.id || '';
  const warehouse = warehouses.find(
    (w) => w._id === warehouseId || w.id === warehouseId,
  );
  return warehouse ? `${warehouse.name}${warehouse.location ? ` • ${warehouse.location}` : ''}` : warehouseId || 'Warehouse';
};

export const RoleBasedAccessView: React.FC = () => {
  const { users, loading, error } = useUserAccessData();

  const roleStats = useMemo(() => {
    const stats = users.reduce<Record<string, number>>((acc, user) => {
      const key = user.role || 'employee';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return [
      { role: 'admin', label: 'Admins', tone: 'indigo' as const },
      { role: 'manager', label: 'Managers', tone: 'emerald' as const },
      { role: 'employee', label: 'Employees', tone: 'amber' as const },
      { role: 'user', label: 'Users', tone: 'slate' as const },
    ].map((item) => ({
      ...item,
      count: stats[item.role] || 0,
    }));
  }, [users]);

  const permissionMatrix = [
    { feature: 'User administration', admin: true, manager: true, employee: false, user: false },
    { feature: 'Inventory edits', admin: true, manager: true, employee: true, user: false },
    { feature: 'Approval actions', admin: true, manager: true, employee: false, user: false },
    { feature: 'Warehouse assignments', admin: true, manager: true, employee: false, user: false },
  ];

  return (
    <PageShell
      icon={<ShieldCheck size={22} />}
      title="Role-Based Access Control"
      subtitle="This screen separates role policy from the user list so each access area is visible on its own."
    >
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {roleStats.map((item) => (
              <StatCard
                key={item.role}
                label={item.label}
                value={item.count}
                note={`Defined role: ${item.role}`}
                tone={item.tone}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Access Matrix</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Feature</th>
                      <th className="px-4 py-3 text-left font-medium">Admin</th>
                      <th className="px-4 py-3 text-left font-medium">Manager</th>
                      <th className="px-4 py-3 text-left font-medium">Employee</th>
                      <th className="px-4 py-3 text-left font-medium">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {permissionMatrix.map((row) => (
                      <tr key={row.feature}>
                        <td className="px-4 py-3 font-medium text-slate-900">{row.feature}</td>
                        {(['admin', 'manager', 'employee', 'user'] as const).map((role) => (
                          <td key={role} className="px-4 py-3">
                            {row[role] ? (
                              <CheckCircle2 className="text-emerald-600" size={16} />
                            ) : (
                              <AlertTriangle className="text-slate-300" size={16} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users size={16} className="text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Role Notes</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="rounded-lg bg-slate-50 p-3">Admins should remain the only group with full policy control.</li>
                <li className="rounded-lg bg-slate-50 p-3">Managers can be granted operational access without exposing every permission toggle.</li>
                <li className="rounded-lg bg-slate-50 p-3">Employees and users should inherit the smallest practical permission set.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Page-Level Permissions</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((user) => {
                const entries = Object.entries(user.permissions || {});
                return (
                  <div key={user._id} className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{user.fullname}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entries.length === 0 ? (
                        <span className="text-xs text-slate-500">No explicit page permissions</span>
                      ) : (
                        entries.map(([pageId, permission]) => (
                          <span key={pageId} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                            {pageLabelById[pageId] || pageId} · {permission.delete || permission.edit ? 'Edit / Delete' : 'View only'}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export const WarehouseAccessView: React.FC = () => {
  const { users, warehouses, loading, error } = useUserAccessData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      `${user.fullname} ${user.email} ${user.role}`.toLowerCase().includes(q),
    );
  }, [searchTerm, users]);

  return (
    <PageShell
      icon={<Warehouse size={22} />}
      title="Warehouse-wise Access"
      subtitle="This page focuses on warehouse assignments, independent of the main user list."
    >
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Warehouses" value={warehouses.length} tone="indigo" />
            <StatCard label="Users" value={users.length} tone="emerald" />
            <StatCard
              label="Restricted users"
              value={users.filter((user) => (user.warehouseAccess || []).length > 0).length}
              tone="amber"
              note="Users with at least one explicit warehouse rule"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users, email, or role"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Warehouse Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => {
                    const access = user.warehouseAccess || [];
                    return (
                      <tr key={user._id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{user.fullname}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {access.length === 0 ? (
                            'All warehouses'
                          ) : (
                            <ul className="space-y-1">
                              {access.map((entry, index) => (
                                <li key={`${user._id}-${index}`} className="text-xs">
                                  {getWarehouseLabel(entry, warehouses)} • {entry.accessLevel || 'view'}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export const ApprovalHierarchyView: React.FC = () => {
  const { users, loading, error } = useUserAccessData();

  const hierarchySummary = useMemo(() => {
    const topLevel = users.filter((user) => !user.approvalManagerId);
    const managed = users.filter((user) => !!user.approvalManagerId);
    return { topLevel, managed };
  }, [users]);

  const resolveManagerLabel = (manager: UserRecord['approvalManagerId']) => {
    if (!manager) return 'Unassigned';
    if (typeof manager === 'string') return manager;
    return manager.fullname || manager.email || 'Unassigned';
  };

  return (
    <PageShell
      icon={<GitBranch size={22} />}
      title="Approval Hierarchy"
      subtitle="This view isolates reporting lines and approval limits so the hierarchy can be reviewed independently."
    >
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Top-level approvers"
              value={hierarchySummary.topLevel.length}
              tone="indigo"
              note="Users without an approval manager"
            />
            <StatCard
              label="Mapped users"
              value={hierarchySummary.managed.length}
              tone="emerald"
              note="Users assigned to a manager"
            />
            <StatCard
              label="Unassigned"
              value={users.filter((user) => !user.approvalManagerId).length}
              tone="amber"
              note="Review these entries for hierarchy gaps"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Approval Chain</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Approval Level</th>
                    <th className="px-4 py-3 text-left font-medium">Manager</th>
                    <th className="px-4 py-3 text-left font-medium">Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{user.fullname}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{user.role}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                          Level {user.approvalLevel || 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{resolveManagerLabel(user.approvalManagerId)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.approvalLimit ? `₹${user.approvalLimit}` : 'No limit'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

