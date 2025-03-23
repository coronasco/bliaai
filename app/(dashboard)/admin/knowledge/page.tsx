"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Type definitions
interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  references?: string[];
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  
  // State for new document
  const [newDocument, setNewDocument] = useState({
    title: "",
    category: "",
    content: "",
    tags: [] as string[],
    difficulty: "beginner" as 'beginner' | 'intermediate' | 'advanced',
    references: [] as string[]
  });
  
  // Temporary state for tags and references (for input)
  const [tagInput, setTagInput] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  
  // State for document editing
  const [editDocument, setEditDocument] = useState<KnowledgeDocument | null>(null);
  
  // State for editing tags and references
  const [editTagInput, setEditTagInput] = useState("");
  const [editReferenceInput, setEditReferenceInput] = useState("");
  
  // State for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        console.log("Knowledge Page - Checking admin status - user:", user?.email);
        
        if (!user || !user.uid) {
          console.log("Knowledge Page - No authenticated user");
          router.push("/dashboard");
          return;
        }

        // Check role in Firestore
        console.log("Knowledge Page - Checking document for user:", user.uid);
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        
        if (!userDoc.exists()) {
          console.log("Knowledge Page - User document doesn't exist");
          router.push("/dashboard");
          return;
        }

        const userData = userDoc.data();
        console.log("Knowledge Page - User data:", userData);
        
        // Check if user has admin role (supports both roles and role)
        const hasAdminRoleInArray = userData.roles?.includes('admin') || false;
        const hasAdminRoleField = userData.role === 'admin';
        const isUserAdmin = hasAdminRoleInArray || hasAdminRoleField;
        
        console.log("Knowledge Page - Admin check result:", {
          hasAdminRoleInArray,
          hasAdminRoleField,
          isUserAdmin
        });

        if (!isUserAdmin) {
          console.log("Knowledge Page - User doesn't have admin role");
          router.push("/dashboard");
          return;
        }

        console.log("Knowledge Page - User confirmed as admin!");
        setHasAdminAccess(true);
      } catch (error) {
        console.error("Error checking admin role:", error);
        router.push("/dashboard");
      } finally {
        setAdminCheckComplete(true);
      }
    };

    checkAdminRole();
  }, [user, router]);

  // Get authentication token
  const getAuthToken = async () => {
    try {
      console.log("Starting token retrieval, user:", user?.email);
      
      // Check if we have a valid user
      if (!user) {
        console.error("No authenticated user");
        toast.error("Could not obtain authentication token - no user");
        return null;
      }
      
      // Get token directly from Firebase Auth
      console.log("Attempting to get token for user:", user.uid);
      const token = await user.getIdToken(true); // force token refresh
      
      if (!token) {
        console.error("Returned token is null or undefined");
        toast.error("Could not obtain authentication token");
        return null;
      }
      
      console.log("Token obtained successfully, length:", token.length, "first characters:", token.substring(0, 10) + "...");
      return token;
    } catch (error) {
      console.error("Error obtaining token:", error);
      toast.error("Error obtaining authentication token");
      return null;
    }
  };

  // Load documents from knowledge base
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/knowledge/list");
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map((doc: KnowledgeDocument) => doc.category))].filter(Boolean) as string[];
        setCategories(uniqueCategories);
        
        // Apply initial filters
        filterDocuments(data, searchTerm, selectedCategory);
      } else {
        toast.error("Error loading documents");
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Could not load documents");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  // Filter documents
  const filterDocuments = (docs: KnowledgeDocument[], search: string, category: string) => {
    let filtered = [...docs];
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.content.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter(doc => doc.category === category);
    }
    
    setFilteredDocuments(filtered);
  };

  // Add new tag
  const addTag = () => {
    if (tagInput.trim() && !newDocument.tags.includes(tagInput.trim())) {
      setNewDocument({
        ...newDocument,
        tags: [...newDocument.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setNewDocument({
      ...newDocument,
      tags: newDocument.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Add new reference
  const addReference = () => {
    if (referenceInput.trim() && !newDocument.references.includes(referenceInput.trim())) {
      setNewDocument({
        ...newDocument,
        references: [...newDocument.references, referenceInput.trim()]
      });
      setReferenceInput("");
    }
  };

  // Remove reference
  const removeReference = (refToRemove: string) => {
    setNewDocument({
      ...newDocument,
      references: newDocument.references.filter(ref => ref !== refToRemove)
    });
  };

  // Reset form
  const resetNewDocumentForm = () => {
    setNewDocument({
      title: "",
      category: "",
      content: "",
      tags: [],
      difficulty: "beginner",
      references: []
    });
    setTagInput("");
    setReferenceInput("");
  };

  // Add new document
  const addDocument = async () => {
    try {
      console.log("Starting document addition process");
      const token = await getAuthToken();
      console.log("Token obtained:", token ? "DA (token valid)" : "NU (token null)");
      
      if (!token) return;
      
      console.log("Sending request to API with token");
      const response = await fetch("/api/knowledge/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newDocument)
      });
      
      console.log("Response received:", {
        status: response.status,
        statusText: response.statusText
      });
      
      if (response.ok) {
        toast.success("Document added successfully");
        fetchDocuments();
        setAddDialogOpen(false);
        // Reset form
        resetNewDocumentForm();
      } else {
        const error = await response.json();
        console.error("Response error:", error);
        toast.error(`Error adding document: ${error.error}`);
      }
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Could not add document");
    }
  };

  // Add tag to edited document
  const addEditTag = () => {
    if (editDocument && editTagInput.trim() && 
        !editDocument.tags?.includes(editTagInput.trim())) {
      setEditDocument({
        ...editDocument,
        tags: [...(editDocument.tags || []), editTagInput.trim()]
      });
      setEditTagInput("");
    }
  };

  // Remove tag from edited document
  const removeEditTag = (tagToRemove: string) => {
    if (editDocument && editDocument.tags) {
      setEditDocument({
        ...editDocument,
        tags: editDocument.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  // Add reference to edited document
  const addEditReference = () => {
    if (editDocument && editReferenceInput.trim() && 
        !editDocument.references?.includes(editReferenceInput.trim())) {
      setEditDocument({
        ...editDocument,
        references: [...(editDocument.references || []), editReferenceInput.trim()]
      });
      setEditReferenceInput("");
    }
  };

  // Remove reference from edited document
  const removeEditReference = (refToRemove: string) => {
    if (editDocument && editDocument.references) {
      setEditDocument({
        ...editDocument,
        references: editDocument.references.filter(ref => ref !== refToRemove)
      });
    }
  };

  // Update document
  const updateDocument = async () => {
    if (!editDocument) return;
    
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch(`/api/knowledge/${editDocument.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editDocument.title,
          category: editDocument.category,
          content: editDocument.content,
          tags: editDocument.tags || [],
          difficulty: editDocument.difficulty || 'beginner',
          references: editDocument.references || [],
        })
      });
      
      if (response.ok) {
        toast.success("Document updated successfully");
        fetchDocuments();
        setEditDialogOpen(false);
        setEditTagInput("");
        setEditReferenceInput("");
      } else {
        const error = await response.json();
        toast.error(`Error updating document: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Could not update document");
    }
  };

  // Delete document
  const deleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch(`/api/knowledge/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: documentToDelete })
      });
      
      if (response.ok) {
        toast.success("Document deleted successfully");
        fetchDocuments();
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
      } else {
        const error = await response.json();
        toast.error(`Error deleting document: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Could not delete document");
    }
  };

  // Update filters when terms change
  useEffect(() => {
    if (hasAdminAccess) {
      filterDocuments(documents, searchTerm, selectedCategory);
    }
  }, [searchTerm, selectedCategory, documents, hasAdminAccess]);

  // Load documents at initialization, only if user has access
  useEffect(() => {
    if (hasAdminAccess) {
      fetchDocuments();
    }
  }, [hasAdminAccess, fetchDocuments]);

  // Show loading until admin check is complete
  if (!adminCheckComplete) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  // Show nothing if user doesn't have access
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with title and add button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage your knowledge documents and resources</p>
        </div>
        
        {/* Add document button moved to header */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2 h-4 w-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-slate-900 border border-gray-700 shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500"></div>
            <DialogHeader className="pb-4 border-b border-gray-700">
              <DialogTitle className="text-xl font-bold flex items-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add New Document
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Fill in the details to add a new document to the knowledge base.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-5 py-5">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Title <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      id="title"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                      placeholder="Enter document title"
                      className="bg-slate-800 border-gray-700 focus:border-primary focus:ring-primary text-white"
                    />
                  </div>
                  
                  {/* Category Field */}
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Category <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      id="category"
                      value={newDocument.category}
                      onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                      placeholder="E.g. Tutorial, Guide, Reference"
                      className="bg-slate-800 border-gray-700 focus:border-primary focus:ring-primary text-white"
                    />
                  </div>
                  
                  {/* Difficulty Field */}
                  <div className="space-y-2">
                    <label htmlFor="difficulty" className="text-sm font-medium text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Difficulty Level
                    </label>
                    <div className="flex space-x-2">
                      {['beginner', 'intermediate', 'advanced'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setNewDocument({ ...newDocument, difficulty: level as 'beginner' | 'intermediate' | 'advanced' })}
                          className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
                            newDocument.difficulty === level 
                              ? level === 'beginner' 
                                ? 'bg-green-950/30 text-green-400 border border-green-600/30' 
                                : level === 'intermediate'
                                  ? 'bg-blue-950/30 text-blue-400 border border-blue-600/30'
                                  : 'bg-purple-950/30 text-purple-400 border border-purple-600/30'
                              : 'bg-slate-800 text-gray-400 border border-gray-700 hover:bg-slate-700'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-5">
                  {/* Tags Field */}
                  <div className="space-y-2">
                    <label htmlFor="tags" className="text-sm font-medium text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tags
                    </label>
                    <div className="relative">
                      <Input
                        id="tagInput"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag and press Enter"
                        className="bg-slate-800 border-gray-700 pr-20 focus:border-primary focus:ring-primary text-white"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button 
                        type="button" 
                        onClick={addTag} 
                        size="sm"
                        className="absolute right-1 top-1 h-7 px-2 text-xs"
                        disabled={!tagInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {newDocument.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pb-1">
                        {newDocument.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-1 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 px-2 py-1"
                          >
                            #{tag}
                            <button 
                              onClick={() => removeTag(tag)}
                              className="rounded-full h-4 w-4 inline-flex items-center justify-center text-xs hover:bg-red-500 hover:text-white"
                              aria-label="Remove tag"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* References Field */}
                  <div className="space-y-2">
                    <label htmlFor="references" className="text-sm font-medium text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1" />
                      </svg>
                      External References
                    </label>
                    <div className="relative">
                      <Input
                        id="referenceInput"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        placeholder="Add a URL and press Enter"
                        className="bg-slate-800 border-gray-700 pr-20 focus:border-primary focus:ring-primary text-white"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
                      />
                      <Button 
                        type="button" 
                        onClick={addReference} 
                        size="sm"
                        className="absolute right-1 top-1 h-7 px-2 text-xs"
                        disabled={!referenceInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {newDocument.references.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {newDocument.references.map((ref, index) => (
                          <div key={index} className="flex items-center justify-between gap-2 py-1.5 px-3 bg-slate-800/50 rounded text-xs group">
                            <span className="truncate text-gray-300">{ref.replace(/^https?:\/\//, '')}</span>
                            <button 
                              onClick={() => removeReference(ref)}
                              className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Content Field - Full Width */}
              <div className="space-y-2 mt-2">
                <label htmlFor="content" className="text-sm font-medium text-gray-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Content <span className="text-red-500 ml-1">*</span>
                </label>
                <Textarea
                  id="content"
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  placeholder="Write the document content here..."
                  rows={8}
                  className="bg-slate-800 border-gray-700 resize-none focus:border-primary focus:ring-primary text-white "
                />
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetNewDocumentForm();
                    setAddDialogOpen(false);
                  }}
                  className="border-gray-700 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={addDocument} 
                  disabled={!newDocument.title || !newDocument.category || !newDocument.content}
                  className={!newDocument.title || !newDocument.category || !newDocument.content ? 
                    'opacity-50 cursor-not-allowed' : 
                    'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Document
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filter bar redrawn */}
      <div className="border border-gray-700 rounded-md p-4 mb-8 bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search input redrawn */}
          <div className="sm:col-span-3 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </div>
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-10 bg-slate-800 border-gray-700"
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-slate-800"
                onClick={() => setSearchTerm("")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            )}
          </div>

          {/* Category selector with appropriate background */}
          <select
            className="h-10 bg-slate-800 border border-gray-700 rounded-md px-3 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Information about results */}
        {!isLoading && filteredDocuments.length > 0 && (
          <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground border-t border-gray-700 pt-3">
            <p>
              Showing {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
              {searchTerm ? ` for "${searchTerm}"` : ''}
              {selectedCategory !== 'all' ? ` in category "${selectedCategory}"` : ''}
            </p>
            <p>
              {selectedCategory === 'all' ? 'All categories' : `Category: ${selectedCategory}`}
            </p>
          </div>
        )}
      </div>

      {/* Main content - dark theme */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-gray-700 rounded-lg bg-slate-900">
          <div className="bg-muted p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">No documents found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {searchTerm || selectedCategory !== 'all' 
              ? "Try adjusting your search or category filters to find what you're looking for."
              : "You haven't added any documents yet. Click the 'Add Document' button to get started."}
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="border border-gray-700 rounded-lg overflow-hidden bg-slate-900 hover:bg-slate-900/80 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-6 group">
                {/* Main section of document */}
                <div className="p-5 md:col-span-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{doc.title}</h3>
                    <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditDocument(doc);
                          setEditDialogOpen(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          setDocumentToDelete(doc.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{doc.category}</Badge>
                    {doc.difficulty && (
                      <Badge 
                        variant="secondary"
                        className={
                          doc.difficulty === 'beginner' ? 'border-green-600/20 bg-green-950/20 text-green-400' :
                          doc.difficulty === 'intermediate' ? 'border-blue-600/20 bg-blue-950/20 text-blue-400' :
                          'border-purple-600/20 bg-purple-950/20 text-purple-400'
                        }
                      >
                        {doc.difficulty}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{doc.content}</p>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {doc.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-muted/20 border-muted/20">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar with metadata */}
                <div className="bg-slate-800 p-4 border-t md:border-t-0 md:border-l border-gray-700">
                  <div className="space-y-4">
                    {/* Creation/update date */}
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-xs">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>

                    {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Updated</p>
                        <p className="text-xs">{new Date(doc.updatedAt).toLocaleDateString()}</p>
                      </div>
                    )}

                    {/* References */}
                    {doc.references && doc.references.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">References</p>
                        <div className="space-y-1">
                          {doc.references.slice(0, 2).map((ref, index) => (
                            <a 
                              key={index}
                              href={ref}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs block text-gray-400 hover:underline truncate"
                            >
                              {ref.replace(/^https?:\/\//, '')}
                            </a>
                          ))}
                          {doc.references.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{doc.references.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs for actions */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the details of the selected document.
            </DialogDescription>
          </DialogHeader>
          {editDocument && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
                <Input
                  id="edit-title"
                  value={editDocument.title}
                  onChange={(e) => setEditDocument({ ...editDocument, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-category" className="text-sm font-medium">Category</label>
                <Input
                  id="edit-category"
                  value={editDocument.category}
                  onChange={(e) => setEditDocument({ ...editDocument, category: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-difficulty" className="text-sm font-medium">Difficulty Level</label>
                <select
                  id="edit-difficulty"
                  value={editDocument.difficulty || 'beginner'}
                  onChange={(e) => setEditDocument({ 
                    ...editDocument, 
                    difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' 
                  })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-tags" className="text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <Input
                    id="edit-tagInput"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditTag())}
                  />
                  <Button type="button" onClick={addEditTag} size="sm">Add</Button>
                </div>
                {editDocument.tags && editDocument.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editDocument.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button 
                          onClick={() => removeEditTag(tag)}
                          className="rounded-full h-4 w-4 inline-flex items-center justify-center text-xs hover:bg-red-500 hover:text-white"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-references" className="text-sm font-medium">External References</label>
                <div className="flex gap-2">
                  <Input
                    id="edit-referenceInput"
                    value={editReferenceInput}
                    onChange={(e) => setEditReferenceInput(e.target.value)}
                    placeholder="Add a reference URL"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditReference())}
                  />
                  <Button type="button" onClick={addEditReference} size="sm">Add</Button>
                </div>
                {editDocument.references && editDocument.references.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {editDocument.references.map((ref, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-secondary/20 rounded-md">
                        <span className="text-sm truncate">{ref}</span>
                        <button 
                          onClick={() => removeEditReference(ref)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-content" className="text-sm font-medium">Content</label>
                <Textarea
                  id="edit-content"
                  value={editDocument.content}
                  onChange={(e) => setEditDocument({ ...editDocument, content: e.target.value })}
                  rows={10}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <p>Created: {new Date(editDocument.createdAt).toLocaleDateString()}</p>
                {editDocument.updatedAt && (
                  <p>Last updated: {new Date(editDocument.updatedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateDocument}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteDocument}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 