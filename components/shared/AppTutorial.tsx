"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { addPoints, awardBadge } from "@/lib/gamification";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { 
  FaRocket, 
  FaTrophy, 
  FaBook, 
  FaRoad, 
  FaRegLightbulb, 
  FaRegCheckCircle,
  FaBrain,
  FaAward,
  FaChartLine
} from 'react-icons/fa';
import { HiOutlineArrowRight, HiOutlineArrowLeft } from 'react-icons/hi';
import { Loader2 } from "lucide-react";

// Types for tutorial data
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface TutorialState {
  completed: boolean;
  lastCompletedStep: number;
  currentStep: number;
  completedAt?: Date;
}

const initialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BLIA AI',
    description: 'BLIA AI is your personal career development platform powered by artificial intelligence. Let\'s walk through the key features to help you get started.',
    icon: <FaRocket className="h-6 w-6 text-purple-500" />,
    completed: false
  },
  {
    id: 'career-paths',
    title: 'Career Roadmaps',
    description: 'Create personalized career roadmaps based on your goals. Our AI analyzes the skills you need and creates a step-by-step learning journey tailored just for you.',
    icon: <FaRoad className="h-6 w-6 text-blue-500" />,
    completed: false
  },
  {
    id: 'learning',
    title: 'Learning Resources',
    description: 'Access curated learning materials for each skill in your roadmap. From tutorials to practical exercises, you\'ll find everything you need to master new competencies.',
    icon: <FaBook className="h-6 w-6 text-green-500" />,
    completed: false
  },
  {
    id: 'assessment',
    title: 'Skill Assessment',
    description: 'Test your knowledge with interactive quizzes. Each quiz helps you identify strengths and areas for improvement, giving you immediate feedback on your progress.',
    icon: <FaBrain className="h-6 w-6 text-orange-500" />,
    completed: false
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    description: 'Monitor your learning journey with detailed statistics. See how much you\'ve accomplished and what\'s left to do to reach your career goals.',
    icon: <FaChartLine className="h-6 w-6 text-teal-500" />,
    completed: false
  },
  {
    id: 'gamification',
    title: 'Gamification System',
    description: 'Earn points, badges, and unlock achievements as you progress. Level up your profile and maintain streaks to stay motivated on your learning journey.',
    icon: <FaTrophy className="h-6 w-6 text-yellow-500" />,
    completed: false
  },
  {
    id: 'finish',
    title: 'Ready to Start',
    description: 'Congratulations! You\'ve completed the introduction to BLIA AI. You\'ve earned 50 points for completing this tutorial. Start exploring now and build your ideal career path!',
    icon: <FaAward className="h-6 w-6 text-purple-500" />,
    completed: false
  }
];

