"use client";

import { createContext, ReactNode } from "react";

// Creăm un context pentru a transmite funcția de gestionare a erorilor
export const ErrorContext = createContext<{
  handleError: (message: string) => void;
}>({
  handleError: () => {},
});

export function ErrorProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: { handleError: (message: string) => void };
}) {
  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
} 