'use client';

import { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { toast } from 'sonner';
import { Alert } from "@/components/ui/alert";
import { AlertTitle } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";
import { AlertCircle, WifiOff } from 'lucide-react';

// Context pentru starea de conectivitate
const ConnectivityContext = createContext<boolean>(true);

// Hook pentru a accesa starea de conectivitate
export const useOnlineStatus = () => useContext(ConnectivityContext);

interface ConnectivityMonitorProps {
  children: ReactNode;
  onStatusChange?: (isOnline: boolean) => void;
  showToast?: boolean;
  showBanner?: boolean;
}

/**
 * Monitorizează starea conexiunii la internet și afișează notificări
 * Oferă un context pentru starea de conectivitate și afișează notificări
 */
export function ConnectivityMonitor({
  children, 
  onStatusChange,
  showToast = true,
  showBanner = true
}: ConnectivityMonitorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  useEffect(() => {
    // Handle when online status changes
    const handleOnline = () => {
      setIsOnline(true);
      if (onStatusChange) onStatusChange(true);
      
      // Show a toast notification if enabled
      if (showToast) {
        toast.success('Internet connection has been restored');
      }
    };
    
    // Handle when offline status changes
    const handleOffline = () => {
      setIsOnline(false);
      if (onStatusChange) onStatusChange(false);
      
      // Show a toast notification if enabled
      if (showToast) {
        toast.error('Internet connection has been lost');
      }
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange, showToast]);
  
  return (
    <ConnectivityContext.Provider value={isOnline}>
      {!isOnline && showBanner && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center">
            <WifiOff className="mr-2 h-4 w-4" />
            Offline Mode
          </AlertTitle>
          <AlertDescription>
            You are in offline mode. Some features may be limited. Data will be synchronized when the connection is restored.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </ConnectivityContext.Provider>
  );
}

export default ConnectivityMonitor;

/**
 * Componenta pentru afișarea unui avertisment de offline
 */
export function OfflineWarning() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center">
        <WifiOff className="mr-2 h-4 w-4" />
        Offline Mode
      </AlertTitle>
      <AlertDescription>
        You are in offline mode. Some features may be limited. Data will be synchronized when the connection is restored.
      </AlertDescription>
    </Alert>
  );
} 