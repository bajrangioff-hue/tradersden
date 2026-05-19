import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-3">
    <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
    <div className="text-xs mono text-[var(--text-tertiary)]">{text}</div>
  </div>
);

export default Loading;
