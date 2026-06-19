import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Award, BarChart3, Globe, Clock, Users } from 'lucide-react';

export const Landing: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Tests',
      description: 'Access a wide range of tests across multiple subjects and topics',
      highlight: false,
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get real-time feedback on your performance and answers',
      highlight: true,
    },
    {
      icon: Award,
      title: 'Track Progress',
      description: 'Monitor your improvement with detailed analytics and reports',
      highlight: false,
    },
    {
      icon: BarChart3,
      title: 'Compete & Win',
      description: 'Join the leaderboard and compete with other learners',
      highlight: false,
    },
  ];

  const heroPills = [
    { icon: Globe, label: 'Learn Anywhere' },
    { icon: Clock, label: 'Lifetime Access' },
    { icon: Users, label: 'Expert Instructor' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section
        style={{
          minHeight: '85vh',
          background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '4rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                fontWeight: '800',
                color: 'var(--text-primary)',
                marginBottom: '20px',
                lineHeight: '1.15',
              }}
            >
              The Best{' '}
              <span style={{ color: 'var(--primary)' }}>Platform</span>{' '}
              For Enhancing Skills
            </h1>
            <p
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                marginBottom: '28px',
                maxWidth: '520px',
                lineHeight: '1.7',
              }}
            >
              Master your skills with interactive tests, AI-powered tutoring, and
              comprehensive learning analytics tailored to your curriculum.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0',
                maxWidth: '480px',
                marginBottom: '24px',
                boxShadow: '0 8px 24px rgba(255, 107, 53, 0.15)',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <input
                type="text"
                placeholder="Search courses, topics..."
                readOnly
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '14px 24px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '15px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Search courses
                </button>
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
              {heroPills.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 107, 53, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  {label}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button size="lg" variant="primary">Start Learning</Button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button size="lg" variant="outline">Create Account</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '420px',
                aspectRatio: '4/5',
                borderRadius: '24px',
                background: 'linear-gradient(145deg, var(--primary) 0%, var(--primary-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 60px rgba(255, 107, 53, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                <div style={{ fontSize: '72px', marginBottom: '12px' }}>📚</div>
                <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>Grow Your Skills</p>
                <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '8px' }}>
                  Adaptive learning powered by AI
                </p>
              </div>
            </div>

            {[
              { label: '23K Free Courses', top: '12%', right: '-8%' },
              { label: '103K Active Students', bottom: '18%', left: '-10%' },
            ].map(badge => (
              <div
                key={badge.label}
                style={{
                  position: 'absolute',
                  ...(badge.top ? { top: badge.top } : { bottom: badge.bottom }),
                  ...(badge.right ? { right: badge.right } : { left: badge.left }),
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--primary)' }}>● </span>
                {badge.label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Why Choose <span style={{ color: 'var(--primary)' }}>edu ai</span>?
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginBottom: '3rem',
            fontSize: '1.05rem',
          }}
        >
          Learn best things with curriculum-aware AI tutoring
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHighlight = feature.highlight;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  backgroundColor: isHighlight ? 'var(--primary)' : 'var(--bg-secondary)',
                  padding: '30px',
                  borderRadius: '16px',
                  border: isHighlight ? 'none' : '1px solid var(--border)',
                  textAlign: 'center',
                  boxShadow: isHighlight
                    ? '0 12px 32px rgba(255, 107, 53, 0.3)'
                    : '0 4px 16px rgba(0,0,0,0.04)',
                  color: isHighlight ? 'white' : undefined,
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: isHighlight
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255, 107, 53, 0.1)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: isHighlight ? 'white' : 'var(--primary)',
                  }}
                >
                  <Icon size={32} />
                </div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: isHighlight ? 'white' : 'var(--text-primary)',
                    marginBottom: '12px',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: isHighlight ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                >
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px' }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '30px', opacity: 0.95 }}>
          Join thousands of learners improving their skills every day
        </p>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <Button size="lg" variant="secondary">Sign Up Now</Button>
        </Link>
      </section>
    </div>
  );
};
