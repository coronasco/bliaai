import OpenAI from "openai";
import { dbAdmin } from "@/lib/firebaseAdmin";

export type LessonType = {
  title: string;
  type: "theory" | "practice" | "example";
  content: string;
};

export type TestType = {
  title: string;
  description: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  isPassed: boolean;
  attemptsCount: number;
};

export type SubTaskType = {
  title: string;
  description: string;
  lessons: LessonType[];
  finalTest: TestType;
  completed: boolean;
};

export type MainTaskType = {
  title: string;
  description: string;
  progress: number;
  subtasks: SubTaskType[];
};

export type CareerRoadmapType = {
  id: string;
  title: string;
  description: string;
  careerPath: string;
  sections: MainTaskType[];
  requiredSkills: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Tipul pentru documentele din baza de cunoștințe
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: string;
  references: string[];
  similarity?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Funcție pentru a căuta documentele relevante din Knowledge Base
 * @param query - Textul pentru care dorim să găsim documente relevante
 * @param limit - Numărul maxim de documente de returnat
 */
async function searchKnowledgeBase(query: string, limit: number = 5): Promise<KnowledgeDocument[]> {
  try {
    console.log(`Searching knowledge base for: "${query}", limit: ${limit}`);
    
    // Obținem toate documentele din Knowledge Base
    const snapshot = await dbAdmin.collection("knowledge_base").get();
    
    // Transformăm documentele pentru procesare
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      content: doc.data().content || "",
      title: doc.data().title || "",
      category: doc.data().category || "",
      tags: Array.isArray(doc.data().tags) ? doc.data().tags : [],
      difficulty: doc.data().difficulty || "beginner",
      references: Array.isArray(doc.data().references) ? doc.data().references : []
    })) as KnowledgeDocument[];
    
    console.log(`Retrieved ${documents.length} documents from knowledge base`);
    
    if (documents.length === 0) {
      console.log("Knowledge base is empty, returning empty results");
      return [];
    }
    
    // Construim embedding pentru query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536
    });
    
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
    
    // Pentru fiecare document, calculăm un scor de similaritate folosind embeddings
    const scoredDocuments = await Promise.all(documents.map(async (doc) => {
      // Combinăm titlul, conținutul și tag-urile pentru a crea un text reprezentativ
      const docText = `${doc.title} ${doc.category} ${doc.content} ${doc.tags.join(" ")}`;
      
      // Generăm embedding pentru document
      const docEmbeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: docText.substring(0, 8000), // Limităm la 8000 de caractere pentru a respecta limitele API
        dimensions: 1536
      });
      
      const docEmbedding = docEmbeddingResponse.data[0].embedding;
      
      // Calculăm similaritatea cosinus între query și document
      const similarity = calculateCosineSimilarity(queryEmbedding, docEmbedding);
      
      return {
        ...doc,
        similarity
      };
    }));
    
    // Sortăm documentele după scorul de similaritate și returnăm primele 'limit' documente
    const relevantDocuments = scoredDocuments
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, limit);
    
    console.log(`Found ${relevantDocuments.length} relevant documents`);
    return relevantDocuments;
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    // Returnăm un array gol în caz de eroare pentru a nu afecta funcționalitatea principală
    return [];
  }
}

/**
 * Calculează similaritatea cosinus între două vectori
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimensions");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generează un roadmap pentru o carieră folosind RAG și OpenAI
 */
