import React, { useEffect, useState } from 'react';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall, onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed or running in standalone mode
    const checkInstallStatus = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay (don't be intrusive)
      setTimeout(() => {
        if (!isStandalone) {
          setShowPrompt(true);
        }
      }, 10000); // Show after 10 seconds
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA: App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone, onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('PWA: User choice result:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('PWA: Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    onDismiss?.();
    
    // Don't show again for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if user previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      if (dismissedTime > oneDayAgo) {
        setShowPrompt(false);
        return;
      }
    }
  }, []);

  // Don't show if already installed or not supported
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Sheet Style Prompt */}
      <div className="fixed inset-0 z-50 sm:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleDismiss}
        />
        
        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 shadow-2xl animate-slide-up">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gold-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xl">📱</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Install ShumelaHire
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Get quick access to your recruitment dashboard. Install our app for a better experience with offline support and push notifications.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-gold-500 text-violet-950 px-4 py-2 rounded-sm font-medium hover:bg-gold-600 transition-colors"
                >
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Banner Style Prompt */}
      <div className="hidden sm:block fixed top-4 right-4 z-50 max-w-sm">
        <div className="bg-white border border-gray-200 rounded-sm shadow-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gold-500 rounded-sm flex items-center justify-center">
                <span className="text-white">📱</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">
                Install App
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Add ShumelaHire to your desktop for quick access and offline support.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="text-xs bg-gold-500 text-violet-950 px-3 py-1 rounded hover:bg-gold-600 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// PWA Status Component
export const PWAStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if PWA is installed
    const checkPWAStatus = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone ||
                   document.referrer.includes('android-app://');
      setIsInstalled(isPWA);
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Service worker update
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    checkPWAStatus();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
      }
    };
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!isInstalled) return null;

  return (
    <div className="fixed top-4 left-4 z-40">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-orange-100 border border-orange-300 text-orange-800 px-3 py-2 rounded-sm shadow-sm mb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">Offline Mode</span>
          </div>
        </div>
      )}

      {/* Update available indicator */}
      {updateAvailable && (
        <div className="bg-gold-100 border border-violet-300 text-violet-800 px-3 py-2 rounded-sm shadow-sm">
          <div className="flex items-center justify-between space-x-3">
            <span className="text-sm font-medium">Update Available</span>
            <button
              onClick={handleUpdate}
              className="text-xs bg-gold-500 text-violet-950 px-2 py-1 rounded hover:bg-gold-600"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAInstallPrompt;
