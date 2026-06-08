import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = "Confirm Deletion",
  description = "Are you sure you want to permanently delete this item? This action is irreversible and might affect other connected records.",
  itemName,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300">
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Warning Accent Border top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        <div className="flex flex-col items-center text-center mt-2">
          {/* Circular Danger Icon container */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 border border-rose-100/60 text-rose-500 mb-4 animate-bounce">
            <AlertTriangle className="w-7 h-7" />
          </div>

          {/* Title & Desc */}
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            {title}
          </h3>
          
          {itemName && (
            <div className="mt-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-sm font-medium text-rose-600 max-w-full truncate">
              {itemName}
            </div>
          )}

          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition-all hover:shadow-sm active:scale-[0.98] duration-150 cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-75 text-white font-medium text-sm rounded-xl shadow-md hover:shadow-red-500/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin-slow" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
