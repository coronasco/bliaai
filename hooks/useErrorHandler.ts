import { useContext } from "react";
import { ErrorContext } from "@/context/ErrorContext";

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  
  if (!context) {
    // Dacă hook-ul este folosit în afara ErrorContext.Provider
    // Oferim o implementare de rezervă pentru a evita erorile
    return {
      handleError: (message: string) => {
        console.error("Error (from fallback handler):", message);
        alert(`Error: ${message}`);
      }
    };
  }
  
  return context;
}; 