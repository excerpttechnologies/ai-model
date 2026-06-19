import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

const colorMap = {
  primary: '#6C63FF',
  secondary: '#FF6584',
  success: '#00D084',
  warning: '#FFB84D'
};

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  trend,
  trendValue,
  color = 'primary'
}) => {
  const bgColor = colorMap[color];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1px solid var(--border)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: `${bgColor}15`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: bgColor,
            fontSize: '24px'
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: trend === 'up' ? '#00D084' : '#FF6B6B',
              backgroundColor: trend === 'up' ? '#E6FFFA' : '#FFE6E6',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>
          {label}
        </p>
        <p style={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: '700' }}>
          {value}
        </p>
      </div>
    </div>
  );
};
