import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('akash@gmail.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (login(email, password)) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid email or password');
    }

    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Welcome Back
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}
            >
              Sign up
            </Link>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Demo credentials:<br />
            Email: <strong>akash@gmail.com</strong><br />
            Password: <strong>123456</strong>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
