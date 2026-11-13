import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subvalue,
  icon: Icon,
  trend,
  trendLabel,
  status = 'neutral',
  onClick,
  className = '',
  badgeText,
  isDemo = true,
}) {
  const statusColors = {
    neutral: 'text-accent-primary bg-accent-primary/10 border-accent-primary/20',
    success: 'text-status-success bg-status-success/10 border-status-success/20',
    warning: 'text-status-warning bg-status-warning/10 border-status-warning/20',
    critical: 'text-status-critical bg-status-critical/10 border-status-critical/20',
    info: 'text-status-info bg-status-info/10 border-status-info/20',
  };

  const trendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const TrendIconComponent = trendIcon;
  const trendColor = trend > 0 ? 'text-status-success' : trend < 0 ? 'text-status-critical' : 'text-text-muted';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`group relative overflow-hidden bg-bg-card rounded-2xl border border-industrial-border p-5 shadow-card-dark transition-all duration-300 hover:border-accent-primary/40 hover:shadow-glow-sm ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Corner decorative notch */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
        <div className="absolute -top-4 -right-4 w-8 h-8 rotate-45 bg-accent-primary/10 border-b border-accent-primary/20" />
      </div>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${statusColors[status] || statusColors.neutral}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {title}
          </span>
        </div>

        {badgeText && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted border border-white/10">
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
          {value}
        </div>

        {trend !== undefined && (
          <div className={`flex items-center text-xs font-mono font-medium ${trendColor}`}>
            <TrendIconComponent className="w-3.5 h-3.5 mr-0.5" />
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-text-muted ml-1 font-sans text-[11px]">{trendLabel}</span>}
          </div>
        )}
      </div>

      {subvalue && (
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>{subvalue}</span>
          {isDemo && (
            <span className="text-[10px] text-text-muted/60 font-mono">DEMO DATA</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
