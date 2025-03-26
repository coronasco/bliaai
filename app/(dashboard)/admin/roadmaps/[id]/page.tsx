"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { FaEdit, FaTrash, FaArrowLeft, FaGraduationCap, FaClock, FaTag } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { use } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Interfață pentru roadmap
interface Roadmap {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  isOfficial?: boolean;
  difficulty: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  experienceLevel?: string;
  requiredSkills?: string[];
  sections?: {
    id: string;
    title: string;
    description?: string;
    subtasks: {
      id: string;
      title: string;
      description?: string;
      content?: string;
      completed?: boolean;
    }[];
  }[];
  lastModifiedBy?: string;
  lastModifiedAt?: Timestamp;
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

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "roadmaps", resolvedParams.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoadmap({
            id: docSnap.id,
            ...data,
            title: data.title || "Untitled Roadmap",
            isPublic: data.isPublic || false,
            experienceLevel: data.experienceLevel || data.difficulty || "beginner",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastModifiedBy: data.lastModifiedBy,
            lastModifiedAt: data.lastModifiedAt,
          } as Roadmap);
          
          // Auto-expand the first section for better UX
          if (data.sections?.length > 0) {
            setExpandedSections(new Set([data.sections[0].id]));
          }
        } else {
          toast.error("Roadmap not found");
          router.push("/admin/roadmaps");
        }
      } catch (error) {
        console.error("Error fetching roadmap:", error);
        toast.error("Could not load roadmap");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoadmap();
  }, [resolvedParams.id, router]);
  
  const handleDelete = async () => {
    if (!roadmap) return;
    
    try {
      await deleteDoc(doc(db, "roadmaps", roadmap.id));
      toast.success("Roadmap deleted successfully");
      router.push("/admin/roadmaps");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error("Could not delete roadmap");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Formatarea datei
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  // Handle expanding/collapsing sections
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
    setActiveSection(sectionId);
  };

  // Handle selecting a subtask
  const selectSubtask = (sectionId: string, subtaskId: string) => {
    setActiveSection(sectionId);
    setActiveSubtask(subtaskId);
    
    // Scroll to the subtask
    setTimeout(() => {
      const element = document.getElementById(`subtask-${subtaskId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <Link href="/admin/roadmaps">
              <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/10">
                <FaArrowLeft />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {roadmap.title}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {roadmap.isPublic ? (
                  <Badge variant="outline" className="bg-green-900/20 text-green-500 hover:bg-green-900/30 border-green-800">
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-900/20 text-gray-300 hover:bg-gray-900/30 border-gray-800">
                    Private
                  </Badge>
                )}
                {roadmap.isOfficial && (
                  <Badge variant="outline" className="bg-blue-900/20 text-blue-500 hover:bg-blue-900/30 border-blue-800">
                    Official
                  </Badge>
                )}
                <Badge variant="outline" className="bg-purple-900/20 text-purple-500 hover:bg-purple-900/30 border-purple-800 capitalize">
                  {roadmap.experienceLevel || "No level"}
                </Badge>
                <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                  {roadmap.sections?.length || 0} sections
                </Badge>
                <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                  {roadmap.sections?.reduce((sum, section) => sum + section.subtasks.length, 0) || 0} tasks
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/admin/roadmaps/${resolvedParams.id}/edit`}>
              <Button variant="outline" className="bg-gray-900 border-gray-800 hover:bg-gray-800">
                <FaEdit className="mr-2" /> Edit
              </Button>
            </Link>
            <Button 
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <FaTrash className="mr-2" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-gray-700 bg-slate-800 sticky top-28">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex justify-between items-center">
                  <span>Content</span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-8 border-gray-700 hover:bg-gray-800"
                      onClick={() => setExpandedSections(new Set(roadmap.sections?.map(s => s.id) || []))}
                    >
                      Expand All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-8 border-gray-700 hover:bg-gray-800"
                      onClick={() => setExpandedSections(new Set())}
                    >
                      Collapse All
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                <div className="space-y-3">
                  {roadmap.sections && roadmap.sections.length > 0 ? (
                    roadmap.sections.map((section, sIndex) => {
                      const isExpanded = expandedSections.has(section.id);
                      
                      return (
                        <div 
                          key={section.id}
                          className={`rounded-md border transition-all ${
                            activeSection === section.id 
                              ? 'bg-indigo-900/20 border-indigo-500' 
                              : 'border-gray-700'
                          }`}
                        >
                          <div 
                            className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                            onClick={() => toggleSection(section.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white text-sm flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-900/40 rounded-full text-xs">
                                  {sIndex + 1}
                                </span>
                                {section.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {section.subtasks.length} tasks
                                </span>
                                <div className="rotate-0 transform transition-transform duration-200">
                                  {isExpanded ? '▼' : '▶'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t border-gray-700 max-h-60 overflow-y-auto">
                              {section.subtasks.map((subtask, stIndex) => (
                                <div 
                                  key={subtask.id}
                                  className={`p-2 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                                    activeSubtask === subtask.id ? 'bg-gray-800' : 'bg-gray-800/40'
                                  }`}
                                  onClick={() => selectSubtask(section.id, subtask.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm ${activeSubtask === subtask.id ? 'text-white' : 'text-gray-300'}`}>
                                      <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-700 rounded-full text-xs mr-1.5">
                                        {stIndex + 1}
                                      </span>
                                      {subtask.title}
                                    </span>
                                    {subtask.completed && (
                                      <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-800 text-xs">
                                        Done
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm mb-2">No sections available</div>
                      <div className="text-gray-500 text-xs">Add sections to organize your roadmap content</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Improved Quick Info card */}
            <Card className="border-gray-700 bg-slate-800 overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-700/50">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-px bg-gray-700 text-xs">
                  <div className="p-3.5 bg-slate-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-indigo-950 p-1.5 rounded-md">
                        <FaGraduationCap className="text-indigo-400 text-sm" />
                      </div>
                      <span className="text-gray-300 font-medium">Experience Level</span>
                    </div>
                    <p className="font-medium text-white capitalize pl-8">{roadmap.experienceLevel}</p>
                  </div>
                  
                  <div className="p-3.5 bg-slate-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-indigo-950 p-1.5 rounded-md">
                        <FaClock className="text-indigo-400 text-sm" />
                      </div>
                      <span className="text-gray-300 font-medium">Timeline</span>
                    </div>
                    <div className="pl-8 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{formatDate(roadmap.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Updated:</span>
                        <span className="text-white">{formatDate(roadmap.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-slate-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-indigo-950 p-1.5 rounded-md">
                        <svg className="text-indigo-400 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <span className="text-gray-300 font-medium">Contributors</span>
                    </div>
                    <div className="pl-8">
                      <div className="flex flex-col gap-2">
                        {roadmap.lastModifiedBy ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-indigo-950/40 text-indigo-400 border-indigo-800/50">
                                {roadmap.lastModifiedBy}
                              </Badge>
                            </div>
                            <div className="text-gray-400 text-xs flex items-center gap-1.5">
                              <FaClock className="h-3 w-3" />
                              Last modified {formatDate(roadmap.lastModifiedAt)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              This roadmap is currently maintained by {roadmap.lastModifiedBy}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-indigo-950/40 text-indigo-400 border-indigo-800/50">
                                Not configured
                              </Badge>
                              <span className="text-gray-400 text-xs">(Feature coming soon)</span>
                            </div>
                            <div className="text-gray-400 text-xs">
                              This feature will be available in a future update
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-slate-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-indigo-950 p-1.5 rounded-md">
                        <svg className="text-indigo-400 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                        </svg>
                      </div>
                      <span className="text-gray-300 font-medium">Content Status</span>
                    </div>
                    <div className="pl-8 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Sections:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium">{roadmap.sections?.length || 0}</span>
                          {(roadmap.sections?.filter(s => !s.description || s.description.trim() === '').length || 0) > 0 && (
                            <Badge className="bg-yellow-600/30 text-yellow-400 border-yellow-600/50 font-normal">
                              {roadmap.sections?.filter(s => !s.description || s.description.trim() === '').length || 0} empty
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tasks:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium">
                            {roadmap.sections?.reduce((sum, section) => sum + section.subtasks.length, 0) || 0}
                          </span>
                          {(roadmap.sections?.reduce((sum, section) => 
                            sum + section.subtasks.filter(st => 
                              (!st.description || st.description.trim() === '') && 
                              (!st.content || st.content.trim() === '')
                            ).length, 0) || 0) > 0 && (
                            <Badge className="bg-yellow-600/30 text-yellow-400 border-yellow-600/50 font-normal">
                              {roadmap.sections?.reduce((sum, section) => 
                                sum + section.subtasks.filter(st => 
                                  (!st.description || st.description.trim() === '') && 
                                  (!st.content || st.content.trim() === '')
                                ).length, 0) || 0} empty
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <Card className="border-gray-700 bg-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-white">Details</CardTitle>
                
                {activeSection && (
                  <Link href={`/admin/roadmaps/${resolvedParams.id}/edit?section=${activeSection}`}>
                    <Button size="sm" variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
                      <FaEdit className="mr-1" /> Edit Section
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {activeSection ? (
                  roadmap.sections?.map((section) => 
                    section.id === activeSection && (
                      <div key={section.id} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
                            Section Description
                            {section.description ? (
                              <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800 text-xs">
                                Has Content
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800 text-xs">
                                No Description
                              </Badge>
                            )}
                          </h3>
                          <div className="text-gray-300 p-4 border border-dashed border-gray-700 rounded-md bg-gray-800/40">
                            <MarkdownPreview content={section.description || "_No description provided. Edit this section to add a description._"} />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Tasks ({section.subtasks.length})</h3>
                            <div className="flex items-center gap-2">
                              {section.subtasks.filter(st => 
                                (!st.description || st.description.trim() === '') && 
                                (!st.content || st.content.trim() === '')
                              ).length > 0 && (
                                <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800 text-xs">
                                  {section.subtasks.filter(st => 
                                    (!st.description || st.description.trim() === '') && 
                                    (!st.content || st.content.trim() === '')
                                  ).length} empty
                                </Badge>
                              )}
                              <Link href={`/admin/roadmaps/${resolvedParams.id}/edit?section=${activeSection}&addTask=true`}>
                                <Button size="sm" variant="outline" className="bg-blue-900/20 border-blue-800 hover:bg-blue-900/40 text-blue-400">
                                  + Add Task
                                </Button>
                              </Link>
                            </div>
                          </div>
                          
                          {section.subtasks.map((subtask, stIndex) => (
                            <div 
                              key={subtask.id}
                              id={`subtask-${subtask.id}`}
                              className={`p-4 rounded-md border transition-all ${
                                activeSubtask === subtask.id 
                                  ? 'bg-gray-800 border-indigo-500' 
                                  : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-white flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-900/40 rounded-full text-sm">
                                    {stIndex + 1}
                                  </span>
                                  {subtask.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {(!subtask.description || subtask.description.trim() === '') && 
                                   (!subtask.content || subtask.content.trim() === '') && (
                                    <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800 text-xs">
                                      Empty content
                                    </Badge>
                                  )}
                                  {subtask.completed && (
                                    <Badge variant="outline" className="bg-green-900/20 text-green-500 border-green-800">
                                      Completed
                                    </Badge>
                                  )}
                                  <Link href={`/admin/roadmaps/${resolvedParams.id}/edit?section=${activeSection}&task=${subtask.id}`}>
                                    <Button size="sm" variant="outline" className="h-7 px-2 border-gray-700 hover:bg-gray-700 text-xs">
                                      <FaEdit className="mr-1" /> Edit
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {subtask.description && (
                                  <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                                    <p className="text-xs text-gray-400 mb-1">Description</p>
                                    <MarkdownPreview content={subtask.description} />
                                  </div>
                                )}
                                
                                {subtask.content && (
                                  <div className="p-3 bg-gray-900/50 rounded border border-gray-700 md:col-span-2">
                                    <p className="text-xs text-gray-400 mb-1">Content</p>
                                    <MarkdownPreview content={subtask.content} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-white">Description</h3>
                      <div className="p-4 border border-dashed border-gray-700 rounded-md bg-gray-800/40">
                        <MarkdownPreview content={roadmap.description || "_No description provided. Edit this roadmap to add a description._"} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-slate-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <FaGraduationCap className="text-indigo-500" />
                            <div>
                              <p className="text-sm text-gray-400">Experience Level</p>
                              <p className="font-medium text-white capitalize">{roadmap.experienceLevel}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-slate-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <FaClock className="text-indigo-500" />
                            <div>
                              <p className="text-sm text-gray-400">Created At</p>
                              <p className="font-medium text-white">{formatDate(roadmap.createdAt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <FaClock className="text-indigo-500" />
                            <div>
                              <p className="text-sm text-gray-400">Updated At</p>
                              <p className="font-medium text-white">{formatDate(roadmap.updatedAt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {roadmap.requiredSkills && roadmap.requiredSkills.length > 0 && (
                        <Card className="bg-slate-800 border-gray-700 md:col-span-2">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <FaTag className="text-indigo-500" />
                              <div>
                                <p className="text-sm text-gray-400">Required Skills</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {roadmap.requiredSkills.map((skill, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className="bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/30 border-indigo-800"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      <Card className="bg-slate-800 border-blue-900/30 md:col-span-2">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <div>
                              <h4 className="text-lg font-medium text-white mb-2">Getting Started</h4>
                              <p className="text-gray-300 mb-4">Select a section from the left sidebar to view its details and tasks.</p>
                              
                              <div className="flex flex-wrap gap-2">
                                {roadmap.sections?.slice(0, 3).map((section) => (
                                  <Button 
                                    key={section.id}
                                    variant="outline" 
                                    className="border-blue-800 bg-blue-900/20 hover:bg-blue-900/40 text-white"
                                    onClick={() => {
                                      setActiveSection(section.id);
                                      setExpandedSections(new Set([section.id]));
                                    }}
                                  >
                                    {section.title}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-950 border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the roadmap &quot;{roadmap.title}&quot;? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-gray-900 border-gray-800 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 