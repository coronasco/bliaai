"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogoutButton } from "./LogoutButton";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { 
  FaHome, 
  FaGraduationCap, 
  FaUserCircle, 
  FaCrown,
  FaBars,
  FaTimes,
  FaShieldAlt,
  FaChevronDown,
  FaRegBell
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  isLandingPage?: boolean;
}

export function Navbar({ isLandingPage = false }: NavbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "customers", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || userData.fullName || "User");
            setUserPoints(userData.points || 0);
            setUserLevel(userData.level || 1);
            setIsAdmin(userData.roles?.includes('admin') || false);
          }
        } catch (error) {
          console.error("Error getting user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Create navigation items
  const baseNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <FaHome className="mr-2" />,
      highlight: false,
    },
    {
      name: "Roadmaps",
      href: "/roadmaps",
      icon: <FaGraduationCap className="mr-2" />,
      highlight: false,
    },
    {
      name: "School",
      href: "/dashboard/school",
      icon: <FaGraduationCap className="mr-2" />,
      highlight: false,
      disabled: true,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: <FaUserCircle className="mr-2" />,
      highlight: false,
    }
  ];
  
  // Add Admin link if user has admin role
  const adminNavItem = isAdmin ? [{
    name: "Admin",
    href: "/admin",
    icon: <FaShieldAlt className="mr-2 text-red-400" />,
    highlight: true,
  }] : [];
  

  
  // Combine all navigation items
  const navItems = [
    ...baseNavItems,
    ...adminNavItem
  ];

  // Landing page simplified navigation
  if (isLandingPage && !user) {
    return (
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/90' : 'bg-gray-900/70'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and app name */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text transition-all group-hover:from-blue-300 group-hover:to-indigo-400">BLia</span>
                <span className="text-2xl font-bold ml-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text transition-all group-hover:from-indigo-400 group-hover:to-purple-400">AI</span>
              </Link>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild className="rounded-full px-6 transition-all hover:bg-gray-800/50 hover:text-white border-gray-700">
                <Link href="/auth">Login</Link>
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg shadow-blue-600/20" asChild>
                <Link href="/auth?register=true">Register</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/95 shadow-lg shadow-black/10' : 'bg-gray-900'} backdrop-blur-md border-b border-gray-800`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and app name */}
          <div className="flex items-center gap-10">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text transition-all group-hover:from-blue-300 group-hover:to-indigo-400">Blia</span>
                <span className="text-2xl font-bold ml-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text transition-all group-hover:from-indigo-400 group-hover:to-purple-400">AI</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gray-800/80 text-blue-400 ring-1 ring-blue-500/20 shadow-sm"
                        : item.highlight
                        ? item.name === "Premium" 
                            ? "text-amber-400 hover:bg-gray-800/50 hover:ring-1 hover:ring-amber-500/20" 
                            : "text-red-400 hover:bg-gray-800/50 hover:ring-1 hover:ring-red-500/20"
                        : "text-gray-300 hover:bg-gray-800/50 hover:text-gray-100 hover:ring-1 hover:ring-gray-700"
                    }`}
                  >
                    <span className={`transform flex items-center transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                      {item.icon}
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile and logout */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification bell with animation */}
            <Link href="/dashboard/notifications">
            <button className="p-2 rounded-full bg-gray-800/70 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white relative">
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <FaRegBell size={18} />
            </button>
            </Link>
            {/* User level and points */}
            <div className="flex items-center bg-gray-800/70 rounded-full px-3 py-1 ring-1 ring-gray-700/50">
              <div className="mr-2 text-xs font-medium text-gray-300">
                Level {userLevel}
              </div>
              <Badge variant="success" className="text-xs">{userPoints} points</Badge>
            </div>
            
            {/* User profile dropdown */}
            <div className="relative">
              <button 
                className="flex items-center bg-gray-800/70 hover:bg-gray-700 rounded-full pl-2 pr-4 py-1.5 ring-1 ring-gray-700/50 transition-all duration-200 hover:ring-gray-600"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <Avatar className="h-8 w-8 mr-2 ring-2 ring-gray-700/50">
                  <AvatarImage src={user?.photoURL || ""} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200">{userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-100 mr-1">
                  {userName}
                  {isPremium && (
                    <span className="ml-1 text-amber-400">
                      <FaCrown className="inline-block w-3 h-3" />
                    </span>
                  )}
                </span>
                <FaChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl py-1 z-50"
                  >
                    <Link 
                      href="/dashboard/profile" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaUserCircle className="inline-block mr-2" /> Profile
                    </Link>
                    
                    <div className="border-t border-gray-700/50 my-1"></div>
                    
                    <div className="px-4 py-2">
                      <LogoutButton variant="full" onClick={() => setShowUserMenu(false)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Main menu"
              className="text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu with animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-gray-800/90 backdrop-blur-sm overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3 ring-2 ring-gray-700/50">
                    <AvatarImage src={user?.photoURL || ""} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200">{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-gray-100">
                      {userName}
                      {isPremium && (
                        <span className="ml-1 text-amber-400">
                          <FaCrown className="inline-block w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-400 mr-2">Level {userLevel}</span>
                      <Badge variant="success" className="text-xs">{userPoints} points</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gray-700/70 text-blue-400 border-l-2 border-blue-500 pl-3.5"
                        : item.highlight
                        ? item.name === "Premium" ? "text-amber-400 hover:bg-gray-700/50" : "text-red-400 hover:bg-gray-700/50"
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="pt-4 pb-3 border-t border-gray-700/50">
                <div className="px-2">
                  <LogoutButton variant="full" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 