"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FaCheckCircle, FaGraduationCap } from "react-icons/fa";
import QuizModal, { QuizQuestion, QuizSubtask } from "./QuizModal";

interface QuizControllerProps {
  sectionIndex: number;
  subtaskIndex: number;
  title: string;
  description?: string;
  completed: boolean;
  onToggleComplete: (sectionIndex: number, subtaskIndex: number, forceComplete?: boolean) => void;
}

const QuizController: React.FC<QuizControllerProps> = ({
  sectionIndex,
  subtaskIndex,
  title,
  description,
  completed,
  onToggleComplete
}) => {
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  // Function to open the quiz modal
  const openQuiz = () => {
    setShowQuizModal(true);
  };
  
  // Function to close the quiz modal
  const closeQuiz = () => {
    setShowQuizModal(false);
  };
  
  // Function to handle quiz completion
  const handleQuizComplete = (passed: boolean) => {
    // If user passed the quiz, mark the subtask as completed
    if (passed) {
      onToggleComplete(sectionIndex, subtaskIndex, true);
    }
  };
  
  // Function to generate quiz questions using AI
  const generateQuizQuestions = async (subtaskTitle: string, subtaskDescription?: string): Promise<QuizQuestion[]> => {
    try {
      console.log(`Generating quiz for: ${subtaskTitle}`);
      console.log(`Using description: ${subtaskDescription?.substring(0, 100)}...`);
      
      // Show loading state
      toast.info("Generating quiz questions using AI...");
      
      try {
        // Make a real API call to OpenAI to generate questions
        const response = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: subtaskTitle, 
            description: subtaskDescription,
            numberOfQuestions: 15  // Generate 15 questions (5 easy, 7 medium, 3 hard)
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error('No questions returned from API');
        }
        
        return data.questions;
      } catch (apiError) {
        console.error("API error:", apiError);
        
        // Fall back to template-based questions if the API fails
        toast.error("AI service unavailable. Using template-based questions instead.");
        
        // Extract keywords from the title and description
        const keywords = extractKeywords(subtaskTitle, subtaskDescription);
        
        // Generate questions with varying difficulty
        const generatedQuestions: QuizQuestion[] = [];
        
        // Generate 5 easy questions
        for (let i = 0; i < 5; i++) {
          generatedQuestions.push(generateQuestionForTopic(subtaskTitle, 'easy', i, keywords));
        }
        
        // Generate 7 medium questions
        for (let i = 0; i < 7; i++) {
          generatedQuestions.push(generateQuestionForTopic(subtaskTitle, 'medium', i + 5, keywords));
        }
        
        // Generate 3 hard questions
        for (let i = 0; i < 3; i++) {
          generatedQuestions.push(generateQuestionForTopic(subtaskTitle, 'hard', i + 12, keywords));
        }
        
        return generatedQuestions;
      }
    } catch (error) {
      console.error("Error generating quiz questions:", error);
      toast.error("Failed to generate quiz questions");
      return [];
    }
  };
  
  // Extract keywords from title and description
  const extractKeywords = (title: string, description?: string): string[] => {
    const combinedText = `${title} ${description || ''}`.toLowerCase();
    
    // Common words to filter out
    const stopWords = ['and', 'the', 'is', 'in', 'to', 'of', 'a', 'for', 'with', 'on', 'as'];
    
    // Extract words and filter out common words and short words
    return combinedText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !stopWords.includes(word)
      );
  };
  
  // Generate a question for a specific topic
  const generateQuestionForTopic = (
    topic: string, 
    difficulty: 'easy' | 'medium' | 'hard', 
    index: number,
    keywords: string[]
  ): QuizQuestion => {
    // Get a question template based on difficulty
    const template = getQuestionTemplate(difficulty, topic, keywords);
    
    // Set options and correct answer
    const options = getOptionsForTemplate(template, difficulty);
    const correctAnswerIndex = Math.floor(Math.random() * 4);
    
    // Ensure the correct answer makes sense
    const finalOptions = adjustOptionsForCorrectAnswer(options, correctAnswerIndex, template.correctAnswer);
    
    // Set time limit based on difficulty
    const timeLimit = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 60;
    
    return {
      question: template.question,
      options: finalOptions,
      correctAnswerIndex: correctAnswerIndex,
      difficulty,
      timeLimit
    };
  };
  
  // Get question template based on difficulty
  const getQuestionTemplate = (
    difficulty: 'easy' | 'medium' | 'hard', 
    topic: string,
    keywords: string[]
  ): { question: string; correctAnswer: string } => {
    // Use a keyword if available, otherwise use the topic
    const keyword = keywords.length > 0 
      ? keywords[Math.floor(Math.random() * keywords.length)] 
      : topic;
    
    // Templates for different difficulties
    const templates = {
      easy: [
        {
          question: `Which of the following best describes the concept of ${keyword} in ${topic}?`,
          correctAnswer: `A systematic approach to handling ${keyword} in software development`
        },
        {
          question: `What is the primary purpose of using ${keyword} in ${topic}?`,
          correctAnswer: `To improve code maintainability and reduce errors`
        },
        {
          question: `In ${topic}, which statement about ${keyword} is correct?`,
          correctAnswer: `${capitalizeFirstLetter(keyword)} helps organize code into reusable components`
        },
        {
          question: `Which tool is commonly used for ${keyword} in ${topic}?`,
          correctAnswer: `The standard library functions specific to ${keyword}`
        },
        {
          question: `What basic principle applies to ${keyword} when working with ${topic}?`,
          correctAnswer: `Separation of concerns and modularity`
        }
      ],
      medium: [
        {
          question: `How does ${keyword} implementation differ between different frameworks in ${topic}?`,
          correctAnswer: `Frameworks may use different design patterns while maintaining the same core principles`
        },
        {
          question: `What challenge might you face when applying ${keyword} in a complex ${topic} project?`,
          correctAnswer: `Balancing flexibility with performance considerations`
        },
        {
          question: `In what scenario would you avoid using ${keyword} when working with ${topic}?`,
          correctAnswer: `When the overhead would significantly impact performance in time-critical operations`
        },
        {
          question: `How would you optimize a ${keyword} implementation in ${topic}?`,
          correctAnswer: `By profiling performance and identifying bottlenecks specific to the implementation`
        },
        {
          question: `What design pattern works well with ${keyword} in ${topic}?`,
          correctAnswer: `The Observer pattern for handling state changes`
        }
      ],
      hard: [
        {
          question: `What are the architectural implications of scaling a system heavily dependent on ${keyword} in ${topic}?`,
          correctAnswer: `Requires careful consideration of state management and potential distributed system challenges`
        },
        {
          question: `How would you implement a fault-tolerant ${keyword} system in ${topic}?`,
          correctAnswer: `By combining redundancy, circuit breakers, and graceful degradation patterns`
        },
        {
          question: `When refactoring legacy code to incorporate modern ${keyword} practices in ${topic}, what approach is most effective?`,
          correctAnswer: `Incremental changes with comprehensive testing at each step`
        },
        {
          question: `What advanced technique could address performance bottlenecks in ${keyword} when applied to ${topic}?`,
          correctAnswer: `Implementing custom caching strategies specific to the domain model`
        },
        {
          question: `How would you evaluate the trade-offs between different ${keyword} implementations in enterprise-scale ${topic} applications?`,
          correctAnswer: `By benchmarking against specific use cases and measuring both performance and maintainability metrics`
        }
      ]
    };
    
    // Select a random template from the appropriate difficulty level
    const levelTemplates = templates[difficulty];
    return levelTemplates[Math.floor(Math.random() * levelTemplates.length)];
  };
  
  // Generate options for a question template
  const getOptionsForTemplate = (
    template: { question: string; correctAnswer: string },
    difficulty: 'easy' | 'medium' | 'hard'
  ): string[] => {
    // Generate wrong answers based on the correct answer
    const wrongAnswers = [
      `A common misconception, but actually not relevant to this specific context`,
      `Only applicable in specialized cases, not as a general principle`,
      `An outdated approach that has been replaced by newer methodologies`
    ];
    
    // Shuffle the options (including the correct answer, which will be placed properly later)
    const options = [...wrongAnswers];
    
    // Add a fourth wrong answer based on difficulty
    if (difficulty === 'easy') {
      options.push(`The opposite of what&apos;s generally recommended in best practices`);
    } else if (difficulty === 'medium') {
      options.push(`A theoretical approach that works in academic settings but rarely in production`);
    } else {
      options.push(`A technique that introduces unnecessary complexity without proportional benefits`);
    }
    
    return shuffle(options);
  };
  
  // Adjust options to ensure the correct answer is placed at the correct index
  const adjustOptionsForCorrectAnswer = (
    options: string[],
    correctIndex: number,
    correctAnswer: string
  ): string[] => {
    const result = [...options];
    
    // Place the correct answer at the right position
    result.splice(correctIndex, 0, correctAnswer);
    
    // Remove one extra option since we added the correct answer
    if (result.length > 4) {
      // Remove from a position other than the correct answer position
      const indexToRemove = (correctIndex + 2) % result.length;
      result.splice(indexToRemove, 1);
    }
    
    return result;
  };
  
  // Utility function to shuffle an array
  const shuffle = <T,>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  
  // Utility function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  // Prepare data for current subtask
  const currentSubtask: QuizSubtask = {
    sectionIndex,
    subtaskIndex,
    title,
    description
  };
  
  return (
    <>
      {/* Button to open quiz */}
      <Button
        size="sm"
        variant={completed ? "ghost" : "default"}
        className={`text-xs px-3 h-7 ${
          completed 
            ? 'text-green-400 hover:text-green-500' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md hover:shadow-lg'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (completed) {
            // If already completed, just toggle state
            onToggleComplete(sectionIndex, subtaskIndex);
          } else {
            // If not completed, open quiz
            openQuiz();
          }
        }}
      >
        {completed ? (
          <>
            <FaCheckCircle className="mr-1.5 h-3 w-3" />
            Mark as incomplete
          </>
        ) : (
          <>
            <FaGraduationCap className="mr-1.5 h-3 w-3" />
            Take Assessment Quiz
          </>
        )}
      </Button>

      {/* Quiz modal */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={closeQuiz}
        currentSubtask={currentSubtask}
        onQuizComplete={handleQuizComplete}
        generateQuizQuestions={generateQuizQuestions}
      />
    </>
  );
};

export default QuizController; 