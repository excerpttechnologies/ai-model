import React, { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RESULTS } from '../data/results';
import { QuizEngine } from '../components/QuizEngine';
import { levelFromScore, LEVEL_CONFIG, scoreColor } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';
import { TrendingUp, Zap } from 'lucide-react';

export const Progress: React.FC = () => {
  const { studentProfile } = useAuthContext();
  const chartData = useMemo(() => {
    return RESULTS.map(r => ({
      name: new Date(r.attemptDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: r.percentage,
      marks: r.obtainedMarks
    }));
  }, []);

  const stats = useMemo(() => {
    const percentages = RESULTS.map(r => r.percentage);
    return {
      avg: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      max: Math.max(...percentages),
      min: Math.min(...percentages),
      total: RESULTS.length
    };
  }, []);

  const level = levelFromScore(stats.avg);
  const lc    = LEVEL_CONFIG[level];

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '30px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>
            Your Progress
          </h1>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {[
              { label: 'Average Score', value: stats.avg + '%', color: '#FF6B35' },
              { label: 'Highest Score', value: stats.max + '%', color: '#00D084' },
              { label: 'Lowest Score', value: stats.min + '%', color: '#FFB84D' },
              { label: 'Tests Completed', value: stats.total, color: '#FF6584' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '32px', fontWeight: '700', color: stat.color }}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                Score Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--primary)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                Marks Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="marks" fill="var(--secondary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* ── AI Practice Quiz ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ marginTop: '28px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Zap size={20} style={{ color: lc.color }} />
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Practise Now — AI Quiz
              </h2>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: lc.colorLight, color: lc.color, fontWeight: '700' }}>
                {lc.emoji} {lc.label} Level
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0' }}>
              Generated by NVIDIA Nemotron — adapts to your current {lc.label.toLowerCase()} level.
            </p>
            <QuizEngine
              topic={`Grade ${studentProfile?.grade ?? 7} ${studentProfile?.board ?? 'CBSE'} practice`}
            />
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
};
