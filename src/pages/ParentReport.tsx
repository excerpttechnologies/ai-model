import React, { useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, BarChart, Bar,
} from 'recharts';
import { RESULTS } from '../data/results';
import { ASSIGNMENTS } from '../data/assignments';
import { STUDENTS } from '../data/students';
import { levelFromScore, LEVEL_CONFIG, scoreColor } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, TrendingUp, BookOpen, Star, Flame, Users } from 'lucide-react';

const BOARD_CONFIG: Record<string, { color: string; bg: string }> = {
  'CBSE':        { color: '#1565C0', bg: 'rgba(21,101,192,0.1)'  },
  'ICSE':        { color: '#F57F17', bg: 'rgba(245,127,23,0.1)'  },
  'State Board': { color: '#2E7D32', bg: 'rgba(46,125,50,0.1)'   },
  'General':     { color: '#FF6B35', bg: 'rgba(255,107,53,0.1)'  },
};

export const ParentReport: React.FC = () => {
  const { user, studentProfile } = useAuthContext();

  // ── derive metrics ───────────────────────────────────────────────────────
  const myResults = useMemo(() =>
    RESULTS.filter(r => r.studentId === (user?.id ?? '1')),
  [user]);

  const avgScore = useMemo(() => {
    if (!myResults.length) return 0;
    return Math.round(myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length);
  }, [myResults]);

  const studentLevel = levelFromScore(avgScore);
  const lc  = LEVEL_CONFIG[studentLevel];
  const bc  = BOARD_CONFIG[studentProfile?.board ?? 'General'];

  // Subject-wise performance for radar chart
  const subjectData = useMemo(() => {
    const map: Record<string, number[]> = {};
    myResults.forEach(r => {
      const asgn = ASSIGNMENTS.find(a => a.id === r.assignmentId);
      if (!asgn) return;
      if (!map[asgn.subject]) map[asgn.subject] = [];
      map[asgn.subject].push(r.percentage);
    });
    return Object.entries(map).map(([subject, scores]) => ({
      subject,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      fullMark: 100,
    }));
  }, [myResults]);

  // Score trend over time
  const trendData = useMemo(() =>
    myResults.map(r => ({
      name: new Date(r.attemptDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      score: r.percentage,
    })),
  [myResults]);

  // Weak areas (subjects where avg < 60)
  const weakAreas = useMemo(() =>
    subjectData.filter(s => s.score < 60).map(s => s.subject),
  [subjectData]);

  // Strong areas (>= 75)
  const strongAreas = useMemo(() =>
    subjectData.filter(s => s.score >= 75).map(s => s.subject),
  [subjectData]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (avgScore < 50)  recs.push('Encourage daily 30-minute revision sessions at home.');
    if (avgScore < 70)  recs.push('Focus extra practice on weak subjects listed below.');
    if (weakAreas.length > 0) recs.push(`Arrange doubt-clearing sessions for: ${weakAreas.join(', ')}.`);
    if ((studentProfile?.streak ?? 0) < 3) recs.push('Motivate the student to maintain a daily learning streak.');
    if (avgScore >= 80) recs.push('Student is performing excellently — consider advanced elective topics.');
    recs.push(`Current board is ${studentProfile?.board ?? 'CBSE'} — ensure alignment with board exam patterns.`);
    return recs;
  }, [avgScore, weakAreas, studentProfile]);

  // Rank among all students
  const rank = useMemo(() => {
    const allAvgs = STUDENTS.map(s => {
      const res = RESULTS.filter(r => r.studentId === s.id);
      return {
        id: s.id,
        avg: res.length ? Math.round(res.reduce((a, r) => a + r.percentage, 0) / res.length) : 0,
      };
    }).sort((a, b) => b.avg - a.avg);
    return (allAvgs.findIndex(s => s.id === (user?.id ?? '1')) + 1) || '-';
  }, [user]);

  // Print report
  const handlePrint = () => window.print();

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '28px 30px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                📊 Parent Progress Report
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Auto-generated — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={handlePrint}
              style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              🖨 Print / Save PDF
            </button>
          </div>

          {/* ── Student Profile Card ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: lc.gradient,
              border: `1.5px solid ${lc.colorBorder}`,
              borderRadius: '16px',
              padding: '22px 26px',
              marginBottom: '22px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
            }}
          >
            {[
              { label: 'Student',       value: user?.name ?? 'Student'                },
              { label: 'Board',         value: studentProfile?.board ?? 'CBSE'        },
              { label: 'Grade',         value: `Class ${studentProfile?.grade ?? '?'}` },
              { label: 'School',        value: studentProfile?.school ?? 'Demo School' },
              { label: 'Level',         value: `${lc.emoji} ${lc.label}`              },
              { label: 'Class Rank',    value: `#${rank} / ${STUDENTS.length}`        },
              { label: 'Avg Score',     value: `${avgScore}%`                          },
              { label: 'Tests Done',    value: myResults.length                        },
              { label: 'XP Earned',     value: `${(studentProfile?.xp ?? 0).toLocaleString()} XP` },
              { label: 'Day Streak',    value: `🔥 ${studentProfile?.streak ?? 0}`    },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{item.label}</p>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Strong / Weak areas ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            {/* Strong */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px', border: '1px solid #00D08430' }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#00D084', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> Strong Areas
              </h3>
              {strongAreas.length > 0 ? strongAreas.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00D084', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{s}</span>
                </div>
              )) : (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Complete more tests to identify strong areas.</p>
              )}
            </motion.div>

            {/* Weak */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px', border: '1px solid #FF6B6B30' }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#FF6B6B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Areas to Improve
              </h3>
              {weakAreas.length > 0 ? weakAreas.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF6B6B', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{s}</span>
                </div>
              )) : (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No weak areas detected — great performance!</p>
              )}
            </motion.div>
          </div>

          {/* ── Charts ───────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            {/* Score Trend */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={15} style={{ color: lc.color }} /> Score Trend
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="score" stroke={lc.color} strokeWidth={2} dot={{ fill: lc.color, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Radar */}
            {subjectData.length >= 3 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} style={{ color: lc.color }} /> Subject Performance
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={subjectData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke={lc.color} fill={lc.color} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} style={{ color: lc.color }} /> Subject Scores
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={subjectData}>
                    <CartesianGrid stroke="var(--border)" />
                    <XAxis dataKey="subject" tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '12px' }} />
                    <Bar dataKey="score" fill={lc.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Test-by-test summary ─────────────────────────────────── */}
          <section style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
              📝 Test-by-Test Summary
            </h3>
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                    {['Test', 'Subject', 'Board', 'Grade', 'Score', '%', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.slice().reverse().map((r, i) => {
                    const asgn = ASSIGNMENTS.find(a => a.id === r.assignmentId);
                    const rlc  = asgn ? LEVEL_CONFIG[asgn.level] : null;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}>
                        <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>{r.assignmentTitle}</td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>{asgn?.subject ?? '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {asgn?.boards[0] ? (
                            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', backgroundColor: BOARD_CONFIG[asgn.boards[0]]?.bg, color: BOARD_CONFIG[asgn.boards[0]]?.color, fontWeight: '600' }}>
                              {asgn.boards[0]}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>{asgn?.grade ? `G${asgn.grade}` : '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.obtainedMarks}/{r.totalMarks}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: scoreColor(r.percentage) }}>{r.percentage.toFixed(0)}%</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: r.status === 'pass' ? '#E6FFFA' : '#FFE6E6', color: r.status === 'pass' ? '#00D084' : '#FF6B6B', fontWeight: '600' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(r.attemptDate).toLocaleDateString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Badges ───────────────────────────────────────────────── */}
          {(studentProfile?.badges ?? []).length > 0 && (
            <section style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                🏅 Earned Badges
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {(studentProfile?.badges ?? []).map((b, i) => (
                  <span key={i} style={{ padding: '8px 16px', backgroundColor: 'rgba(255,215,0,0.15)', color: '#B8860B', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,215,0,0.4)' }}>
                    {b}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Recommendations ──────────────────────────────────────── */}
          <section style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
              💡 Recommendations for Parents
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>💬</span>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{rec}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px' }}>
            Auto-generated by edu ai ALOS · {studentProfile?.board ?? 'CBSE'} · Class {studentProfile?.grade ?? '?'} · {new Date().toLocaleDateString('en-IN')}
          </div>

        </motion.div>
      </main>
    </div>
  );
};
