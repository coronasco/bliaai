import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Verificăm dacă avem cheia API
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured");
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("Generating roadmap with prompt:", prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a career guidance expert. Create detailed, structured learning roadmaps.
          Return the roadmap content directly in markdown format, without any JSON wrapping.
          The content should include:
          1. A clear introduction
          2. Multiple sections with subtasks
          3. Detailed descriptions for each section and subtask
          4. Learning objectives and outcomes
          5. Practical exercises where applicable
          
          Format the response in markdown with proper headings, lists, and emphasis.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    console.log("Received response from OpenAI:", response);

    // Returnăm răspunsul direct, fără JSON wrapping
    return NextResponse.json({
      data: {
        description: response
      }
    });
  } catch (error) {
    console.error("Error in generate route:", error);
    
    // Verificăm tipul erorii pentru a returna un mesaj mai specific
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate roadmap" },
      { status: 500 }
    );
  }
} 