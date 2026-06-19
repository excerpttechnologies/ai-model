import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { STUDENTS, generateDummyProfile, Student } from '../data/students';
import { User } from '../hooks/useAuth';

interface AuthContextValue {
  user: User | null;
  studentProfile: Student | null;     // full ALOS profile (grade, board, xp, etc.)
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateXP: (delta: number) => void;
  addBadge: (badge: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY        = 'edu ai_user';
const PROFILE_STORAGE_KEY = 'edu ai_profile';

const getInitialUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) return JSON.parse(storedUser);
  } catch { localStorage.removeItem(STORAGE_KEY); }
  return null;
};

const getInitialProfile = (): Student | null => {
  try {
    const s = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch { localStorage.removeItem(PROFILE_STORAGE_KEY); }
  return null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user,           setUser]           = useState<User | null>(getInitialUser());
  const [studentProfile, setStudentProfile] = useState<Student | null>(getInitialProfile());

  // ── helpers ──────────────────────────────────────────────────────────────

  const _saveProfile = (p: Student) => {
    setStudentProfile(p);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p));
  };

  // ── login ────────────────────────────────────────────────────────────────

  const login = useCallback((email: string, password: string): boolean => {
    const student = STUDENTS.find(s => s.email === email && s.password === password);
    if (student) {
      const userData: User = { id: student.id, name: student.name, email: student.email, avatar: student.avatar };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      _saveProfile(student);
      return true;
    }
    return false;
  }, []);

  // ── register — auto-generates an ALOS dummy profile ─────────────────────

  const register = useCallback((name: string, email: string, password: string): boolean => {
    if (STUDENTS.find(s => s.email === email)) return false;

    const newId = String(Date.now());
    const avatars = ['🧑‍💻', '👩‍💻', '🧑‍🎓', '👩‍🎓', '🧑‍💼'];
    const avatar  = avatars[Math.floor(Math.random() * avatars.length)];

    const userData: User = { id: newId, name, email, avatar };
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

    // Auto-generate ALOS profile — no manual student data needed
    const profile = generateDummyProfile(newId, name, email);
    profile.avatar   = avatar;
    profile.password = password;
    _saveProfile(profile);

    return true;
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    setUser(null);
    setStudentProfile(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  }, []);

  // ── gamification helpers ─────────────────────────────────────────────────

  const updateXP = useCallback((delta: number) => {
    setStudentProfile(prev => {
      if (!prev) return prev;
      const updated = { ...prev, xp: Math.max(0, prev.xp + delta) };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addBadge = useCallback((badge: string) => {
    setStudentProfile(prev => {
      if (!prev || prev.badges.includes(badge)) return prev;
      const updated = { ...prev, badges: [...prev.badges, badge] };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, studentProfile, isAuthenticated: !!user,
      login, register, logout, updateXP, addBadge,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
