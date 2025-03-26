import { Timestamp } from "firebase/firestore";

export interface MainTaskType {
  id: string;
  title: string;
  description: string;
  content: string;
  completed: boolean;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
}

export interface RoadmapType {
  id: string;
  title: string;
  description: string;
  experienceLevel: string;
  requiredSkills: string[];
  isPublic: boolean;
  isOfficial: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  sections: {
    id: string;
    title: string;
    description: string;
    lastModifiedBy: string;
    lastModifiedAt: Timestamp;
    subtasks: MainTaskType[];
  }[];
} 