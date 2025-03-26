"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { FaArrowLeft, FaSave, FaPlus, FaTrash, FaChevronRight, FaRobot } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import { use } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interfaces for data structure
interface SubTask {
  id: string;
  title: string;
  description: string;
  content: string;
  completed?: boolean;
}

interface RoadmapSection {
  id: string;
  title: string;
  description: string;
  subtasks: SubTask[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string;
  experienceLevel: string;
  requiredSkills: string[];
  isPublic: boolean;
  isOfficial: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sections?: RoadmapSection[];
}

// Markdown preview component
const MarkdownPreview = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-invert max-w-none 
      prose-headings:font-bold prose-headings:text-white
      prose-p:text-gray-300 prose-p:my-2.5
      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
      prose-blockquote:text-gray-400 prose-blockquote:italic prose-blockquote:not-italic
      prose-code:text-yellow-300 
      prose-li:text-gray-300
      "
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <div className="group relative border-b border-indigo-500/30 mb-4 pb-1">
              <div className="absolute -left-4 top-1.5 font-mono text-indigo-500/60 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                #
              </div>
              <h1 className="text-2xl font-bold text-white">{children}</h1>
            </div>
          ),
          h2: ({ children }) => (
            <div className="group relative border-b border-indigo-400/20 mt-6 mb-3 pb-1">
              <div className="absolute -left-4 top-1 font-mono text-indigo-400/60 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                ##
              </div>
              <h2 className="text-xl font-bold text-white/95">{children}</h2>
            </div>
          ),
          h3: ({ children }) => (
            <div className="group relative mt-5 mb-2">
              <div className="absolute -left-4 top-1 font-mono text-indigo-300/60 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                ###
              </div>
              <h3 className="text-lg font-bold text-white/90">{children}</h3>
            </div>
          ),
          h4: ({ children }) => (
            <div className="group relative mt-4 mb-2">
              <div className="absolute -left-4 top-0.5 font-mono text-indigo-300/50 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                ####
              </div>
              <h4 className="text-base font-bold text-white/85">{children}</h4>
            </div>
          ),
          p: ({ children }) => (
            <p className="my-2.5 text-gray-300 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <div className="my-3 pl-1 border-l-2 border-indigo-500/20">
              <ul className="list-none space-y-1.5 pl-4">{children}</ul>
            </div>
          ),
          ol: ({ children }) => (
            <div className="my-3 pl-1 border-l-2 border-indigo-500/20">
              <ol className="list-none space-y-1.5 pl-4">{children}</ol>
            </div>
          ),
          li: ({ children }) => (
            <li className="relative flex gap-2 items-baseline">
              <span className="text-indigo-400/60 absolute -left-5 opacity-60">•</span>
              <span>{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="relative my-4 pl-4 py-1 italic border-l-2 border-indigo-400/40 bg-indigo-500/5 rounded-sm">
              <div className="absolute left-1.5 top-0 text-indigo-400/40 text-xl">&ldquo;</div>
              <div className="pl-2">{children}</div>
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-400 border-b border-blue-400/30 pb-px no-underline inline-flex items-center group" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 ml-0.5 opacity-60 group-hover:translate-x-0.5 transition-transform">
                <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
              </svg>
            </a>
          ),
          code: function Code(props) {
            const { className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            
            if (!className) {
              return (
                <code className="bg-indigo-950/50 text-yellow-300 px-1.5 py-0.5 rounded mx-0.5 font-mono text-sm" {...rest}>
                  {children}
                </code>
              );
            }
            
            return (
              <div className="my-4 rounded-md overflow-hidden border border-indigo-500/20">
                <div className="flex items-center justify-between bg-indigo-950/70 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-300/70">{language || "code"}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-400/30"></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-400/30"></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-400/30"></div>
                  </div>
                </div>
                <div className="bg-gray-950/90 p-3 overflow-x-auto text-sm">
                  <pre className="font-mono text-gray-300">
                    <code {...rest}>{children}</code>
                  </pre>
                </div>
              </div>
            );
          },
          table: (props) => (
            <div className="my-4 overflow-x-auto border border-indigo-500/20 rounded-md">
              <table className="min-w-full" {...props} />
            </div>
          ),
          thead: (props) => (
            <thead className="bg-indigo-950/50 border-b border-indigo-500/20" {...props} />
          ),
          th: (props) => (
            <th className="px-3 py-2 text-left text-sm font-semibold text-white/90" {...props} />
          ),
          td: (props) => (
            <td className="px-3 py-2 text-sm border-t border-indigo-500/10" {...props} />
          ),
          hr: () => (
            <hr className="my-6 border-none h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white/90">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-300/90">{children}</em>
          ),
          img: ({ src, alt }) => (
            <div className="my-4 rounded-md overflow-hidden border border-indigo-500/20 bg-gray-950/50">
              <img src={src} alt={alt} className="max-w-full h-auto" />
              {alt && <div className="px-3 py-1.5 text-xs text-center text-gray-400 bg-indigo-950/70">{alt}</div>}
            </div>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function EditRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // State for basic roadmap info
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  // State for sections and subtasks
  const [sections, setSections] = useState<RoadmapSection[]>([]);
  
  // State for UI navigation
  const [activeTab, setActiveTab] = useState("info");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  
  // Load roadmap data
  useEffect(() => {
    const fetchRoadmap = async () => {
      setInitialLoading(true);
      try {
        const docRef = doc(db, "roadmaps", resolvedParams.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Set basic roadmap info
          setRoadmap({
            id: docSnap.id,
            title: data.title || "Untitled Roadmap",
            description: data.description || "",
            experienceLevel: data.experienceLevel || data.difficulty || "beginner",
            requiredSkills: data.requiredSkills || [],
            isPublic: data.isPublic || false,
            isOfficial: data.isOfficial || false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Roadmap);
          
          // Set sections and subtasks
          if (data.sections && Array.isArray(data.sections)) {
            setSections(data.sections.map((section: RoadmapSection) => ({
              id: section.id || uuidv4(),
              title: section.title || "",
              description: section.description || "",
              subtasks: Array.isArray(section.subtasks) 
                ? section.subtasks.map((subtask: SubTask) => ({
                    id: subtask.id || uuidv4(),
                    title: subtask.title || "",
                    description: subtask.description || "",
                    content: subtask.content || "",
                    completed: subtask.completed || false
                  })) 
                : []
            })));
          }
        } else {
          toast.error("Roadmap not found");
          router.push("/admin/roadmaps");
        }
      } catch (error) {
        console.error("Error fetching roadmap:", error);
        toast.error("Could not load roadmap");
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchRoadmap();
  }, [resolvedParams.id, router]);
  
  // Get active section
  const activeSection = activeSectionId 
    ? sections.find(s => s.id === activeSectionId) 
    : null;
  
  // Get active subtask
  const activeSubtask = activeSection && activeSubtaskId
    ? activeSection.subtasks.find(st => st.id === activeSubtaskId)
    : null;
  
  // Update basic roadmap fields
  const handleChange = (field: string, value: string | boolean | string[]) => {
    if (roadmap) {
      setRoadmap({
        ...roadmap,
        [field]: value
      });
    }
  };

  // Add a new section
  const addSection = () => {
    const newSectionId = uuidv4();
    const newSection = {
      id: newSectionId,
      title: `Section ${sections.length + 1}`,
      description: "",
      subtasks: []
    };
    
    setSections([...sections, newSection]);
    setActiveSectionId(newSectionId);
    setActiveSubtaskId(null);
    setActiveTab("sections");
  };

  // Update section fields
  const updateSection = (field: string, value: string) => {
    if (!activeSectionId) return;
    
    setSections(sections.map(section => 
      section.id === activeSectionId
        ? { ...section, [field]: value }
        : section
    ));
  };

  // Delete a section
  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
    
    if (activeSectionId === sectionId) {
      setActiveSectionId(null);
      setActiveSubtaskId(null);
    }
  };

  // Add a subtask to active section
  const addSubtask = () => {
    if (!activeSectionId) return;
    
    const newSubtaskId = uuidv4();
    const newSubtask = {
      id: newSubtaskId,
      title: `Subtask ${activeSection?.subtasks.length ? activeSection.subtasks.length + 1 : 1}`,
      description: "",
      content: "",
      completed: false
    };
    
    setSections(sections.map(section => 
      section.id === activeSectionId
        ? { 
            ...section, 
            subtasks: [...section.subtasks, newSubtask] 
          }
        : section
    ));
    
    setActiveSubtaskId(newSubtaskId);
  };

  // Update subtask fields
  const updateSubtask = (field: string, value: string) => {
    if (!activeSectionId || !activeSubtaskId) return;
    
    setSections(sections.map(section => 
      section.id === activeSectionId
        ? { 
            ...section, 
            subtasks: section.subtasks.map(subtask => 
              subtask.id === activeSubtaskId
                ? { ...subtask, [field]: value }
                : subtask
            ) 
          }
        : section
    ));
  };

  // Delete a subtask
  const deleteSubtask = (subtaskId: string) => {
    if (!activeSectionId) return;
    
    setSections(sections.map(section => 
      section.id === activeSectionId
        ? { 
            ...section, 
            subtasks: section.subtasks.filter(subtask => subtask.id !== subtaskId) 
          }
        : section
    ));
    
    if (activeSubtaskId === subtaskId) {
      setActiveSubtaskId(null);
    }
  };

  // Check if roadmap is valid for saving
  const isValid = () => {
    if (!roadmap?.title.trim()) return false;
    if (sections.length === 0) return false;
    
    // Check if all sections have titles
    const allSectionsValid = sections.every(section => section.title.trim() !== "");
    if (!allSectionsValid) return false;
    
    // Check if all subtasks have titles
    const allSubtasksValid = sections.every(section => 
      section.subtasks.every(subtask => subtask.title.trim() !== "")
    );
    
    return allSubtasksValid;
  };

  // Generate AI description
  const generateDescription = async () => {
    if (!roadmap?.title) {
      toast.error("Please enter a title first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a detailed description for a roadmap titled "${roadmap.title}". The description should explain the purpose, goals, and expected outcomes of this learning path.`,
        }),
      });
      
      const data = await response.json();
      
      if (roadmap) {
        setRoadmap({
          ...roadmap,
          description: data.data.description
        });
      }
      
      toast.success("Description generated successfully!");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Could not generate description");
    } finally {
      setLoading(false);
    }
  };

  // Generate AI subtask content
  const generateSubtaskContent = async () => {
    if (!activeSubtask?.title || !activeSectionId || !roadmap?.title) {
      toast.error("Roadmap title, section title, and subtask title are required");
      return;
    }
    
    setLoading(true);
    toast.promise(
      fetch('/api/roadmap/subtask-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapTitle: roadmap.title,
          sectionTitle: activeSection?.title || "",
          subtaskTitle: activeSubtask.title,
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error generating content');
          }
          return response.json();
        })
        .then(data => {
          updateSubtask("content", data.data.description);
          return true;
        }),
      {
        loading: 'Generating content...',
        success: 'Content generated!',
        error: 'Error generating content'
      }
    ).finally(() => setLoading(false));
  };

  // Generate AI description for section
  const generateSectionDescription = async () => {
    if (!roadmap?.title || !activeSectionId || !activeSection?.title) {
      toast.error("Roadmap title and section title are required");
      return;
    }
    
    setLoading(true);
    toast.promise(
      fetch('/api/roadmap/section-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapTitle: roadmap.title,
          sectionTitle: activeSection.title,
          experienceLevel: roadmap.experienceLevel,
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error generating section description');
          }
          return response.json();
        })
        .then(data => {
          updateSection("description", data.data.description);
          return true;
        }),
      {
        loading: 'Generating section description...',
        success: 'Section description generated!',
        error: 'Error generating section description'
      }
    ).finally(() => setLoading(false));
  };

  // Generate AI subtask description
  const generateSubtaskDescription = async () => {
    if (!activeSubtask?.title || !activeSectionId || !roadmap?.title) {
      toast.error("Roadmap title, section title, and subtask title are required");
      return;
    }
    
    setLoading(true);
    toast.promise(
      fetch('/api/roadmap/subtask-short-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapTitle: roadmap.title,
          sectionTitle: activeSection?.title || "",
          subtaskTitle: activeSubtask.title,
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error generating subtask description');
          }
          return response.json();
        })
        .then(data => {
          updateSubtask("description", data.data.description);
          return true;
        }),
      {
        loading: 'Generating description...',
        success: 'Description generated!',
        error: 'Error generating description'
      }
    ).finally(() => setLoading(false));
  };

  // Save roadmap updates
  const handleSave = async () => {
    if (!roadmap) return;
    
    setLoading(true);
    try {
      const updatedRoadmap = {
        ...roadmap,
        title: roadmap.title,
        description: roadmap.description,
        experienceLevel: roadmap.experienceLevel,
        requiredSkills: roadmap.requiredSkills,
        isPublic: roadmap.isPublic,
        isOfficial: roadmap.isOfficial,
        updatedAt: Timestamp.now(),
        lastModifiedBy: "admin", // În viitor, vom folosi ID-ul utilizatorului real
        lastModifiedAt: Timestamp.now(),
        sections: sections.map(section => ({
          id: section.id,
          title: section.title,
          description: section.description,
          lastModifiedBy: "admin",
          lastModifiedAt: Timestamp.now(),
          subtasks: section.subtasks.map(subtask => ({
            id: subtask.id,
            title: subtask.title,
            description: subtask.description,
            content: subtask.content,
            completed: subtask.completed || false,
            lastModifiedBy: "admin",
            lastModifiedAt: Timestamp.now(),
          }))
        }))
      };

      await updateDoc(doc(db, "roadmaps", resolvedParams.id), updatedRoadmap);
      toast.success("Roadmap updated successfully!");
      router.push(`/admin/roadmaps/${resolvedParams.id}`);
    } catch (error) {
      console.error("Error updating roadmap:", error);
      toast.error("Could not update roadmap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/admin/roadmaps/${resolvedParams.id}`}>
          <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/10">
            <FaArrowLeft />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold">Edit Roadmap</h2>
      </div>

      {initialLoading ? (
        <div className="flex justify-center my-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Navigation sidebar - Now wider */}
          <div className="lg:col-span-4">
            <Card className="sticky top-4 bg-black/20 backdrop-blur-sm ">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Navigation</CardTitle>
                <CardDescription>Edit your roadmap step by step</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <Button 
                  variant={activeTab === "info" ? "default" : "outline"}
                  className={`${activeTab !== "info" ? 'border-primary/20 hover:bg-primary/10' : ''} w-full justify-start`}
                  onClick={() => {
                    setActiveTab("info");
                    setActiveSectionId(null);
                    setActiveSubtaskId(null);
                  }}
                >
                  Basic Information
                </Button>
                
                <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-2" />
                
                <div className="p-4 border border-gray-700 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Sections</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSection}
                      className="h-8 border-primary/20 hover:bg-primary/10"
                    >
                      <FaPlus className="h-3 w-3 mr-2" /> Add
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {sections.length === 0 ? (
                      <div className="rounded-md border border-dashed border-primary/20 p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          No sections yet
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={addSection}
                          className="border-primary/20 hover:bg-primary/10"
                        >
                          <FaPlus className="mr-2 h-3 w-3" /> Add First Section
                        </Button>
                      </div>
                    ) : (
                      sections.map((section, index) => (
                        <div key={section.id} className="group rounded-md border border-primary/20 p-2 bg-slate-800 hover:bg-slate-700 transition-all">
                          <div className="flex items-center gap-1 mb-1 w-full">
                            <Button
                              variant={activeSectionId === section.id && !activeSubtaskId ? "default" : "ghost"}
                              size="sm"
                              className={`text-sm h-8 ${activeSectionId !== section.id || activeSubtaskId ? 'hover:bg-primary/10' : ''} flex-1 justify-start overflow-hidden`}
                              onClick={() => {
                                setActiveTab("sections");
                                setActiveSectionId(section.id);
                                setActiveSubtaskId(null);
                              }}
                            >
                              <span className="font-medium mr-2">{index + 1}.</span> 
                              <span className="truncate">{section.title || `Section ${index + 1}`}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 rounded-full"
                              onClick={() => deleteSection(section.id)}
                            >
                              <FaTrash className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                          
                          {/* Separator between section title and subtasks */}
                          {section.subtasks.length > 0 && (
                            <div className="h-px bg-gray-700 my-1 mx-2" />
                          )}
                          
                          {/* Subtasks for this section */}
                          <div className="space-y-1">
                            {section.subtasks.map((subtask, stIndex) => (
                              <div key={subtask.id} className="ml-3 group/subtask flex items-center gap-1 w-full">
                                <Button
                                  variant={activeSubtaskId === subtask.id ? "default" : "ghost"}
                                  size="sm"
                                  className={`text-xs h-7 ${activeSubtaskId !== subtask.id ? 'hover:bg-primary/10' : ''} flex-1 justify-start pl-2 overflow-hidden`}
                                  onClick={() => {
                                    setActiveTab("sections");
                                    setActiveSectionId(section.id);
                                    setActiveSubtaskId(subtask.id);
                                  }}
                                >
                                  <span className="opacity-70 mr-1">{index + 1}.{stIndex + 1}</span> 
                                  <span className="truncate">{subtask.title || `Subtask ${stIndex + 1}`}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 flex-shrink-0 opacity-0 group-hover/subtask:opacity-100 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 rounded-full mr-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSubtask(subtask.id);
                                  }}
                                >
                                  <FaTrash className="h-1.5 w-1.5" />
                                </Button>
                              </div>
                            ))}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveSectionId(section.id);
                                addSubtask();
                              }}
                              className="ml-3 text-xs h-7 justify-start pl-2 text-gray-400 hover:text-primary-foreground hover:bg-primary/90 w-auto border border-gray-700 rounded-md"
                            >
                              <FaPlus className="h-1.8 w-1.8 mr-1" /> Add Subtask
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />
                
                <div>
                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                    disabled={!isValid() || loading}
                    onClick={handleSave}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Basic Information Tab */}
            {activeTab === "info" && (
              <Card className="bg-black/20 backdrop-blur-sm border border-gray-700">
                <CardHeader>
                  <CardTitle>Roadmap Information</CardTitle>
                  <CardDescription>
                    Edit the basic details for your roadmap
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                    <Input
                      id="title"
                      placeholder="Enter roadmap title"
                      value={roadmap?.title || ""}
                      onChange={(e) => handleChange("title", e.target.value)}
                      required
                      className="border-gray-700 bg-black/30"
                    />
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateDescription}
                        disabled={loading}
                        className="h-8 border-gray-700 hover:bg-primary/10 text-white"
                      >
                        <FaRobot className="mr-2 h-3 w-3" /> Generate with AI
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Enter a detailed description"
                      value={roadmap?.description || ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="min-h-[200px] border-gray-700 bg-black/30"
                    />
                    {roadmap?.description && (
                      <div className="mt-4 border border-gray-700 rounded-md overflow-hidden">
                        <div className="bg-slate-900 border-b border-gray-700 px-4 py-2 flex items-center">
                          <Label className="font-medium">Preview</Label>
                        </div>
                        <div className="bg-slate-800 p-6 overflow-auto max-h-[400px]">
                          <MarkdownPreview content={roadmap.description} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />

                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select 
                      value={roadmap?.experienceLevel} 
                      onValueChange={(value) => handleChange("experienceLevel", value)}
                    >
                      <SelectTrigger className="border-gray-700 bg-black/30">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-gray-700 text-white">
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requiredSkills">Required Skills (separate with commas)</Label>
                    <Textarea
                      id="requiredSkills"
                      placeholder="Ex: HTML, CSS, JavaScript"
                      value={roadmap?.requiredSkills.join(", ") || ""}
                      onChange={(e) => handleChange("requiredSkills", e.target.value.split(", ").filter(Boolean))}
                      className="border-gray-700 bg-black/30"
                    />
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublic"
                      checked={roadmap?.isPublic}
                      onCheckedChange={(checked) => handleChange("isPublic", checked)}
                    />
                    <Label htmlFor="isPublic">Make this roadmap public</Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sections Tab */}
            {activeTab === "sections" && (
              <>
                {!activeSectionId ? (
                  <Card className="bg-black/20 backdrop-blur-sm border border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">Select a section from the sidebar or add a new one</p>
                      <Button onClick={addSection} className="border-gray-700 bg-primary/10 hover:bg-primary/20">
                        <FaPlus className="mr-2" /> Add Section
                      </Button>
                    </CardContent>
                  </Card>
                ) : !activeSubtaskId ? (
                  // Section Editing
                  <Card className="bg-black/20 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Edit Section</CardTitle>
                      <CardDescription>
                        Define this section and add subtasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="section-title">Section Title <span className="text-red-500">*</span></Label>
                        <Input
                          id="section-title"
                          placeholder="Enter section title"
                          value={activeSection?.title || ""}
                          onChange={(e) => updateSection("title", e.target.value)}
                          className="border-gray-700 bg-black/30"
                        />
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="section-description">Section Description</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateSectionDescription}
                            disabled={loading}
                            className="h-8 border-gray-700 hover:bg-primary/10 text-white"
                          >
                            <FaRobot className="mr-2 h-3 w-3" /> Generate with AI
                          </Button>
                        </div>
                        <Textarea
                          id="section-description"
                          placeholder="Enter section description"
                          value={activeSection?.description || ""}
                          onChange={(e) => updateSection("description", e.target.value)}
                          className="min-h-[100px] border-gray-700 bg-black/30"
                        />
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Subtasks</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addSubtask}
                            className="border-gray-700 hover:bg-primary/10"
                          >
                            <FaPlus className="mr-2" /> Add Subtask
                          </Button>
                        </div>
                        
                        {activeSection?.subtasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 bg-slate-800 rounded-md border border-dashed border-gray-700">
                            <p className="text-muted-foreground mb-2">No subtasks yet for this section</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={addSubtask}
                              className="border-gray-700 hover:bg-primary/10"
                            >
                              <FaPlus className="mr-2" /> Add First Subtask
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {activeSection?.subtasks.map((subtask, index) => (
                              <div 
                                key={subtask.id}
                                className="p-3 border rounded-md flex justify-between items-center border-gray-700 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all"
                                onClick={() => setActiveSubtaskId(subtask.id)}
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{index + 1}. {subtask.title}</p>
                                  {subtask.description && (
                                    <p className="text-sm text-muted-foreground truncate">{subtask.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all duration-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteSubtask(subtask.id);
                                    }}
                                  >
                                    <FaTrash className="h-1.5 w-1.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Subtask Editing
                  <Card className="bg-black/20 backdrop-blur-sm border border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Edit Subtask</CardTitle>
                          <CardDescription>
                            Add content for this learning task
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          className="flex items-center text-sm hover:bg-primary/10"
                          onClick={() => setActiveSubtaskId(null)}
                        >
                          Back to Section <FaChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="subtask-title">Subtask Title <span className="text-red-500">*</span></Label>
                        <Input
                          id="subtask-title"
                          placeholder="Enter subtask title"
                          value={activeSubtask?.title || ""}
                          onChange={(e) => updateSubtask("title", e.target.value)}
                          className="border-gray-700 bg-black/30"
                        />
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="subtask-description">Short Description</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateSubtaskDescription}
                            disabled={loading}
                            className="h-8 border-gray-700 hover:bg-primary/10 text-white"
                          >
                            <FaRobot className="mr-2 h-3 w-3" /> Generate with AI
                          </Button>
                        </div>
                        <Textarea
                          id="subtask-description"
                          placeholder="Enter a brief description"
                          value={activeSubtask?.description || ""}
                          onChange={(e) => updateSubtask("description", e.target.value)}
                          className="min-h-[100px] border-gray-700 bg-black/30"
                        />
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-3" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="subtask-content">Content (Markdown Supported)</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateSubtaskContent}
                            disabled={loading}
                            className="h-8 border-gray-700 hover:bg-primary/10 text-white"
                          >
                            <FaRobot className="mr-2 h-3 w-3" /> Generate with AI
                          </Button>
                        </div>
                        <Tabs defaultValue="edit" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 bg-black/30">
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                          </TabsList>
                          <TabsContent value="edit" className="p-0 border-0">
                            <Textarea
                              id="subtask-content"
                              placeholder="Write content with Markdown support"
                              value={activeSubtask?.content || ""}
                              onChange={(e) => updateSubtask("content", e.target.value)}
                              className="min-h-[300px] font-mono border-gray-700 bg-black/30"
                            />
                          </TabsContent>
                          <TabsContent value="preview" className="p-0 border-0">
                            <div className="border border-gray-700 rounded-md overflow-hidden">
                              <div className="bg-slate-900 border-b border-gray-700 px-4 py-2 flex items-center">
                                <span className="font-medium">Preview</span>
                              </div>
                              <div className="bg-slate-800 p-6 overflow-auto max-h-[500px]">
                                <MarkdownPreview content={activeSubtask?.content || ""} />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        <p className="text-xs text-muted-foreground mt-2">
                          Use Markdown to format your content. Supports headings, lists, code blocks, links, and more.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 