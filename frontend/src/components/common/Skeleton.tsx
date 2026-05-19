import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => (
  <>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`rounded animate-pulse ${className || 'h-4 w-full'} ${i < lines - 1 ? 'mb-3' : ''}`}
        style={{ background: 'var(--bg-elevated)' }}
      />
    ))}
  </>
);

export default Skeleton;
