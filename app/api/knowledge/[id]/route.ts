import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyIdToken } from "@/lib/firebaseAdmin";
import { checkUserPermissions } from "@/lib/adminUtils";

/**
 * GET: Obține un document specific din baza de cunoștințe
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    // Verificăm autorizarea (token-ul din header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" }, 
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    // Verificăm token-ul pentru a obține detaliile utilizatorului
    await verifyIdToken(token);

    // Obținem ID-ul documentului din URL
    const docId = context.params.id;
    if (!docId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Obținem documentul din Firestore
    const docSnapshot = await dbAdmin.collection("knowledge_base").doc(docId).get();

    // Verificăm dacă documentul există
    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Returnăm documentul
    return NextResponse.json({
      id: docSnapshot.id,
      ...docSnapshot.data()
    });

  } catch (error) {
    console.error(`Error fetching knowledge document:`, error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge document" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Actualizează un document din baza de cunoștințe
 * Necesită autentificare și rol de admin
 */
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    // Verificăm autorizarea (token-ul din header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" }, 
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificăm dacă utilizatorul are rol de admin
    const { hasAccess } = await checkUserPermissions(userId, ["manage_knowledge_base"]);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" }, 
        { status: 403 }
      );
    }

    // Obținem ID-ul documentului din URL
    const docId = context.params.id;
    if (!docId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Verificăm dacă documentul există
    const docRef = dbAdmin.collection("knowledge_base").doc(docId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Obținem datele din request
    const updateData = await req.json();
    const { title, category, content, tags, difficulty, references } = updateData;

    // Validăm datele
    if (!title && !category && !content && !tags && !difficulty && !references) {
      return NextResponse.json(
        { error: "At least one field must be provided to update the document" },
        { status: 400 }
      );
    }

    // Validare pentru difficulty dacă este furnizată
    if (difficulty !== undefined) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(difficulty)) {
        return NextResponse.json(
          { error: "Difficulty must be one of: beginner, intermediate, advanced" }, 
          { status: 400 }
        );
      }
    }

    // Pregătim datele de actualizare
    const documentUpdate: Record<string, string | string[] | boolean | number> = {
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };

    if (title !== undefined) documentUpdate.title = title;
    if (category !== undefined) documentUpdate.category = category;
    if (content !== undefined) documentUpdate.content = content;
    if (tags !== undefined) documentUpdate.tags = Array.isArray(tags) ? tags : [];
    if (difficulty !== undefined) documentUpdate.difficulty = difficulty;
    if (references !== undefined) documentUpdate.references = Array.isArray(references) ? references : [];

    // Actualizăm documentul
    await docRef.update(documentUpdate);

    return NextResponse.json({
      success: true,
      message: "Document updated successfully"
    });

  } catch (error) {
    console.error(`Error updating knowledge document:`, error);
    return NextResponse.json(
      { error: "Failed to update knowledge document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Șterge un document din baza de cunoștințe
 * Necesită autentificare și rol de admin
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    // Verificăm autorizarea (token-ul din header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" }, 
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificăm dacă utilizatorul are rol de admin
    const { hasAccess } = await checkUserPermissions(userId, ["manage_knowledge_base"]);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" }, 
        { status: 403 }
      );
    }

    // Obținem ID-ul documentului din URL
    const docId = context.params.id;
    if (!docId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Verificăm dacă documentul există
    const docRef = dbAdmin.collection("knowledge_base").doc(docId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Ștergem documentul
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error(`Error deleting knowledge document:`, error);
    return NextResponse.json(
      { error: "Failed to delete knowledge document" },
      { status: 500 }
    );
  }
} 