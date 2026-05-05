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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
           <div className="relative w-full max-w-sm">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search records..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             />
           </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-6 py-4 font-medium">{col.label}</th>
                ))}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isAdding && (
                <tr className="bg-blue-50/50">
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4">
                      <input 
                        autoFocus={col.key === columns[0].key}
                        type="text"
                        placeholder={col.type === 'array' ? 'Comma separated values' : ''}
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newData[col.key] || ''}
                        onChange={e => setNewData({...newData, [col.key]: e.target.value})}
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={18}/></button>
                       <button onClick={() => setIsAdding(false)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={18}/></button>
                    </div>
                  </td>
                </tr>
              )}
              
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
                      <td key={col.key} className="px-6 py-4 text-slate-700">
                        {Array.isArray(item[col.key]) 
                          ? item[col.key].join(', ') 
                          : item[col.key]
                        }
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleDelete(item.id)}
                         className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
    </div>
  );
};

export default MasterCrud;
