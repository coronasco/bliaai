import { NextRequest, NextResponse } from "next/server";
import { generateSectionTutorial } from "@/lib/ai";
import { db } from '@/lib/firebaseAdmin';
import { RoadmapSubtask } from "@/lib/ai";

/**
 * POST: Generare tutorial pentru o secțiune de roadmap
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { 
      roadmapId,
      sectionId,
      sectionTitle,
      roadmapTitle,
      sectionDescription,
      subtasks
    } = await req.json();

    console.log(`[Section Tutorial] Request pentru: roadmapId=${roadmapId}, sectionId=${sectionId}, sectionTitle=${sectionTitle}`);

    // Verificări de bază
    if (!roadmapId || !sectionId || !sectionTitle || !roadmapTitle) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Verificăm subtask-urile primite
    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      return NextResponse.json({ 
        error: "At least one subtask is required" 
      }, { status: 400 });
    }

    // Rulăm generarea tutorialului
    try {
      console.time('tutorialGeneration');
      
      const tutorialContent = await generateSectionTutorial(
        roadmapTitle,
        sectionTitle,
        sectionDescription,
        subtasks as RoadmapSubtask[]
      );
      
      console.timeEnd('tutorialGeneration');
      
      if (!tutorialContent) {
        return NextResponse.json({ 
          error: "Failed to generate tutorial content" 
        }, { status: 500 });
      }
      
      // Salvăm tutorialul în Firestore
      if (roadmapId && sectionId) {
        try {
          const tutorialDocRef = db
            .collection('roadmaps')
            .doc(roadmapId)
            .collection('sections')
            .doc(sectionId)
            .collection('tutorial')
            .doc('content');
            
          await tutorialDocRef.set({
            content: tutorialContent,
            generatedAt: new Date().toISOString(),
            version: 1,
          }, { merge: true });
          
          console.log(`Tutorial salvat pentru secțiunea ${sectionId} din roadmap ${roadmapId}`);
        } catch (error) {
          console.error("Eroare la salvarea tutorialului:", error);
          // Continuăm să returnăm conținutul, chiar dacă salvarea a eșuat
        }
      }
      
      // Returnăm conținutul generat
      return NextResponse.json({ 
        content: tutorialContent,
        success: true 
      });
      
    } catch (error) {
      console.error("Error generating tutorial:", error);
      return NextResponse.json({ 
        error: "Failed to generate tutorial", 
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 