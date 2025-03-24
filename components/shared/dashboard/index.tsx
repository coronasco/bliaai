"use client";

import UserCard from "@/components/shared/UserCard";
import UserJobsCard from "@/components/shared/UserJobsCard";

// Adaugă layout-ul principal pentru dashboard
export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Prima coloană cu informațiile utilizatorului */}
      <div>
        <UserCard className="mb-6" />
      </div>
      
      {/* A doua și a treia coloană cu joburi recomandate */}
      <div className="lg:col-span-2">
        <UserJobsCard />
      </div>
    </div>
  );
} 