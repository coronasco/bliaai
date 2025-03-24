import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";

/**
 * GET: Check if a user can create more roadmaps
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" }, 
        { status: 400 }
      );
    }
    
    // Get user premium status - verificare corectă pe baza abonamentelor
    let isPremium = false;
    const userDocRef = doc(db, "customers", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Verificăm subcollection-ul subscriptions pentru abonamente active
      const subscriptionsRef = collection(userDocRef, "subscriptions");
      const subscriptionsSnapshot = await getDocs(subscriptionsRef);
      
      // Un utilizator este premium dacă are cel puțin un abonament cu status "active"
      isPremium = subscriptionsSnapshot.docs.some(doc => doc.data().status === "active");
      
      console.log("[DEBUG] API check-limit premium check:", {
        userId,
        isPremium,
        numSubscriptions: subscriptionsSnapshot.size
      });
    }
    
    // Maximum allowed roadmaps
    const maxRoadmaps = isPremium ? 4 : 1;
    
    // Check number of existing roadmaps
    const roadmapsRef = collection(db, "roadmaps");
    const q = query(roadmapsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const currentRoadmapsCount = querySnapshot.size;
    
    // Determine if user can create more roadmaps
    const canCreateMore = currentRoadmapsCount < maxRoadmaps;
    
    return NextResponse.json({
      canCreateMore,
      currentCount: currentRoadmapsCount,
      maxAllowed: maxRoadmaps,
      isPremium
    });
    
  } catch (error) {
    console.error("Error checking roadmap limit:", error);
    return NextResponse.json(
      { error: "Could not check roadmap limit", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 