import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, BookOpen, BarChart3, MessageSquare, Users, TrendingUp, Settings, FileText, ShieldAlert } from 'lucide-react';
import { RESULTS } from '../data/results';
import { levelFromScore } from '../lib/levelUtils';

// Auto-detect if student is in foundation/bridge mode
function useRemediationMode() {
  if (!RESULTS.length) return false;
  const avg = Math.round(RESULTS.reduce((s, r) => s + r.percentage, 0) / RESULTS.length);
  return avg < 70;  // show for foundation + bridge
}

const menuItems = [
  { icon: LayoutGrid,    label: 'Dashboard',       path: '/dashboard'      },
  { icon: BookOpen,      label: 'Assignments',      path: '/assignments'    },
  { icon: BarChart3,     label: 'Results',          path: '/results'        },
  { icon: TrendingUp,    label: 'Progress',         path: '/progress'       },
  { icon: Users,         label: 'Leaderboard',      path: '/leaderboard'    },
  { icon: MessageSquare, label: 'AI ChatBot',        path: '/chatbot'        },
  { icon: FileText,      label: 'Parent Report',    path: '/parent-report'  },
  { icon: Settings,      label: 'Settings',         path: '/settings'       },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const showFoundation = useRemediationMode();

  return (
    <aside
      style={{
        width: '250px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        padding: '20px 0',
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        position: 'sticky',
        top: '70px'
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                fontWeight: isActive ? '600' : '500',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* ── Foundation Mode link (shown when student is struggling) ── */}
        {showFoundation && (
          <>
            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '6px 0' }} />
            <Link
              to="/foundation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: location.pathname === '/foundation' ? 'white' : '#FF6B6B',
                backgroundColor: location.pathname === '/foundation'
                  ? '#FF6B6B'
                  : 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.3)',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              <ShieldAlert size={20} />
              <span>Recovery Mode</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '9px',
                padding: '1px 6px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,107,107,0.2)',
                color: '#FF6B6B',
                fontWeight: '700',
              }}>
                ACTIVE
              </span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
};
