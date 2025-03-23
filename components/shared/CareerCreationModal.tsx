"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { FaBrain, FaRocket, FaLightbulb, FaMapMarkedAlt, FaGraduationCap, FaClipboardList, FaRegLightbulb, FaCode } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

type CareerCreationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    title: string, 
    experienceLevel: string, 
    description: string,
    timeframe?: string,
    learningFocus?: string,
    currentSkills?: string,
    preferredResources?: string[]
  ) => Promise<void>;
  isLoading: boolean;
  roadmapLevel?: string;
};

/**
 * Component for creating a career roadmap
 */
const CareerCreationModal = ({ isOpen, onClose, onGenerate, isLoading, roadmapLevel = "beginner" }: CareerCreationModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = () => {
    if (!isLoading) {
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  const handleGenerate = async () => {
    if (!title) return;
    await onGenerate(
      title, 
      roadmapLevel, 
      description,
      undefined,
      undefined,
      undefined,
      undefined
    );
  };

  const getModalTitle = () => {
    switch (roadmapLevel) {
      case "intermediate":
        return "Generate Intermediate Roadmap";
      case "advanced":
        return "Generate Advanced Roadmap";
      default:
        return "Generate Career Roadmap";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : handleClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl border border-gray-700 shadow-2xl bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-gray-950 to-blue-950/20 -z-10" />
        
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-900/30 p-2 rounded-lg">
              <FaMapMarkedAlt className="h-6 w-6 text-indigo-400" />
            </div>
            <DialogTitle className="text-white text-xl font-bold">{getModalTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 mt-2">
            Create a personalized roadmap for your professional development
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
        {isLoading ? (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-6 flex flex-col items-center"
              >
                <div className="bg-black/40 backdrop-blur-xl p-3 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.5)] relative overflow-hidden mb-6">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-600/10 to-blue-500/10"
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="relative w-6 h-6 flex items-center justify-center"
                  >
                    <motion.div 
                      className="absolute w-full h-full border-2 border-transparent border-t-cyan-400 border-r-purple-400 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                      className="absolute w-4 h-4 border-2 border-transparent border-b-indigo-300 border-l-blue-400 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                      className="w-1.5 h-1.5 bg-white rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
                
                <motion.h3 
                  className="text-xl font-semibold mb-3 text-white"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Generating Your Roadmap
                </motion.h3>
                
                <p className="text-gray-300 text-center max-w-sm">
                  We&apos;re creating a personalized learning journey tailored to your career goals
                </p>
                
                <div className="relative w-full max-w-md mt-6">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 background-animate"
                      initial={{ width: "5%" }}
                      animate={{ width: "95%" }}
                      transition={{ 
                        duration: 15, 
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  
                  <motion.div 
                    className="absolute -top-1 -ml-1.5"
                    initial={{ left: "5%" }}
                    animate={{ left: "95%" }}
                    transition={{ 
                      duration: 15, 
                      ease: "easeInOut" 
                    }}
                  >
                    <div className="h-3.5 w-3.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.9)]"></div>
                  </motion.div>
                </div>
                
                <div className="flex justify-center gap-8 mt-8">
                  <motion.div 
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="p-2 bg-indigo-900/30 rounded-lg mb-2">
                      <FaLightbulb className="h-5 w-5 text-indigo-400" />
                    </div>
                    <p className="text-xs text-gray-400">Analyzing field</p>
                  </motion.div>
                  
                  <motion.div 
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    <div className="p-2 bg-purple-900/30 rounded-lg mb-2">
                      <FaBrain className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400">Creating path</p>
                  </motion.div>
                  
                  <motion.div 
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                  >
                    <div className="p-2 bg-blue-900/30 rounded-lg mb-2">
                      <FaRocket className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-400">Finalizing</p>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
        ) : (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-5 py-4 max-h-[60vh] overflow-y-auto pr-2"
              >
                {/* Career Information */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div 
                    className="space-y-1 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="title" className="text-gray-200 flex items-center gap-2">
                      <FaGraduationCap className="text-indigo-400 h-4 w-4" />
                      <span className="text-sm font-medium">Career Title</span>
                      <span className="text-indigo-400 text-xs bg-indigo-900/20 px-2 py-0.5 rounded">Required</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Frontend Developer, Data Scientist, DevOps Engineer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="bg-gray-800/70 border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400">Specify the professional role or field for which you&apos;d like a development plan</p>
                  </motion.div>
                  
                  <motion.div 
                    className="space-y-1 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="description" className="text-gray-200 flex items-center gap-2">
                      <FaClipboardList className="text-indigo-400 h-4 w-4" />
                      <span className="text-sm font-medium">Career Goals</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your specific goals, particular interests, or any preferences for this learning path..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px] bg-gray-800/70 border-gray-700 text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 mt-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-900/30 p-2 rounded-lg mt-0.5">
                        <FaRegLightbulb className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-gray-200 text-sm font-medium mb-1">Tip for a better roadmap</h4>
                        <p className="text-gray-400 text-sm">Add as many details as possible about what you want to learn and your specific objectives to receive a more relevant and personalized roadmap.</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
        )}
        </div>

        <DialogFooter className="bg-gray-900/90 p-6 border-t border-gray-800/50">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-400"
            >
              This process may take up to a minute...
            </motion.div>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={!title}
                className={`${
                  !title
                    ? "bg-indigo-800/30 text-indigo-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white shadow-lg shadow-indigo-900/20"
                } font-medium transition-all duration-200`}
              >
                <FaCode className="mr-2" />
                Generate Roadmap
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CareerCreationModal; 