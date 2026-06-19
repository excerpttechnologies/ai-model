import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';
import { RESULTS } from '../data/results';

export const Results: React.FC = () => {
  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '30px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>
            My Results
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {RESULTS.map((result, idx) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {result.assignmentTitle}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                  {new Date(result.attemptDate).toLocaleDateString()}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Score</p>
                    <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {result.obtainedMarks}/{result.totalMarks}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Percentage</p>
                    <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
                      {result.percentage.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    backgroundColor: result.status === 'pass' ? '#E6FFFA' : '#FFE6E6',
                    color: result.status === 'pass' ? '#00D084' : '#FF6B6B',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {result.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};
