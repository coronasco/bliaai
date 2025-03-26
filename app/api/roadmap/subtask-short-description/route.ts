import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST: Generate a short description for a roadmap subtask
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse the request body
    const { roadmapTitle, sectionTitle, subtaskTitle } = await req.json();
    
    // Log the request for debugging
    console.log(`[API] Generating short description for subtask "${subtaskTitle}" in section "${sectionTitle}" of roadmap "${roadmapTitle}"`);
    
    // Validate required parameters
    if (!roadmapTitle || !sectionTitle || !subtaskTitle) {
      return NextResponse.json(
        { error: "Missing required parameters: roadmapTitle, sectionTitle, and subtaskTitle are required" }, 
        { status: 400 }
      );
    }

    // Call the AI function to generate description
    try {
      const description = await generateSubtaskShortDescription(roadmapTitle, sectionTitle, subtaskTitle);
      
      // Return the generated description
      return NextResponse.json({ data: { description } });
    } catch (error) {
      console.error("[API] Error generating subtask short description:", error);
      return NextResponse.json(
        { error: "Failed to generate subtask description", details: error instanceof Error ? error.message : String(error) }, 
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

/**
 * Generate a short description for a roadmap subtask using OpenAI
 */
async function generateSubtaskShortDescription(
  roadmapTitle: string, 
  sectionTitle: string, 
  subtaskTitle: string
): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an expert educational content creator. 
Generate a concise, one-paragraph description (1-2 sentences) for the subtask "${subtaskTitle}" 
which is part of the section "${sectionTitle}" in the "${roadmapTitle}" roadmap.

The description should:
1. Be brief but informative (maximum 200 characters)
2. Explain what the learner will accomplish in this subtask
3. Be written in a clear, professional style
4. Be in English
5. Not use complex technical jargon
6. Not include markdown formatting

The output should be just a single, concise paragraph.`;

  const userPrompt = `Please create a short, concise description for the "${subtaskTitle}" subtask which is part of the "${sectionTitle}" section in the "${roadmapTitle}" roadmap.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return content;
  } catch (error) {
    console.error("Error generating subtask description with OpenAI:", error);
    
    // Return a fallback description in case of error
    return `Learn key concepts and practical applications of ${subtaskTitle} to enhance your ${roadmapTitle} skills.`;
  }
} 