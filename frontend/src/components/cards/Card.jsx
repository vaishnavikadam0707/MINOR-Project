import React from 'react';
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hoverEffect = true,
  glow = false,
  onClick,
  title,
  subtitle,
  action,
  icon: Icon,
  badge,
  ...props
}) {
  const Component = onClick ? motion.div : 'div';

  const hoverClasses = hoverEffect
    ? 'transition-all duration-300 hover:-translate-y-1 hover:border-accent-primary/40 hover:shadow-glow-sm cursor-pointer'
    : '';

  const glowClasses = glow
    ? 'border-accent-primary/30 shadow-glow-sm'
    : 'border-industrial-border shadow-card-dark';

  return (
    <Component
      onClick={onClick}
      className={`bg-bg-card rounded-2xl border p-5 ${glowClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {(title || Icon || action || badge) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center text-accent-primary shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-text-primary truncate font-display">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-text-muted truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {badge}
            {action}
          </div>
        </div>
      )}

      {children}
    </Component>
  );
}
