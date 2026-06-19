import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';
import { Bell, Lock, Eye, Volume2, Moon, Globe, HelpCircle } from 'lucide-react';
import { User } from '../hooks/useAuth';

interface SettingsProps {
  user: User | null;
}

export const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    resultNotifications: true,
    soundEnabled: true,
    darkMode: false,
    language: 'en'
  });

  const settingsSections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Email Notifications', key: 'emailNotifications', description: 'Receive email updates about new tests' },
        { label: 'Result Notifications', key: 'resultNotifications', description: 'Get notified when results are available' }
      ]
    },
    {
      title: 'Sound & Display',
      icon: Volume2,
      items: [
        { label: 'Sound Effects', key: 'soundEnabled', description: 'Enable sound for notifications' },
        { label: 'Dark Mode', key: 'darkMode', description: 'Use dark theme for better visibility' }
      ]
    }
  ];

  const otherSettings = [
    { icon: Globe, label: 'Language', value: 'English', description: 'Change your preferred language' },
    { icon: Lock, label: 'Privacy & Security', description: 'Manage your account security settings' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get help with Testi' }
  ];

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '30px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>
            Settings
          </h1>

          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', marginBottom: '30px' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '48px' }}>{user?.avatar}</span>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {user?.name}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIdx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (sectionIdx + 1) * 0.1 }}
                style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', marginBottom: '30px' }}
              >
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={20} style={{ color: 'var(--primary)' }} />
                  {section.title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {section.items.map(item => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {item.description}
                        </p>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={settings[item.key as keyof typeof settings] as boolean}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            [item.key]: e.target.checked
                          }))}
                          style={{ marginRight: '10px' }}
                        />
                        <span
                          style={{
                            width: '40px',
                            height: '24px',
                            backgroundColor: (settings[item.key as keyof typeof settings] as boolean) ? 'var(--primary)' : 'var(--border)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.3s ease',
                            padding: '2px'
                          }}
                        >
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: 'white',
                              borderRadius: '10px',
                              transform: (settings[item.key as keyof typeof settings] as boolean) ? 'translateX(16px)' : 'translateX(0)',
                              transition: 'transform 0.3s ease'
                            }}
                          />
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Other Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', marginBottom: '30px' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Other Settings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {otherSettings.map((setting, idx) => {
                const Icon = setting.icon;
                return (
                  <button
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(108, 99, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={20} style={{ color: 'var(--primary)' }} />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {setting.label}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>→</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};
