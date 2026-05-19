import React from 'react';

type BadgeVariant = 'pass' | 'fail' | 'neutral' | 'warning' | 'grade-aplus' | 'grade-a' | 'grade-b' | 'grade-f';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  'pass': 'bg-[var(--pass-dim)] text-[var(--pass)] border border-[var(--pass-dim)]',
  'fail': 'bg-[var(--fail-dim)] text-[var(--fail)] border border-[var(--fail-dim)]',
  'neutral': 'bg-[var(--bg-elevated)] text-[var(--text-dim)] border border-[var(--bg-border)]',
  'warning': 'bg-[var(--warning-dim)] text-[var(--warning)] border border-[var(--warning-dim)]',
  'grade-aplus': 'bg-[var(--teal-dim)] text-[var(--teal)] border border-[var(--teal-dim)]',
  'grade-a': 'bg-[var(--pass-dim)] text-[var(--pass)] border border-[var(--pass-dim)]',
  'grade-b': 'bg-[var(--warning-dim)] text-[var(--warning)] border border-[var(--warning-dim)]',
  'grade-f': 'bg-[var(--fail-dim)] text-[var(--fail)] border border-[var(--fail-dim)]',
};

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider mono ${variantMap[variant]} ${className}`}>
    {children}
  </span>
);

export default Badge;
