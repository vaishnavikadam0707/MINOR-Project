import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  title,
  ariaLabel,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-2',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2.5',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-3 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-accent-primary text-bg-primary font-semibold hover:bg-[#48ff92] shadow-glow-sm hover:shadow-glow-md active:bg-[#2fe075]',
    secondary: 'bg-bg-elevated text-text-primary border border-industrial-border hover:border-accent-primary/50 hover:bg-bg-card hover:text-accent-primary shadow-sm hover:shadow-glow-sm',
    outline: 'border border-industrial-border text-text-secondary hover:text-text-primary hover:border-industrial-borderHover hover:bg-bg-elevated/50',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
    danger: 'bg-status-critical/15 text-status-critical border border-status-critical/30 hover:bg-status-critical/25 hover:border-status-critical hover:shadow-glow-critical',
    success: 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/20',
    cyber: 'bg-gradient-to-r from-accent-primary to-accent-secondary text-bg-primary font-bold shadow-glow-md hover:shadow-glow-lg hover:brightness-110 tracking-wide uppercase text-xs',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      
      <span>{children}</span>

      {!isLoading && IconRight && (
        <IconRight className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}
