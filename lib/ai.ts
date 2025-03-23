import { dbAdmin } from "@/lib/firebaseAdmin";
import openai from "@/lib/openai";

export interface RoadmapSubtask {
  title: string;
  description: string;
  completed: boolean;
  prerequisites?: string[];
  resources?: Array<{
    title: string;
    url: string;
    type: string;
    description: string;
  }>;
  practicalExercises?: string[];
  validationCriteria?: string[];
}

export interface RoadmapSection {
  title: string;
  description: string;
  progress: number;
  subtasks: RoadmapSubtask[];
  dependencies?: string[];
}

export interface RoadmapData {
  title: string;
  description: string;
  requiredSkills: string[];
  sections: RoadmapSection[];
}

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

export async function fetchRelevantKnowledge(topic: string): Promise<KnowledgeDocument[]> {
  try {
    console.log(`Fetching relevant knowledge for: "${topic}"`);
    const snapshot = await dbAdmin.collection("knowledge_base").get();

    if (snapshot.empty) {
      console.log("Knowledge base is empty");
      return [];
    }

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

    const lowercaseTopic = topic.toLowerCase();
    const filtered = documents.filter(doc => {
      const text = `${doc.title} ${doc.category} ${doc.tags.join(" ")}`.toLowerCase();
      return text.includes(lowercaseTopic);
    });

    console.log(`Filtered ${filtered.length} documents based on topic relevance`);
    return filtered;
  } catch (error) {
    console.error("Error fetching relevant knowledge:", error);
    return [];
  }
}

// Definim interfețe pentru structurile folosite în funcțiile noastre
interface ParsedRoadmapSection {
  title: string;
  description?: string;
  progress?: number;
  subtasks: ParsedRoadmapSubtask[];
  dependencies?: string[];
}

interface ParsedRoadmapSubtask {
  title: string;
  description?: string;
  completed?: boolean;
  id?: string;
}

interface ParsedResource {
  title?: string;
  url?: string;
  type?: string;
  description?: string;
}

export async function generateRoadmapFromUserInput({
  careerTitle,
  careerField,
  experienceLevel,
  careerDescription,
  timeframe,
  learningFocus,
  currentSkills,
  preferredResources
}: {
  careerTitle: string;
  careerField: string;
  experienceLevel: string;
  careerDescription: string;
  timeframe?: string;
  learningFocus?: string;
  currentSkills?: string;
  preferredResources?: string[];
}): Promise<RoadmapData> {
  const topic = `${careerTitle} in ${careerField}`;
  const knowledge = await fetchRelevantKnowledge(topic);

  const topKnowledge = knowledge.slice(0, 3).map((doc, i) => `Doc ${i + 1}: ${doc.title}\n${doc.content}`).join("\n\n");

  const preferencesBlock = `Experience level: ${experienceLevel}.
Learning timeframe: ${timeframe || "3-6 months"}.
Learning approach: ${learningFocus || "balanced"}.
${currentSkills ? `Current skills: ${currentSkills}` : ""}
Preferred resources: ${(preferredResources || ["videos", "projects", "communities", "tutorials", "mentorship"]).join(", ")}.`;

  const systemMessage = `You are an AI that generates structured career roadmaps in JSON.
Requirements:
- 4 to 6 sections (custom titles)
- Each section must have 3+ subtasks
- Each subtask includes title, markdown description (200+ words), prerequisites, 5+ resources, exercises, validation
- Use proper markdown in descriptions
- Return ONLY valid JSON object, nothing else.`;

  const finalPrompt = `Create a ${experienceLevel} roadmap for "${topic}".
User goals: ${careerDescription || "not specified"}

${preferencesBlock}

${topKnowledge ? `Use ONLY this knowledge:\n${topKnowledge}` : ""}`;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      });

      let content = response.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("Empty response from OpenAI");

      // Remove non-JSON prefix/suffix if exists
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");
      if (firstBrace > 0 || lastBrace !== content.length - 1) {
        content = content.slice(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(content);

      if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length < 4) {
        throw new Error(`AI returned ${parsed.sections?.length || 0} sections (minimum 4 expected)`);
      }

      const validSections = parsed.sections.every((section: ParsedRoadmapSection) =>
        Array.isArray(section.subtasks) && section.subtasks.length >= 3
      );

      if (!validSections) {
        throw new Error("One or more sections have less than 3 subtasks");
      }

      return {
        title: parsed.title || careerTitle,
        description: parsed.description || careerDescription,
        requiredSkills: parsed.requiredSkills || [],
        sections: parsed.sections
      };
    } catch (error) {
      console.warn(`Retry ${attempt + 1}/${maxRetries} failed:`, (error as Error).message);
      attempt++;
    }
  }

  throw new Error(`AI failed to generate a valid roadmap after ${maxRetries} retries.`);
}

