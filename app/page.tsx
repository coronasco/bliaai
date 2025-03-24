"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/Navbar";
import { motion } from "framer-motion";
import { 
  FaRoad, 
  FaTrophy, 
  FaUsers,
  FaChartLine,
  FaArrowRight,
  FaBolt,
  FaCheck,
  FaCrown,
  FaPuzzlePiece
} from "react-icons/fa";

export default function Home() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <FaRoad />,
      title: "AI-Generated Roadmaps",
      description: "Get personalized career roadmaps tailored to your goals, with clear progression steps"
    },
    {
      icon: <FaBolt />,
      title: "Detailed Subtasks",
      description: "Each step includes AI-generated resources and detailed instructions to guide your learning"
    },
    {
      icon: <FaPuzzlePiece />,
      title: "Multiple Career Paths",
      description: "Premium users can create up to 4 different career roadmaps to explore various interests"
    },
    {
      icon: <FaChartLine />,
      title: "Progress Tracking",
      description: "Monitor your advancement with detailed analytics and completion status"
    },
    {
      icon: <FaTrophy />,
      title: "Badges & Rewards",
      description: "Earn exclusive badges and rewards as you complete tasks and milestones"
    },
    {
      icon: <FaUsers />,
      title: "Public Roadmaps",
      description: "Explore and follow roadmaps created by other users in the community"
    }
  ];

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen">
      <Navbar isLandingPage={true} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 -z-10"></div>
        
        {/* Background decorations */}
        <div className="absolute inset-0 -z-5">
          <div className="absolute right-0 top-1/3 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-[100px]"></div>
          <div className="absolute left-0 bottom-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-600 rounded-full opacity-10 blur-[80px]"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5 -z-5">
          <svg 
            width="100%" 
            height="100%" 
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-50"
          >
            <defs>
              <pattern 
                id="grid-pattern" 
                width="40" 
                height="40" 
                patternUnits="userSpaceOnUse"
              >
                <path 
                  d="M 40 0 L 0 0 0 40" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.5"
                  opacity="0.4"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <Badge className="mb-4 bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-300 border-purple-500/30 hover:from-purple-600/40 hover:to-blue-600/40 px-3 py-1">
              AI-Powered Career Development Platform
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400 text-transparent bg-clip-text">
              Master Your Career Journey With AI
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              BLia AI creates personalized learning paths tailored to your career goals, 
              helping you develop the skills that matter most in today&apos;s job market.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 px-8 text-lg shadow-lg shadow-purple-900/20" asChild>
                <Link href="/auth?register=true">
                  Get Started Free <FaArrowRight className="ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" className="py-6 px-8 text-lg border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" asChild>
                <Link href="/premium">
                  Explore Premium
                </Link>
              </Button>
            </div>
            
            {/* Preview Image */}
            <motion.div 
              className="mt-16 relative"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1 rounded-xl shadow-2xl shadow-purple-900/10">
                <div className="relative rounded-lg overflow-hidden border border-gray-700 aspect-[16/9] h-[350px] md:h-[400px]">
                  {/* SVG illustration instead of roadmap image */}
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 1200 630" 
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0"
                  >
                    <rect width="100%" height="100%" fill="#1f2937" />
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 0.2 }} />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.1 }} />
                        <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 0.1 }} />
                      </linearGradient>
                    </defs>
                    
                    {/* Background elements */}
                    <rect x="0" y="0" width="1200" height="630" fill="url(#gradient1)" />
                    <rect x="0" y="0" width="1200" height="630" fill="url(#gradient2)" />
                    
                    {/* Roadmap elements */}
                    <rect x="150" y="100" width="900" height="80" rx="8" fill="#2d3748" stroke="#4c1d95" strokeWidth="1" />
                    <rect x="180" y="130" width="120" height="20" rx="4" fill="#6d28d9" opacity="0.8" />
                    <rect x="320" y="130" width="180" height="20" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="520" y="130" width="160" height="20" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="700" y="130" width="140" height="20" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="860" y="130" width="120" height="20" rx="4" fill="#4c1d95" opacity="0.5" />

                    {/* Connection lines */}
                    <line x1="240" y1="180" x2="240" y2="220" stroke="#6d28d9" strokeWidth="2" />
                    
                    {/* First subtask group */}
                    <rect x="150" y="220" width="180" height="60" rx="8" fill="#2d3748" stroke="#4c1d95" strokeWidth="1" />
                    <rect x="170" y="240" width="80" height="14" rx="4" fill="#6d28d9" opacity="0.8" />
                    <rect x="170" y="260" width="140" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    <line x1="240" y1="280" x2="240" y2="320" stroke="#6d28d9" strokeWidth="2" />
                    
                    {/* Second subtask group */}
                    <rect x="150" y="320" width="180" height="60" rx="8" fill="#2d3748" stroke="#4c1d95" strokeWidth="1" />
                    <rect x="170" y="340" width="90" height="14" rx="4" fill="#8b5cf6" opacity="0.8" />
                    <rect x="170" y="360" width="140" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    <line x1="330" y1="250" x2="380" y2="250" stroke="#6d28d9" strokeWidth="2" />
                    
                    {/* Third subtask group */}
                    <rect x="380" y="220" width="180" height="60" rx="8" fill="#2d3748" stroke="#4c1d95" strokeWidth="1" />
                    <rect x="400" y="240" width="100" height="14" rx="4" fill="#8b5cf6" opacity="0.8" />
                    <rect x="400" y="260" width="140" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    <line x1="560" y1="250" x2="610" y2="250" stroke="#6d28d9" strokeWidth="2" />
                    
                    {/* Fourth subtask group */}
                    <rect x="610" y="220" width="180" height="60" rx="8" fill="#2d3748" stroke="#4c1d95" strokeWidth="1" />
                    <rect x="630" y="240" width="110" height="14" rx="4" fill="#8b5cf6" opacity="0.8" />
                    <rect x="630" y="260" width="140" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    {/* Progress bar */}
                    <rect x="200" y="420" width="800" height="30" rx="15" fill="#1f2937" stroke="#4c1d95" strokeWidth="1" />
                    <rect x="200" y="420" width="300" height="30" rx="15" fill="#6d28d9" opacity="0.8" />
                    
                    {/* Progress text */}
                    <rect x="200" y="470" width="120" height="20" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="880" y="470" width="120" height="20" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    {/* Badges */}
                    <circle cx="870" cy="350" r="30" fill="#2d3748" stroke="#6d28d9" strokeWidth="2" />
                    <circle cx="950" cy="350" r="30" fill="#2d3748" stroke="#6d28d9" strokeWidth="2" />
                    <circle cx="910" cy="280" r="30" fill="#2d3748" stroke="#fbbf24" strokeWidth="2" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent opacity-60"></div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -bottom-5 -left-5 md:left-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg transform rotate-3 text-sm">
                <div className="flex items-center gap-2">
                  <FaBolt className="text-yellow-300" /> AI-Generated Content
                </div>
              </div>
              
              <div className="absolute -bottom-5 right-5 md:right-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg transform -rotate-2 text-sm">
                <div className="flex items-center gap-2">
                  <FaCheck className="text-green-300" /> Personalized Steps
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <Badge className="mb-4 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 border-blue-500/30 hover:from-blue-600/40 hover:to-indigo-600/40 px-3 py-1">
              Key Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text">Powered by Advanced AI Technology</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI with educational expertise to deliver 
              a personalized learning experience that adapts to your needs.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/10"
                variants={fadeIn}
              >
                <div className="rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 w-12 h-12 flex items-center justify-center mb-6 border border-purple-500/30 text-purple-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg 
            width="100%" 
            height="100%" 
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-50"
          >
            <defs>
              <pattern 
                id="dots-pattern" 
                width="30" 
                height="30" 
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots-pattern)" />
          </svg>
        </div>
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-[100px]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <Badge className="mb-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/30 px-3 py-1">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text">How BLia AI Works</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Our platform uses advanced algorithms to create a tailored learning journey that evolves with you.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl relative border border-gray-700"
              variants={fadeIn}
            >
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-900/20">
                1
              </div>
              <h3 className="text-xl font-bold mb-4 pt-2 text-white">Create Your Profile</h3>
              <p className="text-gray-400 mb-4">
                Share your career goals, skills, and learning preferences to help our AI understand your needs.
              </p>
              <div className="text-purple-400 font-medium">
                <Link href="/auth?register=true" className="flex items-center hover:text-purple-300 transition-colors">
                  Get Started <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl relative border border-gray-700"
              variants={fadeIn}
            >
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-900/20">
                2
              </div>
              <h3 className="text-xl font-bold mb-4 pt-2 text-white">Generate Your Roadmap</h3>
              <p className="text-gray-400 mb-4">
                Our AI creates a customized career roadmap with specific paths and learning resources.
              </p>
              <div className="text-purple-400 font-medium">
                <Link href="/dashboard" className="flex items-center hover:text-purple-300 transition-colors">
                  View Dashboard <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl relative border border-gray-700"
              variants={fadeIn}
            >
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-900/20">
                3
              </div>
              <h3 className="text-xl font-bold mb-4 pt-2 text-white">Track Your Progress</h3>
              <p className="text-gray-400 mb-4">
                Complete tasks, earn badges, and watch your skills develop as you progress through your roadmap.
              </p>
              <div className="text-purple-400 font-medium">
                <Link href="/premium" className="flex items-center hover:text-purple-300 transition-colors">
                  Unlock Premium <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Premium Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg 
            width="100%" 
            height="100%" 
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-50"
          >
            <defs>
              <pattern 
                id="diagonal-pattern" 
                width="40" 
                height="40" 
                patternUnits="userSpaceOnUse"
              >
                <path 
                  d="M 0,40 l 40,-40 M -10,10 l 20,-20 M 30,50 l 20,-20" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.5"
                  opacity="0.4"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-pattern)" />
          </svg>
        </div>
        <div className="absolute left-0 top-0 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-amber-600/30 to-yellow-600/30 text-amber-300 border-amber-500/30 px-3 py-1">
                Premium Upgrade
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-amber-300 to-yellow-200 text-transparent bg-clip-text">
                Unlock Premium Features
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Enhance your career development journey with our premium features designed to accelerate your progress.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="rounded-full bg-gradient-to-r from-amber-600/20 to-yellow-600/20 w-6 h-6 flex items-center justify-center mt-0.5 mr-3 text-yellow-400">
                    <FaCheck className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="text-white font-medium">Multiple Roadmaps</span>
                    <p className="text-gray-400 text-sm">Create up to 4 different career paths</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="rounded-full bg-gradient-to-r from-amber-600/20 to-yellow-600/20 w-6 h-6 flex items-center justify-center mt-0.5 mr-3 text-yellow-400">
                    <FaCheck className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="text-white font-medium">AI-Generated Details</span>
                    <p className="text-gray-400 text-sm">Get AI-powered explanations for each subtask</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="rounded-full bg-gradient-to-r from-amber-600/20 to-yellow-600/20 w-6 h-6 flex items-center justify-center mt-0.5 mr-3 text-yellow-400">
                    <FaCheck className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="text-white font-medium">Advanced Analytics</span>
                    <p className="text-gray-400 text-sm">Detailed insights and progress tracking</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="rounded-full bg-gradient-to-r from-amber-600/20 to-yellow-600/20 w-6 h-6 flex items-center justify-center mt-0.5 mr-3 text-yellow-400">
                    <FaCheck className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="text-white font-medium">Exclusive Badges</span>
                    <p className="text-gray-400 text-sm">Earn premium-only badges and rewards</p>
                  </div>
                </li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-8 py-6 text-lg shadow-lg shadow-amber-900/20" asChild>
                  <Link href="/premium">
                    View Premium Plans <FaArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="bg-gradient-to-br from-amber-900/20 to-yellow-800/20 p-1 rounded-xl shadow-2xl">
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg overflow-hidden border border-amber-500/30 relative aspect-[4/3] h-[300px] md:h-[400px]">
                  {/* SVG illustration for premium features */}
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 800 600" 
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0"
                  >
                    <rect width="100%" height="100%" fill="#111827" />
                    <defs>
                      <linearGradient id="premiumGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#92400e', stopOpacity: 0.1 }} />
                        <stop offset="100%" style={{ stopColor: '#b45309', stopOpacity: 0.1 }} />
                      </linearGradient>
                      <linearGradient id="premiumGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#78350f', stopOpacity: 0.1 }} />
                        <stop offset="100%" style={{ stopColor: '#92400e', stopOpacity: 0.1 }} />
                      </linearGradient>
                      <linearGradient id="roadmapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#6d28d9', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#4c1d95', stopOpacity: 0.8 }} />
                      </linearGradient>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 0.8 }} />
                      </linearGradient>
                    </defs>
                    
                    {/* Background elements */}
                    <rect x="0" y="0" width="800" height="600" fill="url(#premiumGradient1)" />
                    <rect x="0" y="0" width="800" height="600" fill="url(#premiumGradient2)" />
                    
                    {/* Crown */}
                    <path d="M400,100 L440,160 L480,120 L460,200 L340,200 L320,120 L360,160 Z" fill="url(#goldGradient)" stroke="#fbbf24" strokeWidth="2" />
                    
                    {/* Roadmap cards - 4 representing premium roadmaps */}
                    <rect x="100" y="250" width="140" height="200" rx="8" fill="#1f2937" stroke="#6d28d9" strokeWidth="2" />
                    <rect x="120" y="270" width="100" height="20" rx="4" fill="url(#roadmapGradient)" />
                    <rect x="120" y="300" width="80" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="120" y="320" width="90" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="120" y="340" width="70" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    <rect x="260" y="250" width="140" height="200" rx="8" fill="#1f2937" stroke="#6d28d9" strokeWidth="2" />
                    <rect x="280" y="270" width="100" height="20" rx="4" fill="url(#roadmapGradient)" />
                    <rect x="280" y="300" width="80" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="280" y="320" width="90" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="280" y="340" width="70" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    <rect x="420" y="250" width="140" height="200" rx="8" fill="#1f2937" stroke="#6d28d9" strokeWidth="2" />
                    <rect x="440" y="270" width="100" height="20" rx="4" fill="url(#roadmapGradient)" />
                    <rect x="440" y="300" width="80" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="440" y="320" width="90" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    <rect x="440" y="340" width="70" height="10" rx="4" fill="#4c1d95" opacity="0.5" />
                    
                    <rect x="580" y="250" width="140" height="200" rx="8" fill="#1f2937" stroke="#fbbf24" strokeWidth="2" />
                    <rect x="600" y="270" width="100" height="20" rx="4" fill="url(#goldGradient)" />
                    <rect x="600" y="300" width="80" height="10" rx="4" fill="#b45309" opacity="0.5" />
                    <rect x="600" y="320" width="90" height="10" rx="4" fill="#b45309" opacity="0.5" />
                    <rect x="600" y="340" width="70" height="10" rx="4" fill="#b45309" opacity="0.5" />
                    
                    {/* Badges */}
                    <circle cx="130" y="480" r="20" fill="#1f2937" stroke="#6d28d9" strokeWidth="2" />
                    <circle cx="180" y="480" r="20" fill="#1f2937" stroke="#fbbf24" strokeWidth="2" />
                    <circle cx="230" y="480" r="20" fill="#1f2937" stroke="#2563eb" strokeWidth="2" />
                    <circle cx="280" y="480" r="20" fill="#1f2937" stroke="#9333ea" strokeWidth="2" />
                    <circle cx="330" y="480" r="20" fill="#1f2937" stroke="#d97706" strokeWidth="2" />
                    
                    {/* AI Sparkle effects */}
                    <circle cx="650" y="170" r="5" fill="#fbbf24" opacity="0.8">
                      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="670" y="150" r="3" fill="#fbbf24" opacity="0.6">
                      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="640" y="135" r="4" fill="#fbbf24" opacity="0.7">
                      <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    
                    {/* Detailed view */}
                    <rect x="450" y="500" width="300" height="70" rx="8" fill="#1f2937" stroke="#fbbf24" strokeWidth="1" />
                    <rect x="470" y="515" width="200" height="12" rx="4" fill="#fbbf24" opacity="0.5" />
                    <rect x="470" y="535" width="260" height="8" rx="4" fill="#b45309" opacity="0.3" />
                    <rect x="470" y="550" width="230" height="8" rx="4" fill="#b45309" opacity="0.3" />
                  </svg>
                  
                  {/* Premium badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-600 to-yellow-600 px-4 py-2 rounded-full shadow-lg">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <FaCrown className="text-yellow-300" /> Premium
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg 
            width="100%" 
            height="100%" 
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-50"
          >
            <defs>
              <pattern 
                id="wave-pattern" 
                width="100" 
                height="100" 
                patternUnits="userSpaceOnUse"
              >
                <path 
                  d="M 0,50 Q 25,25 50,50 Q 75,75 100,50" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.8"
                  opacity="0.3"
                />
                <path 
                  d="M 0,30 Q 25,55 50,30 Q 75,5 100,30" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.8"
                  opacity="0.3"
                />
                <path 
                  d="M 0,70 Q 25,95 50,70 Q 75,45 100,70" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.8"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave-pattern)" />
          </svg>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-[100px]"></div>
        <div className="absolute left-0 bottom-0 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Accelerate Your Career?</h2>
            <p className="text-xl text-purple-200 mb-8">
              Join BLia AI today and start your personalized learning journey.
            </p>
            <Button className="bg-white text-purple-700 hover:bg-gray-100 py-6 px-8 text-lg shadow-xl shadow-purple-950/30" asChild>
              <Link href="/auth?register=true">
                Create Free Account <FaArrowRight className="ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/auth" className="text-gray-400 hover:text-purple-400 transition-colors">Career Roadmaps</Link></li>
                <li><Link href="/dashboard" className="text-gray-400 hover:text-purple-400 transition-colors">Dashboard</Link></li>
                <li><Link href="/premium" className="text-gray-400 hover:text-purple-400 transition-colors">Premium Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-purple-400 transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-purple-400 transition-colors">Blog</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-purple-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-400 hover:text-purple-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-gray-400 hover:text-purple-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Contact</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@blia-ai.com" className="text-gray-400 hover:text-purple-400 transition-colors">support@blia-ai.com</a></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-purple-400 transition-colors">Contact Form</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="font-bold text-xl bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400 text-transparent bg-clip-text mb-4 md:mb-0">
              BLia AI
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} BLia AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
