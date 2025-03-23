"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, Save, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type FeedbackItem = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: Date;
  userId?: string;
  lesson?: string;
  lessonTitle?: string;
  sectionTitle?: string;
  sectionId?: string;
  subtaskId?: string;
  roadmapId?: string;
  roadmapTitle?: string;
  resolvedAt?: Date;
  userEmail?: string;
  priority?: "low" | "medium" | "high";
  type?: string;
  context?: string;
  browser?: string;
  device?: string;
  osVersion?: string;
  updatedAt?: Date;
};

type ResourceItem = {
  title?: string;
  url?: string;
  description?: string;
  [key: string]: string | undefined;
};

// Type for test questions
type TestQuestion = {
  id?: string;
  question?: string;
  options?: string[];
  answer?: string | number;
  explanation?: string;
  points?: number;
  type?: string;
  [key: string]: string | string[] | number | undefined;
};

// Type for subtask
type SubtaskItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  roadmapId?: string;
  roadmapTitle?: string;
  sectionId?: string;
  sectionTitle?: string;
  order?: number;
  resources?: Array<ResourceItem>;
  createdAt?: Date;
  updatedAt?: Date;
  duration?: string;
  difficulty?: string;
  pathId?: string;
  finalTest?: {
    title?: string;
    description?: string;
    questions?: Array<TestQuestion>;
    [key: string]: string | Array<TestQuestion> | undefined;
  };
  [key: string]: string | number | boolean | Array<ResourceItem> | Date | Record<string, unknown> | undefined;
};

// Types for sections and subtasks in roadmap
type RoadmapSection = {
  id: string;
  title: string;
  subtasks?: SubtaskItem[];
  subsections?: SubtaskItem[];
  description?: string;
  progress?: number;
  dependencies?: string[];
  [key: string]: string | SubtaskItem[] | string[] | number | undefined;
};

type RoadmapData = {
  id?: string;
  title?: string;
  description?: string;
  careerField?: string;
  experienceLevel?: string;
  sections?: RoadmapSection[];
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  requiredSkills?: string[];
  [key: string]: unknown;
};

// Funcție utilă pentru a elimina câmpurile undefined dintr-un obiect (recursiv)
const removeUndefinedValues = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  }
  
  const sanitized: Record<string, unknown> = {};
  
  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined) {
      sanitized[key] = removeUndefinedValues(value);
    }
  });
  
  return sanitized;
};

