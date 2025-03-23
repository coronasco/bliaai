import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebaseAdmin";

/**
 * GET: Obține toate documentele din baza de cunoștințe, ordonate după data creării
 * Nu necesită autentificare - endpoint public
 */
export async function GET(): Promise<Response> {
  try {
    // Construim query-ul pentru Firestore
    const snapshot = await dbAdmin.collection("knowledge_base")
      .orderBy("createdAt", "desc")
      .get();
    
    // Transformăm documentele pentru a include ID-ul
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Returnăm documentele ca răspuns JSON
    return NextResponse.json(documents);
    
  } catch (error) {
    console.error("Error fetching knowledge list:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge list" },
      { status: 500 }
    );
  }
} 