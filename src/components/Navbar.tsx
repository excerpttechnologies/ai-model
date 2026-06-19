import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Settings } from 'lucide-react';
import { User } from '../hooks/useAuth';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav
      style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <Link
        to={user ? '/dashboard' : '/'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          color: 'var(--primary)',
          fontSize: '20px',
          fontWeight: '700'
        }}
      >
        <span style={{ fontSize: '24px' }}>📝</span>
        <span>Testi</span>
      </Link>

      {/* Desktop Menu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}
      >
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '24px' }}>{user.avatar}</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#FF6B6B',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: '600',
                borderRadius: '6px',
                border: '2px solid var(--primary)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
