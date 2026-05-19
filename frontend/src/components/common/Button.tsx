import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white hover:brightness-110 shadow-sm',
  secondary: 'text-[var(--text-primary)] border hover:bg-[var(--bg-hover)]',
  tertiary: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  ghost: 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[11px]',
  md: 'px-4 py-2 text-[12px]',
  lg: 'px-5 py-2.5 text-[13px]',
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--accent)' },
  secondary: { background: 'var(--bg-elevated)', borderColor: 'var(--bg-border)' },
  tertiary: {},
  ghost: {},
};

const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...rest
}) => (
  <button
    className={`inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-lg transition-all duration-200
      ${variantClasses[variant]} ${sizeClasses[size]}
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      ${className}`}
    style={variantStyles[variant]}
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
