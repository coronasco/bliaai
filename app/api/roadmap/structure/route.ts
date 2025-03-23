import { NextRequest, NextResponse } from "next/server";
import { generateRoadmapStructure } from "@/lib/ai";

/**
 * POST: Generate a roadmap structure based on a career title
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse the request body
    const { careerTitle } = await req.json();
    
    // Validate required parameters
    if (!careerTitle) {
      return NextResponse.json(
        { error: "Career title is required" }, 
        { status: 400 }
      );
    }

    // Log the request
    console.log(`[API] Generating roadmap structure for career: "${careerTitle}"`);
    
    try {
      // Generate roadmap structure
      const roadmapStructure = await generateRoadmapStructure(careerTitle);
      
      // Return the generated structure
      return NextResponse.json({ data: roadmapStructure });
    } catch (error) {
      console.error("[API] Error generating roadmap structure:", error);
      return NextResponse.json(
        { error: "Failed to generate roadmap structure", details: error instanceof Error ? error.message : String(error) }, 
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