import React, { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame } from 'lucide-react';
import { RESULTS } from '../data/results';
import { STUDENTS } from '../data/students';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  avgScore: number;
  testsCompleted: number;
}

export const Leaderboard: React.FC = () => {
  const leaderboard = useMemo(() => {
    const studentScores: Record<string, { name: string; avatar: string; scores: number[]; count: number }> = {};

    RESULTS.forEach(result => {
      const student = STUDENTS.find(s => s.id === result.studentId);
      if (student) {
        if (!studentScores[student.id]) {
          studentScores[student.id] = {
            name: student.name,
            avatar: student.avatar,
            scores: [],
            count: 0
          };
        }
        studentScores[student.id].scores.push(result.percentage);
        studentScores[student.id].count++;
      }
    });

    const entries: LeaderboardEntry[] = Object.entries(studentScores).map(([id, data]) => ({
      id,
      name: data.name,
      avatar: data.avatar,
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
      testsCompleted: data.count
    }));

    return entries.sort((a, b) => b.avgScore - a.avgScore);
  }, []);

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy size={24} style={{ color: '#FFD700' }} />;
    if (position === 1) return <Medal size={24} style={{ color: '#C0C0C0' }} />;
    if (position === 2) return <Medal size={24} style={{ color: '#CD7F32' }} />;
    return null;
  };

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '30px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>
            Leaderboard
          </h1>

          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '20px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>Rank</th>
                  <th style={{ padding: '20px', textAlign: 'left', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>Student</th>
                  <th style={{ padding: '20px', textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>Tests</th>
                  <th style={{ padding: '20px', textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>Avg Score</th>
                  <th style={{ padding: '20px', textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>Badge</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx < 3 ? 'rgba(255, 107, 53, 0.05)' : 'transparent' }}
                  >
                    <td style={{ padding: '20px', fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '28px' }}>{entry.avatar}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{entry.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {entry.testsCompleted}
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--primary)' }}>
                        {entry.avgScore}%
                      </span>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      {getMedalIcon(idx)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
