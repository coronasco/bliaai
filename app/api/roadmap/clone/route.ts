import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * POST: Clone a public roadmap for the authenticated user
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Extract roadmap ID and user ID from request body
    const { roadmapId, userId } = await req.json();
    
    console.log("[DEBUG API] Cloning roadmap request received:", { roadmapId, userId });
    
    if (!roadmapId || !userId) {
      console.error("[DEBUG API] Missing required parameters:", { roadmapId, userId });
      return NextResponse.json(
        { error: "Roadmap ID and user ID are required" }, 
        { status: 400 }
      );
    }
    
    // Get original roadmap
    try {
      const roadmapDoc = await getDoc(doc(db, "roadmaps", roadmapId));
      
      if (!roadmapDoc.exists()) {
        console.error("[DEBUG API] Roadmap not found:", { roadmapId });
        return NextResponse.json(
          { error: "Roadmap not found" }, 
          { status: 404 }
        );
      }
      
      const roadmapData = roadmapDoc.data();
      console.log("[DEBUG API] Original roadmap data:", { 
        roadmapId,
        isPublic: roadmapData.isPublic, 
        hasRoadmapField: !!roadmapData.roadmap,
        dataFields: Object.keys(roadmapData)
      });
      
      // Check if roadmap is public
      if (!roadmapData.isPublic) {
        console.error("[DEBUG API] Trying to clone a non-public roadmap:", { roadmapId });
        return NextResponse.json(
          { error: "This roadmap is not public and cannot be cloned" }, 
          { status: 403 }
        );
      }
      
      // Pregătim datele pentru clonare
      let roadmapToClone;
      
      // Verificăm dacă datele roadmap-ului sunt încapsulate într-un câmp "roadmap"
      if (roadmapData.roadmap && typeof roadmapData.roadmap === 'object') {
        roadmapToClone = {
          ...roadmapData,
          roadmap: {
            ...roadmapData.roadmap,
            title: roadmapData.roadmap.title || "Cloned Roadmap",
          }
        };
      } else {
        // Altfel, folosim direct datele din document
        roadmapToClone = {
          ...roadmapData,
          title: roadmapData.title || "Cloned Roadmap",
        };
      }
      
      // Actualizăm metadatele pentru noul proprietar
      const roadmapCopy = {
        ...roadmapToClone,
        userId: userId,                     // Set new owner
        originalRoadmapId: roadmapId,       // Reference to original
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: false                     // Cloned roadmap is not public by default
      };
      
      console.log("[DEBUG API] Preparing to save cloned roadmap:", {
        newOwner: userId,
        originalId: roadmapId,
        hasRoadmapField: 'roadmap' in roadmapCopy,
      });
      
      // Save new roadmap to Firestore
      const newRoadmapRef = await addDoc(collection(db, "roadmaps"), roadmapCopy);
      console.log("[DEBUG API] Cloned roadmap saved with ID:", newRoadmapRef.id);
      
      // Record cloning for statistics
      try {
        await addDoc(collection(db, "roadmap_clones"), {
          userId: userId,
          originalRoadmapId: roadmapId,
          newRoadmapId: newRoadmapRef.id,
          clonedAt: serverTimestamp()
        });
        console.log("[DEBUG API] Clone record created successfully");
      } catch (cloneRecordError) {
        console.error("[DEBUG API] Error creating clone record:", cloneRecordError);
        // Continuăm chiar dacă înregistrarea statisticii eșuează
      }
      
      // Pregătim răspunsul pentru client
      let responseRoadmap;
      
      // Verificăm dacă datele originale au un câmp roadmap sau nu
      if (roadmapData.roadmap && typeof roadmapData.roadmap === 'object') {
        responseRoadmap = { ...roadmapData.roadmap, id: newRoadmapRef.id };
      } else {
        responseRoadmap = { ...roadmapData, id: newRoadmapRef.id };
      }
      
      // Return new roadmap details
      return NextResponse.json({
        success: true,
        message: "Roadmap cloned successfully",
        roadmap: responseRoadmap
      });
    
    } catch (docError) {
      console.error("[DEBUG API] Error accessing Firestore document:", docError);
      return NextResponse.json(
        { error: "Database error", details: docError instanceof Error ? docError.message : String(docError) }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("[DEBUG API] Error cloning roadmap:", error);
    return NextResponse.json(
      { error: "Could not clone roadmap", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 