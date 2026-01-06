'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  change?: number;
  changeLabel?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBgColor = 'rgba(99, 102, 241, 0.15)',
  iconColor = 'var(--primary)',
  change,
  changeLabel = 'dari kemarin',
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="stat-card animate-fade-in">
      <div
        className="stat-card-icon"
        style={{ backgroundColor: iconBgColor }}
      >
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {change !== undefined && (
        <span className={`stat-card-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : null}
          {isPositive && '+'}
          {change}% {changeLabel}
        </span>
      )}
    </div>
  );
}
