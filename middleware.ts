import { NextResponse } from 'next/server';
import { securityHeaders } from './lib/security';

/**
 * Middleware pentru securitatea aplicației
 * - Adaugă headers de securitate
 * - Redirectează utilizatorii neautentificați pe rutele protejate
 * 
 * Notă: Firebase utilizează tokenuri stocate în localStorage, nu cookie-uri.
 * Implementarea unei soluții complete pentru verificarea autentificării în middleware
 * ar necesita integrarea cu Firebase Admin SDK pe server
 * și crearea unui sistem de cookie-uri sincronizate cu starea de autentificare.
 */
export function middleware() {
  const response = NextResponse.next();
  
  // Adăugăm headerele de securitate la toate răspunsurile
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value);
  });
  
  // Notă: În această versiune a middleware-ului, nu mai verificăm autentificarea
  // deoarece Firebase utilizează tokenuri stocate în localStorage/IndexedDB, nu cookie-uri.
  // Această logică trebuie implementată pe client-side în fiecare pagină protejată.
  
  return response;
}

// Configurăm rutele pentru care să se aplice middleware-ul
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes - acestea au propria lor securitate)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}; 