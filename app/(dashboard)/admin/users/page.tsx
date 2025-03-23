"use client";

import React, { useState, useEffect } from "react";
import { collection, query, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Search, Edit, ChevronLeft, ChevronRight, ShieldCheck, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserData = {
  id: string;
  fullName: string;
  email: string;
  level?: number;
  points?: number;
  role?: string;
  roles?: string[];
  createdAt: Date;
  photo?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
};

type UpdateDataType = {
  fullName?: string;
  name?: string;
  role?: string;
  roles?: string[];
  updatedAt?: Date;
  updatedBy?: string;
};

const UsersAdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserData>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");
  
  // Role filter
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Load all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const items: UserData[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            fullName: data.fullName || data.name || "Unnamed User",
            email: data.email || "",
            level: data.level || 1,
            points: data.points || 0,
            role: data.role || "standard",
            roles: data.roles || ["standard"],
            createdAt: data.createdAt?.toDate() || new Date(),
            photo: data.photo || null,
            notificationPreferences: data.notificationPreferences || {
              email: true,
              push: true,
              marketing: false
            }
          });
        });
        
        setUsers(items);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Error loading users. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const userRef = doc(db, "customers", selectedUser.id);
      
      // Prepare update data
      const updateData: UpdateDataType = {};
      
      if (editedUser.role && editedUser.role !== selectedUser.role) {
        updateData.role = editedUser.role;
      }
      
      if (editedUser.roles && JSON.stringify(editedUser.roles) !== JSON.stringify(selectedUser.roles)) {
        updateData.roles = editedUser.roles;
      }
      
      if (editedUser.fullName && editedUser.fullName !== selectedUser.fullName) {
        updateData.fullName = editedUser.fullName;
        updateData.name = editedUser.fullName; // For compatibility
      }
      
      if (Object.keys(updateData).length === 0) {
        setEditingUser(false);
        return;
      }
      
      // Add update metadata
      updateData.updatedAt = new Date();
      updateData.updatedBy = user?.uid;
      
      await updateDoc(userRef, updateData);

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...updateData } 
          : u
      ));

      setSelectedUser(prev => prev ? { ...prev, ...updateData } : null);
      setEditingUser(false);
      setError(null);
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      setError(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Error updating user!");
    }
  };

  // Get the primary role of the user (for display)
  const getPrimaryRole = (user: UserData): string => {
    if (user.roles && user.roles.includes("admin")) return "admin";
    if (user.roles && user.roles.includes("editor")) return "editor";
    if (user.role) return user.role;
    return "standard";
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    // Filter by search term
    const searchTermLower = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      searchTermLower === "" || 
      (user.fullName && user.fullName.toLowerCase().includes(searchTermLower)) || 
      (user.email && user.email.toLowerCase().includes(searchTermLower));
    
    // Filter by role
    const matchesRole = 
      roleFilter === "all" || 
      (roleFilter === "admin" && (user.roles?.includes("admin") || user.role === "admin")) ||
      (roleFilter === "editor" && (user.roles?.includes("editor") || user.role === "editor")) ||
      (roleFilter === "standard" && getPrimaryRole(user) === "standard");
    
    return matchesSearch && matchesRole;
  });

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // Get users for current page
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Change page function
  const changePage = (page: number) => {
    setCurrentPage(page);
  };
  
  // Reset page to 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchTerm]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and their roles in the platform.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-gray-950 border-gray-800 text-white"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px] bg-gray-950 border-gray-800 text-white">
            <SelectValue placeholder="Role filter" className="text-white" />
          </SelectTrigger>
          <SelectContent className="bg-gray-950 border-gray-800 text-white">
            <SelectItem value="all" className="text-white">All roles</SelectItem>
            <SelectItem value="admin" className="text-white">Admin</SelectItem>
            <SelectItem value="editor" className="text-white">Editor</SelectItem>
            <SelectItem value="standard" className="text-white">Standard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6 bg-gray-900 border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Registration Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b border-gray-800 hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {user.photo ? (
                          <AvatarImage src={user.photo} alt={user.fullName} />
                        ) : (
                          <AvatarFallback className="bg-gray-800 text-white">
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant={
                        getPrimaryRole(user) === "admin" 
                          ? "destructive" 
                          : getPrimaryRole(user) === "editor"
                            ? "outline"
                            : "secondary"
                      }
                      className="flex items-center gap-1 w-fit"
                    >
                      {getPrimaryRole(user) === "admin" && <ShieldCheck className="h-3 w-3" />}
                      {getPrimaryRole(user) === "editor" && <Shield className="h-3 w-3" />}
                      {getPrimaryRole(user) === "standard" && <User className="h-3 w-3" />}
                      {getPrimaryRole(user)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {format(user.createdAt, "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setEditedUser({
                          fullName: user.fullName,
                          role: user.role,
                          roles: user.roles
                        });
                        setEditingUser(true);
                      }}
                      className="hover:bg-gray-800"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 bg-gray-900 border-gray-800 hover:bg-gray-800"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit user dialog */}
      <Dialog open={editingUser} onOpenChange={(open) => !open && setEditingUser(false)}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update user details and roles.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="fullName" className="text-sm font-medium text-white">Full Name</label>
                <Input
                  id="fullName"
                  value={editedUser.fullName || selectedUser.fullName}
                  onChange={(e) => setEditedUser({ ...editedUser, fullName: e.target.value })}
                  className="bg-gray-950 border-gray-800 text-white"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="userRole" className="text-sm font-medium text-white">Primary Role</label>
                <Select 
                  value={editedUser.role || selectedUser.role || "standard"} 
                  onValueChange={(value) => setEditedUser({ ...editedUser, role: value })}
                >
                  <SelectTrigger id="userRole" className="bg-gray-950 border-gray-800 text-white">
                    <SelectValue placeholder="Select role" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-800 text-white">
                    <SelectItem value="admin" className="text-white">Administrator</SelectItem>
                    <SelectItem value="editor" className="text-white">Editor</SelectItem>
                    <SelectItem value="standard" className="text-white">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-white">Multiple Roles</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["admin", "editor", "standard"].map((role) => (
                    <Badge
                      key={role}
                      variant={
                        editedUser.roles?.includes(role) || 
                        ((!editedUser.roles || editedUser.roles.length === 0) && 
                        selectedUser.roles?.includes(role)) ? "default" : "outline"
                      }
                      className="cursor-pointer px-3 py-1"
                      onClick={() => {
                        const currentRoles = [...(editedUser.roles || selectedUser.roles || [])];
                        const roleIndex = currentRoles.indexOf(role);
                        
                        if (roleIndex > -1) {
                          currentRoles.splice(roleIndex, 1);
                        } else {
                          currentRoles.push(role);
                        }
                        
                        setEditedUser({ ...editedUser, roles: currentRoles });
                      }}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingUser(false)}
              className="bg-gray-900 border-gray-800 hover:bg-gray-800 text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersAdminPage; 