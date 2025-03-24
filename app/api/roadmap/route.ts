import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";

/**
 * GET: Get a specific roadmap by ID
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get roadmap ID and user ID from the query parameters
    const roadmapId = req.nextUrl.searchParams.get("roadmapId");
    const userId = req.nextUrl.searchParams.get("userId");
    
    // Handle different request types
    if (roadmapId) {
      // Get a single roadmap by ID
      const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
      
      if (!roadmapDoc.exists()) {
        return NextResponse.json(
          { error: "Roadmap not found" }, 
          { status: 404 }
        );
      }
      
      // Check if the user has access to this roadmap
      const roadmapData = roadmapDoc.data();
      if (roadmapData.userId !== userId && !roadmapData.isPublic) {
        return NextResponse.json(
          { error: "You don't have access to this roadmap" }, 
          { status: 403 }
        );
      }
      
      // Return the roadmap data
      return NextResponse.json({
        roadmap: {
          id: roadmapDoc.id,
          ...roadmapData
        }
      });
    } else if (userId) {
      // Get all roadmaps for a user
      const roadmapsQuery = query(
        collection(db, "roadmaps"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(roadmapsQuery);
      const roadmaps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return NextResponse.json({ roadmaps });
    } else {
      // No valid parameters provided
      return NextResponse.json(
        { error: "Either roadmapId or userId is required" }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error getting roadmap:", error);
    return NextResponse.json(
      { error: "Could not load the roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new roadmap
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap data and user ID from request body
    const { roadmap, userId } = await req.json();
    
    if (!roadmap || !userId) {
      return NextResponse.json(
        { error: "Roadmap data and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Create a new roadmap document
    const newRoadmap = {
      roadmap,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: false,
      isActive: true
    };
    
    // Add the new roadmap to Firestore
    const newRoadmapRef = doc(collection(db, "roadmaps"));
    await setDoc(newRoadmapRef, newRoadmap);
    
    // Return the new roadmap ID
    return NextResponse.json({
      success: true,
      message: "Roadmap created successfully",
      roadmapId: newRoadmapRef.id
    });
    
  } catch (error) {
    console.error("Error creating roadmap:", error);
    return NextResponse.json(
      { error: "Could not create roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing roadmap
 */
export async function PUT(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap ID, roadmap data, and user ID from request body
    const { roadmapId, roadmap, userId } = await req.json();
    
    if (!roadmapId || !roadmap || !userId) {
      return NextResponse.json(
        { error: "Roadmap ID, roadmap data, and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Check if the roadmap exists
    const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
    
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the user has permission to update this roadmap
    const roadmapData = roadmapDoc.data();
    if (roadmapData.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this roadmap" }, 
        { status: 403 }
      );
    }
    
    // Update the roadmap
    await updateDoc(doc(db, "roadmaps", roadmapId), {
      roadmap,
      updatedAt: serverTimestamp()
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Roadmap updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return NextResponse.json(
      { error: "Could not update roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a roadmap
 */
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    // Get roadmap ID and user ID from URL
    const url = new URL(req.url);
    const roadmapId = url.searchParams.get("roadmapId");
    const userId = url.searchParams.get("userId");
    
    if (!roadmapId || !userId) {
      return NextResponse.json(
        { error: "Roadmap ID and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Check if the roadmap exists
    const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
    
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: "Roadmap not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the user has permission to delete this roadmap
    const roadmapData = roadmapDoc.data();
    if (roadmapData.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this roadmap" }, 
        { status: 403 }
      );
    }
    
    // Delete the roadmap
    await deleteDoc(doc(db, "roadmaps", roadmapId));
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Roadmap deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return NextResponse.json(
      { error: "Could not delete roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 