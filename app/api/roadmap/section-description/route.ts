import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST: Generează descrierea pentru o secțiune de roadmap
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse request body
    const { roadmapTitle, sectionTitle, experienceLevel } = await req.json();
    
    // Validare parametri necesari
    if (!roadmapTitle || !sectionTitle) {
      return NextResponse.json(
        { error: "Titlul roadmap-ului și titlul secțiunii sunt obligatorii" }, 
        { status: 400 }
      );
    }

    // Log request pentru debugging
    console.log(`[API] Generarea descrierii pentru secțiunea "${sectionTitle}" din roadmap-ul "${roadmapTitle}"`);
    
    try {
      // Generare descriere folosind AI
      const description = await generateSectionDescription(roadmapTitle, sectionTitle, experienceLevel || "beginner");
      
      // Return response
      return NextResponse.json({ 
        data: { description } 
      });
    } catch (error) {
      console.error("[API] Eroare la generarea descrierii secțiunii:", error);
      return NextResponse.json(
        { error: "Generarea descrierii secțiunii a eșuat", details: error instanceof Error ? error.message : String(error) }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API] Eroare la procesarea cererii:", error);
    return NextResponse.json(
      { error: "Eroare internă server", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * Generează descrierea pentru o secțiune de roadmap folosind OpenAI
 */
async function generateSectionDescription(
  roadmapTitle: string, 
  sectionTitle: string, 
  experienceLevel: string
): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an expert in creating educational section descriptions for learning roadmaps.
Your task is to create a short and useful description for a section of a learning roadmap.

The description must:
1. Clearly explain the purpose of the "${sectionTitle}" section in the context of the "${roadmapTitle}" roadmap
2. Provide a concise summary of what this section will cover
3. Mention the importance of this section in the overall learning process
4. Be written in a clear, concise but motivational style
5. Be approximately 100-200 words
6. Be in English
7. NOT include complex markdown formatting (no headings)

The output should be a concise paragraph, without headings, clear and informative about the section.`;

  const userPrompt = `Please create a concise description for the "${sectionTitle}" section of the "${roadmapTitle}" roadmap for ${experienceLevel} level (beginner/intermediate/advanced).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Răspuns gol de la OpenAI");
    }

    return content;
  } catch (error) {
    console.error("Eroare la generarea descrierii secțiunii cu OpenAI:", error);
    
    // Returnăm o descriere de rezervă în caz de eroare
    return `This "${sectionTitle}" section covers the essential concepts needed to progress in your ${roadmapTitle} learning journey. You will gain fundamental knowledge and practical skills that will enable you to move on to the next stages of the roadmap. Successfully completing this section will provide you with a solid foundation for exploring more advanced topics within the roadmap.`;
  }
} 