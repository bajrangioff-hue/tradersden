import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  onClear?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({ icon, onClear, className = '', ...rest }) => (
  <div className="relative flex items-center">
    {icon && <span className="absolute left-3 pointer-events-none text-[var(--text-tertiary)]">{icon}</span>}
    <input
      className={`w-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg
        text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
        outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent-dim)]
        ${icon ? 'pl-9' : 'pl-3'}
        ${onClear ? 'pr-8' : 'pr-3'}
        py-2.5 font-mono text-[13px]
        ${className}`}
      {...rest}
    />
    {onClear && rest.value && (
      <button
        className="absolute right-2 p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
        onClick={onClear}
        tabIndex={-1}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    )}
  </div>
);

export default InputField;
