"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RoadmapType } from "@/types/roadmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Star, ArrowRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RoadmapsPage() {
  const [officialRoadmaps, setOfficialRoadmaps] = useState<RoadmapType[]>([]);
  const [aiRoadmaps, setAiRoadmaps] = useState<RoadmapType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        // Fetch official roadmaps
        const officialQuery = query(
          collection(db, "roadmaps"),
          where("isOfficial", "==", true)
        );
        const officialSnapshot = await getDocs(officialQuery);
        const officialData = officialSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
              lastModifiedAt: data.lastModifiedAt instanceof Timestamp ? data.lastModifiedAt : Timestamp.now(),
            } as RoadmapType;
          })
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        // Fetch AI-generated roadmaps
        const aiQuery = query(
          collection(db, "roadmaps"),
          where("isOfficial", "==", false)
        );
        const aiSnapshot = await getDocs(aiQuery);
        const aiData = aiSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
              lastModifiedAt: data.lastModifiedAt instanceof Timestamp ? data.lastModifiedAt : Timestamp.now(),
            } as RoadmapType;
          })
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        setOfficialRoadmaps(officialData);
        setAiRoadmaps(aiData);
      } catch (error) {
        console.error("Error fetching roadmaps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  const filteredOfficialRoadmaps = officialRoadmaps.filter(roadmap => {
    const matchesSearch = roadmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         roadmap.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "all" || roadmap.experienceLevel === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const filteredAiRoadmaps = aiRoadmaps.filter(roadmap => {
    const matchesSearch = roadmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         roadmap.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "all" || roadmap.experienceLevel === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-12"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">
            Career Roadmaps
          </h1>
          <p className="text-gray-400 mt-2">Explore and create learning paths for your career</p>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search roadmaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800 focus:border-purple-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-gray-900/50 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </motion.div>

      {/* Tabs Section */}
      <Tabs defaultValue="official" className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-800 p-1">
          <TabsTrigger 
            value="official" 
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            <Star className="w-4 h-4 mr-2" />
            Official Roadmaps
          </TabsTrigger>
          <TabsTrigger 
            value="ai" 
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Generated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="official" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOfficialRoadmaps.map((roadmap, index) => (
              <motion.div
                key={roadmap.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/roadmaps/${roadmap.id}`}>
                  <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl text-white group-hover:text-purple-400 transition-colors">
                          {roadmap.title}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                          Official
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400 line-clamp-2">
                        {roadmap.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {roadmap.requiredSkills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-gray-800/50 text-white">
                            {skill}
                          </Badge>
                        ))}
                        {roadmap.requiredSkills?.length > 3 && (
                          <Badge variant="secondary" className="bg-gray-800/50 text-white">
                            +{roadmap.requiredSkills.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Level: {roadmap.experienceLevel}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAiRoadmaps.map((roadmap, index) => (
              <motion.div
                key={roadmap.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/roadmaps/${roadmap.id}`}>
                  <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl text-white group-hover:text-purple-400 transition-colors">
                          {roadmap.title}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                          AI Generated
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400 line-clamp-2">
                        {roadmap.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {roadmap.requiredSkills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-gray-800/50 text-white">
                            {skill}
                          </Badge>
                        ))}
                        {roadmap.requiredSkills?.length > 3 && (
                          <Badge variant="secondary" className="bg-gray-800/50 text-white">
                            +{roadmap.requiredSkills.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Level: {roadmap.experienceLevel}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 