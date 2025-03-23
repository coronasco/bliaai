import { FaExclamationTriangle } from "react-icons/fa";

interface OfflineWarningProps {
  message?: string;
  className?: string;
}

export function OfflineWarning({ 
  message = "You are in offline mode. Some features may be limited and displayed data may not be up-to-date.", 
  className = "mb-4" 
}: OfflineWarningProps) {
  return (
    <div className={`bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded ${className}`}>
      <div className="flex items-center">
        <FaExclamationTriangle className="text-yellow-500 mr-2" />
        <p className="text-yellow-700">
          {message}
        </p>
      </div>
    </div>
  );
} 