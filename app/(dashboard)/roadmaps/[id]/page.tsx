"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RoadmapType } from "@/types/roadmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Sparkles, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Circle,
  Brain,
  BookOpen,
  Clock,
  ChevronDown,
  BarChart,
  BookMarked,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { PrismTheme } from 'react-syntax-highlighter';

export default function RoadmapPage() {
  const params = useParams();
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'roadmap' | 'markdown'>('roadmap');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<string | null>(null);
  const [currentSubtaskContext, setCurrentSubtaskContext] = useState<{
    title: string;
    description: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const roadmapDoc = await getDoc(doc(db, "roadmaps", params.id as string));
        if (roadmapDoc.exists()) {
          const data = roadmapDoc.data();
          const roadmapData = {
            id: roadmapDoc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
            lastModifiedAt: data.lastModifiedAt instanceof Timestamp ? data.lastModifiedAt : Timestamp.now(),
          } as RoadmapType;
          setRoadmap(roadmapData);
          
          // Activate first section if available
          if (roadmapData.sections.length > 0) {
            const firstSection = roadmapData.sections[0];
            setSelectedSection(firstSection.id);
            setExpandedSections(new Set([firstSection.id]));
          }
        }
      } catch (error) {
        console.error("Error fetching roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [params.id]);

  const handleAiHelp = async (subtask: {
    id: string;
    title: string;
    description?: string;
    content?: string;
    completed?: boolean;
  }) => {
    setIsAiLoading(true);
    setShowAiChat(true);
    setCurrentSubtaskContext({
      title: subtask.title,
      description: subtask.description || '',
      content: subtask.content || ''
    });

    // Generăm un mesaj contextual bazat pe subtask
    const contextMessage = `I'm here to help you with "${subtask.title}". ${
      subtask.description ? `This topic covers: ${subtask.description}. ` : ''
    }What specific aspect would you like to discuss or clarify?`;

    setTimeout(() => {
      setIsAiLoading(false);
      setAiMessage(contextMessage);
    }, 1000);
  };

  const handleAiChatSubmit = async (message: string) => {
    if (!currentSubtaskContext) return;

    setIsAiLoading(true);
    try {
      // Construim prompt-ul pentru AI bazat pe context și întrebarea utilizatorului
      const prompt = `Context: You are helping with "${currentSubtaskContext.title}". ${
        currentSubtaskContext.description ? `Topic description: ${currentSubtaskContext.description}. ` : ''
      }User question: ${message}`;

      // Aici vom face apelul către API-ul nostru
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context: currentSubtaskContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setAiMessage(data.message);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAiMessage('I apologize, but I encountered an error. Please try again or rephrase your question.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Roadmap not found</p>
      </div>
    );
  }

  const totalSubtasks = roadmap.sections.reduce((acc, section) => acc + section.subtasks.length, 0);
  const completedSubtasks = roadmap.sections.reduce(
    (acc, section) => acc + section.subtasks.filter(st => st.completed).length,
    0
  );
  const progress = (completedSubtasks / totalSubtasks) * 100;

  return (
    <div className="min-h-screen ">
      {/* Compact Header */}
      <div className="border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {roadmap.isOfficial ? (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    <Star className="w-3 h-3 mr-1" />
                    Official
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-gray-800/50 text-white">
                  {roadmap.experienceLevel}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-white">
                {roadmap.title}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-800/30 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-400">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'roadmap' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('roadmap')}
              className={`${
                activeTab === 'roadmap' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-800/50 hover:bg-gray-800/70 text-gray-400 hover:text-white'
              }`}
            >
              <BarChart className="w-4 h-4 mr-2" />
              Roadmap
            </Button>
            <Button
              variant={activeTab === 'markdown' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('markdown')}
              className={`${
                activeTab === 'markdown' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-800/50 hover:bg-gray-800/70 text-gray-400 hover:text-white'
              }`}
            >
              <BookMarked className="w-4 h-4 mr-2" />
              Resources
            </Button>
          </div>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowAiChat(true)}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 sticky top-20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-400">Sections</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSections(new Set())}
                    className="text-gray-400 hover:text-white hover:bg-slate-700/50"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    <span className="text-xs">Collapse All</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {roadmap.sections.map((section) => {
                    const isExpanded = expandedSections.has(section.id);
                    
                    return (
                      <div key={section.id} className="space-y-2">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedSections);
                            if (newExpanded.has(section.id)) {
                              newExpanded.delete(section.id);
                            } else {
                              newExpanded.add(section.id);
                            }
                            setExpandedSections(newExpanded);
                            setSelectedSection(section.id);
                            setSelectedSubtask(null);
                          }}
                          className="w-full flex items-center justify-between group p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                              <BarChart className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                              {section.title}
                            </span>
                          </div>
                          <ChevronDown 
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pl-11 space-y-1 overflow-hidden"
                            >
                              {section.subtasks.map((subtask) => (
                                <button
                                  key={subtask.id}
                                  onClick={() => {
                                    setSelectedSection(section.id);
                                    setSelectedSubtask(subtask.id);
                                    const element = document.getElementById(`subtask-${subtask.id}`);
                                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }}
                                  className={`w-full flex items-center gap-2 text-left group px-2 py-1.5 rounded-md transition-colors ${
                                    selectedSubtask === subtask.id 
                                      ? 'bg-slate-700/50' 
                                      : 'hover:bg-slate-700/30'
                                  }`}
                                >
                                  <div className="mt-0.5">
                                    {subtask.completed ? (
                                      <CheckCircle2 className={`w-3 h-3 ${
                                        selectedSubtask === subtask.id 
                                          ? 'text-green-400' 
                                          : 'text-green-500'
                                      }`} />
                                    ) : (
                                      <Circle className={`w-3 h-3 ${
                                        selectedSubtask === subtask.id 
                                          ? 'text-slate-400' 
                                          : 'text-gray-600'
                                      }`} />
                                    )}
                                  </div>
                                  <span className={`text-xs transition-colors truncate ${
                                    selectedSubtask === subtask.id 
                                      ? 'text-white' 
                                      : 'text-gray-400 group-hover:text-purple-400'
                                  }`}>
                                    {subtask.title}
                                  </span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'roadmap' ? (
              <div className="space-y-6">
                {selectedSection ? (
                  roadmap.sections
                    .filter(section => section.id === selectedSection)
                    .map((section) => (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-white">{section.title}</CardTitle>
                            <CardDescription className="text-gray-400">
                              {section.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {section.subtasks.map((subtask) => (
                                <motion.div
                                  key={subtask.id}
                                  id={`subtask-${subtask.id}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`bg-slate-700/30 rounded-lg border transition-colors ${
                                    selectedSubtask === subtask.id 
                                      ? 'border-purple-500' 
                                      : 'border-slate-600/50 hover:border-purple-500/50'
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedSubtask(subtask.id);
                                      const element = document.getElementById(`subtask-${subtask.id}`);
                                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                    className="w-full flex items-center gap-3 p-3"
                                  >
                                    <div className="mt-1">
                                      {subtask.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-gray-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-base font-medium text-white">
                                          {subtask.title}
                                        </h3>
                                        {(!subtask.content || !subtask.description) && (
                                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                                            Coming Soon
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>2-3 hours</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <BookOpen className="w-3 h-3" />
                                          <span>Resources</span>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                  <AnimatePresence>
                                    {selectedSubtask === subtask.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="px-6 py-4 border-t border-slate-700/50 space-y-6"
                                      >
                                        {(!subtask.content && !subtask.description) ? (
                                          <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                                              <Sparkles className="w-6 h-6 text-purple-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-white mb-2">Coming Soon</h3>
                                            <p className="text-gray-400 max-w-md">
                                              We&apos;re working on creating comprehensive content for this topic. Check back soon for detailed resources, examples, and learning materials.
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="space-y-4">
                                            <p className="text-sm text-gray-400">
                                              {subtask.description}
                                            </p>
                                            {subtask.content && (
                                              <div className="prose prose-invert max-w-none">
                                                <ReactMarkdown
                                                  remarkPlugins={[remarkGfm]}
                                                  components={{
                                                    code({ className, children, ...props }) {
                                                      const match = /language-(\w+)/.exec(className || '');
                                                      return match ? (
                                                        <SyntaxHighlighter
                                                          style={vscDarkPlus as PrismTheme}
                                                          language={match[1]}
                                                          PreTag="div"
                                                          {...props}
                                                        >
                                                          {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                      ) : (
                                                        <code className={className} {...props}>
                                                          {children}
                                                        </code>
                                                      );
                                                    },
                                                    h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2">{children}</h3>,
                                                    p: ({ children }) => <p className="text-gray-300 mb-4">{children}</p>,
                                                    ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4">{children}</ol>,
                                                    li: ({ children }) => <li className="text-gray-300 mb-1">{children}</li>,
                                                    a: ({ children, href }) => (
                                                      <a href={href} className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                                        {children}
                                                        <ExternalLink className="w-3 h-3" />
                                                      </a>
                                                    ),
                                                    blockquote: ({ children }) => (
                                                      <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 mb-4">
                                                        {children}
                                                      </blockquote>
                                                    ),
                                                    table: ({ children }) => (
                                                      <div className="overflow-x-auto mb-4">
                                                        <table className="min-w-full divide-y divide-gray-700">
                                                          {children}
                                                        </table>
                                                      </div>
                                                    ),
                                                    th: ({ children }) => (
                                                      <th className="px-4 py-2 text-left text-sm font-semibold text-white bg-gray-800">
                                                        {children}
                                                      </th>
                                                    ),
                                                    td: ({ children }) => (
                                                      <td className="px-4 py-2 text-sm text-gray-300 border-t border-gray-700">
                                                        {children}
                                                      </td>
                                                    ),
                                                  }}
                                                >
                                                  {subtask.content}
                                                </ReactMarkdown>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="text-purple-400 hover:text-purple-300 border-purple-500/50 hover:border-purple-500"
                                            >
                                              <BookOpen className="w-3 h-3 mr-2" />
                                              Take Exam
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="text-red-400 hover:text-red-300 border-red-500/50 hover:border-red-500"
                                            >
                                              <AlertCircle className="w-3 h-3 mr-2" />
                                              Report Issue
                                            </Button>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-purple-400 hover:text-purple-300"
                                            onClick={() => handleAiHelp(subtask)}
                                          >
                                            <Brain className="w-3 h-3 mr-2" />
                                            Get AI Help
                                          </Button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Select a section from the sidebar to view its content</p>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus as PrismTheme}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-300 mb-4">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-300 mb-1">{children}</li>,
                        a: ({ children, href }) => (
                          <a href={href} className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                            {children}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 mb-4">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full divide-y divide-gray-700">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="px-4 py-2 text-left text-sm font-semibold text-white bg-gray-800">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-4 py-2 text-sm text-gray-300 border-t border-gray-700">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {roadmap.description}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showAiChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <h2 className="text-base font-semibold text-white">AI Learning Assistant</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAiChat(false)}
                  className="text-gray-400 hover:text-white h-8 w-8"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3">
                <div className="space-y-3">
                  <div className="bg-slate-700/30 rounded-lg p-3 text-sm text-slate-300 max-h-[400px] overflow-y-auto">
                    {isAiLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span>AI is thinking...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus as PrismTheme}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2">{children}</h3>,
                            p: ({ children }) => <p className="text-gray-300 mb-4">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4">{children}</ol>,
                            li: ({ children }) => <li className="text-gray-300 mb-1">{children}</li>,
                            a: ({ children, href }) => (
                              <a href={href} className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                {children}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 mb-4">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-4">
                                <table className="min-w-full divide-y divide-gray-700">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="px-4 py-2 text-left text-sm font-semibold text-white bg-gray-800">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-4 py-2 text-sm text-gray-300 border-t border-gray-700">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {aiMessage}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a question..."
                      className="bg-slate-700/30 border-slate-600 h-9"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          handleAiChatSubmit(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      className="bg-purple-600 hover:bg-purple-700 h-9 w-9"
                      onClick={() => {
                        const input = document.querySelector('input') as HTMLInputElement;
                        if (input.value) {
                          handleAiChatSubmit(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 