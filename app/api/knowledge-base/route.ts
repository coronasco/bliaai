import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, authAdmin, verifyIdToken } from "@/lib/firebaseAdmin";

// Colecția pentru baza de cunoștințe
const knowledgeBaseCollection = "knowledge_base";

// GET: Obține toate documentele din baza de cunoștințe
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Verificăm autorizarea (token-ul din header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    // Verificăm doar token-ul, fără a utiliza userId
    await verifyIdToken(token);

    // Obținem documentele din baza de cunoștințe
    const snapshot = await dbAdmin.collection(knowledgeBaseCollection).get();
    
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base" },
      { status: 500 }
    );
  }
}

// POST: Adaugă un document nou în baza de cunoștințe
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Verificăm autorizarea (token-ul din header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificăm dacă utilizatorul are permisiunile necesare
    const userRecord = await authAdmin.getUser(userId);
    
    // Exemplu: doar utilizatorii cu email verificat pot adăuga documente
    if (!userRecord.emailVerified) {
      return NextResponse.json({ 
        error: "Forbidden: Email not verified" 
      }, { status: 403 });
    }

    // Obținem datele din request
    const body = await req.json();
    
    // Validăm datele
    if (!body.title || !body.content) {
      return NextResponse.json({ 
        error: "Bad Request: Title and content are required" 
      }, { status: 400 });
    }

    // Adăugăm documentul în baza de cunoștințe
    const docData = {
      title: body.title,
      content: body.content,
      category: body.category || "general",
      tags: body.tags || [],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await dbAdmin.collection(knowledgeBaseCollection).add(docData);

    return NextResponse.json({ 
      success: true, 
      message: "Document added successfully",
      docId: docRef.id 
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding document to knowledge base:", error);
    return NextResponse.json(
      { error: "Failed to add document to knowledge base" },
      { status: 500 }
    );
  }
} 