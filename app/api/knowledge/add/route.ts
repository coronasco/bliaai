import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyIdToken } from "@/lib/firebaseAdmin";
import { checkUserPermissions } from "@/lib/adminUtils";

/**
 * POST: Adaugă un nou document în baza de cunoștințe
 * Necesită autentificare și rol de admin
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    console.log("==== DEBUGGING ADD KNOWLEDGE DOCUMENT ====");
    
    // Verificăm autorizarea (token-ul din header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Auth header missing or invalid:", authHeader);
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" }, 
        { status: 401 }
      );
    }

    console.log("Auth header present");
    const token = authHeader.split("Bearer ")[1];
    
    // Verificăm token-ul și obținem userId
    console.log("Verifying token...");
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log("Token valid for user:", userId);

    // Verificăm dacă utilizatorul are rol de admin - verificare directă în customers
    console.log("Checking user permissions for:", userId);
    let hasAccess = false;
    
    // VERIFICAREA 1: Verificăm prin funcția standard
    console.log("Checking via checkUserPermissions function");
    const permissions = await checkUserPermissions(userId, ["manage_knowledge_base"]);
    hasAccess = permissions.hasAccess;
    console.log("Permission check result:", hasAccess);
    
    // VERIFICAREA 2: Verificăm direct în colecția customers 
    if (!hasAccess) {
      console.log("Permission check failed, checking customers collection directly");
      const customerDoc = await dbAdmin.collection("customers").doc(userId).get();
      console.log("Customer document exists:", customerDoc.exists);
      
      if (customerDoc.exists) {
        const customerData = customerDoc.data();
        console.log("Customer data:", JSON.stringify(customerData));
        
        if (customerData) {
          // Verificăm dacă utilizatorul are rolul admin
          // CAZUL 1: roles este array și conține "admin"  
          const hasAdminRoleInArray = Array.isArray(customerData.roles) && customerData.roles.includes('admin');
          
          // CAZUL 2: roles este string și este egal cu "admin"
          const hasAdminRoleAsString = typeof customerData.roles === 'string' && customerData.roles === 'admin';
          
          // CAZUL 3: role este string și este egal cu "admin"
          const hasAdminRoleField = customerData.role === 'admin';
          
          console.log("Role check results:", { 
            hasAdminRoleInArray, 
            hasAdminRoleAsString,
            hasAdminRoleField,
            roles: customerData.roles,
            role: customerData.role
          });
          
          hasAccess = hasAdminRoleInArray || hasAdminRoleAsString || hasAdminRoleField;
          console.log("Final access decision:", hasAccess);
        }
      }
    }
    
    if (!hasAccess) {
      console.log("Access denied for user:", userId);
      return NextResponse.json(
        { error: "Forbidden: Admin access required" }, 
        { status: 403 }
      );
    }

    console.log("Access granted, processing document");
    
    // Obținem datele din request
    const body = await req.json();
    console.log("Request body:", body);
    const { 
      title, 
      category, 
      content, 
      tags = [], 
      difficulty = 'beginner',
      references = []
    } = body;

    // Validăm datele
    if (!title || !category || !content) {
      console.log("Validation failed, missing required fields");
      return NextResponse.json(
        { error: "Bad Request: All fields (title, category, content) are required" }, 
        { status: 400 }
      );
    }

    // Validare pentru difficulty
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      console.log("Validation failed, invalid difficulty level");
      return NextResponse.json(
        { error: "Bad Request: Difficulty must be one of: beginner, intermediate, advanced" }, 
        { status: 400 }
      );
    }

    // Adăugăm documentul în baza de cunoștințe
    const docData = {
      title,
      category,
      content,
      tags: Array.isArray(tags) ? tags : [],
      difficulty: validDifficulties.includes(difficulty) ? difficulty : 'beginner',
      references: Array.isArray(references) ? references : [],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log("Adding document to knowledge_base:", docData);
    const docRef = await dbAdmin.collection("knowledge_base").add(docData);
    console.log("Document added successfully, id:", docRef.id);

    // Returnăm răspuns de succes
    return NextResponse.json({
      success: true,
      message: "Knowledge added successfully",
      docId: docRef.id
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding knowledge:", error);
    return NextResponse.json(
      { error: "Failed to add knowledge" },
      { status: 500 }
    );
  }
} 