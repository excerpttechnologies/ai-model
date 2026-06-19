import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name) {
      newErrors.name = 'Name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (register(name, email, password)) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error('Email already registered');
    }

    setLoading(false);
  };

  const passwordStrength = password ? (
    password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak'
  ) : null;

  const getStrengthColor = (strength: string | null) => {
    switch (strength) {
      case 'strong':
        return '#00D084';
      case 'medium':
        return '#FFB84D';
      case 'weak':
        return '#FF6B6B';
      default:
        return 'transparent';
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Create Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Join thousands of learners improving their skills
            </p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your name"
              icon={<User size={18} />}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={errors.name}
            />

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

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                icon={<Lock size={18} />}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
              />
              {password && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                  <div style={{ flex: 1, height: '4px', backgroundColor: getStrengthColor(passwordStrength), borderRadius: '2px' }}></div>
                  <div style={{ flex: 1, height: '4px', backgroundColor: passwordStrength && ['strong', 'medium'].includes(passwordStrength) ? getStrengthColor(passwordStrength) : '#E2E8F0', borderRadius: '2px' }}></div>
                  <div style={{ flex: 1, height: '4px', backgroundColor: passwordStrength === 'strong' ? getStrengthColor(passwordStrength) : '#E2E8F0', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '11px', color: getStrengthColor(passwordStrength), fontWeight: '600', marginLeft: '8px', textTransform: 'capitalize' }}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              icon={<Lock size={18} />}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              error={errors.confirmPassword}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}
            >
              Sign in
            </Link>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'rgba(0, 208, 132, 0.1)', borderRadius: '8px', fontSize: '12px', color: '#00D084', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            Your data is secure and encrypted
          </div>
        </div>
      </motion.div>
    </div>
  );
};
