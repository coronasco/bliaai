import { FaExclamationTriangle } from "react-icons/fa";

interface ErrorMessageProps {
  message: string | null;
  className?: string;
}

export function ErrorMessage({ message, className = "mb-4" }: ErrorMessageProps) {
  if (!message) return null;
  
  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-4 rounded ${className}`}>
      <div className="flex items-center">
        <FaExclamationTriangle className="text-red-500 mr-2" />
        <p className="text-red-700">{message}</p>
      </div>
    </div>
  );
} 