export async function generateRoadmap(userPrompt: string) {
  try {
    console.log("Starting roadmap generation with RAG...");
    
    // Pas 1: Recuperăm documente relevante din Knowledge Base
    const relevantDocuments = await searchKnowledgeBase(userPrompt);
    
    // Pas 2: Construim contextul bazat pe documentele recuperate
    let knowledgeContext = "";
    
    if (relevantDocuments.length > 0) {
      knowledgeContext = `Here is relevant information from our knowledge base to help you create an accurate roadmap:\n\n`;
      
      relevantDocuments.forEach((doc, index) => {
        knowledgeContext += `Document ${index + 1} - "${doc.title}" (Category: ${doc.category}, Difficulty: ${doc.difficulty}):\n${doc.content}\n\n`;
      });
      
      // Adăugăm și tag-urile și referințele pentru context suplimentar
      knowledgeContext += "Additional context from knowledge base:\n";
      relevantDocuments.forEach((doc) => {
        if (doc.tags && doc.tags.length > 0) {
          knowledgeContext += `Tags for "${doc.title}": ${doc.tags.join(", ")}\n`;
        }
        
        if (doc.references && doc.references.length > 0) {
          knowledgeContext += `References for "${doc.title}":\n${doc.references.join("\n")}\n`;
        }
      });
      
      console.log(`Added ${relevantDocuments.length} documents to the context`);
    } else {
      console.log("No relevant documents found in knowledge base");
    }
    
    // Pas 3: Construim system prompt îmbunătățit cu informațiile din Knowledge Base
    const systemPrompt = `You are an AI that generates structured career roadmaps. Return JSON output only.
    
${knowledgeContext ? `Use the following information from our knowledge base to ensure your roadmap is accurate and comprehensive:\n\n${knowledgeContext}\n\n` : ""}

When generating the roadmap:
1. Structure the roadmap logically, progressing from foundational to advanced topics
2. Include accurate technical details based on industry standards
3. Align recommendations with current best practices in the field
4. Ensure skills, technologies, and tools mentioned are relevant and up-to-date
5. Avoid generating false or misleading information`;

    console.log("Created enhanced system prompt with knowledge base context");
    
    // Pas 4: Facem call-ul către API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });

    if (!response.choices || !response.choices[0]?.message?.content) {
      console.error("OpenAI response error", response);
      throw new Error("Invalid response from OpenAI");
    }

    let roadmap;
    try {
      roadmap = JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Error parsing AI response", error);
      throw new Error("Failed to parse AI response");
    }

    if (!roadmap || typeof roadmap !== 'object' || !roadmap.sections || !Array.isArray(roadmap.sections)) {
      console.error("Invalid roadmap format received", roadmap);
      return {
        id: "error",
        title: "Invalid Roadmap",
        description: "An error occurred while generating the roadmap.",
        careerPath: "Unknown",
        sections: [],
        requiredSkills: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Pas 5: Validăm și standardizăm structura roadmap-ului
    roadmap.sections = roadmap.sections.map((section: MainTaskType, index: number) => ({
      title: section.title || `Stage ${index + 1}`,
      description: section.description || "No description provided.",
      progress: section.progress || 0,
      subtasks: Array.isArray(section.subtasks) ? section.subtasks.map((subtask: SubTaskType, subIndex: number) => ({
        title: subtask.title || `Subtask ${subIndex + 1}`,
        description: subtask.description || "No description provided.",
        lessons: Array.isArray(subtask.lessons) ? subtask.lessons.map((lesson: LessonType, lessonIndex: number) => ({
          title: lesson.title || `Lesson ${lessonIndex + 1}`,
          type: lesson.type || "theory",
          content: lesson.content || "No content available."
        })) : [],
        finalTest: subtask.finalTest || {
          title: "Final Test",
          description: "No description provided.",
          questions: [],
          isPassed: false,
          attemptsCount: 0
        },
        completed: subtask.completed || false
      })) : []
    }));

    // Asigurăm-ne că avem un array de requiredSkills
    if (!roadmap.requiredSkills || !Array.isArray(roadmap.requiredSkills)) {
      roadmap.requiredSkills = [];
    }

    return roadmap;
  } catch (error) {
    console.error("Error in generateRoadmap:", error);
    // Returnăm un roadmap gol în caz de eroare
    return {
      id: "error",
      title: "Error Generating Roadmap",
      description: "An error occurred while generating the roadmap.",
      careerPath: "Unknown",
      sections: [],
      requiredSkills: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export default openai;