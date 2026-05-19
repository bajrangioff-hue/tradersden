import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface LoadingStatesProps {
  type: 'analyze' | 'scanner' | 'default';
  symbol?: string;
}

const shimmer = {
  background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

const LoadingStates: React.FC<LoadingStatesProps> = ({ type, symbol }) => {
  if (type === 'analyze') {
    return (
      <div className="space-y-4">
        <motion.div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg" style={shimmer} />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-32 rounded" style={shimmer} />
              <div className="h-4 w-24 rounded" style={shimmer} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded" style={shimmer} />
            <div className="h-3 w-3/4 rounded" style={shimmer} />
          </div>
          <div className="flex items-center justify-center mt-6 gap-2">
            <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-[12px] font-mono" style={{ color: 'var(--text-tertiary)' }}>Analyzing {symbol || 'market'}...</span>
          </div>
          <div className="text-[10px] text-center mt-1" style={{ color: 'var(--text-dim)' }}>Running ICT analysis...</div>
        </motion.div>
      </div>
    );
  }

  if (type === 'scanner') {
    return (
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <span className="text-[12px] font-mono text-[var(--text-tertiary)]">Scanning markets...</span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-4 w-16 rounded" style={shimmer} />
              <div className="h-4 w-8 rounded" style={shimmer} />
              <div className="h-4 w-12 rounded" style={shimmer} />
              <div className="h-4 w-20 rounded" style={shimmer} />
              <div className="flex-1 h-4 rounded" style={shimmer} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <TrendingUp size={32} style={{ color: 'var(--text-dim)' }} />
      <div className="text-sm text-[var(--text-tertiary)] mt-3">Loading...</div>
    </div>
  );
};

export default LoadingStates;
