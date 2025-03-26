import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST: Generează detalii pentru un subtask din roadmap
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse the request body
    const { roadmapTitle, sectionTitle, subtaskTitle } = await req.json();
    
    // Log the request for debugging
    console.log(`[API] Generarea detaliilor pentru subtask-ul "${subtaskTitle}" din secțiunea "${sectionTitle}" a roadmap-ului "${roadmapTitle}"`);
    
    // Validate required parameters
    if (!roadmapTitle || !sectionTitle || !subtaskTitle) {
      return NextResponse.json(
        { error: "Parametrii obligatorii lipsă: roadmapTitle, sectionTitle, și subtaskTitle sunt necesari" }, 
        { status: 400 }
      );
    }

    // Call the AI function to generate details
    try {
      const subtaskDetails = await generateSubtaskDetails(roadmapTitle, sectionTitle, subtaskTitle);
      
      // Return the generated details
      return NextResponse.json({ data: subtaskDetails });
    } catch (error) {
      console.error("[API] Eroare la generarea detaliilor de subtask:", error);
      return NextResponse.json(
        { error: "Generarea detaliilor de subtask a eșuat", details: error instanceof Error ? error.message : String(error) }, 
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
 * Generează detalii pentru un subtask folosind OpenAI
 */
async function generateSubtaskDetails(
  roadmapTitle: string, 
  sectionTitle: string, 
  subtaskTitle: string
): Promise<{
  description: string;
  resources?: Array<{
    title: string;
    url: string;
    type: string;
    description: string;
  }>;
  practicalExercises?: string[];
  validationCriteria?: string[];
  prerequisites?: string[];
}> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an expert educational content creator. Generate detailed information for the subtask "${subtaskTitle}" which is part of the section "${sectionTitle}" in the "${roadmapTitle}" career roadmap.

  Generate detailed, well-structured, and educational content in markdown format.
  
  The content must:
  1. Start with an H1 heading with the subtask title
  2. Provide a clear conceptual introduction
  3. Explain key concepts with details and concrete examples
  4. Include relevant code examples or practices (if applicable)
  5. Be structured with appropriate headings (h1, h2, h3)
  6. Include a "Learning Resources" section with links
  7. Include a "Practical Exercise" section with an application task
  8. Be properly formatted in clear markdown
  9. Be written in a didactic, clear, and engaging style
  10. Be approximately 500-800 words
  11. Be in English
  
  The output should be just the markdown content, properly formatted and ready for display.`;

  const userPrompt = `Please create detailed and educational content for the "${subtaskTitle}" subtask which is part of the "${sectionTitle}" section of the "${roadmapTitle}" roadmap.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Răspuns gol de la OpenAI");
    }

    // Returnăm structura de date cu descrierea generată
    return {
      description: content,
      resources: [
        {
          title: "Documentație oficială",
          url: "https://example.com",
          type: "documentation",
          description: "Documentația oficială pentru acest subiect"
        },
        {
          title: "Tutorial recomandat",
          url: "https://example.com/tutorial",
          type: "tutorial",
          description: "Un tutorial comprehensiv pentru înțelegerea acestui subiect"
        }
      ],
      practicalExercises: [
        `Creează un proiect simplu care demonstrează înțelegerea conceptului ${subtaskTitle}`,
        `Implementează o soluție pentru ${subtaskTitle} și testează funcționalitatea`,
        `Aplică cunoștințele învățate într-un proiect real din portofoliul tău`
      ],
      validationCriteria: [
        `Poți explica clar conceptele cheie din ${subtaskTitle}`,
        `Poți implementa soluții folosind tehnicile din ${subtaskTitle}`,
        `Poți identifica și rezolva probleme comune legate de ${subtaskTitle}`
      ],
      prerequisites: [`Cunoștințe de bază în ${roadmapTitle}`]
    };
  } catch (error) {
    console.error("Eroare la generarea detaliilor de subtask cu OpenAI:", error);
    
    // Returnăm date de rezervă în caz de eroare
    return {
      description: `# ${subtaskTitle}\n\n## Introduction\n\nIn this section, you'll learn about ${subtaskTitle}, which is an essential part of ${sectionTitle}.\n\n## Key Concepts\n\n- Understanding core principles\n- Practical applications\n- Avoiding common mistakes\n\n## Learning Resources\n\n- [Official Documentation](https://example.com)\n- [Recommended Tutorial](https://example.com/tutorial)\n- [Practice Exercises](https://example.com/exercises)\n\n## Practical Exercise\n\nTry implementing what you've learned in a small project. This will reinforce your understanding and give you practical experience.`,
      resources: [
        {
          title: "Official Documentation",
          url: "https://example.com",
          type: "documentation",
          description: "Official documentation for this topic"
        }
      ],
      practicalExercises: [
        `Create a simple project that demonstrates your understanding of ${subtaskTitle}`
      ],
      validationCriteria: [
        `Can clearly explain key concepts of ${subtaskTitle}`,
        `Can implement solutions using ${subtaskTitle} techniques`
      ],
      prerequisites: [`Basic knowledge of ${roadmapTitle}`]
    };
  }
} 