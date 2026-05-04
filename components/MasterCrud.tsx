import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Save, X, Loader2 } from 'lucide-react';

interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'array';
}

interface MasterCrudProps {
  title: string;
  description: string;
  columns: ColumnDef[];
  fetchData: () => Promise<any[]>;
  addData: (data: any) => Promise<any>;
  deleteData: (id: string) => Promise<void>;
}

const MasterCrud: React.FC<MasterCrudProps> = ({ 
  title, 
  description, 
  columns, 
  fetchData, 
  addData, 
  deleteData 
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setIsAdding(false);
    setNewData({});
  }, [fetchData]);

  const handleSave = async () => {
    // Basic validation
    for (const col of columns) {
      if (!newData[col.key]) {
        alert(`${col.label} is required`);
        return;
      }
    }

    // Format array types if needed
    const formattedData = { ...newData };
    columns.forEach(col => {
      if (col.type === 'array' && typeof formattedData[col.key] === 'string') {
        formattedData[col.key] = formattedData[col.key].split(',').map((s: string) => s.trim());
      }
    });

    try {
      await addData(formattedData);
      setIsAdding(false);
      setNewData({});
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      await deleteData(id);
      await loadData();
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const recordCount = filteredData.length;

  return (
    <div className="space-y-4">
      {/* Title and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-slate-600">{description}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 sm:px-6">{col.label}</th>
                ))}
                <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} /> Loading data...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 sm:px-6 text-slate-700">
                        {Array.isArray(item[col.key]) 
                          ? item[col.key].join(', ') 
                          : item[col.key]
                        }
                      </td>
                    ))}
                    <td className="px-4 py-3 sm:px-6 text-right">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setIsAdding(false)} />
          <div className="relative w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Add New</h3>
              <button onClick={() => { setIsAdding(false); setNewData({}); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.map((col, idx) => (
                <div key={col.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{col.label}</label>
                  <input
                    autoFocus={idx === 0}
                    type={col.type === 'number' ? 'number' : 'text'}
                    placeholder={col.type === 'array' ? 'Comma separated values' : ''}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    value={newData[col.key] || ''}
                    onChange={e => setNewData({...newData, [col.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setIsAdding(false); setNewData({}); }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Save size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterCrud;