/**
 * Funcție care generează doar structura generală a roadmap-ului (Faza 1)
 * Returnează un JSON cu 4-6 secțiuni, fiecare cu 3-6 subtasks
 */
export async function generateRoadmapStructure(careerTitle: string): Promise<{
  title: string;
  requiredSkills: string[];
  sections: {
    title: string;
    progress: number;
    subtasks: {
      title: string;
      completed: boolean;
      id?: string;
    }[];
  }[];
}> {
  const systemMessage = `You are an expert roadmap architect. Generate a career roadmap JSON with 4–6 sections and 3–6 subtasks per section. 
Each subtask must only include a title and "completed: false".

NO markdown, NO descriptions, NO resources. Only clean JSON that follows this structure exactly:
{
  "title": "Career Title",
  "requiredSkills": [],
  "sections": [
    {
      "title": "Section Title",
      "progress": 0,
      "subtasks": [
        { "title": "Subtask Title", "completed": false, "id": "id" },
        ...
      ]
    },
    ...
  ]
}`;

  const userPrompt = `Based on the topic "${careerTitle}", generate a career roadmap JSON with 4–6 sections and 3–6 subtasks per section. Each subtask must only include a title and "completed": false.`;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      });

      const content = response.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("Empty response from OpenAI");

      // Verificăm și curățăm JSON-ul
      const parsed = JSON.parse(content);

      // Validăm structura conform cerințelor
      if (!parsed.title) parsed.title = careerTitle;
      if (!parsed.requiredSkills || !Array.isArray(parsed.requiredSkills)) {
        parsed.requiredSkills = [];
      }
      
      if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length < 4 || parsed.sections.length > 6) {
        throw new Error(`AI returned ${parsed.sections?.length || 0} sections (minimum 4, maximum 6 expected)`);
      }

      // Validăm secțiunile
      parsed.sections = parsed.sections.slice(0, 6).map((section: ParsedRoadmapSection) => {
        if (!section.subtasks || !Array.isArray(section.subtasks) || section.subtasks.length < 3) {
          throw new Error("One or more sections have less than 3 subtasks");
        }
        
        // Asigurăm-ne că fiecare secțiune are structura corectă
        return {
          title: section.title || "Section",
          progress: 0,
          subtasks: section.subtasks.slice(0, 6).map((subtask: ParsedRoadmapSubtask) => ({
            title: subtask.title || "Subtask",
            completed: false,
            id: subtask.id || ""
          }))
        };
      });

      return parsed;
    } catch (error) {
      console.warn(`Retry ${attempt + 1}/${maxRetries} failed for roadmap structure:`, (error as Error).message);
      attempt++;
      
      if (attempt === maxRetries) {
        // Returnăm o structură minimă validă dacă toate încercările eșuează
        return {
          title: careerTitle,
          requiredSkills: [],
          sections: [
            {
              title: "Foundation",
              progress: 0,
              subtasks: [
                { title: "Basics", completed: false, id: "1" },
                { title: "Core Concepts", completed: false, id: "2" },
                { title: "Fundamentals", completed: false, id: "3" }
              ]
            },
            {
              title: "Intermediate",
              progress: 0,
              subtasks: [
                { title: "Advanced Techniques", completed: false, id: "4" },
                { title: "Best Practices", completed: false, id: "5" },
                { title: "Common Patterns", completed: false, id: "6" }
              ]
            },
            {
              title: "Advanced",
              progress: 0,
              subtasks: [
                { title: "Expert Skills", completed: false, id: "7"  },
                { title: "Optimization", completed: false, id: "8" },
                { title: "Mastery", completed: false, id: "9" }
              ]
            },
            {
              title: "Specialization",
              progress: 0,
              subtasks: [
                { title: "Niche Skills", completed: false },
                { title: "Industry Applications", completed: false },
                { title: "Specialized Tools", completed: false }
              ]
            }
          ]
        };
      }
    }
  }

  throw new Error(`AI failed to generate a valid roadmap structure after ${maxRetries} retries.`);
}

