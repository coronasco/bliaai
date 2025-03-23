'use client';

import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Wrapper pentru componente lazy-loaded
export const LazyLoadWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  return (
    <Suspense fallback={fallback || <LoadingSpinner text="Se încarcă..." />}>
      {children}
    </Suspense>
  );
};

// Lazy loading pentru componentele mari
export const LazyCareerRoadmap = lazy(() => import('./CareerRoadmap'));
export const LazyCareerCreationModal = lazy(() => import('./CareerCreationModal'));
export const LazyPathCard = lazy(() => import('./PathCard').then(mod => ({ default: mod.PathCard })));

// Componenta încărcată lazy cu wrapper inclus
export const RoadmapWithSuspense: React.FC<React.ComponentProps<typeof LazyCareerRoadmap>> = (props) => {
  return (
    <LazyLoadWrapper>
      <LazyCareerRoadmap {...props} />
    </LazyLoadWrapper>
  );
};

// Modal încărcat lazy cu wrapper inclus
export const CareerCreationModalWithSuspense: React.FC<React.ComponentProps<typeof LazyCareerCreationModal>> = (props) => {
  return (
    <LazyLoadWrapper fallback={<div className="p-8 text-center">Se încarcă modalul...</div>}>
      <LazyCareerCreationModal {...props} />
    </LazyLoadWrapper>
  );
};

// PathCard încărcat lazy cu wrapper inclus
export const PathCardWithSuspense: React.FC<React.ComponentProps<typeof LazyPathCard>> = (props) => {
  return (
    <LazyLoadWrapper fallback={<div className="h-48 w-full bg-gray-100 animate-pulse rounded-lg"></div>}>
      <LazyPathCard {...props} />
    </LazyLoadWrapper>
  );
}; 