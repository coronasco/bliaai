"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, deleteDoc, orderBy, Timestamp } from "firebase/firestore";
import { FaPlus, FaEdit, FaTrash, FaEye, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  difficulty: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  experienceLevel?: string;
  requiredSkills?: string[];
}

export default function AdminRoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState<Roadmap | null>(null);

  // Încarcă lista de roadmap-uri
  useEffect(() => {
    const loadRoadmaps = async () => {
      setLoading(true);
      try {
        const roadmapsQuery = query(
          collection(db, "roadmaps"),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(roadmapsQuery);
        const roadmapsList: Roadmap[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Roadmap, "id">;
          roadmapsList.push({
            id: doc.id,
            ...data,
            title: data.title || "Untitled Roadmap",
            isPublic: data.isPublic || false,
            difficulty: data.difficulty || "beginner",
            experienceLevel: data.experienceLevel || data.difficulty || "beginner"
          } as Roadmap);
        });
        
        setRoadmaps(roadmapsList);
      } catch (error) {
        console.error("Error loading roadmaps:", error);
        toast.error("Could not load roadmaps");
      } finally {
        setLoading(false);
      }
    };
    
    loadRoadmaps();
  }, []);
  
  // Funcția pentru a deschide dialogul de confirmare pentru ștergere
  const confirmDelete = (roadmap: Roadmap) => {
    setRoadmapToDelete(roadmap);
    setDeleteDialogOpen(true);
  };
  
  // Funcția pentru a șterge un roadmap
  const deleteRoadmap = async () => {
    if (!roadmapToDelete) return;
    
    try {
      await deleteDoc(doc(db, "roadmaps", roadmapToDelete.id));
      setRoadmaps(roadmaps.filter(r => r.id !== roadmapToDelete.id));
      toast.success("Roadmap deleted successfully");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error("Could not delete roadmap");
    } finally {
      setDeleteDialogOpen(false);
      setRoadmapToDelete(null);
    }
  };
  
  // Formatarea datei
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("ro-RO");
    } catch {
      // Ignorăm eroarea și returnăm un mesaj generic
      return "Invalid date";
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" className="mr-2" size="icon">
                <FaArrowLeft />
              </Button>
            </Link>
            <h2 className="text-3xl font-bold">Roadmaps Management</h2>
          </div>
          <Link href="/admin/roadmaps/create">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <FaPlus className="mr-2" /> Create Roadmap
            </Button>
          </Link>
        </div>
        
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle>All Roadmaps</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {roadmaps.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-800">
                        <TableHead className="text-white">Title</TableHead>
                        <TableHead className="text-white">Experience Level</TableHead>
                        <TableHead className="text-white">Public</TableHead>
                        <TableHead className="text-white">Created At</TableHead>
                        <TableHead className="text-white">Updated At</TableHead>
                        <TableHead className="text-right text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roadmaps.map((roadmap) => (
                        <TableRow key={roadmap.id} className="border-gray-700 hover:bg-gray-800">
                          <TableCell className="font-medium text-white">{roadmap.title}</TableCell>
                          <TableCell className="text-gray-300">
                            <span className="capitalize">{roadmap.experienceLevel || roadmap.difficulty}</span>
                          </TableCell>
                          <TableCell>
                            {roadmap.isPublic ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Public
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Private
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-300">{formatDate(roadmap.createdAt)}</TableCell>
                          <TableCell className="text-gray-300">{formatDate(roadmap.updatedAt)}</TableCell>
                          <TableCell className="flex items-center justify-end space-x-2">
                            <Link href={`/admin/roadmaps/${roadmap.id}`}>
                              <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700">
                                <FaEye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/roadmaps/${roadmap.id}/edit`}>
                              <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-800 border-gray-700 hover:bg-gray-700">
                                <FaEdit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => confirmDelete(roadmap)}
                            >
                              <FaTrash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 bg-gray-800 rounded-md">
                    <p className="text-gray-300">No roadmaps found. Create your first roadmap!</p>
                    <Link href="/admin/roadmaps/create" className="mt-4 inline-block">
                      <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 mt-2">
                        <FaPlus className="mr-2" /> Create Roadmap
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog de confirmare pentru ștergere */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-950 border-gray-800">
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the roadmap &quot;{roadmapToDelete?.title}&quot;? 
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
              onClick={deleteRoadmap}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 