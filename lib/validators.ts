import { z } from 'zod';

/**
 * Utilitar pentru validarea și sanitizarea datelor de intrare
 * Folosim Zod pentru validare și tipare automată
 */

/**
 * Schema de validare pentru formularul de generare a roadmap-ului
 */
export const roadmapFormSchema = z.object({
  desiredRole: z.string().min(3, { message: 'Desired role must be at least 3 characters' }),
  currentSkills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  careerGoals: z.string().min(10, { message: 'Career goals must be at least 10 characters' })
});

/**
 * Schema de validare pentru formularul de creare a unui path
 */
export const pathFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters' }),
  category: z.string().min(3, { message: 'Category must be at least 3 characters' }),
  difficulty: z.string(),
  durationHours: z.number().min(1, { message: 'Duration must be at least 1 hour' })
});

/**
 * Schema de validare pentru formularul de înregistrare
 */
export const registerFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters' })
});

/**
 * Schema de validare pentru formularul de autentificare
 */
export const loginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string()
});

// Schema pentru datele profilului
export const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  bio: z.string().max(500, { message: "Bio must be at most 500 characters" }).optional(),
  avatar: z.string().optional()
});

/**
 * Funcții pentru sanitizarea datelor intrare
 */

// Sanitizare text pentru a preveni HTML/script injection
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Înlocuim tagurile HTML cu entități HTML
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Funcție pentru validarea și sanitizarea datelor
 * @param schema Schema Zod pentru validare
 * @param data Datele de validat
 * @returns Rezultatul validării
 */
export const validateData = <T>(schema: z.Schema<T>, data: unknown): {
  success: boolean;
  data?: T;
  issues?: { message: string }[];
} => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        issues: error.errors.map(err => ({ message: err.message }))
      };
    }
    
    console.error('Error during validation:', error);
    return {
      success: false,
      issues: [{ message: 'Error validating data' }]
    };
  }
}; 