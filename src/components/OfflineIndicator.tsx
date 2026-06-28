import React from 'react';
import { useOffline } from '../hooks/useOffline';

// Component for displaying offline status and actions
export const OfflineIndicator: React.FC = () => {
  const { isOnline, offlineActions, clearOfflineData } = useOffline();

  if (isOnline && offlineActions.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className={`rounded-control p-4 shadow-lg border ${
        isOnline ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
            }`}></div>
            <span className={`text-sm font-medium ${
              isOnline ? 'text-green-800' : 'text-orange-800'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {offlineActions.length > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              isOnline 
                ? 'bg-gold-100 text-gold-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {offlineActions.length} pending
            </span>
          )}
        </div>

        {!isOnline && (
          <p className="text-xs text-orange-600 mt-2">
            Some features are limited. Your actions will sync when online.
          </p>
        )}

        {offlineActions.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {offlineActions.length} action(s) queued for sync
            </span>
            <button
              onClick={clearOfflineData}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
