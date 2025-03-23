import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyIdToken } from "@/lib/firebaseAdmin";
import { checkUserPermissions } from "@/lib/adminUtils";

/**
 * DELETE: Șterge un document din baza de cunoștințe bazat pe ID-ul din corpul cererii
 * Necesită autentificare și rol de admin
 */
export async function DELETE(req: NextRequest): Promise<Response> {
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

    // Obținem ID-ul documentului din corpul cererii
    const { id } = await req.json();
    
    // Validăm ID-ul
    if (!id) {
      return NextResponse.json(
        { error: "Bad Request: ID is required" },
        { status: 400 }
      );
    }

    // Verificăm dacă documentul există
    const docRef = dbAdmin.collection("knowledge_base").doc(id);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Ștergem documentul
    await docRef.delete();

    // Returnăm mesajul de succes
    return NextResponse.json({
      success: true,
      message: "Knowledge deleted successfully",
      id
    });

  } catch (error) {
    console.error("Error deleting knowledge:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge" },
      { status: 500 }
    );
  }
} 