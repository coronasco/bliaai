"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  FaPlus, FaCheck, FaRoad, FaSearch, FaSpinner, FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaBookReader,
  FaBrain, FaBug, FaCheckCircle, FaCrown, FaChartLine, FaFilter, FaWifi, FaExclamationCircle,
  FaTrash, FaMinus
} from "react-icons/fa";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogFooter, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Globe, Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { CareerCreationModal } from "@/components/shared/CareerCreationModal";

import QuizController from "@/components/shared/quiz/QuizController";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, collection, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
// Importăm noul component pentru explorarea roadmap-urilor
import ExploreRoadmapsModal from "@/components/explore/ExploreRoadmapsModal";
// Pentru compatibilitate retroactivă cu codul existent, definim un tip general pentru task-uri
type MainTaskType = {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  progress?: number;
};

// Add type for error handling
type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}

// Remove unused types
type FilterType = "all" | "completed" | "in-progress" | "not-started";

export interface RoadmapStep {
  title: string;
  description: string;
  tasks: string[];
}

export type RoadmapType = {
  id: string;
  title: string;
  description?: string;
  steps?: RoadmapStep[];
  sections: {
    id?: string;
    title: string;
    progress: number;
    position?: number;
    dependencies?: string[];
    tutorial?: string;
    description?: string;
    subsections?: {
      id?: string;
      title: string;
      completed: boolean;
      pathId?: string;
      position?: number;
      isPending?: boolean;
      description?: string;
      prerequisites?: string[];
      resources?: {
        title: string;
        url: string;
        type: string;
        description: string;
      }[];
      practicalExercises?: string[];
      validationCriteria?: string[];
    }[];
    subtasks?: {
      id?: string;
      title: string;
      completed: boolean;
      pathId?: string;
      position?: number;
      isPending?: boolean;
      description?: string;
      prerequisites?: string[];
      resources?: {
        title: string;
        url: string;
        type: string;
        description: string;
      }[];
      practicalExercises?: string[];
      validationCriteria?: string[];
    }[];
  }[];
  requiredSkills?: string[];
  userId?: string;
  isPublic?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isOriginal?: boolean;
};

type RoadmapGenerationOptions = {
  title: string;
  description: string;
  timeframe?: string;
  learningFocus?: string;
  currentSkills?: string;
  preferredResources?: string[];
};

type CareerRoadmapProps = {
  roadmap: RoadmapType | null;
  allRoadmaps?: RoadmapType[];
  onlineStatus: boolean;
  isPremium: boolean;
  handleGenerateRoadmap: (level: string, options?: RoadmapGenerationOptions) => Promise<void>;
  handleOpenCreateCareer: () => void;
  setRoadmap: (roadmap: RoadmapType | null) => void;
  detailedRoadmap?: {
    sections: MainTaskType[];
    requiredSkills?: string[];
    careerDescription?: string;
  };
  handleDeleteRoadmap?: () => Promise<void>;
  isOwner?: boolean;
  handleGeneratePathForSubtask?: (sectionIndex: number, subtaskIndex: number, description: string) => Promise<string | undefined>;
  currentUserId?: string; // ID-ul utilizatorului curent (proprietarul sesiunii)
};

// Add issue reporting schema for validation
// const issueFormSchema = z.object({
//   title: z.string().min(3, { message: "Issue title must be at least 3 characters" }),
//   description: z.string().min(10, { message: "Description must be at least 10 characters" }),
// });

