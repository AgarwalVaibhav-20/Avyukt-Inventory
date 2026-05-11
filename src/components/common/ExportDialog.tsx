import React, { useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';

export type ExportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ExportFormat = 'csv' | 'excel';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (period: ExportPeriod, format: ExportFormat) => Promise<void>;
  reportName?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  reportName = 'Report'
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('monthly');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periods: { value: ExportPeriod; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const formats: { value: ExportFormat; label: string }[] = [
    { value: 'csv', label: 'CSV File' },
    { value: 'excel', label: 'Excel (XLSX)' }
  ];

  const handleExport = async () => {
    setError(null);
    setExporting(true);
    try {
      console.log('🚀 Starting export with period:', selectedPeriod, 'format:', selectedFormat);
      await onExport(selectedPeriod, selectedFormat);
      console.log('✅ Export completed successfully');
      setTimeout(() => onClose(), 500);
    } catch (error: any) {
      const errorMsg = error.message || 'Export failed. Please try again.';
      console.error('❌ Export error:', errorMsg);
      setError(errorMsg);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export {reportName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Choose format and time period</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Error: {error}</p>
            </div>
          )}
          {/* Time Period Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Time Period
            </label>
            <div className="grid grid-cols-2 gap-3">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  disabled={exporting}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedPeriod === period.value
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {formats.map((format) => (
                <label
                  key={format.value}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    disabled={exporting}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-slate-700">{format.label}</p>
                    <p className="text-xs text-slate-500">
                      {format.value === 'csv'
                        ? 'Comma-separated values, compatible with Excel'
                        : 'Microsoft Excel format with formatting'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
