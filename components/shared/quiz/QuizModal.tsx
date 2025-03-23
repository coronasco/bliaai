"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FaSpinner, 
  FaCheck, 
  FaCheckCircle, 
  FaBrain,
  FaClock, 
  FaLightbulb,
  FaChevronRight,
  FaArrowRight,
  FaExclamationCircle,
  FaRegLightbulb,
  FaTrophy
} from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Quiz question interface
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

// Subtask interface for quiz context
export interface QuizSubtask {
  sectionIndex: number;
  subtaskIndex: number;
  title: string;
  description?: string;
}

// Main QuizModal component props
interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubtask: QuizSubtask;
  onQuizComplete: (passed: boolean) => void;
  generateQuizQuestions: (title: string, description?: string) => Promise<QuizQuestion[]>;
}

// Quiz result tracking
interface QuizResult {
  questionIndex: number;
  selectedAnswerIndex: number | null;
  isCorrect: boolean;
  timeSpent: number;
}

const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  currentSubtask,
  onQuizComplete,
  generateQuizQuestions
}) => {
  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [timeOutOccurred, setTimeOutOccurred] = useState(false);
  
  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Calculate quiz statistics
  const quizStats = useMemo(() => {
    if (quizResults.length === 0) return { correctCount: 0, incorrectCount: 0, score: 0, passed: false };
    
    const correctCount = quizResults.filter(result => result.isCorrect).length;
    const totalQuestions = quizResults.length;
    const score = (correctCount / totalQuestions) * 100;
    const passed = score >= 70; // Pass threshold is 70%
    
    return {
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      score,
      passed
    };
  }, [quizResults]);
  
  // Get difficulty label and style
  const getDifficultyInfo = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return { 
          label: 'Easy', 
          timeLabel: '30s',
          bgClass: 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-700/50',
          textClass: 'text-green-400'
        };
      case 'medium':
        return { 
          label: 'Medium', 
          timeLabel: '45s',
          bgClass: 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-700/50',
          textClass: 'text-yellow-400'
        };
      case 'hard':
        return { 
          label: 'Hard', 
          timeLabel: '60s',
          bgClass: 'bg-gradient-to-r from-red-900/40 to-rose-900/40 border-red-700/50',
          textClass: 'text-red-400'
        };
      default:
        return { 
          label: 'Unknown', 
          timeLabel: '45s',
          bgClass: 'bg-gray-800 border-gray-700',
          textClass: 'text-gray-400'
        };
    }
  }, []);
  
  // Timer effect for counting down question time
  useEffect(() => {
    if (!quizStarted || !currentQuestion || answered || timeOutOccurred) return;
    
    setRemainingTime(currentQuestion.timeLimit);
    
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeOutOccurred(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizStarted, currentQuestionIndex, answered, timeOutOccurred, currentQuestion]);
  
  // Handle time out for current question
  useEffect(() => {
    if (timeOutOccurred && !answered) {
      handleAnswer(null, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeOutOccurred]);
  
  // Generate questions when quiz starts
  const handleGenerateQuestions = async () => {
    setGenerating(true);
    try {
      const generatedQuestions = await generateQuizQuestions(currentSubtask.title, currentSubtask.description);
      
      if (generatedQuestions.length === 0) {
        toast.error("Failed to generate questions for this assessment. Please try again.");
        return;
      }
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setQuizStarted(true);
      setQuizCompleted(false);
      setQuizResults([]);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("An error occurred while generating the assessment. Please try again.");
    } finally {
      setGenerating(false);
    }
  };
  
  // Handle answer selection
  const handleAnswer = (index: number | null, isTimeout = false) => {
    if (answered || (!isTimeout && index === null)) return;
    
    setAnswered(true);
    setSelectedAnswerIndex(index);
    
    // Record result
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const timeSpent = currentQuestion.timeLimit - remainingTime;
    
    setQuizResults(prev => [
      ...prev,
      {
        questionIndex: currentQuestionIndex,
        selectedAnswerIndex: index,
        isCorrect,
        timeSpent
      }
    ]);
    
    // Show toast notification for correct/incorrect answer
    if (isTimeout) {
      toast.error("Time&apos;s up! Moving to the next question.");
    } else if (isCorrect) {
      toast.success("Correct answer!");
    } else {
      toast.error("Incorrect answer.");
    }
  };
  
  // Go to next question or finish quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setAnswered(false);
      setTimeOutOccurred(false);
    } else {
      // Quiz is complete - calculează scorul și determină dacă testul a fost trecut
      const correctCount = quizResults.filter(result => result.isCorrect).length;
      const totalQuestions = questions.length;
      const score = (correctCount / totalQuestions) * 100;
      const passed = score >= 70; // Pass threshold is 70%
      
      // Setează starea quizului ca finalizat
      setQuizCompleted(true);
      
      // Afișează mesaj de felicitare dacă testul a fost trecut
      if (passed) {
        toast.success("Congratulations! You passed the assessment!");
      } else {
        toast.error("You didn't reach the minimum score required to pass. Try again!");
      }
      
      // Notifică componenta părinte despre finalizarea testului
      // Acest lucru va actualiza starea în Firebase
      onQuizComplete(passed);
    }
  };
  
  // Reset quiz state when closing the modal
  const handleCloseQuiz = useCallback(() => {
    // Resetează starea quiz-ului
    setQuizResults([]);
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswered(false);
    setSelectedAnswerIndex(null);
    setRemainingTime(0);
    setTimeOutOccurred(false);
    
    // Închide modalul
    onClose();
  }, [onClose]);
  
  // Calculate progress percentage
  const progressPercentage = (currentQuestionIndex / questions.length) * 100;
  
  // Calculate remaining time percentage for the current question
  const timePercentage = currentQuestion ? (remainingTime / currentQuestion.timeLimit) * 100 : 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={val => !val && handleCloseQuiz()}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 border border-gray-700 text-white">
        {!quizStarted ? (
          /* QUIZ INTRO SCREEN */
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                  <FaBrain className="h-6 w-6 text-indigo-400" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-center text-white">
                Competency Assessment Test
              </DialogTitle>
              <DialogDescription className="text-center text-gray-300 mt-2">
                This assessment will evaluate your knowledge on:
                <span className="font-medium block text-lg text-indigo-400 mt-1">{currentSubtask.title}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FaLightbulb className="mr-3 text-amber-400" />
                  About this Assessment
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-300">1</span>
                    </div>
                    <p className="text-gray-300">
                      The assessment will contain at least 15 AI-generated questions on this topic, with varying difficulty levels.
                    </p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-300">2</span>
                    </div>
                    <p className="text-gray-300">
                      Each question has its own timer based on difficulty level. Answer before time runs out.
                    </p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-300">3</span>
                    </div>
                    <p className="text-gray-300">
                      To mark the subtask as completed, you must achieve a score of at least 70%.
                    </p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-300">4</span>
                    </div>
                    <p className="text-gray-300">
                      Upon completion, you&apos;ll receive detailed feedback on your answers.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-lg p-4">
                <div className="flex items-start">
                  <FaRegLightbulb className="h-5 w-5 text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-indigo-200">
                    It&apos;s important to answer this assessment honestly, as the results will reflect your actual understanding of the subject and help identify areas that need more attention.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex gap-3 w-full justify-end">
                <Button
                  variant="outline"
                  onClick={handleCloseQuiz}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
                >
                  {generating ? (
                    <>
                      <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                      Generating Assessment...
                    </>
                  ) : (
                    <>
                      <FaBrain className="mr-2 h-4 w-4" />
                      Generate Test
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : quizCompleted ? (
          /* QUIZ RESULTS SCREEN */
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-2">
                {quizStats.passed ? (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600/30 to-emerald-700/30 border border-green-500/50 flex items-center justify-center">
                    <FaTrophy className="h-8 w-8 text-green-400" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-600/30 to-yellow-700/30 border border-amber-500/50 flex items-center justify-center">
                    <FaExclamationCircle className="h-8 w-8 text-amber-400" />
                  </div>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-center text-white">
                {quizStats.passed ? "Assessment Completed Successfully!" : "Assessment Not Completed"}
              </DialogTitle>
              <DialogDescription className="text-center text-lg mt-1">
                Your final score: <span className={`font-semibold ${quizStats.passed ? 'text-green-400' : 'text-amber-400'}`}>{quizStats.score.toFixed(0)}%</span>
                {!quizStats.passed && <span className="text-gray-400 text-sm block">(minimum 70% required to pass)</span>}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className={cn(
                "rounded-lg border p-6",
                quizStats.passed 
                  ? "bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/40" 
                  : "bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-amber-800/40"
              )}>
                <h3 className="font-semibold text-xl text-white mb-4">Assessment Results</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                    <span className="text-sm text-gray-300 block mb-1">Total Questions</span>
                    <span className="text-2xl font-bold text-white">{quizResults.length}</span>
                  </div>
                  
                  <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                    <span className="text-sm text-gray-300 block mb-1">Final Score</span>
                    <span className={`text-2xl font-bold ${quizStats.passed ? 'text-green-400' : 'text-amber-400'}`}>{quizStats.score.toFixed(0)}%</span>
                  </div>
                  
                  <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                    <span className="text-sm text-gray-300 block mb-1">Correct Answers</span>
                    <span className="text-2xl font-bold text-green-400">{quizStats.correctCount}</span>
                  </div>
                  
                  <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                    <span className="text-sm text-gray-300 block mb-1">Incorrect Answers</span>
                    <span className="text-2xl font-bold text-red-400">{quizStats.incorrectCount}</span>
                  </div>
                </div>
                
                <div className={cn(
                  "rounded-lg p-4 border",
                  quizStats.passed 
                    ? "bg-green-950/30 border-green-800/30 text-green-200" 
                    : "bg-amber-950/30 border-amber-800/30 text-amber-200"
                )}>
                  <div className="flex gap-3 items-start">
                    {quizStats.passed ? (
                      <>
                        <FaCheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          <strong>Congratulations!</strong> You&apos;ve demonstrated a good understanding of this topic. The subtask has been marked as completed. Keep learning and improving your skills!
                        </p>
                      </>
                    ) : (
                      <>
                        <FaExclamationCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          <strong>Don&apos;t be discouraged!</strong> Review the materials and try again when you feel ready. We recommend studying the core concepts more before attempting again.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex gap-3 w-full justify-end">
                <Button
                  variant="outline"
                  onClick={handleCloseQuiz}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Close
                </Button>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                >
                  {generating ? (
                    <>
                      <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Try Again"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          /* QUIZ QUESTION SCREEN */
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30 px-2 py-1">
                    Question {currentQuestionIndex + 1}/{questions.length}
                  </Badge>
                  
                  {currentQuestion && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "px-2 py-1 border",
                        getDifficultyInfo(currentQuestion.difficulty).bgClass,
                        getDifficultyInfo(currentQuestion.difficulty).textClass
                      )}
                    >
                      {getDifficultyInfo(currentQuestion.difficulty).label}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FaClock className={cn(
                      timePercentage > 60 ? "text-green-400" : 
                      timePercentage > 30 ? "text-yellow-400" : 
                      "text-red-400"
                    )} />
                    <span className={cn(
                      "text-sm font-mono",
                      timePercentage > 60 ? "text-green-400" : 
                      timePercentage > 30 ? "text-yellow-400" : 
                      "text-red-400"
                    )}>
                      {remainingTime}s
                    </span>
                  </div>
                  
                  <Progress 
                    value={timePercentage} 
                    className="h-1.5 w-32"
                    variant={
                      timePercentage > 60 ? "emerald" : 
                      timePercentage > 30 ? "amber" : 
                      "default"
                    }
                  />
                </div>
              </div>
              
              <div className="mt-6 mb-1">
                <Progress 
                  value={progressPercentage} 
                  className="h-1" 
                  variant="blue"
                />
              </div>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              {/* Question text */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-5 shadow-lg">
                <h3 className="text-lg font-medium text-white leading-relaxed">
                  {currentQuestion?.question}
                </h3>
              </div>
              
              {/* Answer options */}
              <div className="space-y-3">
                {currentQuestion?.options.map((option, idx) => (
                  <Card 
                    key={idx} 
                    className={cn(
                      "border transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md",
                      answered && idx === selectedAnswerIndex && idx === currentQuestion.correctAnswerIndex 
                        ? "bg-green-900/30 border-green-500 shadow-[0_0_10px_rgba(74,222,128,0.2)]" 
                        : answered && idx === selectedAnswerIndex && idx !== currentQuestion.correctAnswerIndex
                        ? "bg-red-900/30 border-red-500 shadow-[0_0_10px_rgba(248,113,113,0.2)]"
                        : answered && idx === currentQuestion.correctAnswerIndex
                        ? "bg-green-900/20 border-green-500/50"
                        : answered
                        ? "bg-gray-800/60 border-gray-700 opacity-60"
                        : "bg-gray-800 border-gray-700 hover:bg-gray-750/80 hover:border-gray-600"
                    )}
                    onClick={() => !answered && handleAnswer(idx)}
                  >
                    <div className="p-4 flex items-center gap-3">
                      <div className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-medium border",
                        answered && idx === currentQuestion.correctAnswerIndex
                          ? "bg-green-900/30 text-green-400 border-green-500/50"
                          : answered && idx === selectedAnswerIndex
                          ? "bg-red-900/30 text-red-400 border-red-500/50"
                          : "bg-indigo-900/20 text-indigo-300 border-indigo-700/50"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={cn(
                        "text-base",
                        answered && (
                          (idx === currentQuestion.correctAnswerIndex)
                            ? "text-green-400"
                            : (idx === selectedAnswerIndex)
                            ? "text-red-400"
                            : "text-gray-300"
                        )
                      )}>
                        {option}
                      </span>
                      {answered && idx === currentQuestion.correctAnswerIndex && (
                        <FaCheck className="ml-auto flex-shrink-0 h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleNextQuestion} 
                disabled={!answered && !timeOutOccurred}
                className={cn(
                  "min-w-[120px]",
                  answered || timeOutOccurred
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                )}
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next
                    <FaChevronRight className="ml-2 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Finish
                    <FaArrowRight className="ml-2 h-3 w-3" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal; 