/**
 * Funcție care generează detalii pentru un subtask specific (Faza 2)
 * Returnează un obiect cu descriere, resurse, exerciții, criterii de validare și prerequisituri
 */
export async function generateSubtaskDetails(
  roadmapTitle: string, 
  sectionTitle: string, 
  subtaskTitle: string
): Promise<{
  description: string;
  resources: Array<{
    title: string;
    url: string;
    type: string;
    description: string;
  }>;
  practicalExercises: string[];
  validationCriteria: string[];
  prerequisites: string[];
}> {
  const systemMessage = `You are an expert educational content creator. Generate detailed information for the subtask "${subtaskTitle}" 
which is part of the section "${sectionTitle}" in the "${roadmapTitle}" career roadmap.

Your response must be a JSON object with the following structure:
{
  "description": "Detailed markdown description (minimum 200 words)",
  "resources": [
    {
      "title": "Resource Title",
      "url": "https://example.com",
      "type": "video|article|course|book|tool",
      "description": "Brief description of this resource"
    },
    ... (at least 5 resources)
  ],
  "practicalExercises": [
    "Exercise 1 description",
    ... (at least 3 exercises)
  ],
  "validationCriteria": [
    "Criterion 1",
    ... (at least 3 criteria)
  ],
  "prerequisites": [
    "Prerequisite 1",
    ... (list of skills or knowledge required)
  ]
}

Ensure the description is comprehensive, detailed, and formatted in markdown with proper headings, bullet points, and emphasis where appropriate.
The resources must be real, accurate URLs to quality learning materials. Include a diverse mix of resource types.
The practical exercises should be challenging but achievable, with clear objectives.
The validation criteria should help the user assess their mastery of the subtask.`;

  const userPrompt = `Generate detailed information for the subtask "${subtaskTitle}" which is part of the section "${sectionTitle}" in the "${roadmapTitle}" career roadmap.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });

    const content = response.choices?.[0]?.message?.content?.trim();

    if (!content) throw new Error("Empty response from OpenAI");

    // Parsăm și validăm response-ul
    const parsed = JSON.parse(content);

    // Validări de bază
    if (!parsed.description || parsed.description.length < 100) {
      parsed.description = `# ${subtaskTitle}\n\nThis is a placeholder description for the subtask "${subtaskTitle}" in the section "${sectionTitle}". The AI-generated content did not meet the minimum requirements. Please check back later for detailed content.`;
    }

    if (!parsed.resources || !Array.isArray(parsed.resources) || parsed.resources.length < 5) {
      // Generăm resurse placeholder
      parsed.resources = [
        {
          title: "Official Documentation",
          url: "https://example.com/docs",
          type: "documentation",
          description: "Official documentation for this subject"
        },
        {
          title: "Beginner Tutorial",
          url: "https://example.com/tutorial",
          type: "article",
          description: "Step-by-step tutorial for beginners"
        },
        {
          title: "Video Course",
          url: "https://example.com/course",
          type: "video",
          description: "Comprehensive video course"
        },
        {
          title: "Practice Exercises",
          url: "https://example.com/exercises",
          type: "exercise",
          description: "Interactive exercises to practice"
        },
        {
          title: "Community Forum",
          url: "https://example.com/forum",
          type: "community",
          description: "Community forum for questions and answers"
        }
      ];
    } else {
      // Asigurăm-ne că toate resursele au formatarea corectă
      parsed.resources = parsed.resources.map((resource: ParsedResource) => ({
        title: resource.title || "Resource",
        url: resource.url || "https://example.com",
        type: resource.type || "article",
        description: resource.description || "Resource description"
      }));
    }

    if (!parsed.practicalExercises || !Array.isArray(parsed.practicalExercises) || parsed.practicalExercises.length < 3) {
      parsed.practicalExercises = [
        `Build a simple project that demonstrates your understanding of ${subtaskTitle}`,
        `Create a tutorial explaining the key concepts of ${subtaskTitle}`,
        `Solve 3 practice problems related to ${subtaskTitle}`
      ];
    }

    if (!parsed.validationCriteria || !Array.isArray(parsed.validationCriteria) || parsed.validationCriteria.length < 3) {
      parsed.validationCriteria = [
        `Can explain the core concepts of ${subtaskTitle} clearly`,
        `Can implement solutions using ${subtaskTitle} techniques`,
        `Can troubleshoot common issues related to ${subtaskTitle}`
      ];
    }

    if (!parsed.prerequisites || !Array.isArray(parsed.prerequisites)) {
      parsed.prerequisites = [];
    }

    return parsed;
  } catch (error) {
    console.error("Error generating subtask details:", error);
    
    // Returnăm un obiect minimal valid în caz de eroare
    return {
      description: `# ${subtaskTitle}\n\nThis is a placeholder description for the subtask "${subtaskTitle}" in the section "${sectionTitle}". The AI-generated content could not be created due to an error. Please try again later.`,
      resources: [
        {
          title: "Official Documentation",
          url: "https://example.com/docs",
          type: "documentation",
          description: "Official documentation for this subject"
        },
        {
          title: "Beginner Tutorial",
          url: "https://example.com/tutorial",
          type: "article",
          description: "Step-by-step tutorial for beginners"
        },
        {
          title: "Video Course",
          url: "https://example.com/course",
          type: "video",
          description: "Comprehensive video course"
        },
        {
          title: "Practice Exercises",
          url: "https://example.com/exercises",
          type: "exercise",
          description: "Interactive exercises to practice"
        },
        {
          title: "Community Forum",
          url: "https://example.com/forum",
          type: "community",
          description: "Community forum for questions and answers"
        }
      ],
      practicalExercises: [
        `Build a simple project that demonstrates your understanding of ${subtaskTitle}`,
        `Create a tutorial explaining the key concepts of ${subtaskTitle}`,
        `Solve 3 practice problems related to ${subtaskTitle}`
      ],
      validationCriteria: [
        `Can explain the core concepts of ${subtaskTitle} clearly`,
        `Can implement solutions using ${subtaskTitle} techniques`,
        `Can troubleshoot common issues related to ${subtaskTitle}`
      ],
      prerequisites: []
    };
  }
}

