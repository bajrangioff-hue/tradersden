import React from 'react';

interface EmptyProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const Empty: React.FC<EmptyProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 rounded-lg" style={{ border: '1px dashed var(--bg-border)' }}>
    <div className="mb-3" style={{ color: 'var(--text-tertiary)' }}>{icon}</div>
    <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</div>
    {description && <div className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>{description}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default Empty;
