import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, getDoc, doc } from "firebase/firestore";

/**
 * GET: Get all available public roadmaps
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get optional filter parameters
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get("search")?.toLowerCase() || "";
    const limitParam = parseInt(url.searchParams.get("limit") || "20");
    
    // Build query to get public roadmaps
    const roadmapsRef = collection(db, "roadmaps");
    const q = query(
      roadmapsRef,
      where("isPublic", "==", true),
      limit(limitParam)
    );
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    // Transform results into an appropriate response format
    const publicRoadmaps = [];
    
    if (querySnapshot.empty) {
      console.log("No public roadmaps found in the database");
      // Return an empty array instead of throwing an error
      return NextResponse.json({ 
        roadmaps: [],
        total: 0,
        message: "No public roadmaps found"
      });
    }
    
    for (const roadmapDoc of querySnapshot.docs) {
      try {
        const roadmapData = roadmapDoc.data();
        
        // Skip roadmaps with missing or invalid data
        if (!roadmapData || !roadmapData.roadmap) {
          console.warn(`Skipping roadmap ${roadmapDoc.id} - missing or invalid data`);
          continue;
        }
        
        // Check if the roadmap has a title and matches the search term (if any)
        if (
          roadmapData.roadmap.title && 
          (!searchTerm || roadmapData.roadmap.title.toLowerCase().includes(searchTerm))
        ) {
          // Get author information
          let userName = "Anonymous user";
          try {
            if (roadmapData.userId) {
              const userDoc = await getDoc(doc(db, "users", roadmapData.userId));
              if (userDoc.exists()) {
                userName = userDoc.data().displayName || userDoc.data().email || "Anonymous user";
              }
            }
          } catch (error) {
            console.error("Error getting user information:", error);
            // Continue with default username if there's an error
          }
          
          // Calculate popularity (number of users who have cloned this roadmap)
          let popularity = 0;
          try {
            const cloneCountQuery = query(
              collection(db, "roadmap_clones"),
              where("originalRoadmapId", "==", roadmapDoc.id)
            );
            const cloneSnapshot = await getDocs(cloneCountQuery);
            popularity = cloneSnapshot.size;
          } catch (error) {
            console.error("Error calculating popularity:", error);
            // Continue with default popularity if there's an error
          }
          
          // Add the roadmap to the results list
          publicRoadmaps.push({
            id: roadmapDoc.id,
            title: roadmapData.roadmap.title,
            description: roadmapData.roadmap.description || "",
            userName: userName,
            popularity: popularity,
            createdAt: roadmapData.createdAt?.toDate?.() || new Date()
          });
        }
      } catch (docError) {
        console.error(`Error processing roadmap document ${roadmapDoc.id}:`, docError);
        // Skip this document and continue with the next one
        continue;
      }
    }
    
    // Sort roadmaps by popularity (descending)
    publicRoadmaps.sort((a, b) => b.popularity - a.popularity);
    
    return NextResponse.json({ 
      roadmaps: publicRoadmaps,
      total: publicRoadmaps.length
    });
    
  } catch (error) {
    console.error("Error getting public roadmaps:", error);
    return NextResponse.json(
      { 
        error: "Could not get public roadmaps", 
        details: error instanceof Error ? error.message : String(error),
        roadmaps: [] // Return empty array even in case of error
      }, 
      { status: 500 }
    );
  }
} 