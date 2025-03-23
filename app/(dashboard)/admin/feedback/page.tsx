"use client";

import React, { useState, useEffect } from "react";
import { collection, query, getDocs, updateDoc, deleteDoc, doc, orderBy, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Trash2, CheckCircle, AlertTriangle, Filter, Pencil, Clock, User, MessageSquare, BookOpen, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

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
  resolvedAt?: Date;
  userEmail?: string;
  priority?: "low" | "medium" | "high";
  type?: string;
  context?: string;
  browser?: string;
  device?: string;
  osVersion?: string;
  roadmapId?: string;
  roadmapTitle?: string;
};

const FeedbackPage = () => {
  const router = useRouter();
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<"all" | "pending" | "resolved">("all");
  const [viewingFeedback, setViewingFeedback] = useState<FeedbackItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeedbackItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState<Partial<FeedbackItem>>({});
  
  // Paginare
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Căutare
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch feedback from Firestore
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const items: FeedbackItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            resolvedAt: data.resolvedAt?.toDate() || null,
          } as FeedbackItem);
        });
        
        setFeedbackItems(items);
      } catch (error) {
        console.error("Error fetching feedback:", error);
        setError("Error loading feedback. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  // Handle marking as resolved
  const handleMarkAsResolved = async (id: string) => {
    try {
      // Verificăm dacă utilizatorul este autentificat
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Trebuie să fii autentificat pentru a actualiza statusul feedback-ului");
        return;
      }

      // Afișăm ID-ul utilizatorului pentru debug
      console.log("User ID curent:", currentUser.uid);
      
      try {
        // Încercăm să actualizăm direct documentul
        const feedbackRef = doc(db, "feedback", id);
        await updateDoc(feedbackRef, {
          status: "resolved",
          resolvedAt: new Date(),
          resolvedBy: currentUser.uid
        });

        // Update local state
        setFeedbackItems(feedbackItems.map(item => 
          item.id === id 
            ? { ...item, status: "resolved", resolvedAt: new Date() } 
            : item
        ));

        setError(null);
      } catch (updateError) {
        console.error("Eroare la actualizarea feedback-ului:", updateError);
        
        // Încercăm să actualizăm cu un middleware serverless
        // Implementați această funcție dacă este posibil
        try {
          // Cod alternativ care ar putea fi implementat în viitor
          // await fetch('/api/admin/markFeedbackResolved', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ feedbackId: id, userId: currentUser.uid }),
          // });
          
          setError(`Eroare de permisiuni: ${updateError instanceof Error ? updateError.message : 'Eroare necunoscută'}. 
                   Verifică rolul de admin în baza de date și regulile de securitate Firestore.`);
        } catch (serverError) {
          console.error("Eroare la metoda alternativă:", serverError);
          setError(`Nu s-a putut marca feedback-ul ca rezolvat: ${updateError instanceof Error ? updateError.message : 'Eroare necunoscută'}`);
        }
      }
    } catch (error) {
      console.error("Eroare generală:", error);
      setError(`Eroare la actualizarea statusului: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
    }
  };

  // Handle updating feedback
  const handleUpdateFeedback = async () => {
    if (!viewingFeedback) return;
    
    try {
      // Verificăm dacă utilizatorul este autentificat
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to update feedback");
        return;
      }
      
      const feedbackRef = doc(db, "feedback", viewingFeedback.id);
      
      const updateData = {
        ...editedFeedback,
        updatedAt: new Date(),
        updatedBy: currentUser.uid // Adăugăm ID-ul utilizatorului care actualizează
      };
      
      await updateDoc(feedbackRef, updateData);

      // Update local state
      setFeedbackItems(feedbackItems.map(item => 
        item.id === viewingFeedback.id 
          ? { ...item, ...updateData } 
          : item
      ));

      setViewingFeedback({
        ...viewingFeedback,
        ...updateData
      });
      
      setEditingFeedback(false);
      setError(null);
    } catch (error) {
      console.error("Error updating feedback:", error);
      setError(`Error updating feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle deleting feedback
  const handleDelete = async (id: string) => {
    try {
      // Verificăm dacă utilizatorul este autentificat
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to delete feedback");
        return;
      }
      
      await deleteDoc(doc(db, "feedback", id));
      
      // Update local state
      setFeedbackItems(feedbackItems.filter(item => item.id !== id));
      
      setConfirmDelete(null);
      setError(null);
    } catch (error) {
      console.error("Error deleting feedback:", error);
      setError(`Error deleting feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Filter items based on current tab and search term
  const filteredItems = feedbackItems.filter(item => {
    // Filtrare după tab
    const matchesTab = 
      currentTab === "all" || 
      (currentTab === "pending" && item.status === "pending") || 
      (currentTab === "resolved" && item.status === "resolved");
    
    // Filtrare după termenul de căutare
    const searchTermLower = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      searchTermLower === "" || 
      (item.title && item.title.toLowerCase().includes(searchTermLower)) || 
      (item.description && item.description.toLowerCase().includes(searchTermLower)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchTermLower)) ||
      (item.roadmapTitle && item.roadmapTitle.toLowerCase().includes(searchTermLower)) ||
      (item.sectionTitle && item.sectionTitle.toLowerCase().includes(searchTermLower)) || 
      (item.lessonTitle && item.lessonTitle.toLowerCase().includes(searchTermLower));
    
    return matchesTab && matchesSearch;
  });
  
  // Calculați numărul total de pagini
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  
  // Obțineți elementele pentru pagina curentă
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Funcție pentru a schimba pagina
  const changePage = (page: number) => {
    setCurrentPage(page);
  };
  
  // Resetăm pagina la 1 când se schimbă filtrul sau căutarea
  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, searchTerm]);

  // View feedback details
  const viewFeedbackDetails = async (item: FeedbackItem) => {
    setEditingFeedback(false);
    // Get the most up-to-date version
    try {
      const docRef = doc(db, "feedback", item.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fullItem = {
          id: item.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate() || null,
        } as FeedbackItem;
        
        setViewingFeedback(fullItem);
        setEditedFeedback({});
      } else {
        setViewingFeedback(item);
      }
    } catch (error) {
      console.error("Error fetching feedback details:", error);
      setViewingFeedback(item); // Fallback to the existing item
    }
  };

  // Redirect to edit page
  const navigateToEditPage = (item: FeedbackItem) => {
    if (item.subtaskId) {
      router.push(`/admin/feedback/${item.subtaskId}?id=${item.id}&subtask=${item.subtaskId}`);
    } else {
      // If there's no subtaskId, use the feedback id
      router.push(`/admin/feedback/edit/${item.id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">Feedback Management</h1>

      {error && (
        <Alert className="mb-4 bg-red-900 border-red-800 text-white">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex flex-wrap gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setCurrentTab("all")}
            variant={currentTab === "all" ? "default" : "outline"}
            className={currentTab === "all" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            All
          </Button>
          <Button 
            onClick={() => setCurrentTab("pending")}
            variant={currentTab === "pending" ? "default" : "outline"}
            className={currentTab === "pending" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Pending
          </Button>
          <Button 
            onClick={() => setCurrentTab("resolved")}
            variant={currentTab === "resolved" ? "default" : "outline"}
            className={currentTab === "resolved" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Resolved
          </Button>
        </div>
        
        {/* Câmp de căutare */}
        <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
          <Input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 pl-9 pr-4 py-2 text-sm rounded-md text-gray-300 w-full sm:w-64"
          />
          <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
            >
              <span className="sr-only">Clear</span>
              <span className="text-gray-400">×</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-2"></div>
              <span>Loading feedback...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchTerm ? (
                <>
                  <p>Nu a fost găsit niciun feedback pentru căutarea &quot;{searchTerm}&quot;.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="mt-4 bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                  >
                    Șterge filtrul de căutare
                  </Button>
                </>
              ) : (
                <p>Nu există feedback-uri în această categorie.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Status</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-200">
                        <div className="flex flex-col">
                          <span>{item.title || "No title"}</span>
                          <Badge className="md:hidden w-fit mt-1">
                            {item.status === "resolved" ? "Resolved" : "Pending"}
                          </Badge>
                          <span className="text-xs text-gray-400 sm:hidden mt-1">
                            {item.createdAt ? format(item.createdAt, "MM/dd/yyyy") : "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge className={item.status === "resolved" 
                          ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 border-green-800" 
                          : "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border-amber-800"}>
                          {item.status === "resolved" ? "Resolved" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                        {item.createdAt ? format(item.createdAt, "MM/dd/yyyy HH:mm") : "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-row gap-2 justify-end">
                          <Button 
                            onClick={() => viewFeedbackDetails(item)}
                            variant="outline" 
                            size="icon"
                            className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 h-8 w-8"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.status !== "resolved" && (
                            <Button 
                              onClick={() => handleMarkAsResolved(item.id)}
                              variant="outline" 
                              size="icon"
                              className="bg-emerald-900/30 text-emerald-400 border-emerald-800 hover:bg-emerald-800/50 h-8 w-8"
                              title="Mark as resolved"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            onClick={() => setConfirmDelete(item)}
                            variant="outline" 
                            size="icon"
                            className="bg-red-900/30 text-red-400 border-red-800 hover:bg-red-800/50 h-8 w-8"
                            title="Delete feedback"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Paginare */}
              {totalPages > 1 && (
                <div className="py-4 px-4 flex justify-between items-center border-t border-gray-800">
                  <div className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 bg-gray-800 border-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Afișăm maxim 5 pagini: prima, ultima și paginile din jurul celei curente
                        return page === 1 || 
                              page === totalPages || 
                              (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => {
                        // Adăugăm elipsis pentru paginile omise
                        const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                        const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="text-gray-500">...</span>
                            )}
                            
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePage(page)}
                              className={`h-8 w-8 p-0 ${
                                currentPage === page 
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" 
                                  : "bg-gray-800 border-gray-700"
                              }`}
                            >
                              {page}
                            </Button>
                            
                            {showEllipsisAfter && (
                              <span className="text-gray-500">...</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 bg-gray-800 border-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Detail Dialog */}
      <Dialog open={viewingFeedback !== null} onOpenChange={(open) => !open && setViewingFeedback(null)}>
        <DialogContent className="sm:max-w-3xl bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {editingFeedback ? (
                <Input 
                  value={editedFeedback.title || ''} 
                  onChange={(e) => setEditedFeedback({...editedFeedback, title: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              ) : (
                viewingFeedback?.title || "Feedback Details"
              )}
            </DialogTitle>
          </DialogHeader>
          
          {viewingFeedback && (
            <div className="space-y-4 py-4">
              {/* Status & Creation Date */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                {editingFeedback ? (
                  <select 
                    value={editedFeedback.status || viewingFeedback.status} 
                    onChange={(e) => setEditedFeedback({...editedFeedback, status: e.target.value as "pending" | "resolved"})}
                    className="px-2 py-1 rounded-md bg-gray-800 border-gray-700 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                ) : (
                  <Badge className={viewingFeedback.status === "resolved" 
                    ? "bg-green-600/20 text-green-400 border-green-800" 
                    : "bg-amber-600/20 text-amber-400 border-amber-800"}>
                    {viewingFeedback.status === "resolved" ? "Resolved" : "Pending"}
                  </Badge>
                )}
                
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {viewingFeedback.createdAt ? format(viewingFeedback.createdAt, "MM/dd/yyyy HH:mm") : ""}
                </div>
              </div>

              {/* Priority */}
              <div className="border-t border-gray-800 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Priority:
                  </h4>
                  
                  {editingFeedback ? (
                    <select 
                      value={editedFeedback.priority || viewingFeedback.priority || 'medium'} 
                      onChange={(e) => setEditedFeedback({...editedFeedback, priority: e.target.value as "low" | "medium" | "high"})}
                      className="px-2 py-1 rounded-md bg-gray-800 border-gray-700 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <Badge className={
                      viewingFeedback.priority === "high" 
                        ? "bg-red-600/20 text-red-400 border-red-800" 
                        : viewingFeedback.priority === "low" 
                          ? "bg-blue-600/20 text-blue-400 border-blue-800"
                          : "bg-amber-600/20 text-amber-400 border-amber-800"
                    }>
                      {viewingFeedback.priority || "Medium"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* User Info */}
              {viewingFeedback.userId && (
                <div className="border-t border-gray-800 pt-3">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    User Information:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-800/50 p-3 rounded-md">
                    <p className="text-sm text-gray-400">
                      <span className="text-gray-500">ID:</span> {viewingFeedback.userId}
                    </p>
                    {viewingFeedback.userEmail && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Email:</span> {viewingFeedback.userEmail}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* System Info */}
              {(viewingFeedback.browser || viewingFeedback.device || viewingFeedback.osVersion) && (
                <div className="border-t border-gray-800 pt-3">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    System Information:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-800/50 p-3 rounded-md">
                    {viewingFeedback.browser && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Browser:</span> {viewingFeedback.browser}
                      </p>
                    )}
                    {viewingFeedback.device && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Device:</span> {viewingFeedback.device}
                      </p>
                    )}
                    {viewingFeedback.osVersion && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">OS:</span> {viewingFeedback.osVersion}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Lesson Context */}
              {(viewingFeedback.lessonTitle || viewingFeedback.sectionTitle || viewingFeedback.context || viewingFeedback.lesson) && (
                <div className="border-t border-gray-800 pt-3">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4" />
                    Learning Context:
                  </h4>
                  <div className="bg-gray-800/50 p-3 rounded-md space-y-2">
                    {viewingFeedback.context && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Context:</span> {viewingFeedback.context}
                      </p>
                    )}
                    {viewingFeedback.lesson && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Subtask:</span> {viewingFeedback.lesson}
                      </p>
                    )}
                    {viewingFeedback.lessonTitle && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Lesson:</span> {viewingFeedback.lessonTitle}
                      </p>
                    )}
                    {viewingFeedback.sectionTitle && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Section:</span> {viewingFeedback.sectionTitle}
                      </p>
                    )}
                    {viewingFeedback.subtaskId && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Subtask ID:</span> {viewingFeedback.subtaskId}
                      </p>
                    )}
                    {viewingFeedback.sectionId && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Section ID:</span> {viewingFeedback.sectionId}
                      </p>
                    )}
                    {viewingFeedback.roadmapId && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Roadmap ID:</span> {viewingFeedback.roadmapId}
                      </p>
                    )}
                    {viewingFeedback.roadmapTitle && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Roadmap Title:</span> {viewingFeedback.roadmapTitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback Description */}
              <div className="border-t border-gray-800 pt-3">
                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Description:
                </h4>
                {editingFeedback ? (
                  <Textarea 
                    value={editedFeedback.description || viewingFeedback.description || ''} 
                    onChange={(e) => setEditedFeedback({...editedFeedback, description: e.target.value})}
                    className="mt-2 bg-gray-800 border-gray-700 min-h-[100px]"
                  />
                ) : (
                  <div className="mt-2 p-3 bg-gray-800 rounded-md text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {viewingFeedback.description || "No description"}
                  </div>
                )}
              </div>
              
              {/* Resolution Information */}
              {viewingFeedback.status === "resolved" && viewingFeedback.resolvedAt && (
                <div className="border-t border-gray-800 pt-3">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Resolution Information:
                  </h4>
                  <div className="mt-2 p-3 bg-gray-800 rounded-md text-gray-300">
                    <p className="text-sm">
                      <span className="text-gray-500">Resolved On:</span> {format(viewingFeedback.resolvedAt, "MM/dd/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex justify-between border-t border-gray-800 pt-4 flex-wrap gap-2">
            {editingFeedback ? (
              <>
                <Button 
                  onClick={handleUpdateFeedback}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  onClick={() => setEditingFeedback(false)}
                  variant="outline"
                  className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => viewingFeedback && navigateToEditPage(viewingFeedback)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  onClick={() => setViewingFeedback(null)}
                  variant="outline"
                  className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                >
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300">Are you sure you want to delete this feedback? This action cannot be undone.</p>
          </div>
          <DialogFooter className="flex justify-between border-t border-gray-800 pt-4 flex-wrap gap-2">
            <Button 
              onClick={() => {
                if (confirmDelete) handleDelete(confirmDelete.id);
              }}
              variant="destructive"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button 
              onClick={() => setConfirmDelete(null)}
              variant="outline"
              className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackPage; 