const CareerRoadmap = ({
  roadmap,
  allRoadmaps = [],
  onlineStatus,
  isPremium,
  handleOpenCreateCareer,
  setRoadmap,
  detailedRoadmap,
  handleDeleteRoadmap,
  isOwner = false,
  handleGeneratePathForSubtask,
  currentUserId
}: CareerRoadmapProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [cacheKey, setCacheKey] = useState<number>(Date.now());
  
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);
  const [tutorialGenerating, setTutorialGenerating] = useState(false);
  const [currentSubtask, setCurrentSubtask] = useState<{
    title: string;
    description?: string;
    sectionTitle: string;
    sectionIndex: number;
    subtaskIndex: number;
  } | null>(null);
  
  // State-uri pentru issue reporting
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSubtask, setIssueSubtask] = useState<{
    id?: string;
    title: string;
    sectionTitle: string;
    sectionId?: string;
  } | null>(null);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  
  // Adăugăm un nou state pentru a controla modalul
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  
  // Adăugăm noi state-uri pentru afișarea loadingului și generarea detaliilor
  const [loadingSubtaskDetails, setLoadingSubtaskDetails] = useState<{
    sectionId: string;
    subtaskId: string;
  } | null>(null);
  
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  
  // Stare pentru generarea path-urilor
  const [isPathGenerating, setIsPathGenerating] = useState<boolean>(false);
  
  // Adăugăm state pentru a gestiona afișarea roadmap-urilor disponibile
  const [showRoadmapSelector, setShowRoadmapSelector] = useState(false);
  
  // Adăugăm state pentru a gestiona afișarea modalului de explorare roadmap-uri
  const [showExploreModal, setShowExploreModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Corectăm calculul pentru a permite utilizatorilor premium să creeze până la 4 roadmap-uri
  const maxRoadmaps = isPremium ? 4 : 1;
  const canCreateNewRoadmap = allRoadmaps.length < maxRoadmaps;
  
  // Function to clean and format titles for display
  const cleanTitle = (title: string): string => {
    // Înlocuim cratime și underscore cu spații
    const spacedTitle = title.replace(/[-_]/g, ' ');
    
    // Capitalizăm primul cuvânt și fiecare cuvânt după spațiu
    return spacedTitle
      .split(' ')
      .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .trim();
  };
  
  // Initialize expandedSections when roadmap changes
  useEffect(() => {
    if (roadmap) {
      normalizeRoadmapData();
      
      // Dacă avem un roadmap detaliat, adăugăm informații suplimentare
      if (detailedRoadmap && detailedRoadmap.sections) {
        setRoadmap({
          ...roadmap,
          requiredSkills: detailedRoadmap.requiredSkills || roadmap.requiredSkills
        });
      }
      
      // Actualizăm cacheKey la fiecare modificare a roadmap-ului
      setCacheKey(Date.now());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap, detailedRoadmap, setRoadmap]);

  // Funcția pentru a normaliza datele roadmap-ului
  const normalizeRoadmapData = () => {
    if (!roadmap || !roadmap.sections) return;
    
    // Parcurgem fiecare secțiune și ne asigurăm că are un array subsections
    roadmap.sections.forEach(section => {
      // Dacă secțiunea are subtasks dar nu are subsections, transferăm datele
      if (section.subtasks && (!section.subsections || section.subsections.length === 0)) {
        section.subsections = section.subtasks;
      }
      // Dacă există subsections dar nu subtasks, copiem în subtasks pentru compatibilitate
      else if (section.subsections && (!section.subtasks || section.subtasks.length === 0)) {
        section.subtasks = section.subsections;
      }
    });
  };
  
  // Funcție auxiliară pentru a obține array-ul de subtask-uri
  const getSubtasks = (section: RoadmapType['sections'][0]) => {
    return section.subsections || section.subtasks || [];
  };
  
  // Funcție pentru a obține numărul de subtask-uri
  const getSubtaskCount = (section: RoadmapType['sections'][0]) => {
    const subtasks = getSubtasks(section);
    return subtasks.length;
  };

  // Function to check if a section is expanded
  const isSectionExpanded = (sectionTitle: string): boolean => {
    return expandedSections.has(sectionTitle);
  };

  // Function to show all sections or hide them all
  const toggleAllSections = (expand: boolean) => {
    if (!roadmap) return;
    
    console.log(`toggleAllSections(${expand})`);
    
    // Creez un nou Set pentru a evita problemele de referință
    const newExpandedSections = new Set<string>();
    
    if (expand) {
      // Adaug toate titlurile secțiunilor dacă expandăm
      roadmap.sections.forEach(section => {
        newExpandedSections.add(section.title);
      });
    }
    // Dacă colapsez, lasă Set-ul gol
    
    setExpandedSections(newExpandedSections);
  };

  // Function to filter sections based on their status
  const filterSections = (sections: RoadmapType['sections']) => {
    if (!sections) return [];
    
    return sections
      .filter(section => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'completed') return section.progress === 100;
        if (activeFilter === 'in-progress') return section.progress > 0 && section.progress < 100;
        if (activeFilter === 'not-started') return section.progress === 0;
        return true;
      })
      .filter(section => {
        if (!searchTerm) return true;
        const subsArray = section.subsections || section.subtasks || [];
        return section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subsArray.some(sub => sub.title.toLowerCase().includes(searchTerm.toLowerCase()));
      });
  };

  // Function to calculate the overall progress of the roadmap
  const calculateOverallProgress = (): number => {
    if (!roadmap || !roadmap.sections || roadmap.sections.length === 0) return 0;
    
    const totalProgress = roadmap.sections.reduce((sum, section) => sum + section.progress, 0);
    return Math.round(totalProgress / roadmap.sections.length);
  };
  
  // Premium status or progress information
  const renderStatusBadge = () => {
    const overallProgress = calculateOverallProgress();
    
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="px-2 py-1 font-medium bg-gray-800 text-gray-300 border-gray-700">
          <FaChartLine className="mr-1.5 h-3 w-3 text-purple-400" />
          {overallProgress}% Complete
        </Badge>
        
        {isPremium && (
          <Badge variant="outline" className="bg-purple-900/30 text-purple-300 px-2 py-1 border-purple-800/50">
            <FaCrown className="mr-1.5 h-3 w-3 text-amber-400" />
            Premium
          </Badge>
        )}
      </div>
    );
  };

  // List view - most compact, for long roadmaps
  const renderListView = () => {
    if (!roadmap) return null;
    
    const filteredSections = filterSections(roadmap.sections);
    
    return (
      <div key={`${cacheKey}-${Object.keys(expandedSubtasks).length}`}>
        <div className="max-w-4xl mx-auto space-y-5">
          {filteredSections.map((section, sectionIndex) => (
            <Accordion 
              key={sectionIndex} 
              type="single" 
              collapsible 
              value={isSectionExpanded(section.title) ? section.title : undefined}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-md"
            >
              <AccordionItem value={section.title} className="border-0">
                <AccordionTrigger 
                  className="hover:bg-gray-700/50 p-4 text-left"
                  onClick={() => handleSectionToggle(section.title)}
                  data-no-underline="true"
                >
                  <div className="flex items-center w-full">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 p-4
                      ${section.progress === 100 ? 'bg-green-600' : section.progress > 0 ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      {section.progress === 100 ? (
                        <FaCheckCircle className="text-white h-3.5 w-3.5" />
                      ) : (
                        <span className="text-white text-xs font-medium">{section.progress}%</span>
                      )}
                    </div>
                    
                    <h3 className="flex-1 text-sm text-white">{cleanTitle(section.title)}</h3>
                    
                    <div className="flex items-center space-x-2">
                      {/* Afișăm doar numărul de taskuri */}
                      <span className="text-gray-400 text-sm">
                        {getSubtaskCount(section)} {getSubtaskCount(section) === 1 ? "task" : "tasks"}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-0 border-t border-gray-700">
                  {/* Verificăm dacă secțiunea are un tutorial și îl afișăm */}
                  {section.tutorial && (
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-indigo-300">Section Tutorial</h4>
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none markdown-content">
                        {renderMarkdown(section.tutorial)}
                      </div>
                    </div>
                  )}
                  
                  <div className="divide-y divide-gray-700">
                    {getSubtasks(section).map((subtask, subtaskIndex) => {
                      const hasPathId = Boolean(subtask.pathId);
                      const pathUrl = hasPathId ? `/learning-path/${subtask.pathId}` : undefined;
                      return (
                        <Accordion 
                          key={subtaskIndex} 
                          type="single" 
                          collapsible 
                          value={expandedSubtasks[`${section.id || section.title}-${subtask.id || subtask.title}`] ? `subtask-${subtaskIndex}` : undefined}
                          className={`${subtask.completed ? 'bg-green-900/30' : ''}`}
                        >
                          <AccordionItem value={`subtask-${subtaskIndex}`} className="border-0">
                            <AccordionTrigger 
                              className={`hover:bg-gray-700/30 pl-6 pr-4 py-3 text-left ${subtask.completed ? 'text-green-300' : ''}`}
                              data-no-underline="true"
                              onClick={() => {
                                // Doar expandăm/colapsăm subtask-ul, fără a genera detalii
                                setExpandedSubtasks({
                                  ...expandedSubtasks,
                                  [`${section.id || section.title}-${subtask.id || subtask.title}`]: 
                                    !expandedSubtasks[`${section.id || section.title}-${subtask.id || subtask.title}`]
                                });
                              }}
                            >
                              <div className="flex items-center w-full">
                                <div className="mr-3">
                                  {subtask.completed ? (
                                    <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
                                      <FaCheck className="text-white h-2.5 w-2.5" />
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border border-gray-600 flex items-center justify-center bg-gray-800">
                                      {loadingSubtaskDetails?.subtaskId === (subtask.id || subtask.title) && 
                                       loadingSubtaskDetails?.sectionId === (section.id || section.title) ? (
                                        <FaSpinner className="animate-spin h-3 w-3 text-blue-400" />
                                      ) : (
                                        <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <h4 className="flex-1 text-sm font-medium">
                                  {cleanTitle(subtask.title)}
                                </h4>
                                
                                <div className="ml-2 flex items-center">
                                  {hasPathId || subtask.pathId ? (
                                    <Link href={pathUrl || `/learning-path/${subtask.pathId}`} passHref>
                                      <FaExternalLinkAlt className="text-indigo-400 hover:text-indigo-300 h-3 w-3 mr-1" />
                                    </Link>
                                  ) : null}
                                </div>
                              </div>
                            </AccordionTrigger>
                            
                            <AccordionContent className="pb-3 pt-1 px-3">
                              {subtask.description ? (
                                <div className="prose prose-sm prose-invert max-w-none pl-7 markdown-content">
                                  {renderMarkdown(subtask.description.replace(/\\n/g, '\n').replace(/(?<!\n)\n(?!\n)/g, '\n\n'))}
                                  
                                  {/* Tutorials - Coming Soon Section */}
                                  <div className="mt-4 border border-indigo-800/30 bg-indigo-900/20 rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-sm font-medium text-indigo-300 flex items-center">
                                        <FaBookReader className="mr-1.5 h-3.5 w-3.5" />
                                        Tutorials
                                      </h5>
                                      <span className="text-xs bg-indigo-900/40 text-indigo-300 py-0.5 px-1.5 rounded">
                                        Coming soon
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Interactive tutorials for this subtask will be available soon. These custom-made lessons will provide step-by-step guidance to help you master this skill.
                                    </p>
                                  </div>
                                  
                                  {/* Resources */}
                                  {subtask.resources && subtask.resources.length > 0 && (
                                    <div className="mt-4">
                                      <h5 className="text-sm font-medium text-indigo-300 mb-2">Learning Resources:</h5>
                                      <ul className="space-y-2">
                                        {subtask.resources.map((resource, idx) => (
                                          <li key={idx} className="flex items-start">
                                            <div>
                                              <a 
                                                href={resource.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-white hover:text-indigo-300 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center w-fit"
                                              >
                                                {resource.title} <FaExternalLinkAlt className="ml-1 h-2.5 w-2.5" />
                                              </a>
                                              <p className="text-gray-400 text-xs mt-1">{resource.description}</p>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {/* Practical exercises */}
                                  {subtask.practicalExercises && subtask.practicalExercises.length > 0 && (
                                    <div className="mt-4">
                                      <h5 className="text-sm font-medium text-indigo-300 mb-2">Practical Exercises:</h5>
                                      <ul className="space-y-1">
                                        {subtask.practicalExercises.map((exercise, idx) => (
                                          <li key={idx} className="flex items-start">
                                            <span className="text-gray-300">{exercise}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {/* Validation criteria */}
                                  {subtask.validationCriteria && subtask.validationCriteria.length > 0 && (
                                    <div className="mt-4">
                                      <h5 className="text-sm font-medium text-indigo-300 mb-2">Validation Criteria:</h5>
                                      <ul className="space-y-1">
                                        {subtask.validationCriteria.map((criterion, idx) => (
                                          <li key={idx} className="flex items-start">
                                            <span className="text-gray-300">{criterion}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="pl-7 text-sm text-gray-400">
                                  <div className="flex justify-center mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-2 h-7 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubtaskClick(
                                          section.id || section.title,
                                          subtask.id || subtask.title,
                                          roadmap.title,
                                          section.title,
                                          subtask.title
                                        );
                                      }}
                                      disabled={loadingSubtaskDetails?.subtaskId === (subtask.id || subtask.title) &&
                                               loadingSubtaskDetails?.sectionId === (section.id || section.title)}
                                    >
                                      {loadingSubtaskDetails?.subtaskId === (subtask.id || subtask.title) && 
                                       loadingSubtaskDetails?.sectionId === (section.id || section.title) ? (
                                        <FaSpinner className="animate-spin h-3 w-3 mr-1.5" />
                                      ) : (
                                        <FaBrain className="h-3 w-3 mr-1.5" />
                                      )}
                                      Generate Details
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-3 pl-7">
                                <div className="bg-gradient-to-r from-gray-800/90 to-gray-800/70 rounded-lg border border-gray-700 p-3 shadow-md">
                                  <div className="flex flex-wrap justify-between items-center">
                                    <div className="flex items-center">
                                      {/* Toggle completion status button - Updated to use QuizController */}
                                      {isOwner && (
                                        <QuizController
                                          sectionIndex={sectionIndex}
                                          subtaskIndex={subtaskIndex}
                                          title={subtask.title}
                                          description={subtask.description}
                                          completed={subtask.completed}
                                          onToggleComplete={handleSubtaskToggle}
                                        />
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      {/* Generate learning path button if needed */}
                                      {isPremium && isOwner && handleGeneratePathForSubtask && !subtask.pathId && !hasPathId && (
                                        <Tooltip content="Generate Tutorial">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs px-2 h-7 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleGeneratePath(sectionIndex, subtaskIndex, subtask.description || '');
                                            }}
                                            disabled={isPathGenerating}
                                          >
                                            {isPathGenerating && currentSubtask?.subtaskIndex === subtaskIndex && 
                                             currentSubtask?.sectionIndex === sectionIndex ? (
                                              <FaSpinner className="animate-spin h-3 w-3 mr-1.5" />
                                            ) : (
                                              <FaRoad className="h-3 w-3 mr-1.5" />
                                            )}
                                            Generate Tutorial
                                          </Button>
                                        </Tooltip>
                                      )}
                                      
                                      {/* Report Issue button */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs px-2 h-7 text-gray-400 hover:text-gray-200 hover:bg-red-900/20 transition-colors duration-200"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIssueSubtask({
                                            id: subtask.id,
                                            title: subtask.title,
                                            sectionTitle: section.title,
                                            sectionId: section.id
                                          });
                                          setShowIssueDialog(true);
                                        }}
                                      >
                                        <FaBug className="h-3 w-3 mr-1.5" />
                                        <span>Report Issue</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    })}
                  </div>
                  
                  {/* Generate Tutorial button moved here - has been removed */}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </div>
    );
  };
  
  // Filter dropdown component
  const FilterDropdown = () => {
    const getButtonClass = (filterValue: typeof activeFilter) => 
      activeFilter === filterValue 
        ? "bg-indigo-600 text-white" 
        : "bg-gray-800 text-gray-300 hover:bg-gray-700";
    
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-700 text-gray-300 flex items-center"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter className="mr-1.5 h-3 w-3" />
          Filter
          <FaChevronDown className={`ml-1.5 h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </Button>
        
        {showFilters && (
          <div className="absolute mt-1 z-10 bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden right-0 w-40">
            <div className="p-1 space-y-1">
              <button
                className={`w-full text-left px-3 py-1.5 text-sm rounded ${getButtonClass("all")}`}
                onClick={() => {
                  setActiveFilter("all");
                  setShowFilters(false);
                }}
              >
                All Tasks
              </button>
              <button
                className={`w-full text-left px-3 py-1.5 text-sm rounded ${getButtonClass("completed")}`}
                onClick={() => {
                  setActiveFilter("completed");
                  setShowFilters(false);
                }}
              >
                Completed
              </button>
              <button
                className={`w-full text-left px-3 py-1.5 text-sm rounded ${getButtonClass("in-progress")}`}
                onClick={() => {
                  setActiveFilter("in-progress");
                  setShowFilters(false);
                }}
              >
                In Progress
              </button>
              <button
                className={`w-full text-left px-3 py-1.5 text-sm rounded ${getButtonClass("not-started")}`}
                onClick={() => {
                  setActiveFilter("not-started");
                  setShowFilters(false);
                }}
              >
                Not Started
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add TutorialGenerationDialog component
  const TutorialGenerationDialog = () => {
    if (!showTutorialDialog || !currentSubtask) return null;

    return (
      <Dialog open={showTutorialDialog} onOpenChange={setShowTutorialDialog}>
        <DialogContent className="sm:max-w-[550px] bg-gray-900 border border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Generate Tutorial</DialogTitle>
            <DialogDescription className="text-gray-400">
              Creating a personalized tutorial for {currentSubtask.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Section</h4>
                <p className="text-white">{currentSubtask.sectionTitle}</p>
              </div>
              
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Skill</h4>
                <p className="text-white">{currentSubtask.title}</p>
                {currentSubtask.description && (
                  <div className="text-sm text-gray-400 mt-2 markdown-content">
                    {renderMarkdown(currentSubtask.description)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTutorialDialog(false);
                  setCurrentSubtask(null);
                }}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!currentSubtask) return;
                  
                  setTutorialGenerating(true);
                  try {
                    // Update the roadmap to show pending state
                    if (roadmap && setRoadmap) {
                      const updatedRoadmap = {...roadmap};
                      const section = updatedRoadmap.sections[currentSubtask.sectionIndex];
                      const subtasks = getSubtasks(section);
                      
                      if (subtasks[currentSubtask.subtaskIndex]) {
                        subtasks[currentSubtask.subtaskIndex].isPending = true;
                        
                        // Asigurăm consistență între subsections și subtasks
                        if (section.subsections && section.subsections[currentSubtask.subtaskIndex]) {
                          section.subsections[currentSubtask.subtaskIndex].isPending = true;
                        }
                        if (section.subtasks && section.subtasks[currentSubtask.subtaskIndex]) {
                          section.subtasks[currentSubtask.subtaskIndex].isPending = true;
                        }
                      }
                      
                      setRoadmap(updatedRoadmap);
                    }
                    
                    // Generate the actual tutorial
                    // Pentru simplitate, simulăm un apel asincron care va reveni cu un pathId
                    if (handleGeneratePathForSubtask) {
                      toast.loading("Generating your tutorial...", {
                        duration: 5000, // Show for 5 seconds or until dismissed
                        description: "Please wait while we create a detailed learning path."
                      });
                      
                      // Call the actual generation function
                      const pathId = await handleGeneratePathForSubtask(
                        currentSubtask.sectionIndex,
                        currentSubtask.subtaskIndex,
                        currentSubtask.title
                      );
                      
                      // If we got a valid pathId back, update the UI
                      if (pathId && roadmap && setRoadmap) {
                        const finalRoadmap = {...roadmap};
                        const section = finalRoadmap.sections[currentSubtask.sectionIndex];
                        const subtasks = getSubtasks(section);
                        
                        if (subtasks[currentSubtask.subtaskIndex]) {
                          subtasks[currentSubtask.subtaskIndex].isPending = false;
                          subtasks[currentSubtask.subtaskIndex].pathId = pathId;
                          
                          // Asigurăm consistență între subsections și subtasks
                          if (section.subsections && section.subsections[currentSubtask.subtaskIndex]) {
                            section.subsections[currentSubtask.subtaskIndex].isPending = false;
                            section.subsections[currentSubtask.subtaskIndex].pathId = pathId;
                          }
                          if (section.subtasks && section.subtasks[currentSubtask.subtaskIndex]) {
                            section.subtasks[currentSubtask.subtaskIndex].isPending = false;
                            section.subtasks[currentSubtask.subtaskIndex].pathId = pathId;
                          }
                        }
                        
                        setRoadmap(finalRoadmap);
                        
                        toast.success("Tutorial generated successfully!", {
                          description: "Your personalized learning path is ready."
                        });
                        
                        // Salvează actualizările în Firebase
                        await saveRoadmapToFirebase(finalRoadmap, `Updated tutorial for subtask "${currentSubtask?.title || 'unknown'}"`);
                      }
                    }
                    
                    // Close the dialog
                    setShowTutorialDialog(false);
                    setCurrentSubtask(null);
                  } catch (error) {
                    console.error("Error generating tutorial:", getErrorMessage(error));
                    toast.error("Failed to generate tutorial", {
                      description: "Please try again later."
                    });
                    
                    // Reset the pending state in case of error
                    if (roadmap && setRoadmap) {
                      const updatedRoadmap = {...roadmap};
                      const section = updatedRoadmap.sections[currentSubtask.sectionIndex];
                      const subtasks = getSubtasks(section);
                      
                      if (subtasks[currentSubtask.subtaskIndex]) {
                        subtasks[currentSubtask.subtaskIndex].isPending = false;
                        
                        // Asigurăm consistență între subsections și subtasks
                        if (section.subsections && section.subsections[currentSubtask.subtaskIndex]) {
                          section.subsections[currentSubtask.subtaskIndex].isPending = false;
                        }
                        if (section.subtasks && section.subtasks[currentSubtask.subtaskIndex]) {
                          section.subtasks[currentSubtask.subtaskIndex].isPending = false;
                        }
                      }
                      
                      setRoadmap(updatedRoadmap);
                    }
                  } finally {
                    setTutorialGenerating(false);
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                disabled={tutorialGenerating}
              >
                {tutorialGenerating ? (
                  <div className="flex items-center">
                    <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                    Generating...
                  </div>
                ) : (
                  <>
                    <FaBrain className="mr-2" />
                    Generate Tutorial
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Update IssueReportingDialog to use shadcn components but with simplified form management
  const IssueReportingDialog = () => {
    // Folosim refs pentru a stoca valorile
    const titleRef = React.useRef<HTMLInputElement>(null);
    const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Atunci când dialogul este montat, setăm valorile inițiale în refs
    React.useEffect(() => {
      if (showIssueDialog) {
        if (titleRef.current) titleRef.current.value = issueTitle;
        if (descriptionRef.current) descriptionRef.current.value = issueDescription;
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showIssueDialog, issueTitle, issueDescription]);
    
    if (!showIssueDialog || !issueSubtask) return null;
    
    const handleSubmit = async () => {
      // Extragem valorile direct din refs
      const title = titleRef.current?.value;
      const description = descriptionRef.current?.value;
      
      if (!issueSubtask || !title || !description) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      setIsSubmittingIssue(true);
      
      try {
        // Trimitere direct către colecția feedback, inclusiv roadmapId
        await addDoc(collection(db, "feedback"), {
          type: "issue",
          title: title,
          description: description,
          lesson: issueSubtask.title,
          sectionTitle: issueSubtask.sectionTitle,
          subtaskId: issueSubtask.id || "unknown",
          sectionId: issueSubtask.sectionId || "unknown",
          roadmapId: roadmap?.id || "unknown", // Adăugăm ID-ul roadmap-ului
          roadmapTitle: roadmap?.title || "unknown", // Adăugăm titlul roadmap-ului
          createdAt: new Date(),
          status: "pending"
        });
        
        toast.success("Issue reported successfully", {
          description: "Thank you for helping us improve our content."
        });
        
        handleClose();
      } catch (error) {
        console.error("Error reporting issue:", getErrorMessage(error));
        
        // Afișăm un mesaj mai detaliat în funcție de tipul erorii
        if (getErrorMessage(error).includes("permission")) {
          toast.error("Permission denied", {
            description: "You don't have permission to report issues. Please contact support."
          });
        } else {
          toast.error("Failed to report issue", {
            description: "Please try again later or contact support if the issue persists."
          });
        }
      } finally {
        setIsSubmittingIssue(false);
      }
    };
    
    const handleClose = () => {
      setShowIssueDialog(false);
      setIssueTitle("");
      setIssueDescription("");
      setIssueSubtask(null);
    };
    
    return (
      <Dialog 
        open={showIssueDialog} 
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent 
          className="sm:max-w-[550px] bg-gray-900 border border-gray-700 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Report Issue</DialogTitle>
            <DialogDescription className="text-gray-400">
              Let us know about any issues or suggestions for this content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issue-title" className="text-sm font-medium text-gray-300">
                  Issue Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issue-title"
                  ref={titleRef}
                  defaultValue={issueTitle}
                  placeholder="Brief description of the issue"
                  className="bg-gray-800 border-gray-700 text-white focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issue-description" className="text-sm font-medium text-gray-300">
                  Detailed Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="issue-description"
                  ref={descriptionRef}
                  defaultValue={issueDescription}
                  placeholder="Please provide details about the issue or suggestion"
                  className="h-32 bg-gray-800 border-gray-700 text-white focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Related Content</Label>
                <div className="p-3 bg-gray-800 rounded border border-gray-700">
                  <p className="text-gray-300 font-medium">{issueSubtask.title}</p>
                  <p className="text-gray-400 text-sm mt-1">Section: {issueSubtask.sectionTitle}</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmittingIssue}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isSubmittingIssue ? (
                  <div className="flex items-center">
                    <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                    Submitting...
                  </div>
                ) : (
                  <>
                    <FaBug className="mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Add CSS personalizat pentru AccordionTrigger și Markdown după declararea componentelor
  useEffect(() => {
    // Adaugă stil pentru a elimina sublinierea la hover pe AccordionTrigger și a formata Markdown corect
    const style = document.createElement('style');
    style.innerHTML = `
      [data-no-underline="true"]::after {
        content: none !important;
      }
      [data-no-underline="true"] * {
        text-decoration: none !important;
      }
      [data-no-underline="true"]:hover {
        text-decoration: none !important;
      }
      
      .accordion-trigger-chevron {
        margin-top: 0 !important;
        align-self: center !important;
        transform: translateY(0) !important;
      }
      
      /* Override for accordion trigger to center align content */
      [data-slot="accordion-trigger"] {
        align-items: center !important;
      }
      
      /* Eliminate the translate-y property */
      [data-slot="accordion-trigger"] svg {
        translate: none !important;
        transform: translateY(0) !important;
      }
      
      /* Stiluri îmbunătățite pentru markdown-content */
      .markdown-content {
        color: rgb(229, 231, 235);
        font-size: 0.875rem;
        line-height: 1.5;
      }
      
      .markdown-content h1, 
      .markdown-content h2, 
      .markdown-content h3, 
      .markdown-content h4, 
      .markdown-content h5, 
      .markdown-content h6 {
        margin-top: 1.2em;
        margin-bottom: 0.6em;
        font-weight: 600;
        color: white;
        line-height: 1.3;
      }
      
      .markdown-content h1 { font-size: 1.5em; }
      .markdown-content h2 { font-size: 1.3em; }
      .markdown-content h3 { font-size: 1.1em; }
      .markdown-content h4 { font-size: 1em; }
      
      .markdown-content p {
        margin-bottom: 1em !important;
        margin-top: 0.25em !important;
        white-space: normal !important;
        line-height: 1.5 !important;
      }
      
      .markdown-content ul, 
      .markdown-content ol {
        margin-left: 1.5em !important;
        margin-bottom: 1em !important;
        margin-top: 0.5em !important;
        display: block !important;
        list-style-position: outside !important;
      }
      
      .markdown-content ul li,
      .markdown-content ol li {
        margin-bottom: 0.5em !important;
        display: list-item !important;
        white-space: normal !important;
      }
      
      .markdown-content ul li {
        list-style-type: disc !important;
      }
      
      .markdown-content ol li {
        list-style-type: decimal !important;
      }
      
      /* Stiluri pentru listele custom din subsecțiuni */
      .resource-list li,
      .exercise-list li,
      .criteria-list li {
        list-style-type: none !important;
        position: relative;
        padding-left: 1.5em;
      }
      
      .resource-list li:before,
      .exercise-list li:before,
      .criteria-list li:before {
        content: "•";
        position: absolute;
        left: 0;
        color: rgb(156, 163, 175);
      }
      
      .markdown-content code {
        background-color: rgba(71, 85, 105, 0.3);
        padding: 0.1em 0.3em;
        border-radius: 0.2em;
        font-family: monospace;
        color: rgb(249, 168, 212);
      }
      
      .markdown-content pre {
        background-color: rgba(30, 41, 59, 0.8);
        padding: 1em;
        border-radius: 0.3em;
        overflow-x: auto;
        margin: 1em 0;
        font-family: monospace;
      }
      
      .markdown-content pre code {
        background-color: transparent;
        padding: 0;
        color: rgb(229, 231, 235);
      }
      
      .markdown-content blockquote {
        border-left: 3px solid rgb(99, 102, 241);
        padding-left: 1em;
        margin-left: 0;
        margin-right: 0;
        margin-bottom: 1em;
        margin-top: 1em;
        color: rgb(148, 163, 184);
      }
      
      .markdown-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      
      .markdown-content table th,
      .markdown-content table td {
        border: 1px solid rgb(71, 85, 105);
        padding: 0.5em;
      }
      
      .markdown-content table th {
        background-color: rgba(51, 65, 85, 0.5);
      }
      
      .markdown-content a {
        color: rgb(99, 102, 241);
        text-decoration: underline;
      }
      
      .markdown-content a:hover {
        color: rgb(129, 140, 248);
      }
      
      .markdown-content strong, 
      .markdown-content b {
        font-weight: 600;
        color: white;
      }
      
      .markdown-content em, 
      .markdown-content i {
        font-style: italic;
      }
      
      .markdown-content img {
        max-width: 100%;
        border-radius: 0.3em;
        margin: 1em 0;
      }
      
      .markdown-content hr {
        border: 0;
        border-top: 1px solid rgb(71, 85, 105);
        margin: 2em 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Funcția pentru renderizarea markdown cu React-Markdown
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    // Procesează textul pentru a asigura formatarea corectă
    const processedText = text
      .replace(/\\n/g, '\n') // Înlocuiește \n escapate cu newline-uri reale
      .replace(/\n(?!\n)/g, '\n\n') // Asigură-te că există două newline-uri pentru paragrafe
      .replace(/\*\*/g, '**') // Asigură-te că bold-ul este corect formatat
      .replace(/\*([^*]+)\*/g, '*$1*') // Asigură-te că italic-ul este corect formatat
      .replace(/(?<!\n)- /g, '\n- ') // Asigură-te că listele încep pe o linie nouă
      .replace(/(?<!\n)# /g, '\n# ') // Asigură-te că titlurile încep pe o linie nouă
      .replace(/(?<!\n)## /g, '\n## '); // Asigură-te că subtitlurile încep pe o linie nouă
    
    return (
      <div className="markdown-content w-full overflow-visible">
        <Markdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-4 mt-2 text-gray-300">{children}</p>,
            h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-4 text-white">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3 text-white">{children}</h2>,
            h3: ({ children }) => <h3 className="text-md font-bold mt-4 mb-2 text-white">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc ml-5 mb-4 mt-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-5 mb-4 mt-2">{children}</ol>,
            li: ({ children }) => <li className="ml-2 mb-1 text-gray-300">{children}</li>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">{children}</a>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-4">{children}</blockquote>,
            code: ({ children }) => <code className="bg-gray-800 px-1 py-0.5 rounded text-pink-300 text-sm">{children}</code>,
            pre: ({ children }) => <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto my-4 text-sm">{children}</pre>,
          }}
        >
          {processedText}
        </Markdown>
      </div>
    );
  };

  // Modificăm butonul de generare a roadmap-ului
  const renderGenerateButton = () => {
    // Adăugăm un console log pentru debug
    console.log("[DEBUG] renderGenerateButton called with:", { 
      isPremium, 
      onlineStatus, 
      allRoadmapsLength: allRoadmaps.length, 
      maxRoadmaps 
    });

    if (!onlineStatus) {
      return (
        <Button
          variant="default"
          className="bg-gray-700 text-gray-300 cursor-not-allowed"
          disabled={true}
        >
          <FaWifi className="mr-2 text-red-500" />
          Offline
        </Button>
      );
    }
    
    // Verificăm dacă utilizatorul a atins limita de roadmap-uri
    if (allRoadmaps.length >= maxRoadmaps) {
      return (
        <Button
          variant="default"
          className="bg-gray-700 text-gray-300 cursor-not-allowed"
          onClick={() => toast.error(`You've reached the maximum limit of ${maxRoadmaps} roadmap${maxRoadmaps > 1 ? 's' : ''}`)}
        >
          <FaExclamationCircle className="mr-2 text-red-500" />
          Limit Reached ({allRoadmaps.length}/{maxRoadmaps})
        </Button>
      );
    }
    
    // Pentru toți utilizatorii, permitem generarea de roadmap-uri
    return (
      <Button
        onClick={handleOpenCreateCareer}
        variant="default"
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
      >
        <FaPlus className="mr-2" />
        Generate Roadmap
      </Button>
    );
  };

  // Adăugăm o funcție specifică pentru generarea roadmap-ului
  

  // Adăugăm o funcție pentru path generation
  const handleGeneratePath = async (sectionIndex: number, subtaskIndex: number, description: string) => {
    if (!handleGeneratePathForSubtask) return;
    
    setIsPathGenerating(true);
    setCurrentSubtask({
      title: getSubtasks(roadmap?.sections[sectionIndex] || { title: "", progress: 0 })[subtaskIndex]?.title || "",
      sectionTitle: roadmap?.sections[sectionIndex]?.title || "",
      description: description,
      sectionIndex,
      subtaskIndex
    });
    
    try {
      await handleGeneratePathForSubtask(sectionIndex, subtaskIndex, description);
    } catch (error) {
      console.error("Error generating path:", error);
    } finally {
      setIsPathGenerating(false);
    }
  };
  
  // Adăugăm o funcție pentru a marca un subtask ca completat/necompletat
  const handleSubtaskToggle = (sectionIndex: number, subtaskIndex: number, forceComplete?: boolean) => {
    if (!roadmap || !isOwner) return;
    
    // Creăm o copie a roadmap-ului pentru actualizare
    const updatedRoadmap = { ...roadmap };
    const section = updatedRoadmap.sections[sectionIndex];
    const subtasks = getSubtasks(section);
    const subtask = subtasks[subtaskIndex];
    
    // Dacă subtask-ul este deja completat, atunci îl putem marca direct ca necompletat
    // Sau dacă forceComplete este true, îl marcăm ca fiind completat
    if (subtask.completed || forceComplete === true) {
      // Inversăm starea completată sau îl setăm ca fiind completat
      subtask.completed = forceComplete === true ? true : !subtask.completed;
      
      // Actualizăm în ambele locuri dacă există
      if (section.subtasks && section.subtasks[subtaskIndex]) {
        section.subtasks[subtaskIndex].completed = subtask.completed;
      }
      if (section.subsections && section.subsections[subtaskIndex]) {
        section.subsections[subtaskIndex].completed = subtask.completed;
      }
      
      // Recalculăm progresul secțiunii
      const completedSubtasks = subtasks.filter(st => st.completed).length;
      section.progress = Math.round((completedSubtasks / subtasks.length) * 100);
      
      // Actualizăm roadmap-ul
      setRoadmap(updatedRoadmap);
      
      // Aici ar trebui să salvăm în Firebase/backend
      // Implementarea depinde de arhitectura aplicației
    }
  };

  // Modified function to not auto-generate on click
  const handleSubtaskClick = async (
    sectionId: string,
    subtaskId: string,
    roadmapTitle: string,
    sectionTitle: string,
    subtaskTitle: string
  ) => {
    if (!roadmap || !onlineStatus) {
      toast.error("You need to be connected to the internet to view details");
      return;
    }
    
    // Find the section and subtask to display details
    const section = roadmap.sections.find(s => s.id === sectionId || s.title === sectionTitle);
    if (!section) return;
    
    const subtasks = getSubtasks(section);
    const subtask = subtasks.find(s => s.id === subtaskId || s.title === subtaskTitle);
    
    // If subtask already has detailed description, just expand it
    if (subtask?.description && subtask.description.length > 50) {
      console.log(`Subtask "${subtaskTitle}" already has details, just expanding:`, subtask);
      // Toggle expanded state
      setExpandedSubtasks({
        ...expandedSubtasks,
        [`${sectionId}-${subtaskId}`]: !expandedSubtasks[`${sectionId}-${subtaskId}`]
      });
      return;
    }
    
    setLoadingSubtaskDetails({ sectionId, subtaskId });
    console.log(`Generating details for subtask "${subtaskTitle}" in section "${sectionTitle}"`);
    
    try {
      const response = await fetch('/api/roadmap/subtask-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: roadmap.userId, // Explicitly add userId from roadmap
          roadmapId: roadmap.id,
          sectionId,
          subtaskId,
          roadmapTitle: roadmapTitle || roadmap.title,
          sectionTitle,
          subtaskTitle
        })
      });
      
      console.log(`Response received from API for "${subtaskTitle}":`, response.status);
      
      if (!response.ok) {
        throw new Error('Error generating details for subtask');
      }
      
      const data = await response.json();
      console.log(`Data received from API for "${subtaskTitle}":`, data);
      
      if (!data || !data.data || !data.data.description) {
        throw new Error('API did not return details for subtask');
      }
      
      // Update local roadmap with generated details
      const updatedRoadmap = { ...roadmap };
      const sectionIndex = updatedRoadmap.sections.findIndex(s => 
        s.id === sectionId || s.title === sectionTitle
      );
      
      if (sectionIndex !== -1) {
        const subtasks = getSubtasks(updatedRoadmap.sections[sectionIndex]);
        const subtaskIndex = subtasks.findIndex(st => 
          st.id === subtaskId || st.title === subtaskTitle
        );
        
        if (subtaskIndex !== -1) {
          // Update subtask with received details
          subtasks[subtaskIndex] = {
            ...subtasks[subtaskIndex],
            description: data.data.description,
            resources: data.data.resources,
            practicalExercises: data.data.practicalExercises,
            validationCriteria: data.data.validationCriteria,
            prerequisites: data.data.prerequisites
          };
          
          // Ensure update in both subtasks and subsections
          if (updatedRoadmap.sections[sectionIndex].subtasks) {
            updatedRoadmap.sections[sectionIndex].subtasks = [...subtasks];
          }
          if (updatedRoadmap.sections[sectionIndex].subsections) {
            updatedRoadmap.sections[sectionIndex].subsections = [...subtasks];
          }
          
          console.log(`Roadmap updated with details for "${subtaskTitle}":`, 
                      updatedRoadmap.sections[sectionIndex].subtasks?.[subtaskIndex] || 
                      updatedRoadmap.sections[sectionIndex].subsections?.[subtaskIndex]);
          
          // Update roadmap state
          setRoadmap(updatedRoadmap);
          
          // Salvează actualizările în Firebase
          await saveRoadmapToFirebase(updatedRoadmap, `Updated details for subtask "${subtaskTitle}"`);
        }
      }
      
      // Expand subtask after generating details
      setExpandedSubtasks({
        ...expandedSubtasks,
        [`${sectionId}-${subtaskId}`]: true
      });
      
      toast.success("Details generated successfully!");
      
    } catch (error) {
      console.error("Error generating subtask details:", error);
      toast.error("Could not generate subtask details. Please try again.");
    } finally {
      setLoadingSubtaskDetails(null);
    }
  };

  // Function to save roadmap changes to Firebase
  const saveRoadmapToFirebase = async (updatedRoadmap: RoadmapType, message: string) => {
    if (!updatedRoadmap.id) return;
    
    try {
      const roadmapRef = doc(db, "roadmaps", updatedRoadmap.id);
      
      // Verificăm mai întâi structura documentului
      const roadmapDoc = await getDoc(roadmapRef);
      
      if (!roadmapDoc.exists()) {
        console.error("Roadmap document does not exist:", updatedRoadmap.id);
        return;
      }
      
      const data = roadmapDoc.data();
      console.log("Current document structure:", {
        hasRoadmapField: 'roadmap' in data,
        topLevelFields: Object.keys(data)
      });
      
      // Verificăm dacă documentul are un câmp "roadmap" sau datele sunt direct în document
      if ('roadmap' in data) {
        // Documentul folosește structura veche - avem câmpul "roadmap"
        await updateDoc(roadmapRef, {
          "roadmap": updatedRoadmap,
          "updatedAt": new Date()
        });
        console.log(`Roadmap updated in Firebase (nested structure): ${message}`);
      } else {
        // Documentul folosește structura nouă - actualizăm direct datele
        // Creăm un obiect de actualizare care exclude proprietățile read-only
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...updateData } = updatedRoadmap;
        
        await updateDoc(roadmapRef, {
          ...updateData,
          "updatedAt": new Date()
        });
        console.log(`Roadmap updated in Firebase (flat structure): ${message}`);
      }
    } catch (firestoreError) {
      console.error("Error saving roadmap updates to Firebase:", firestoreError);
      toast.error("Changes saved locally, but failed to update in the database");
    }
  };
  
  

  // Îmbunătățim logging-ul pentru a fi mai informativ
  useEffect(() => {
    // Log pentru depanare
    console.log("CareerRoadmap render:", { 
      hasRoadmap: !!roadmap, 
      roadmapId: roadmap?.id,

      onlineStatus,
      isButtonDisabled: !onlineStatus,
      isOwner,
      isPremium,
      allRoadmapsCount: allRoadmaps?.length || 0,
      maxRoadmaps,
      canCreateNewRoadmap,
    });

    // Adăugăm un log specific pentru starea premium
    console.log("[DEBUG] Premium status check:", { 
      isPremium, 
      allRoadmaps: allRoadmaps?.length, 
      maxRoadmaps, 
      renderButtonCondition: isPremium && allRoadmaps.length < maxRoadmaps 
    });

    // Verificăm și log-am informații specifice pentru debugging
    if (!roadmap) {
      console.log("No roadmap loaded. Check if a roadmap exists in localStorage or if query to Firebase failed.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap, onlineStatus, isPremium, allRoadmaps, maxRoadmaps]);

  
  
  // Component pentru a afișa selectorul de roadmap-uri
  const RoadmapSelector = () => {
    // Adăugăm un log de debug pentru a verifica valorile
    console.log("[DEBUG] RoadmapSelector called with:", { 
      allRoadmaps,
      currentUserId
    });
    
    return (
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-300 flex items-center text-sm">
            <FaRoad className="mr-1.5 h-3.5 w-3.5 text-indigo-400" /> 
            <span>Your Roadmaps</span>
            <Badge variant="outline" className="ml-2 bg-gray-800/80 px-2 py-0.5 text-xs h-5 text-gray-300 border-gray-700">
              {allRoadmaps.length}/{maxRoadmaps}
            </Badge>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            onClick={() => setShowRoadmapSelector(!showRoadmapSelector)}
          >
            {showRoadmapSelector ? "Hide" : "Show all"}
            {showRoadmapSelector ? (
              <FaChevronUp className="ml-1.5 h-3 w-3" />
            ) : (
              <FaChevronDown className="ml-1.5 h-3 w-3" />
            )}
          </Button>
        </div>

        {allRoadmaps.length === 0 ? (
          <p className="text-sm text-gray-400">You haven&#39;t created any roadmaps yet</p>
        ) : (
          showRoadmapSelector && (
            <div className="bg-gray-800 border border-gray-700 rounded-md p-2 mb-4 grid gap-2 max-h-48 overflow-y-auto custom-scrollbar">
              {allRoadmaps.map((rm) => (
                <div
                  key={rm.id}
                  className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-colors ${
                    roadmap?.id === rm.id
                      ? "bg-indigo-900/50 text-white border border-indigo-700"
                      : "bg-gray-850 hover:bg-gray-700/50 text-gray-300 border border-gray-700"
                  }`}
                  onClick={() => {
                    setRoadmap(rm);
                    setShowRoadmapSelector(false);
                  }}
                >
                  <div className="flex items-center space-x-2 truncate pr-2 max-w-[85%]">
                    {rm.isActive && <FaCheckCircle className="text-green-500 h-3 w-3 flex-shrink-0" />}
                    <span className="truncate">{rm.title}</span>
                    {!rm.isOriginal && rm.userId !== currentUserId && (
                      <Badge variant="outline" className="bg-blue-900/30 text-blue-300 text-[10px] h-4 border-blue-700 ml-1">
                        Cloned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-400">{calculateProgressForRoadmap(rm)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };
  
  // Funcție pentru a calcula progresul unui roadmap
  const calculateProgressForRoadmap = (rm: RoadmapType): number => {
    if (!rm || !rm.sections || rm.sections.length === 0) return 0;
    
    const total = rm.sections.length;
    const completed = rm.sections.reduce((acc, section) => {
      return acc + (section.progress === 100 ? 1 : 0);
    }, 0);
    
    return (completed / total) * 100;
  };

  // Add proper type for event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleExpandClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Expand All clicked");
    toggleAllSections(true);
  };

  const handleCollapseClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Collapse All clicked");
    toggleAllSections(false);
  };

  // Add type for section toggle
  const handleSectionToggle = (sectionTitle: string): void => {
    const newExpandedSections = new Set(expandedSections);
    if (isSectionExpanded(sectionTitle)) {
      newExpandedSections.delete(sectionTitle);
    } else {
      newExpandedSections.add(sectionTitle);
    }
    setExpandedSections(newExpandedSections);
  };
  


  // Funcție pentru deschiderea modalului de explorare
  const handleExploreClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!onlineStatus) {
      toast.error("Trebuie să fii online pentru a explora roadmap-uri publice");
      return;
    }
    
    // Setăm starea modalului de explorare
    setShowExploreModal(true);
  };
  
  // Modificăm funcția pentru a încărca un roadmap public în loc să îl cloneze
  const handleUsePublicRoadmap = async (roadmapId: string) => {
    try {
      setIsLoading(true);
      
      if (!currentUserId) {
        toast.error("You need to be signed in to use roadmaps");
        return;
      }
      
      if (!onlineStatus) {
        toast.error("You need to be online to view roadmaps");
        return;
      }
      
      console.log("[DEBUG] Loading public roadmap:", roadmapId);
      
      // Obținem datele roadmap-ului
      const response = await fetch(`/api/roadmap/${roadmapId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load roadmap: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.roadmap) {
        throw new Error("Invalid roadmap data received");
      }
      
      toast.success("Roadmap loaded successfully!");
      
      // Închidem modalul de explorare
      setShowExploreModal(false);
      
      // Setăm roadmap-ul încărcat ca roadmap curent
      if (setRoadmap) {
        setRoadmap(data.roadmap);
      }
      
    } catch (error) {
      console.error("Error loading public roadmap:", error);
      toast.error("Failed to load the roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {!roadmap ? (
        <Card className="shadow-lg overflow-hidden border border-gray-700 bg-gray-900">
          <CardHeader className="pb-3 border-b border-gray-700 bg-gray-900">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <CardTitle className="text-xl flex items-center text-white">
                  <FaRoad className="mr-2 text-purple-500" />
                  Career Roadmap
                </CardTitle>
                <CardDescription className="text-gray-400">Generate a personalized roadmap for your career development</CardDescription>
              </div>
              
              <div className="flex gap-2">
                {renderGenerateButton()}
                <Button 
                  variant="outline" 
                  onClick={handleExploreClick}
                  disabled={!onlineStatus}
                  className="hidden md:flex"
                >
                  <Globe className="mr-2" /> 
                  Explore Roadmaps
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="md:hidden">
                    <Button variant="outline" size="sm">
                      <Menu />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExploreClick} disabled={!onlineStatus}>
                      <Globe className="mr-2 h-4 w-4" /> Explore Roadmaps
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          
          
          <CardContent className="py-12 px-6 bg-gray-900">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-6 mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gray-800 border border-gray-700">
                <FaRoad className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Create Your Career Development Plan</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Generate a personalized roadmap to visualize and track your learning journey. 
                Our AI will analyze your career goals and create a structured plan just for you.
              </p>
              
              <div className="grid gap-6 md:grid-cols-3 text-left bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm mb-8">
                <div className="p-5 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col">
                  <div className="p-2 bg-purple-900/30 rounded-lg w-fit mb-3">
                    <FaBrain className="h-5 w-5 text-purple-400" />
                  </div>
                  <h4 className="font-medium text-gray-200 mb-2">AI-Powered Generation</h4>
                  <p className="text-sm text-gray-400 flex-1">Our AI analyzes your career goals and current skills to create a personalized learning roadmap.</p>
                </div>
                <div className="p-5 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col">
                  <div className="p-2 bg-blue-900/30 rounded-lg w-fit mb-3">
                    <FaChartLine className="h-5 w-5 text-blue-400" />
                  </div>
                  <h4 className="font-medium text-gray-200 mb-2">Track Your Progress</h4>
                  <p className="text-sm text-gray-400 flex-1">Follow your progress through multiple stages with detailed tasks and subtasks for each milestone.</p>
                </div>
                <div className="p-5 flex flex-col">
                  <div className="p-2 bg-green-900/30 rounded-lg w-fit mb-3">
                    <FaChartLine className="h-5 w-5 text-green-400" />
                  </div>
                  <h4 className="font-medium text-gray-200 mb-2">Generate Learning Paths</h4>
                  <p className="text-sm text-gray-400 flex-1">Create specific learning paths for each skill you need to master, with detailed resources and activities.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                
                <Button 
                  variant="outline" 
                  onClick={handleExploreClick}
                  disabled={!onlineStatus}
                  className="hidden md:flex"
                >
                  <Globe className="mr-2" /> 
                  Explore Roadmaps
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="md:hidden">
                    <Button variant="outline" size="sm">
                      <Menu />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExploreClick} disabled={!onlineStatus}>
                      <Globe className="mr-2 h-4 w-4" /> Explore Roadmaps
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg overflow-hidden border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-850 gap-0">
          <CardHeader className="pb-3 border-b border-gray-700 bg-transparent">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-xl flex items-center text-white">
                    <FaRoad className="mr-2 text-indigo-500" />
                    Career Roadmap
                  </CardTitle>
                  <CardDescription className="text-gray-400">Track your progress toward your career goal</CardDescription>
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap gap-2 self-start">
                  {isPremium && canCreateNewRoadmap && (
                    <Button
                      onClick={handleOpenCreateCareer}
                      variant="default"
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      <FaPlus className="mr-2 h-3.5 w-3.5" />
                      Add Roadmap
                    </Button>
                  )}
                  <Button
                    onClick={handleExploreClick}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700"
                    title="Explore other roadmaps"
                    disabled={!onlineStatus}
                  >
                    <FaSearch className="mr-1.5 h-3.5 w-3.5" />
                    Explore
                  </Button>
                  {isOwner && roadmap && (
                    <Button
                      onClick={handleDeleteRoadmap}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600/90 hover:bg-red-700 text-white h-9 w-9 p-0"
                      title="Delete Roadmap"
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!isOwner && handleDeleteRoadmap && (
                    <Button
                      onClick={handleDeleteRoadmap}
                      variant="secondary"
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600 text-white h-9 w-9 p-0"
                      title="Remove From Profile"
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              
              {allRoadmaps.length > 0 && <RoadmapSelector />}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="border-b border-gray-700 bg-gray-800/50 p-4">
              <div className="flex flex-col md:flex-row justify-between max-w-3xl mx-auto">
                <div className="mb-4 md:mb-0 space-y-1">
                  <h2 className="text-lg font-semibold text-white">{roadmap.title}</h2>
                  {detailedRoadmap?.careerDescription && (
                    <div className="relative">
                      <div className={`text-sm text-gray-400 max-w-xl markdown-content ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
                        {renderMarkdown(detailedRoadmap.careerDescription)}
                      </div>
                      {detailedRoadmap.careerDescription.length > 120 && (
                        <button
                          className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 flex items-center"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        >
                          {isDescriptionExpanded ? (
                            <>
                              <FaChevronUp className="mr-1" /> Show less
                            </>
                          ) : (
                            <>
                              <FaChevronDown className="mr-1" /> Show more
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {renderStatusBadge()}
              </div>
            </div>
            
            <div className="p-3 border-b border-gray-700 bg-gray-800">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    {/* Search input */}
                    <div className="relative w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="rounded-md border border-gray-700 pl-8 pr-3 py-1.5 text-sm w-full sm:w-[200px] bg-gray-900 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 h-3.5 w-3.5" />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter dropdown */}
                    <FilterDropdown />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      onClick={handleExpandClick}
                    >
                      <FaPlus className="mr-1.5 h-3 w-3" />
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      onClick={handleCollapseClick}
                    >
                      <FaMinus className="mr-1.5 h-3 w-3" />
                      Collapse All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main roadmap content */}
            <div className="bg-gray-900 p-4">
              {renderListView()}
            </div>
            
            {/* Legend for understanding statuses - simplified */}
            <div className="p-3 border-t border-gray-700 bg-slate-900">
              <div className="max-w-3xl mx-auto flex flex-wrap gap-4 items-center justify-center text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-1.5"></div>
                  <span className="text-gray-400">Completed</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-1.5"></div>
                  <span className="text-gray-400">In Progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-600 rounded-full mr-1.5"></div>
                  <span className="text-gray-400">Not Started</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <TutorialGenerationDialog />
      <IssueReportingDialog />
      
      {/* Career Creation Modal */}
      <CareerCreationModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
      />
      {showExploreModal && (
        <ExploreRoadmapsModal
          isOpen={showExploreModal}
          onClose={() => setShowExploreModal(false)}
          onSelectRoadmap={handleUsePublicRoadmap}
          onlineStatus={onlineStatus}
        />
      )}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
            <FaSpinner className="animate-spin mr-2 text-indigo-500 h-5 w-5" />
            <span className="text-white">Loading roadmap...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmap; 