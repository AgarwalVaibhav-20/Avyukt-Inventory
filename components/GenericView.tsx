import React from 'react';
import { Construction, ArrowRight } from 'lucide-react';

interface GenericViewProps {
  title: string;
  parent: string;
}

const GenericView: React.FC<GenericViewProps> = ({ title, parent }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <Construction size={32} className="mb-4 text-slate-400" />
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-slate-600">
          This <span className="font-semibold">{parent}</span> module is under construction.
        </p>
        <div className="mt-6 w-full overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900">Column 1</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Column 2</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">Row {i}</td>
                  <td className="px-4 py-3 text-slate-700">Data {i}</td>
                  <td className="px-4 py-3 text-slate-700">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GenericView;
