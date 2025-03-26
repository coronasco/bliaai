"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FaSearch, FaSpinner, FaFire, FaWifi, FaClone } from "react-icons/fa";
import { HiOutlineTrendingUp } from "react-icons/hi";
import { MdExplore } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

export interface PublicRoadmap {
  id: string;
  title: string;
  description?: string;
  userName?: string;
  popularity?: number;
  requiredSkills?: string[];
  tags?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
}

interface ExploreRoadmapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoadmap: (roadmapId: string) => Promise<void>;
  onlineStatus: boolean;
}

const ExploreRoadmapsModal: React.FC<ExploreRoadmapsModalProps> = ({
  isOpen,
  onClose,
  onSelectRoadmap,
  onlineStatus
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roadmaps, setRoadmaps] = useState<PublicRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // Load popular roadmaps initially
  const loadPublicRoadmaps = useCallback(async (query?: string) => {
    if (!onlineStatus) {
      toast.error("You need to be online to explore public roadmaps");
      return;
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log("[EXPLORE] Loading roadmaps...", query ? `Query: ${query}` : "Popular roadmaps");
      
      // Build URL based on parameters
      let url = '/api/roadmap/public';
      const params = new URLSearchParams();
      
      if (query) {
        params.append('query', query);
        setHasSearched(true);
      } else {
        // If no query, request popular roadmaps
        params.append('sort', 'popularity');
        params.append('limit', '6');
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load roadmaps: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data.roadmaps)) {
        throw new Error('Unexpected data format from server');
      }
      
      console.log("[EXPLORE] Loaded roadmaps:", data.roadmaps.length);
      setRoadmaps(data.roadmaps);
    } catch (error) {
      console.error("[EXPLORE] Error loading roadmaps:", error);
      toast.error("Failed to load roadmaps. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [onlineStatus, isLoading]);

  // Load roadmaps when modal opens
  useEffect(() => {
    if (isOpen && onlineStatus && roadmaps.length === 0 && !isLoading) {
      loadPublicRoadmaps();
    }
  }, [isOpen, onlineStatus, roadmaps.length, isLoading, loadPublicRoadmaps]);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery("");
    setHasSearched(false);
    
    if (value === "popular" && roadmaps.length === 0) {
      loadPublicRoadmaps();
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      loadPublicRoadmaps(searchQuery);
    }
  };

  // Handle cloning a roadmap
  const handleClone = async (roadmapId: string) => {
    if (!onlineStatus) {
      toast.error("You need to be online to use roadmaps");
      return;
    }
    
    setSelectedRoadmap(roadmapId);
    
    try {
      console.log("[DEBUG EXPLORE] Selecting roadmap:", roadmapId);
      await onSelectRoadmap(roadmapId);
      toast.success("Roadmap selected successfully!");
      onClose();
    } catch (error) {
      console.error("[DEBUG EXPLORE] Failed to select roadmap:", error);
      
      // Extract error message
      let errorMessage = "Failed to select the roadmap. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    } finally {
      setSelectedRoadmap(null);
    }
  };

  // Render skills as badges
  const renderSkills = (skills?: string[]) => {
    if (!skills || skills.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {skills.slice(0, 3).map((skill, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="bg-indigo-900/30 text-indigo-300 border-indigo-800 text-xs"
          >
            {skill}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700 text-xs">
            +{skills.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  // Render difficulty badge
  const renderDifficulty = (difficulty?: string) => {
    if (!difficulty) return null;
    
    const colors = {
      beginner: "bg-green-900/30 text-green-300 border-green-800",
      intermediate: "bg-amber-900/30 text-amber-300 border-amber-800",
      advanced: "bg-red-900/30 text-red-300 border-red-800"
    };
    
    return (
      <Badge 
        variant="outline" 
        className={`${colors[difficulty as keyof typeof colors] || colors.beginner} text-xs ml-2`}
      >
        {difficulty}
      </Badge>
    );
  };

  // Render roadmap card
  const renderRoadmapCard = (roadmap: PublicRoadmap) => {
    const isSelected = selectedRoadmap === roadmap.id;
    
    return (
      <motion.div
        key={roadmap.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-4 rounded-lg border ${isSelected 
          ? 'border-indigo-600 bg-indigo-950/30' 
          : 'border-gray-700 bg-gray-800/50'} 
          hover:border-indigo-500 transition-all duration-200 cursor-pointer group`}
        onClick={() => setSelectedRoadmap(roadmap.id)}
      >
        <div className="flex justify-between items-start">
          <h4 className="text-white font-medium group-hover:text-indigo-300 transition-colors">
            {roadmap.title}
            {renderDifficulty(roadmap.difficulty)}
          </h4>
          <Badge variant="outline" className="bg-gray-700 text-gray-300 text-xs flex items-center">
            <FaFire className="text-amber-400 mr-1 h-3 w-3" />
            {roadmap.popularity || 0} users
          </Badge>
        </div>
        
        {roadmap.description && (
          <p className="text-gray-400 text-sm mt-2 line-clamp-2 group-hover:text-gray-300 transition-colors">
            {roadmap.description}
          </p>
        )}
        
        {renderSkills(roadmap.requiredSkills)}
        
        <div className="mt-3 flex justify-between items-center">
          {roadmap.userName && (
            <span className="text-xs text-gray-500 flex items-center">
              Created by: {roadmap.userName}
            </span>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="bg-indigo-900/30 border-indigo-700 text-indigo-300 hover:bg-indigo-800/50 hover:text-indigo-200"
            onClick={(e) => {
              e.stopPropagation();
              handleClone(roadmap.id);
            }}
            disabled={selectedRoadmap === roadmap.id || !onlineStatus}
          >
            {selectedRoadmap === roadmap.id ? (
              <div className="flex items-center">
                <FaSpinner className="animate-spin mr-1.5 h-3 w-3" />
                <span>Selecting...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <FaClone className="mr-1.5 h-3 w-3" />
                <span>Select</span>
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-white">
            <MdExplore className="mr-2 text-indigo-500" />
            Explore Public Roadmaps
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Discover and use roadmaps created by other users
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tabs */}
          <Tabs
            defaultValue="popular"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="bg-gray-800/80 border border-gray-700">
              <TabsTrigger 
                value="popular" 
                className="data-[state=active]:bg-indigo-900/30 data-[state=active]:text-indigo-300"
              >
                <FaFire className="mr-1.5 h-3.5 w-3.5" /> Popular
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-indigo-900/30 data-[state=active]:text-indigo-300"
              >
                <HiOutlineTrendingUp className="mr-1.5 h-3.5 w-3.5" /> Recent
              </TabsTrigger>
              <TabsTrigger 
                value="search" 
                className="data-[state=active]:bg-indigo-900/30 data-[state=active]:text-indigo-300"
              >
                <FaSearch className="mr-1.5 h-3.5 w-3.5" /> Search
              </TabsTrigger>
            </TabsList>
            
            {/* Search Bar - Shown at top for all tabs */}
            <form onSubmit={handleSearch} className="mt-4 flex">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, skill, or level..."
                  className="bg-gray-800 border-gray-700 text-white pl-10"
                  disabled={!onlineStatus || isLoading}
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              <Button 
                type="submit"
                className="ml-2 bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={!onlineStatus || isLoading || !searchQuery.trim()}
              >
                Search
              </Button>
            </form>
            
            {/* Warning if user is offline */}
            {!onlineStatus && (
              <div className="bg-red-900/30 border border-red-800 rounded-md p-3 text-sm text-gray-300 flex items-center">
                <FaWifi className="text-red-500 mr-2 h-4 w-4" />
                You are currently offline. Connect to the internet to explore roadmaps.
              </div>
            )}
            
            {/* Tab Content */}
            <TabsContent value="popular" className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <FaSpinner className="animate-spin text-indigo-500 h-6 w-6" />
                  <span className="ml-2 text-gray-400">Loading popular roadmaps...</span>
                </div>
              ) : roadmaps.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400">No popular roadmaps found.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {roadmaps.map((roadmap) => renderRoadmapCard(roadmap))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recent" className="mt-4">
              <div className="flex justify-center items-center py-10">
                <FaSpinner className="animate-spin text-indigo-500 h-6 w-6" />
                <span className="ml-2 text-gray-400">Loading recent roadmaps...</span>
              </div>
            </TabsContent>
            
            <TabsContent value="search" className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <FaSpinner className="animate-spin text-indigo-500 h-6 w-6" />
                  <span className="ml-2 text-gray-400">Searching for roadmaps...</span>
                </div>
              ) : hasSearched ? (
                roadmaps.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400">No roadmaps found matching your search.</p>
                    <p className="text-gray-500 text-sm mt-2">Try different keywords or browse popular roadmaps.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {roadmaps.map((roadmap) => renderRoadmapCard(roadmap))}
                    </AnimatePresence>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400">Enter keywords above to search for roadmaps.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {roadmaps.length} roadmaps found
          </span>
          <Button 
            variant="outline" 
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreRoadmapsModal; 