/**
 * Generează un tutorial complet în format markdown pentru o secțiune a roadmap-ului
 * @param roadmapTitle Titlul roadmap-ului
 * @param sectionTitle Titlul secțiunii
 * @param sectionDescription Descrierea secțiunii (opțional)
 * @param subtasks Lista de subtask-uri din secțiune (opțional)
 * @returns Tutorialul generat în format markdown
 */
export async function generateSectionTutorial(
  roadmapTitle: string,
  sectionTitle: string,
  sectionDescription?: string,
  subtasks?: RoadmapSubtask[]
): Promise<string> {
  // Pregătim prompt-ul pentru AI
  const systemPrompt = `You are an expert educational content creator specializing in creating comprehensive, well-structured tutorials. 
Your task is to create a complete markdown tutorial for a specific section of a learning roadmap.

The tutorial should:
1. Start with a clear introduction to the topic
2. Be comprehensive and cover all important aspects of the subject
3. Include code examples where relevant
4. Be structured with proper headings (h1, h2, h3)
5. Include practical tips and best practices
6. Be written in an engaging, clear style
7. End with a summary and next steps
8. Be formatted in proper markdown with syntax highlighting for code blocks
9. If relevant, include diagrams or visual explanations described in markdown

The output should ONLY be the markdown content, properly formatted and ready to display.`;

  // Construim prompt-ul pentru utilizator cu informațiile disponibile
  let userPrompt = `Please create a comprehensive tutorial for the section "${sectionTitle}" in the roadmap "${roadmapTitle}".`;
  
  if (sectionDescription) {
    userPrompt += `\n\nSection description: ${sectionDescription}`;
  }
  
  if (subtasks && subtasks.length > 0) {
    userPrompt += `\n\nThis section includes the following subtasks that should be covered in the tutorial:`;
    subtasks.forEach((subtask, index) => {
      userPrompt += `\n${index + 1}. ${subtask.title}`;
      if (subtask.description) {
        userPrompt += ` - ${subtask.description}`;
      }
    });
  }
  
  userPrompt += `\n\nPlease provide a complete, well-structured markdown tutorial that covers all these aspects in depth.`;
  
  try {
    // Obținem răspunsul de la OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    // Extragem conținutul în markdown
    const markdownContent = response.choices[0]?.message?.content?.trim() || "";
    
    if (!markdownContent) {
      throw new Error("Nu s-a putut genera tutorialul pentru secțiune");
    }
    
    return markdownContent;
    
  } catch (error) {
    console.error("Error generating section tutorial:", error);
    throw new Error(`Failed to generate tutorial: ${error instanceof Error ? error.message : String(error)}`);
  }
}
