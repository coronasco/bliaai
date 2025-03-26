"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

interface CareerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENERATION_STEPS = [
  { id: 1, text: "Analyzing career requirements and prerequisites..." },
  { id: 2, text: "Structuring comprehensive learning path..." },
  { id: 3, text: "Adding detailed subtasks and milestones..." },
  { id: 4, text: "Optimizing learning sequence and progression..." },
  { id: 5, text: "Finalizing roadmap with best practices..." }
];

export function CareerCreationModal({ isOpen, onClose }: CareerCreationModalProps) {
  const router = useRouter();
  const [careerTitle, setCareerTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < GENERATION_STEPS.length - 1) {
            setCompletedSteps(prevSteps => [...prevSteps, prev]);
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 2000); // Schimbă pasul la fiecare 2 secunde

      return () => clearInterval(interval);
    } else {
      setCurrentStep(0);
      setCompletedSteps([]);
    }
  }, [isGenerating]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const generateRoadmap = async () => {
    if (!careerTitle.trim()) {
      toast.error("Please enter a career title");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate roadmap content using AI
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a detailed roadmap for becoming a ${careerTitle}. 
          ${description ? `Additional context: ${description}` : ""}
          ${skills.length > 0 ? `Required skills: ${skills.join(", ")}` : ""}
          Please provide a comprehensive learning path with sections and subtasks.`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.data || !data.data.description) {
        throw new Error("Invalid response format from API");
      }

      const generatedContent = data.data.description;

      // Parse the markdown content to create sections
      const sections = generatedContent.split(/^##\s+/m).slice(1).map((section: string) => {
        const [title, ...content] = section.split('\n');
        const description = content.join('\n').trim();
        
        // Create subtasks from the content
        const subtasks = description.split(/^###\s+/m).slice(1).map(subtask => {
          const [subtaskTitle, ...subtaskContent] = subtask.split('\n');
          return {
            id: uuidv4(),
            title: subtaskTitle.trim(),
            description: subtaskContent.join('\n').trim(),
            content: subtaskContent.join('\n').trim(),
            completed: false,
            lastModifiedBy: "admin",
            lastModifiedAt: Timestamp.now(),
          };
        });

        return {
          id: uuidv4(),
          title: title.trim(),
          description: description.split('\n')[0].trim(), // First line as description
          lastModifiedBy: "admin",
          lastModifiedAt: Timestamp.now(),
          subtasks: subtasks.length > 0 ? subtasks : [{
            id: uuidv4(),
            title: "Overview",
            description: description.split('\n')[0].trim(),
            content: description,
            completed: false,
            lastModifiedBy: "admin",
            lastModifiedAt: Timestamp.now(),
          }]
        };
      });

      // Create the roadmap document
      const roadmapData = {
        title: careerTitle,
        description: generatedContent,
        experienceLevel: "beginner",
        requiredSkills: skills,
        isPublic: true,
        isOfficial: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastModifiedBy: "admin",
        lastModifiedAt: Timestamp.now(),
        sections: sections
      };

      // Save to Firestore and redirect to the new roadmap
      const docRef = await addDoc(collection(db, "roadmaps"), roadmapData);
      toast.success("Career roadmap generated successfully!");
      router.push(`/admin/roadmaps/${docRef.id}`);
      onClose();
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate roadmap");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {isGenerating ? "Generating Your Roadmap" : "Create Career Roadmap"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isGenerating 
              ? "Our AI is crafting a personalized learning path for you"
              : "Generate a detailed learning path for your chosen career"}
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold text-white">AI Generation in Progress</h3>
                <div className="space-y-3">
                  {GENERATION_STEPS.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center justify-center space-x-2 transition-all duration-500 ${
                        index === currentStep
                          ? "opacity-100 transform translate-x-0"
                          : index < currentStep
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-0 transform translate-x-4"
                      }`}
                    >
                      {completedSteps.includes(index) ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : index === currentStep ? (
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                      )}
                      <p className={`text-sm ${
                        completedSteps.includes(index)
                          ? "text-green-500"
                          : index === currentStep
                          ? "text-purple-500"
                          : "text-gray-400"
                      }`}>
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  This process typically takes 10-15 seconds
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="career-title" className="text-white">Career Title</Label>
              <Input
                id="career-title"
                placeholder="e.g., Frontend Developer, Data Scientist"
                value={careerTitle}
                onChange={(e) => setCareerTitle(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Additional Context (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any specific details about the career path, goals, or requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-sm text-gray-400">
                The more detailed your description, the more accurate the AI-generated roadmap will be.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="text-white">Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  id="skills"
                  placeholder="Add required skills (press Enter)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddSkill}
                  className="border-gray-700 hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-700 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={generateRoadmap}
                disabled={!careerTitle.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Roadmap
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 