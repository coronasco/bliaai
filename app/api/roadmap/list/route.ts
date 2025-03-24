import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

/**
 * GET: Get all roadmaps for a specific user
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get the user ID from the query parameters
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" }, 
        { status: 400 }
      );
    }
    
    // Query roadmaps for this user
    const roadmapsQuery = query(
      collection(db, "roadmaps"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    // Get all roadmaps
    const querySnapshot = await getDocs(roadmapsQuery);
    
    // Process results
    const roadmaps = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }));
    
    return NextResponse.json({ 
      roadmaps,
      total: roadmaps.length
    });
    
  } catch (error) {
    console.error("Error loading roadmaps:", error);
    return NextResponse.json(
      { error: "Could not load roadmaps", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 