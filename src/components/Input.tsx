import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <label
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
              fontSize: '18px'
            }}
          >
            {icon}
          </div>
        )}
        <input
          style={{
            width: '100%',
            padding: icon ? '12px 12px 12px 40px' : '12px',
            border: `2px solid ${error ? '#FF6B6B' : 'var(--border)'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-primary)',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? '#FF6B6B' : 'var(--primary)';
            e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(255,107,107,0.1)' : 'rgba(108,99,255,0.1)'}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#FF6B6B' : 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>
      {error && (
        <span
          style={{
            fontSize: '12px',
            color: '#FF6B6B',
            marginTop: '2px'
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
