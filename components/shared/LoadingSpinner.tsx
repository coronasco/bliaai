import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  text?: string;
  size?: "small" | "medium" | "large";
  fullHeight?: boolean;
  variant?: "default" | "minimal" | "ai";
}

export function LoadingSpinner({ 
  text = "Loading...", 
  size = "medium", 
  fullHeight = false,
  variant = "ai"
}: LoadingSpinnerProps) {
  
  // Determine size based on parameter
  const sizeClass = size === "small" 
    ? "h-10 w-10" 
    : size === "large" 
      ? "h-32 w-32" 
      : "h-16 w-16";
  
  // Container height class
  const heightClass = fullHeight 
    ? "h-[calc(100vh-4rem)]" 
    : "min-h-[240px]";
  
  // Modern AI spinner
  if (variant === "ai") {
    return (
      <div className={`flex flex-col items-center justify-center ${heightClass}`}>
        <div className="flex flex-col items-center gap-20">
          <div className="relative flex items-center justify-center">
            {/* Outer container to ensure proper scaling containment */}
            <div className={`relative ${
              size === "small" ? "h-16 w-16" : size === "large" ? "h-48 w-48" : "h-24 w-24"
            } flex items-center justify-center`}>
              {/* Concentric gradient circles with enhanced glow */}
              <motion.div 
                className={`absolute rounded-full border-4 border-t-blue-500 border-r-indigo-600 border-b-purple-700 border-l-teal-500 ${sizeClass} shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10`}
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              <motion.div 
                className={`absolute rounded-full border-4 border-t-indigo-500 border-r-purple-600 border-b-blue-500 border-l-emerald-500 opacity-80 ${
                  size === "small" ? "inset-2" : size === "large" ? "inset-5" : "inset-3"
                } z-20`}
                animate={{ rotate: -180 }}
                transition={{ 
                  duration: 2.2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Glowing center blob with enhanced glow effect */}
              <motion.div
                className={`absolute m-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full ${
                  size === "small" ? "w-4 h-4" : size === "large" ? "w-14 h-14" : "w-8 h-8"
                } shadow-[0_0_30px_rgba(168,85,247,0.8)] z-30`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* External pulse with enhanced glow */}
              <motion.div
                className={`absolute rounded-full border-2 border-blue-400/50 ${sizeClass} shadow-[0_0_15px_rgba(96,165,250,0.4)]`}
                animate={{
                  scale: [1, 1.2, 1.5],
                  opacity: [0.6, 0.3, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </div>
          </div>
          
          {text && (
            <motion.p 
              className="text-gray-200 text-base font-medium mt-6"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ 
                repeat: Infinity, 
                duration: 2 
              }}
            >
              {text}
            </motion.p>
          )}
        </div>
      </div>
    );
  }
  
  // Minimal spinner for page navigation
  if (variant === "minimal") {
    return (
      <div className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center`}>
        <motion.div
          className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-full ${
            size === "small" ? "h-1" : size === "large" ? "h-2" : "h-1.5"
          } w-full max-w-screen-lg mx-auto shadow-[0_0_12px_rgba(99,102,241,0.8)]`}
          initial={{ scaleX: 0.3, opacity: 0 }}
          animate={{
            scaleX: [0.3, 0.6, 0.9],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "left" }}
        />
      </div>
    );
  }
  
  // Classic spinner (default)
  return (
    <div className={`flex flex-col items-center justify-center ${heightClass} gap-10`}>
      <div className={`animate-spin rounded-full ${sizeClass} border-t-2 border-b-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]`}></div>
      {text && <p className="text-gray-200 text-base font-medium">{text}</p>}
    </div>
  );
} 