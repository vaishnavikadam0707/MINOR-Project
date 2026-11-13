import React, { forwardRef } from 'react';

const TextInput = forwardRef(function TextInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon: Icon,
  rightElement,
  required = false,
  disabled = false,
  className = '',
  id,
  ...props
}, ref) {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-status-critical ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-bg-elevated text-text-primary text-sm rounded-xl border transition-all duration-200 placeholder:text-text-muted/60 focus:outline-none focus:ring-1 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-11' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-status-critical/60 focus:border-status-critical focus:ring-status-critical/30'
              : 'border-industrial-border focus:border-accent-primary focus:ring-accent-primary/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-status-critical flex items-center gap-1 font-medium">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default TextInput;
