import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const SelectInput = forwardRef(function SelectInput({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  id,
  ...props
}, ref) {
  const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-status-critical ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none bg-bg-elevated text-text-primary text-sm rounded-xl border transition-all duration-200 focus:outline-none focus:ring-1 pl-3.5 pr-10 py-2.5 ${
            error
              ? 'border-status-critical/60 focus:border-status-critical focus:ring-status-critical/30'
              : 'border-industrial-border focus:border-accent-primary focus:ring-accent-primary/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-bg-elevated text-text-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal} className="bg-bg-card text-text-primary">
                {optLabel}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-text-muted">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-status-critical font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default SelectInput;
