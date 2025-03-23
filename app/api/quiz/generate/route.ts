import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tipul pentru o întrebare de quiz
export interface QuizQuestionType {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

// Funcție pentru a genera quiz-ul folosind OpenAI
export async function POST(req: Request): Promise<Response> {
  try {
    // Extragem parametrii din cerere
    const { title, description, numberOfQuestions = 15 } = await req.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Construim prompt-ul pentru OpenAI
    const systemPrompt = `You are an expert tutor and quiz creator. Your task is to create a quiz about "${title}" 
    ${description ? `with the following detailed description: "${description}"` : ''}.
    
    Generate ${numberOfQuestions} questions about this topic with the following distribution:
    - 5 easy questions (30 seconds to answer)
    - 7 medium questions (45 seconds to answer)
    - 3 hard questions (60 seconds to answer)
    
    For each question:
    1. Provide the question text
    2. Provide 4 possible answers (one correct, three incorrect but plausible)
    3. Indicate which answer is correct (by index 0-3)
    4. Specify the difficulty level (easy, medium, or hard)
    
    The questions should be highly relevant to the specific topic and should test understanding, not just memorization.
    The easy questions should test basic understanding, medium questions should require deeper knowledge, 
    and hard questions should require advanced knowledge or application of concepts.
    
    IMPORTANT: Vary the position of the correct answer. Don't always put it at the same index.
    
    Return the result as valid JSON with this exact structure:
    {
      "questions": [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0,
          "difficulty": "easy",
          "timeLimit": 30
        },
        ... more questions ...
      ]
    }`;
    
    // Apelăm OpenAI pentru a genera întrebările
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",  // Sau alt model adecvat
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a quiz about ${title}${description ? ` based on this description: ${description}` : ''}. Make sure to vary the position of the correct answer (correctAnswerIndex) for each question! Don't always use index 0.` }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parsăm și validăm rezultatul
    const content = response.choices[0]?.message.content;
    if (!content) {
      return NextResponse.json({ error: 'Failed to generate quiz content' }, { status: 500 });
    }

    try {
      const quizData = JSON.parse(content);
      
      // Validăm structura datelor
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz data structure');
      }
      
      // Verificăm și randomizăm și mai mult răspunsurile dacă e nevoie
      const processedQuestions = quizData.questions.map((q: QuizQuestionType) => {
        // Validare de bază
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
            typeof q.correctAnswerIndex !== 'number' || !q.difficulty || !q.timeLimit) {
          throw new Error('Invalid question structure');
        }
        
        // Dacă AI-ul tot a generat prea multe răspunsuri la aceeași poziție,
        // randomizăm și noi manual unele dintre ele
        if (Math.random() > 0.5) {
          const correctOption = q.options[q.correctAnswerIndex];
          const newOptions = [...q.options];
          
          // Amestecă opțiunile
          for (let i = newOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newOptions[i], newOptions[j]] = [newOptions[j], newOptions[i]];
          }
          
          // Găsește noul index al răspunsului corect
          const newCorrectIndex = newOptions.findIndex(opt => opt === correctOption);
          
          // Actualizează întrebarea
          return {
            ...q,
            options: newOptions,
            correctAnswerIndex: newCorrectIndex
          };
        }
        
        return q;
      });
      
      return NextResponse.json({ questions: processedQuestions });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError, content);
      return NextResponse.json({ error: 'Failed to parse quiz data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
