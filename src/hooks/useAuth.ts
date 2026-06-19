import { useState, useEffect, useCallback } from 'react';
import { STUDENTS } from '../data/students';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const STORAGE_KEY = 'edu ai_user';

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const student = STUDENTS.find(s => s.email === email && s.password === password);
    
    if (student) {
      const userData: User = {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar
      };
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const register = useCallback((name: string, email: string, password: string): boolean => {
    const existingStudent = STUDENTS.find(s => s.email === email);
    
    if (existingStudent) {
      return false; // Email already exists
    }

    // In a real app, you would save this to a database
    // For now, we'll just treat it as a login
    const avatars = ['🧑‍💻', '👩‍💻', '🧑‍🎓', '👩‍🎓', '🧑‍💼'];
    const newUser: User = {
      id: String(STUDENTS.length + 1),
      name,
      email,
      avatar: avatars[Math.floor(Math.random() * avatars.length)]
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };
};