export default function EditSectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedbackId = searchParams.get("id") || "";
  const subtaskId = searchParams.get("subtask") || "";
  const [feedback, setFeedback] = useState<FeedbackItem | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedSection, setEditedSection] = useState<Partial<SubtaskItem>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch section and feedback from Firestore
  useEffect(() => {
    const fetchData = async () => {      
      setIsLoading(true);
      
      try {
        // First get the feedback if it exists
        if (feedbackId) {
          const feedbackRef = doc(db, "feedback", feedbackId);
          const feedbackSnap = await getDoc(feedbackRef);
          
          if (feedbackSnap.exists()) {
            const feedbackData = feedbackSnap.data();
            const feedbackItem = {
              id: feedbackId,
              ...feedbackData,
              createdAt: feedbackData.createdAt?.toDate() || new Date(),
              resolvedAt: feedbackData.resolvedAt?.toDate() || null,
            } as FeedbackItem;
            
            setFeedback(feedbackItem);
            
            // Try to find the roadmap using roadmapId from feedback
            if (feedbackData.roadmapId) {
              const roadmapRef = doc(db, "roadmaps", feedbackData.roadmapId);
              const roadmapSnap = await getDoc(roadmapRef);
              
              if (roadmapSnap.exists()) {
                const roadmapData = roadmapSnap.data();
                roadmapData.id = feedbackData.roadmapId; // Ensure we have the ID
                setRoadmap(roadmapData as RoadmapData);
                
                // Check if we have a subtaskId to find the specific subsection
                const checkSubtaskId = subtaskId || feedbackData.subtaskId;
                
                if (checkSubtaskId && roadmapData.sections && Array.isArray(roadmapData.sections)) {
                  let foundSubsection: SubtaskItem | null = null;
                  let parentSection: RoadmapSection | null = null;
                  
                  // Go through all sections to find the subsection by ID
                  for (const section of roadmapData.sections as RoadmapSection[]) {
                    // Check both in subtasks and subsections
                    const subtasksArray = section.subtasks || section.subsections || [];
                    
                    for (const subsec of subtasksArray) {
                      if (subsec.id === checkSubtaskId) {
                        foundSubsection = subsec;
                        parentSection = section;
                        break;
                      }
                    }
                    
                    if (foundSubsection) break;
                  }
                  
                  if (foundSubsection && parentSection) {
                    // Set the parent section
                    setSelectedSectionId(parentSection.id);
                    
                    // Add additional information to the subsection
                    const completeSubsection = {
                      ...foundSubsection,
                      sectionId: parentSection.id,
                      sectionTitle: parentSection.title,
                      roadmapId: feedbackData.roadmapId,
                      roadmapTitle: roadmapData.title
                    };
                    
                    // Ne asigurăm că id-ul este prezent
                    if (!completeSubsection.id && subtaskId) {
                      completeSubsection.id = subtaskId;
                    } else if (!completeSubsection.id && feedbackData.subtaskId) {
                      completeSubsection.id = feedbackData.subtaskId;
                    }
                    
                    setEditedSection(completeSubsection);
                    console.log("Setting edited section:", completeSubsection);
                    console.log("Setting selectedSectionId:", parentSection.id);
                  } else {
                    setError(`Subsection with ID ${checkSubtaskId} not found in the roadmap.`);
                  }
                } else {
                  // If we don't have a subtaskId, use sectionId if available
                  if (feedbackData.sectionId && roadmapData.sections) {
                    const foundSection = roadmapData.sections.find(
                      (section: RoadmapSection) => section.id === feedbackData.sectionId
                    );
                    
                    if (foundSection) {
                      setSelectedSectionId(foundSection.id);
                      setEditedSection(foundSection);
                      console.log("Setting section data:", foundSection);
                      console.log("Setting selectedSectionId:", foundSection.id);
                    } else {
                      setError(`Section with ID ${feedbackData.sectionId} not found in the roadmap.`);
                    }
                  } else {
                    setError("No subtask ID or section ID found in the feedback.");
                  }
                }
              } else {
                setError(`Roadmap with ID ${feedbackData.roadmapId} not found in the database.`);
              }
            } else {
              setError(`Feedback exists but doesn't contain a roadmapId. Cannot edit section.`);
            }
          } else {
            setError(`Feedback with ID ${feedbackId} not found in the database.`);
          }
        } else {
          setError(`No feedback ID provided. Cannot determine which section to edit.`);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error loading data. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [subtaskId, feedbackId]);
  
  // Handle form submission to save the edited section
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Submit button clicked, checking data:", {
      hasRoadmap: Boolean(roadmap),
      roadmapId: roadmap?.id,
      selectedSectionId,
      hasEditedSection: Boolean(editedSection),
      editedSectionId: editedSection?.id
    });
    
    // Verificăm dacă selectedSectionId lipsește dar avem editedSection cu sectionId
    let sectionIdToUse = selectedSectionId;
    
    if (!sectionIdToUse && editedSection && editedSection.sectionId) {
      sectionIdToUse = editedSection.sectionId;
      setSelectedSectionId(sectionIdToUse);
      console.log("Setting selectedSectionId from editedSection.sectionId:", sectionIdToUse);
    }
    
    // Dacă în continuare nu avem selectedSectionId dar editedSection are id, folosim id-ul pentru update
    if (!sectionIdToUse && editedSection && editedSection.id) {
      sectionIdToUse = editedSection.id;
      setSelectedSectionId(sectionIdToUse);
      console.log("Using editedSection.id as selectedSectionId:", sectionIdToUse);
    }
    
    if (!roadmap || !sectionIdToUse || !editedSection || !editedSection.id) {
      setError("Missing required data for update");
      console.error("Missing required data:", {
        roadmap: Boolean(roadmap),
        sectionIdToUse,
        editedSection: Boolean(editedSection),
        editedSectionId: editedSection?.id
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to update content");
        setIsLoading(false);
        return;
      }

      // Get the user ID to use in updates
      const userId = currentUser.uid;
      
      // Get the current roadmap
      if (!roadmap.id) {
        setError("Roadmap ID is missing");
        setIsLoading(false);
        return;
      }
      
      const roadmapRef = doc(db, "roadmaps", roadmap.id);
      const roadmapSnap = await getDoc(roadmapRef);
      
      if (roadmapSnap.exists()) {
        const roadmapData = roadmapSnap.data();
        const sections = [...(roadmapData.sections || [])];
        
        // Variable to track the update
        let updated = false;
        
        // Verifică explicit dacă secțiunea cu ID-ul specificat există în roadmap
        const sectionExists = sections.some(section => 
          (section.id === sectionIdToUse) || 
          (section.id === undefined && sectionIdToUse === editedSection.sectionId)
        );
        console.log("Sections in roadmap:", sections.map(s => ({ id: s.id, title: s.title })));
        
        if (!sectionExists) {
          // Dacă secțiunea nu există după ID, căutăm după titlu 
          // (în cazul în care toate secțiunile au id: undefined)
          let foundSectionId = null;
          let foundSectionIndex = -1;
          
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            // Verificăm în subtasks
            if (section.subtasks && section.subtasks.some((subtask: SubtaskItem) => subtask.id === editedSection.id)) {
              foundSectionId = section.id || section.title; // Folosim titlul ca identificator dacă id este undefined
              foundSectionIndex = i;
              break;
            }
            
            // Verificăm în subsections
            if (section.subsections && section.subsections.some((subsection: SubtaskItem) => subsection.id === editedSection.id)) {
              foundSectionId = section.id || section.title; // Folosim titlul ca identificator dacă id este undefined
              foundSectionIndex = i;
              break;
            }
          }
          
          if (foundSectionId || foundSectionIndex >= 0) {
            console.log(`Found section at index ${foundSectionIndex} containing subtask ${editedSection.id}`);
            sectionIdToUse = foundSectionId || `index_${foundSectionIndex}`;
          } else {
            setError(`Could not find any section containing subsection with ID ${editedSection.id}`);
            setIsLoading(false);
            return;
          }
        }
        
        // If we have a specific subsection to update
        if (editedSection && sectionIdToUse) {
          // Determine if we're editing a section or a subsection by checking if editedSection has a sectionId
          const isSubsection = Boolean(editedSection.sectionId);
          
          // Find the section containing the subsection
          const updatedSections = sections.map((sec: RoadmapSection, index: number) => {
            const matchesId = sec.id === sectionIdToUse;
            const matchesTitle = sec.title === sectionIdToUse;
            const matchesIndex = sectionIdToUse === `index_${index}`;
            
            if (matchesId || matchesTitle || matchesIndex) {
              // We found the section to update
              updated = true;
              
              if (isSubsection) {
                // We're updating a subsection within this section
                // Remove reference properties we added manually
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { roadmapId, roadmapTitle, sectionId, sectionTitle, ...subsectionToUpdate } = editedSection;
                
                // Create a copy of the section with updated subsections/subtasks
                const updatedSection = { ...sec };
                
                // Update the subsection within the appropriate array (subtasks or subsections)
                if (updatedSection.subtasks && updatedSection.subtasks.length > 0) {
                  updatedSection.subtasks = updatedSection.subtasks.map(subtask => 
                    subtask.id === subsectionToUpdate.id 
                      ? { ...subtask, ...subsectionToUpdate, updatedAt: new Date() } 
                      : subtask
                  );
                }
                
                if (updatedSection.subsections && updatedSection.subsections.length > 0) {
                  updatedSection.subsections = updatedSection.subsections.map(subsection => 
                    subsection.id === subsectionToUpdate.id 
                      ? { ...subsection, ...subsectionToUpdate, updatedAt: new Date() } 
                      : subsection
                  );
                }
                
                return updatedSection;
              } else {
                // We're updating the entire section directly
                // Keep the section's original subtasks and subsections
                const originalSubtasks = sec.subtasks || [];
                const originalSubsections = sec.subsections || [];
                
                // Remove reference properties we added manually
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { roadmapId, roadmapTitle, ...sectionToUpdate } = editedSection;
                
                return {
                  ...sec,
                  ...sectionToUpdate,
                  subtasks: originalSubtasks,
                  subsections: originalSubsections,
                  updatedAt: new Date()
                };
              }
            }
            return sec;
          });
          
          if (updated) {
            // Sanitizăm datele pentru a elimina câmpurile undefined
            const sanitizedSections = removeUndefinedValues(updatedSections);
            
            // Update the roadmap with the new sections
            await updateDoc(roadmapRef, {
              sections: sanitizedSections,
              updatedAt: new Date(),
              lastModifiedBy: userId // Add the ID of the user making the change
            });
            
            toast.success("Section updated successfully");
          } else {
            setError(`Could not find section with ID ${sectionIdToUse} to update in the roadmap`);
            setIsLoading(false);
            return;
          }
        } else {
          setError("Invalid data state for update");
          setIsLoading(false);
          return;
        }
        
        // If feedback exists, mark it as resolved
        if (feedback && feedback.id && feedback.status !== "resolved" && updated) {
          const feedbackRef = doc(db, "feedback", feedback.id);
          await updateDoc(feedbackRef, {
            status: "resolved",
            resolvedAt: new Date(),
            resolvedBy: userId // Use the authenticated user's ID
          });
          
          // Add an additional message for resolved feedback
          toast.success("Feedback marked as resolved");
        }
        
        // Redirect back to the feedback page after a short time
        setTimeout(() => {
          router.push("/admin/feedback");
        }, 1500);
      } else {
        setError(`Roadmap with ID ${roadmap.id} not found`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error updating section:", error);
      setError(`Error updating section: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-2"></div>
              <span className="text-gray-400">Loading section data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error || !roadmap) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardContent className="p-8">
            <Alert className="bg-red-900 border-red-800 text-white">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>{error || "Section not found"}</AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={() => router.push("/admin/feedback")}
                variant="outline"
                className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Edit Roadmap Section
        </h1>
        <Button 
          onClick={() => router.push("/admin/feedback")}
          variant="outline"
          size="sm"
          className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feedback
        </Button>
      </div>
      
      {/* Feedback Context Panel */}
      {feedback && (
        <Card className="bg-gray-900 border-gray-800 mb-6 shadow-xl">
          <CardHeader className="border-b border-gray-800 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 pb-4">
            <CardTitle className="text-white text-lg flex items-center">
              <FileText className="h-5 w-5 text-blue-400 mr-2" />
              Feedback Context
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`px-2 py-1 rounded-md text-xs font-medium border ${
                  feedback.priority === "high" 
                    ? "bg-red-600/20 text-red-400 border-red-800" 
                    : feedback.priority === "low" 
                      ? "bg-blue-600/20 text-blue-400 border-blue-800"
                      : "bg-amber-600/20 text-amber-400 border-amber-800"
                }`}>
                  {feedback.priority ? `Priority: ${feedback.priority}` : "Priority: Medium"}
                </div>
                
                <div className={`px-2 py-1 rounded-md text-xs font-medium border ${feedback.status === "resolved" 
                  ? "bg-green-600/20 text-green-400 border-green-800" 
                  : "bg-amber-600/20 text-amber-400 border-amber-800"}`}>
                  {feedback.status === "resolved" ? "Resolved" : "Pending"}
                </div>
                
                <span className="text-sm text-gray-400">
                  {feedback.createdAt ? new Date(feedback.createdAt).toLocaleString() : ""}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-1">{feedback.title}</h3>
                <div className="bg-gray-800/80 p-3 rounded-md text-gray-300 text-sm whitespace-pre-wrap">
                  {feedback.description}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Editor Card */}
      <Card className="bg-gray-900 border-gray-800 shadow-xl">
        <CardHeader className="border-b border-gray-800 bg-gradient-to-r from-indigo-900/40 to-purple-900/40">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-xl">
              {editedSection.title ? editedSection.title : "Edit Section"}
            </CardTitle>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="py-6">
            {error && (
              <Alert className="mb-6 bg-red-900 border-red-800 text-white">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Section Title */}
            <div className="mb-6">
              <label htmlFor="section-title" className="block text-sm font-medium text-gray-300 mb-2">
                Section Title
              </label>
              <input
                id="section-title"
                type="text"
                value={editedSection.title || ''}
                onChange={(e) => setEditedSection({...editedSection, title: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                placeholder="Enter section title"
              />
            </div>
            
            {/* Section Description */}
            <div className="mb-6">
              <label htmlFor="section-description" className="block text-sm font-medium text-gray-300 mb-2">
                Section Description
              </label>
              <Textarea
                id="section-description"
                value={editedSection.description || ''}
                onChange={(e) => setEditedSection({...editedSection, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white min-h-[120px] w-full"
                placeholder="Enter section description"
              />
            </div>
            
            {/* Resources Section */}
            {editedSection.resources && editedSection.resources.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-200 mb-3">
                  Resources
                </h3>
                <div className="bg-gray-800/50 rounded-md p-4 space-y-4">
                  {editedSection.resources.map((resource, index) => (
                    <div key={index} className="p-3 border border-gray-700 rounded-md bg-gray-800/60">
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Resource Title
                        </label>
                        <input
                          type="text"
                          value={resource.title || ''}
                          onChange={(e) => {
                            const newResources = [...editedSection.resources!];
                            newResources[index] = { ...newResources[index], title: e.target.value };
                            setEditedSection({ ...editedSection, resources: newResources });
                          }}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm"
                          placeholder="Resource title"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Resource URL
                        </label>
                        <input
                          type="text"
                          value={resource.url || ''}
                          onChange={(e) => {
                            const newResources = [...editedSection.resources!];
                            newResources[index] = { ...newResources[index], url: e.target.value };
                            setEditedSection({ ...editedSection, resources: newResources });
                          }}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white text-sm"
                          placeholder="Resource URL"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Resource Description
                        </label>
                        <Textarea
                          value={resource.description || ''}
                          onChange={(e) => {
                            const newResources = [...editedSection.resources!];
                            newResources[index] = { ...newResources[index], description: e.target.value };
                            setEditedSection({ ...editedSection, resources: newResources });
                          }}
                          className="bg-gray-800 border-gray-700 text-white min-h-[80px] text-sm w-full"
                          placeholder="Resource description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section Metadata */}
            <div className="bg-gray-800/50 p-4 rounded-md border border-gray-700 mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Section Information</h3>
              <hr className="border-gray-700 mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">ID:</span>{" "}
                  <span className="text-gray-200 font-mono text-xs">{editedSection.id}</span>
                </div>
                
                {editedSection.sectionId && (
                  <div>
                    <span className="text-gray-400">Parent Section:</span>{" "}
                    <span className="text-gray-200">{editedSection.sectionTitle}</span>
                  </div>
                )}
                
                {editedSection.roadmapTitle && (
                  <div>
                    <span className="text-gray-400">Roadmap:</span>{" "}
                    <span className="text-gray-200">{editedSection.roadmapTitle}</span>
                  </div>
                )}
                
                {typeof editedSection.order === 'number' && (
                  <div>
                    <span className="text-gray-400">Order:</span>{" "}
                    <span className="text-gray-200">{editedSection.order}</span>
                  </div>
                )}
                
                {editedSection.difficulty && (
                  <div>
                    <span className="text-gray-400">Difficulty:</span>{" "}
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border inline-block ${
                      editedSection.difficulty === "beginner" ? "bg-green-900/40 text-green-300 border-green-800" :
                      editedSection.difficulty === "intermediate" ? "bg-blue-900/40 text-blue-300 border-blue-800" :
                      "bg-purple-900/40 text-purple-300 border-purple-800"
                    }`}>
                      {editedSection.difficulty}
                    </span>
                  </div>
                )}
                
                {editedSection.duration && (
                  <div>
                    <span className="text-gray-400">Duration:</span>{" "}
                    <span className="text-gray-200">{editedSection.duration}</span>
                  </div>
                )}
              
                {editedSection.status && (
                  <div>
                    <span className="text-gray-400 block mb-1">Status:</span>
                    <select 
                      value={editedSection.status as string}
                      onChange={(e) => setEditedSection({...editedSection, status: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t border-gray-800 pt-6 gap-4">
            <Button 
              type="button"
              onClick={() => router.push("/admin/feedback")}
              variant="outline"
              className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
            
            <div className="flex gap-2">
              {feedback && feedback.status === "pending" && (
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update & Resolve Feedback
                </Button>
              )}
              
              <Button 
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 