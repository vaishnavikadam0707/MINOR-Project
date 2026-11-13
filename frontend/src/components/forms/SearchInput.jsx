import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search by name, ID, or serial...',
  className = '',
  size = 'md',
  autoFocus = false,
  ...props
}) {
  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-7 text-xs',
    md: 'py-2.5 pl-10 pr-9 text-sm',
    lg: 'py-3 pl-11 pr-10 text-base',
  }[size] || 'py-2.5 pl-10 pr-9 text-sm';

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3.5',
    lg: 'w-5 h-5 left-4',
  }[size] || 'w-4 h-4 left-3.5';

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className={`absolute pointer-events-none text-text-muted ${iconSizes}`} />
      
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full bg-bg-elevated text-text-primary rounded-xl border border-industrial-border transition-all duration-200 placeholder:text-text-muted/60 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 ${sizeClasses}`}
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
