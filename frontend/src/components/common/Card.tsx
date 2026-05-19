import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', animate = true, onClick }) => {
  const base = `rounded-xl ${className}`;
  const style: React.CSSProperties = { background: 'var(--bg-surface)', border: 'var(--border-subtle)' };

  if (animate) {
    return (
      <motion.div
        className={base}
        style={style}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={base} style={style} onClick={onClick}>{children}</div>;
};

export default Card;
