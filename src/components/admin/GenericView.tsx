import React from 'react';
import { Zap, ArrowRight, CheckCircle, Lightbulb } from 'lucide-react';

interface GenericViewProps {
  title: string;
  parent: string;
}

const GenericView: React.FC<GenericViewProps> = ({ title, parent }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="text-white" size={48} />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">{title}</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            This module is part of the <span className="font-semibold text-blue-600">{parent}</span> suite. 
          </p>
          <p className="text-base text-slate-500 mt-3">
            Full functionality for this section involves complex forms and backend integration.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Comprehensive</h3>
            <p className="text-slate-600 text-sm">Complete tracking and management of consignments</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <Lightbulb className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Intelligent</h3>
            <p className="text-slate-600 text-sm">Smart insights and real-time data synchronization</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Zap className="text-purple-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Powerful</h3>
            <p className="text-slate-600 text-sm">Advanced features with seamless backend integration</p>
          </div>
        </div>

        {/* Sample Data Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Sample Data Structure</h2>
                <p className="text-sm text-slate-600 mt-1">Preview of available data fields and formats</p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs font-semibold text-slate-700">Mock View</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                  <th className="px-8 py-4 font-semibold text-slate-700">ID</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Reference</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Date</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <tr
                    key={i}
                    className={`transition-colors hover:bg-blue-50 border-slate-100 ${
                      i % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg font-semibold text-blue-700 text-sm">
                        #{1000 + i}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-semibold text-slate-900">REF-2024-{i}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 font-semibold text-xs rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-600">2023-11-{10 + i}</td>
                    <td className="px-8 py-5">
                      <button className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        View
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-5 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">3 of 3</span> records
            </p>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:shadow-lg transition-shadow shadow-md">
              Load More
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-blue-700">ℹ️ Development Status:</span> This module is currently in development. Full features including advanced forms, real-time updates, and complete backend integration will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenericView;
