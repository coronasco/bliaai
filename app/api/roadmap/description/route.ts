import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST: Generează descrierea pentru un roadmap
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse request body
    const { title, experienceLevel } = await req.json();
    
    // Validare parametri necesari
    if (!title) {
      return NextResponse.json(
        { error: "Titlul este obligatoriu" }, 
        { status: 400 }
      );
    }

    // Log request pentru debugging
    console.log(`[API] Generarea descrierii pentru roadmap-ul: "${title}"`);
    
    try {
      // Generare descriere folosind AI
      const description = await generateRoadmapDescription(title, experienceLevel || "beginner");
      
      // Return response
      return NextResponse.json({ 
        data: { description } 
      });
    } catch (error) {
      console.error("[API] Eroare la generarea descrierii:", error);
      return NextResponse.json(
        { error: "Generarea descrierii a eșuat", details: error instanceof Error ? error.message : String(error) }, 
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
 * Generează descrierea pentru un roadmap folosind OpenAI
 */
async function generateRoadmapDescription(title: string, experienceLevel: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an expert in creating educational roadmap descriptions.
Your task is to create a detailed markdown description for a learning roadmap.

The description must:
1. Start with an H1 heading with the roadmap title
2. Provide a clear, motivational introduction
3. Explain why this subject is important to learn
4. Mention what the user will learn
5. Be structured with appropriate headings (h1, h2)
6. Include a "What You'll Learn" section with bullet points
7. Include a "Prerequisites" section (if applicable)
8. Be properly formatted in markdown
9. Be written in an engaging, motivational style
10. Be approximately 300-500 words in total
11. Be in English

The output should be just the markdown content, properly formatted and ready for display.`;

  const userPrompt = `Please create a comprehensive description for a roadmap about "${title}" for ${experienceLevel} level (beginner/intermediate/advanced).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Răspuns gol de la OpenAI");
    }

    return content;
  } catch (error) {
    console.error("Eroare la generarea descrierii cu OpenAI:", error);
    
    // Returnăm o descriere de rezervă în caz de eroare
    return `# ${title}\n\nThis comprehensive roadmap will guide you through mastering ${title}. Follow these steps carefully to build your skills from the ground up.\n\n## What You'll Learn\n\n- Core fundamentals and theory\n- Practical techniques and best practices\n- Advanced concepts for real-world applications\n- Tips from industry experts\n\n## Prerequisites\n\nBasic understanding of the subject is helpful but not required. A growth mindset and dedication will take you far!`;
  }
} 