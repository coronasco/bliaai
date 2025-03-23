import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FaCode,
  FaStar,
  FaCheck,
  FaBookmark,
  FaArrowRight,
  FaDatabase,
  FaLaptopCode,
  FaUserTie,
  FaNetworkWired,
  FaRobot,
  FaServer,
  FaMousePointer
} from "react-icons/fa";

export type PathType = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  durationHours: number;
  likes: number;
  completedBy: number;
};

export interface PathCardProps {
  path: PathType;
  isCompleted?: boolean;
  isSaved?: boolean;
}

export function PathCard({ path, isCompleted = false, isSaved = false }: PathCardProps) {
  // Function to generate category icon
  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'frontend':
        return <FaLaptopCode className="text-blue-400" />;
      case 'backend':
        return <FaDatabase className="text-purple-400" />;
      case 'programming':
        return <FaCode className="text-green-400" />;
      case 'web development':
        return <FaMousePointer className="text-cyan-400" />;
      case 'devops':
        return <FaServer className="text-red-400" />;
      case 'ai':
      case 'machine learning':
        return <FaRobot className="text-amber-400" />;
      case 'networking':
        return <FaNetworkWired className="text-teal-400" />;
      default:
        return <FaUserTie className="text-gray-400" />;
    }
  };

  // Function to determine difficulty badge
  const getDifficultyBadge = (difficulty: string) => {
    switch(difficulty.toLowerCase()) {
      case 'beginner':
        return <Badge variant="success">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="warning">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="info">Advanced</Badge>;
      case 'expert':
        return <Badge variant="destructive">Expert</Badge>;
      default:
        return <Badge>Mixed</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-700">
      <div className="relative h-36">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-4xl">
            {getCategoryIcon(path.category)}
          </div>
        </div>
        <div className="absolute top-2 right-2 flex space-x-1">
          {isCompleted && (
            <Badge variant="success" className="shadow-md">
              <FaCheck className="mr-1" /> Completed
            </Badge>
          )}
          {isSaved && (
            <Badge variant="warning" className="shadow-md">
              <FaBookmark className="mr-1" /> Saved
            </Badge>
          )}
        </div>
        <div className="absolute top-2 left-2">
          {getDifficultyBadge(path.difficulty)}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getCategoryIcon(path.category)}
            {path.category}
          </Badge>
          <span className="text-xs text-gray-400">{path.durationHours} hours</span>
        </div>
        <h3 className="font-semibold text-base mb-2 text-gray-100">{path.title}</h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{path.description}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center text-xs text-gray-400 gap-3">
            <span className="flex items-center">
              <FaStar className="text-amber-500 mr-1" /> 
              {path.likes}
            </span>
            <span className="flex items-center">
              <FaCheck className="text-green-500 mr-1" /> 
              {path.completedBy}
            </span>
          </div>
          <Link 
            href={`/paths/${path.id}`}
            className="text-xs flex items-center font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>View path</span>
            <FaArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 