const AppTutorial: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    completed: false,
    lastCompletedStep: -1,
    currentStep: 0,
    completedAt: undefined
  });
  const [steps, setSteps] = useState<TutorialStep[]>(initialSteps);
  const [isLoading, setIsLoading] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Load tutorial state from Firebase
  useEffect(() => {
    const loadTutorialState = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if the user has completed the tutorial before
          if (userData.tutorialCompleted) {
            setTutorialState({
              completed: true,
              lastCompletedStep: initialSteps.length - 1,
              currentStep: initialSteps.length - 1,
              completedAt: userData.tutorialCompletedAt?.toDate()
            });
            
            // Mark all steps as completed
            setSteps(initialSteps.map(step => ({ ...step, completed: true })));
          } else if (userData.tutorialState) {
            // Load the saved tutorial state
            setTutorialState(userData.tutorialState);
            
            // Update steps completion based on lastCompletedStep
            const lastCompleted = userData.tutorialState.lastCompletedStep || -1;
            setSteps(initialSteps.map((step, index) => ({
              ...step,
              completed: index <= lastCompleted
            })));
          }
        }
        
        // Marchează starea tutorialului ca fiind încărcată
        setIsStateLoaded(true);
      } catch (error) {
        console.error("Error loading tutorial state:", error);
        setIsStateLoaded(true); // Marchează ca încărcat chiar și în caz de eroare
      }
    };
    
    loadTutorialState();
  }, [user?.uid]);

  // Open the tutorial automatically if never completed
  useEffect(() => {
    // Așteptăm până când starea tutorialului este încărcată
    if (user?.uid && isStateLoaded && !tutorialState.completed) {
      setIsOpen(true);
    }
  }, [user?.uid, tutorialState.completed, isStateLoaded]);

  // Save tutorial progress
  const saveTutorialProgress = async (newState: TutorialState) => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      
      // Creez un obiect nou fără proprietăți undefined
      const stateToSave = { ...newState };
      
      // Elimin câmpul completedAt dacă este undefined
      if (stateToSave.completedAt === undefined) {
        delete stateToSave.completedAt;
      }
      
      await updateDoc(doc(db, "customers", user.uid), {
        tutorialState: stateToSave,
        updatedAt: new Date()
      });
      
      setTutorialState(newState);
    } catch (error) {
      console.error("Error saving tutorial progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete tutorial and award points
  const completeTutorial = async () => {
    if (!user?.uid || tutorialState.completed) return;
    
    try {
      setIsAwarding(true);
      
      // Award 50 points for tutorial completion
      const success = await addPoints(
        user.uid, 
        50, 
        'TUTORIAL_COMPLETE', 
        'Completed app introduction tutorial'
      );
      
      if (success) {
        // Award badge for tutorial completion
        await awardBadge(user.uid, 'tutorial_complete');
        
        // Update local state
        const newState = {
          completed: true,
          lastCompletedStep: steps.length - 1,
          currentStep: steps.length - 1,
          completedAt: new Date()
        };
        
        // Save to Firebase
        await updateDoc(doc(db, "customers", user.uid), {
          tutorialCompleted: true,
          tutorialCompletedAt: new Date(),
          tutorialState: newState,
          updatedAt: new Date()
        });
        
        setTutorialState(newState);
        
        // Update steps
        setSteps(steps.map(step => ({ ...step, completed: true })));
        
        // Show success message
        toast.success("Tutorial completed!", {
          description: "You've earned 50 points and a badge!",
          icon: <FaTrophy className="h-5 w-5 text-yellow-500" />
        });
      }
    } catch (error) {
      console.error("Error completing tutorial:", error);
      toast.error("Failed to award points", {
        description: "Please try again later"
      });
    } finally {
      setIsAwarding(false);
    }
  };

  // Handle navigating to the next step
  const handleNext = async () => {
    if (tutorialState.currentStep < steps.length - 1) {
      const newStep = tutorialState.currentStep + 1;
      const lastCompleted = Math.max(tutorialState.lastCompletedStep, tutorialState.currentStep);
      
      // Update steps
      const newSteps = [...steps];
      newSteps[tutorialState.currentStep].completed = true;
      setSteps(newSteps);
      
      // Save progress
      const newState = {
        ...tutorialState,
        currentStep: newStep,
        lastCompletedStep: lastCompleted
      };
      
      await saveTutorialProgress(newState);
    } else if (tutorialState.currentStep === steps.length - 1 && !tutorialState.completed) {
      // Complete the tutorial on the last step
      await completeTutorial();
    }
  };

  // Handle navigating to the previous step
  const handlePrevious = async () => {
    if (tutorialState.currentStep > 0) {
      const newStep = tutorialState.currentStep - 1;
      
      // Save progress
      const newState = {
        ...tutorialState,
        currentStep: newStep
      };
      
      await saveTutorialProgress(newState);
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((tutorialState.lastCompletedStep + 1) / steps.length) * 100;

  // Get current step data
  const currentStep = steps[tutorialState.currentStep];

  return (
    <>
      {/* Floating Tutorial Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 p-0 flex items-center justify-center"
        >
          <FaRegLightbulb className="h-6 w-6" />
        </Button>
      </div>

      {/* Tutorial Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 bg-gray-900 border-gray-800 text-white overflow-hidden rounded-xl">
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 h-1.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="mr-3 bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg">
                  {currentStep.icon}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">{currentStep.title}</DialogTitle>
                  <DialogDescription className="text-gray-400">Step {tutorialState.currentStep + 1} of {steps.length}</DialogDescription>
                </div>
              </div>
              
              {tutorialState.completed && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <FaRegCheckCircle className="mr-1 h-3 w-3" /> Completed
                </Badge>
              )}
            </div>
            
            <div className="min-h-[180px] mb-8">
              <p className="text-gray-300 text-lg leading-relaxed">{currentStep.description}</p>
              
              {/* Step-specific extra content could be added here */}
              {currentStep.id === 'finish' && !tutorialState.completed && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center">
                    <FaTrophy className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                    <p className="text-yellow-300 text-sm">Complete this tutorial to earn 50 points and your first badge!</p>
                  </div>
                </div>
              )}
              
              {currentStep.id === 'finish' && tutorialState.completed && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <FaRegCheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-300 text-sm">
                      You completed this tutorial on{' '}
                      {tutorialState.completedAt?.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="bg-gray-850 border-t border-gray-800 p-4 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={tutorialState.currentStep === 0 || isLoading}
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <HiOutlineArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center text-xs text-gray-500">
              {tutorialState.currentStep + 1} / {steps.length}
            </div>
            
            <Button
              onClick={tutorialState.completed ? () => setIsOpen(false) : handleNext}
              disabled={isLoading || isAwarding}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {isLoading || isAwarding ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isAwarding ? 'Awarding...' : 'Saving...'}</>
              ) : tutorialState.currentStep < steps.length - 1 ? (
                <>Next <HiOutlineArrowRight className="ml-2 h-4 w-4" /></>
              ) : tutorialState.completed ? (
                'Close'
              ) : (
                <>Complete <FaRegCheckCircle className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppTutorial; 