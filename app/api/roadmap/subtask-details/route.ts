import { NextRequest, NextResponse } from "next/server";
import { generateSubtaskDetails } from "@/lib/ai";

/**
 * POST: Generate detailed information for a roadmap subtask
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse the request body
    const { roadmapTitle, sectionTitle, subtaskTitle } = await req.json();
    
    // Log the request for debugging
    console.log(`[API] Generating details for subtask "${subtaskTitle}" in section "${sectionTitle}" of roadmap "${roadmapTitle}"`);
    
    // Validate required parameters
    if (!roadmapTitle || !sectionTitle || !subtaskTitle) {
      return NextResponse.json(
        { error: "Missing required parameters: roadmapTitle, sectionTitle, and subtaskTitle are required" }, 
        { status: 400 }
      );
    }

    // Call the AI function to generate details
    try {
      const subtaskDetails = await generateSubtaskDetails(roadmapTitle, sectionTitle, subtaskTitle);
      
      // Return the generated details
      return NextResponse.json({ data: subtaskDetails });
    } catch (error) {
      console.error("[API] Error generating subtask details:", error);
      return NextResponse.json(
        { error: "Failed to generate subtask details", details: error instanceof Error ? error.message : String(error) }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 