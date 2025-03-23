import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyIdToken } from "@/lib/firebaseAdmin";
import { CollectionReference, Query, DocumentData } from "firebase-admin/firestore";

/**
 * GET: Obține toate documentele din baza de cunoștințe
 * Parametri opționali: category
 */
export async function GET(req: NextRequest): Promise<Response> {
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

    // Obținem parametrii de filtrare
    const url = new URL(req.url);
    const category = url.searchParams.get("category");

    // Construim query-ul pentru Firestore
    let query: CollectionReference<DocumentData> | Query<DocumentData> = dbAdmin.collection("knowledge_base");
    
    // Aplicăm filtrare pe categorie dacă e specificată
    if (category) {
      query = query.where("category", "==", category);
    }

    // Executăm query-ul și obținem documentele
    const snapshot = await query.get();
    
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