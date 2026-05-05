import React from 'react';
import { Construction, ArrowRight } from 'lucide-react';

interface GenericViewProps {
  title: string;
  parent: string;
}

const GenericView: React.FC<GenericViewProps> = ({ title, parent }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Construction className="text-slate-400" size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md mb-8">
        This module is part of the <span className="font-semibold text-slate-700">{parent}</span> suite. 
        Full functionality for this section involves complex forms and backend integration.
      </p>
      
      <div className="w-full max-w-2xl">
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-700">Sample Data Structure</span>
                <span className="text-xs text-slate-400">Mock View</span>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Reference</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3].map((i) => (
                            <tr key={i} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">#{1000 + i}</td>
                                <td className="px-6 py-4">REF-{2024}-{i}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Active</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">2023-11-{10+i}</td>
                                <td className="px-6 py-4">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center">
                                        View <ArrowRight size={12} className="ml-1"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GenericView;
