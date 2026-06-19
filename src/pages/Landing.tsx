import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Award, BarChart3 } from 'lucide-react';

export const Landing: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Tests',
      description: 'Access a wide range of tests across multiple subjects and topics'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get real-time feedback on your performance and answers'
    },
    {
      icon: Award,
      title: 'Track Progress',
      description: 'Monitor your improvement with detailed analytics and reports'
    },
    {
      icon: BarChart3,
      title: 'Compete & Win',
      description: 'Join the leaderboard and compete with other learners'
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section
        style={{
          minHeight: '80vh',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: '1.2' }}>
              Welcome to <span style={{ color: 'var(--primary)' }}>Testi</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
              Master your skills with interactive tests, instant feedback, and comprehensive learning analytics
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="primary">Start Testing</Button>
            </Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="outline">Create Account</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '3rem' }}>
          Why Choose Testi?
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '30px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: 'var(--primary)',
                    fontSize: '32px'
                  }}
                >
                  <Icon size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
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
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'white'
        }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px' }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '30px' }}>
          Join thousands of learners improving their skills every day
        </p>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <Button size="lg" variant="secondary">Sign Up Now</Button>
        </Link>
      </section>
    </div>
  );
};
