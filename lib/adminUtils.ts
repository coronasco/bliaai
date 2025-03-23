import { dbAdmin, authAdmin } from "./firebaseAdmin";

// Tipuri pentru roluri de utilizator
export type UserRole = "user" | "admin" | "editor";

interface UserClaims {
  role?: UserRole;
  permissions?: string[];
}

/**
 * Setează roluri și permisiuni pentru un utilizator folosind Firebase Admin SDK
 * Aceste roluri vor fi stocate în custom claims și vor fi disponibile în token-ul JWT
 */
export async function setUserRole(userId: string, role: UserRole, permissions: string[] = []) {
  try {
    // Verificăm dacă utilizatorul există
    await authAdmin.getUser(userId);

    // Construim obiectul custom claims - limitat la 1000 bytes
    const customClaims: UserClaims = {
      role,
      permissions
    };

    // Setăm custom claims pentru utilizator
    await authAdmin.setCustomUserClaims(userId, customClaims);

    // Opțional: Salvăm aceste date și în Firestore pentru referință
    await dbAdmin.collection("user_roles").doc(userId).set({
      role,
      permissions,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error setting user role:", error);
    throw new Error(`Failed to set role for user: ${error}`);
  }
}

/**
 * Verifică dacă un utilizator are anumite permisiuni
 * Util pentru verificări server-side
 */
export async function checkUserPermissions(userId: string, requiredPermissions: string[]) {
  try {
    console.log(`[checkUserPermissions] Verificare pentru utilizatorul: ${userId}, permisiuni necesare:`, requiredPermissions);
    
    // Obținem datele utilizatorului inclusiv custom claims
    const user = await authAdmin.getUser(userId);
    const customClaims = user.customClaims as UserClaims || {};
    console.log(`[checkUserPermissions] Custom claims:`, customClaims);

    // Verificăm mai întâi în custom claims
    // Admin are toate permisiunile
    if (customClaims.role === "admin") {
      console.log(`[checkUserPermissions] Utilizatorul are rol admin în claims`);
      return { hasAccess: true };
    }

    // Verificăm permisiunile specifice în custom claims
    if (customClaims.permissions && Array.isArray(customClaims.permissions)) {
      console.log(`[checkUserPermissions] Verificare permisiuni specifice în claims:`, customClaims.permissions);
      const hasAllPermissions = requiredPermissions.every(
        permission => customClaims.permissions?.includes(permission)
      );
      
      if (hasAllPermissions) {
        console.log(`[checkUserPermissions] Utilizatorul are toate permisiunile necesare în claims`);
        return { hasAccess: true };
      }
    }

    // Dacă nu are permisiuni în claims, verificăm în colecția customers
    console.log(`[checkUserPermissions] Verificare în colecția customers`);
    const customerDoc = await dbAdmin.collection("customers").doc(userId).get();
    
    if (customerDoc.exists) {
      console.log(`[checkUserPermissions] Document customer găsit`);
      const customerData = customerDoc.data();
      console.log(`[checkUserPermissions] Date customer:`, customerData);
      
      if (customerData) {
        // Verificăm dacă utilizatorul are rolul admin
        // CAZUL 1: roles este array și conține "admin"  
        const hasAdminRoleInArray = Array.isArray(customerData.roles) && customerData.roles.includes('admin');
        
        // CAZUL 2: roles este string și este egal cu "admin"
        const hasAdminRoleAsString = typeof customerData.roles === 'string' && customerData.roles === 'admin';
        
        // CAZUL 3: role este string și este egal cu "admin"
        const hasAdminRoleField = customerData.role === 'admin';
        
        console.log(`[checkUserPermissions] Verificare rol admin în customer:`, {
          hasAdminRoleInArray,
          hasAdminRoleAsString,
          hasAdminRoleField,
          roles: customerData.roles,
          role: customerData.role
        });
        
        if (hasAdminRoleInArray || hasAdminRoleAsString || hasAdminRoleField) {
          console.log(`[checkUserPermissions] Utilizatorul are rol admin în customer`);
          return { hasAccess: true };
        }
      }
    } else {
      console.log(`[checkUserPermissions] Document customer nu există`);
    }

    console.log(`[checkUserPermissions] Utilizatorul nu are acces`);
    return { hasAccess: false };
  } catch (error) {
    console.error("[checkUserPermissions] Error checking user permissions:", error);
    throw new Error(`Failed to check permissions: ${error}`);
  }
}

/**
 * Obține toți utilizatorii cu rol de admin
 */
export async function getAdminUsers() {
  try {
    const snapshot = await dbAdmin.collection("user_roles")
      .where("role", "==", "admin")
      .get();

    const adminUsers = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const userData = await authAdmin.getUser(doc.id);
        return {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: "admin",
          permissions: doc.data().permissions || []
        };
      })
    );

    return adminUsers;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw new Error(`Failed to fetch admin users: ${error}`);
  }
}

/**
 * Creează reguli Firestore din cod - util pentru migrări și setup inițial
 * Notă: Reguli trebuie de obicei configurate în consola Firebase sau prin fișierul firestore.rules
 * Această funcție este doar pentru demonstrație a accesului administrativ
 */
export async function setupKnowledgeBaseCollection() {
  try {
    // Verificăm dacă colecția există, dacă nu, o creăm
    const knowledgeBaseRef = dbAdmin.collection("knowledge_base");
    const snapshot = await knowledgeBaseRef.limit(1).get();
    
    if (snapshot.empty) {
      // Creăm un document inițial
      await knowledgeBaseRef.add({
        title: "Welcome to Knowledge Base",
        content: "This is the first document in your knowledge base. You can add more documents using the API.",
        category: "system",
        tags: ["welcome", "getting-started"],
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log("Knowledge base collection initialized successfully");
    }

    return { success: true, message: "Knowledge base setup complete" };
  } catch (error) {
    console.error("Error setting up knowledge base:", error);
    throw new Error(`Failed to setup knowledge base: ${error}`);
  }
} 