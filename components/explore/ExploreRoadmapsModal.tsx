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
import { FaSearch, FaSpinner, FaPlus, FaStar, FaFire } from "react-icons/fa";
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
  onCloneRoadmap: (roadmapId: string) => Promise<void>;
  onlineStatus: boolean;
}

const ExploreRoadmapsModal: React.FC<ExploreRoadmapsModalProps> = ({
  isOpen,
  onClose,
  onCloneRoadmap,
  onlineStatus
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roadmaps, setRoadmaps] = useState<PublicRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string | null>(null);
  const [isCloningRoadmap, setIsCloningRoadmap] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // Încărcăm roadmap-urile populare inițial
  const loadPublicRoadmaps = useCallback(async (query?: string) => {
    if (!onlineStatus) {
      toast.error("You need to be online to explore public roadmaps");
      return;
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log("[EXPLORE] Loading roadmaps...", query ? `Query: ${query}` : "Popular roadmaps");
      
      // Construim URL-ul în funcție de parametri
      let url = '/api/roadmap/public';
      const params = new URLSearchParams();
      
      if (query) {
        params.append('query', query);
        setHasSearched(true);
      } else {
        // Dacă nu avem query, cerem roadmap-urile populare
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

  // Încărcăm roadmap-urile când se deschide modalul
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

  // Handle roadmap cloning
  const handleClone = async (roadmapId: string) => {
    if (!onlineStatus) {
      toast.error("You need to be online to clone roadmaps");
      return;
    }
    
    setSelectedRoadmap(roadmapId);
    setIsCloningRoadmap(true);
    
    try {
      await onCloneRoadmap(roadmapId);
      toast.success("Roadmap cloned successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to clone roadmap:", error);
      toast.error("Failed to clone the roadmap. Please try again.");
    } finally {
      setIsCloningRoadmap(false);
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
    const isCloning = isSelected && isCloningRoadmap;
    
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
              Creat de: {roadmap.userName}
            </span>
          )}
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClone(roadmap.id);
            }}
            disabled={isCloningRoadmap}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 
              ${isCloning ? 'opacity-80' : ''}`}
          >
            {isCloning ? (
              <>
                <FaSpinner className="animate-spin h-3 w-3 mr-1.5" />
                Clonare...
              </>
            ) : (
              <>
                <FaPlus className="h-3 w-3 mr-1.5" />
                Folosește
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-gray-900 border border-gray-800 text-white p-0 overflow-hidden rounded-xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-gray-950 to-purple-950/20 -z-10" />
        
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-900/40 p-2 rounded-lg">
              <MdExplore className="h-5 w-5 text-indigo-300" />
            </div>
            <DialogTitle className="text-xl font-semibold text-white">Explorează Roadmaps</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            Descoperă și folosește roadmap-uri create de comunitate
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="popular" value={activeTab} onValueChange={handleTabChange} className="px-6">
          <TabsList className="bg-gray-800/70 border border-gray-700 h-11">
            <TabsTrigger value="popular" className="data-[state=active]:bg-indigo-900/50 data-[state=active]:text-indigo-200">
              <HiOutlineTrendingUp className="mr-2 h-4 w-4" />
              Populare
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-indigo-900/50 data-[state=active]:text-indigo-200">
              <FaSearch className="mr-2 h-3.5 w-3.5" />
              Caută
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {activeTab === "search" && (
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Caută după titlu, descriere sau skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border-gray-700 pl-10 pr-4 py-2 placeholder:text-gray-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Button 
                    type="submit" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 bg-indigo-600 hover:bg-indigo-700 px-3"
                    disabled={!searchQuery.trim() || isLoading}
                  >
                    {isLoading ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : "Caută"}
                  </Button>
                </div>
              </form>
            )}
            
            <TabsContent value="popular" className="mt-0">
              <AnimatePresence>
                {isLoading ? (
                  <div className="py-12 flex flex-col justify-center items-center">
                    <FaSpinner className="animate-spin h-8 w-8 text-indigo-500 mb-3" />
                    <p className="text-gray-400">Se încarcă roadmap-urile populare...</p>
                  </div>
                ) : roadmaps.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-gray-800/70 flex items-center justify-center mb-4">
                      <FaStar className="text-amber-500 h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">Niciun roadmap popular găsit</h4>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Nu există încă roadmap-uri populare. Fii primul care împărtășește un roadmap cu comunitatea!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
                    {roadmaps.map(roadmap => renderRoadmapCard(roadmap))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
            
            <TabsContent value="search" className="mt-0">
              <AnimatePresence>
                {isLoading ? (
                  <div className="py-12 flex flex-col justify-center items-center">
                    <FaSpinner className="animate-spin h-8 w-8 text-indigo-500 mb-3" />
                    <p className="text-gray-400">Se caută roadmap-uri...</p>
                  </div>
                ) : hasSearched && roadmaps.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-gray-800/70 flex items-center justify-center mb-4">
                      <FaSearch className="text-gray-500 h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">Niciun rezultat găsit</h4>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Nu am găsit roadmap-uri care să se potrivească cu căutarea ta. Încearcă alte cuvinte cheie.
                    </p>
                  </div>
                ) : !hasSearched ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-gray-800/70 flex items-center justify-center mb-4">
                      <FaSearch className="text-indigo-400 h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">Caută un roadmap</h4>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Introdu un termen de căutare pentru a găsi roadmap-uri potrivite intereselor și obiectivelor tale.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
                    {roadmaps.map(roadmap => renderRoadmapCard(roadmap))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="p-6 pt-3 border-t border-gray-800 bg-gray-900/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            Închide
          </Button>
          {selectedRoadmap && (
            <Button
              onClick={() => handleClone(selectedRoadmap)}
              disabled={isCloningRoadmap}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {isCloningRoadmap ? (
                <div className="flex items-center">
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Se clonează...
                </div>
              ) : (
                <>
                  <FaPlus className="mr-2" />
                  Folosește Roadmap-ul Selectat
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreRoadmapsModal; 