import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, BookOpen, BarChart3, MessageSquare, Users, TrendingUp, Settings, FileText } from 'lucide-react';

const menuItems = [
  { icon: LayoutGrid,   label: 'Dashboard',      path: '/dashboard'      },
  { icon: BookOpen,     label: 'Assignments',     path: '/assignments'    },
  { icon: BarChart3,    label: 'Results',         path: '/results'        },
  { icon: TrendingUp,   label: 'Progress',        path: '/progress'       },
  { icon: Users,        label: 'Leaderboard',     path: '/leaderboard'    },
  { icon: MessageSquare,label: 'AI ChatBot',      path: '/chatbot'        },
  { icon: FileText,     label: 'Parent Report',   path: '/parent-report'  },
  { icon: Settings,     label: 'Settings',        path: '/settings'       },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

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
                  e.currentTarget.style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
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
      </nav>
    </aside>
  );
};
