import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAuditLogs } from '@/store/slices/auditSlice';
import { UserCheck, Search, Loader2, RefreshCw } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const UserActivityLogView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { logs, loading, error } = useAppSelector(state => state.audit);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchAuditLogs());
    const interval = window.setInterval(() => {
      dispatch(fetchAuditLogs());
    }, 30000);

    return () => window.clearInterval(interval);
  }, [dispatch]);

  const {
    filteredItems: filtered,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
      items: logs,
      searchTerm: search,
      filters: { action: actionFilter },
      initialPageSize: 10,
      searchFn: (l, term) =>
        l.user.toLowerCase().includes(term) ||
        l.description.toLowerCase().includes(term) ||
        l.module.toLowerCase().includes(term) ||
        (l.userEmail || '').toLowerCase().includes(term) ||
        (l.ipAddress || '').toLowerCase().includes(term),
      filterFn: (l, filters) => filters.action === 'all' || l.action === filters.action,
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="text-indigo-600" size={20}/> User Activity Logs
                </h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search Activity..." 
                            className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                    >
                        <option value="all">All actions</option>
                        <option value="View">View</option>
                        <option value="Create">Create</option>
                        <option value="Update">Update</option>
                        <option value="Delete">Delete</option>
                        <option value="Approve">Approve</option>
                        <option value="Reject">Reject</option>
                        <option value="Login">Login</option>
                        <option value="Export">Export</option>
                    </select>
                    <button
                        onClick={() => dispatch(fetchAuditLogs())}
                        className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
                        Refresh
                    </button>
                </div>
            </div>
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Module</th>
                            <th className="px-6 py-4">IP Address</th>
                            <th className="px-6 py-4">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         filtered.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No logs found.</td></tr> :
                         pagedItems.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.date} {log.timestamp}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-700">{log.user}</div>
                                    <div className="text-xs text-slate-400">{log.userEmail || log.userId || 'Unknown ID'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        log.action === 'Delete' ? 'bg-red-100 text-red-700' :
                                        log.action === 'Create' ? 'bg-green-100 text-green-700' :
                                        log.action === 'Approve' ? 'bg-emerald-100 text-emerald-700' :
                                        log.action === 'Reject' ? 'bg-orange-100 text-orange-700' :
                                        log.action === 'Login' ? 'bg-indigo-100 text-indigo-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{log.module}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.ipAddress || 'N/A'}</td>
                                <td className="px-6 py-4 text-slate-600">{log.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
            />
        </div>
    </div>
  );
};

export default UserActivityLogView;
