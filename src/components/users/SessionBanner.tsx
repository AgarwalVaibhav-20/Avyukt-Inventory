import React from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface SessionBannerProps {
  delegatedUserEmail: string;
  onReturnToOriginal: () => void;
}

const SessionBanner: React.FC<SessionBannerProps> = ({ delegatedUserEmail, onReturnToOriginal }) => {
  const handleReturn = () => {
    if (window.confirm('Are you sure you want to return to your original account?')) {
      onReturnToOriginal();
      toast.success('Returned to your original account');
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-300 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Currently acting as <span className="font-mono bg-white px-2 py-1 rounded ml-1">{delegatedUserEmail}</span>
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Your actions are being performed on this account's data. All activities are logged for audit purposes.
            </p>
          </div>
        </div>
        <button
          onClick={handleReturn}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
        >
          <LogOut size={16} />
          Return to My Account
        </button>
      </div>
    </div>
  );
};

export default SessionBanner;
