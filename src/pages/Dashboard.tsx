import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { StatsCard } from '../components/StatsCard';
import { AssignmentCard } from '../components/AssignmentCard';
import { BookOpen, CheckCircle, BarChart3, Target, TrendingUp, Flame, Star, Zap } from 'lucide-react';
import { ASSIGNMENTS, WEEKLY_PLAN_TEMPLATE } from '../data/assignments';
import { RESULTS } from '../data/results';
import { User } from '../hooks/useAuth';
import { levelFromScore, LEVEL_CONFIG, scoreColor } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';

interface DashboardProps { user: User | null; }

// ── Board color config ────────────────────────────────────────────────────────
const BOARD_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  'CBSE':        { color: '#1565C0', bg: 'rgba(21,101,192,0.1)',  label: 'CBSE' },
  'ICSE':        { color: '#F57F17', bg: 'rgba(245,127,23,0.1)',  label: 'ICSE' },
  'State Board': { color: '#2E7D32', bg: 'rgba(46,125,50,0.1)',   label: 'State Board' },
  'General':     { color: '#6C63FF', bg: 'rgba(108,99,255,0.1)',  label: 'General' },
};

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const { studentProfile } = useAuthContext();

  const avgScore = useMemo(() => {
    if (!RESULTS.length) return 0;
    return Math.round(RESULTS.reduce((s, r) => s + r.percentage, 0) / RESULTS.length);
  }, []);

  const studentLevel = levelFromScore(avgScore);
  const lc = LEVEL_CONFIG[studentLevel];
  const bc = BOARD_CONFIG[studentProfile?.board ?? 'General'];

  const stats = useMemo(() => ({
    active:    ASSIGNMENTS.filter(a => a.status === 'active').length,
    completed: RESULTS.length,
    avg:       avgScore,
    total:     ASSIGNMENTS.length,
  }), [avgScore]);

  const recommendedAssignments = useMemo(() =>
    ASSIGNMENTS.filter(a => a.level === studentLevel && a.status === 'active').slice(0, 3),
  [studentLevel]);

  const recentResults = useMemo(() => RESULTS.slice(-4).reverse(), []);

  // ── Today's weekly plan day (Mon=1 … Sun=7) ───────────────────────────────
  const todayPlan = useMemo(() => {
    const day = new Date().getDay() || 7; // Sun=0 → 7
    return WEEKLY_PLAN_TEMPLATE.find(d => d.day === day) ?? WEEKLY_PLAN_TEMPLATE[0];
  }, []);

  // ── XP level thresholds ───────────────────────────────────────────────────
  const xp          = studentProfile?.xp ?? 0;
  const xpNextLevel = Math.ceil((xp + 1) / 500) * 500;
  const xpPct       = ((xp % 500) / 500) * 100;

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '28px 30px', maxWidth: 'calc(100vw - 250px)', overflowX: 'hidden' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

          {/* ══ HERO BANNER ════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: lc.gradient,
              border: `1.5px solid ${lc.colorBorder}`,
              borderRadius: '18px',
              padding: '24px 28px',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <div>
              {/* Name + board + grade row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '30px' }}>{user?.avatar || lc.emoji}</span>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {user?.name || 'Student'} 👋
                  </h1>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {/* Board badge */}
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '12px', backgroundColor: bc.bg, color: bc.color }}>
                      {bc.label}
                    </span>
                    {/* Grade badge */}
                    {studentProfile?.grade && (
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '12px', backgroundColor: lc.colorLight, color: lc.color }}>
                        Grade {studentProfile.grade}
                      </span>
                    )}
                    {/* Level badge */}
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '12px', backgroundColor: lc.color, color: 'white' }}>
                      {lc.emoji} {lc.label}
                    </span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                {lc.description}
              </p>

              {/* XP bar */}
              <div style={{ maxWidth: '380px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={11} style={{ color: '#FFD700' }} /> {xp.toLocaleString()} XP
                  </span>
                  <span>Next: {xpNextLevel.toLocaleString()} XP</span>
                </div>
                <div style={{ height: '7px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                    style={{ height: '100%', backgroundColor: '#FFD700', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>

            {/* Right — score ring + streak + badges */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              {/* Score ring */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `conic-gradient(${lc.color} ${avgScore * 3.6}deg, var(--border) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '62px', height: '62px', borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: lc.color, lineHeight: 1 }}>{avgScore}%</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>avg</span>
                </div>
              </div>
              {/* Streak */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#FF6B6B' }}>
                <Flame size={14} /> {studentProfile?.streak ?? 0} day streak
              </div>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '120px' }}>
                {(studentProfile?.badges ?? []).slice(0, 3).map((b, i) => (
                  <span key={i} style={{ fontSize: '10px', padding: '2px 7px', backgroundColor: 'rgba(255,215,0,0.15)', color: '#B8860B', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.4)', fontWeight: '600' }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ══ TODAY'S PLAN ════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 20px', borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              marginBottom: '24px', cursor: 'pointer',
            }}
            onClick={() => navigate('/assignments')}
          >
            <span style={{ fontSize: '28px' }}>{todayPlan.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Today's Plan — {todayPlan.label}
              </p>
              <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {todayPlan.activity}
              </p>
            </div>
            <span style={{ padding: '7px 16px', backgroundColor: lc.color, color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
              Start →
            </span>
          </motion.div>

          {/* ══ STATS ═══════════════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {[
              { icon: <BookOpen size={20} />,    label: 'Active Tests',  value: stats.active,        color: 'primary'   as const },
              { icon: <CheckCircle size={20} />, label: 'Completed',     value: stats.completed,     color: 'success'   as const },
              { icon: <BarChart3 size={20} />,   label: 'Avg Score',     value: `${stats.avg}%`,     color: 'secondary' as const },
              { icon: <Target size={20} />,      label: 'Total Tests',   value: stats.total,         color: 'warning'   as const },
              { icon: <Star size={20} />,        label: 'XP Earned',     value: xp.toLocaleString(), color: 'primary'   as const },
              { icon: <Flame size={20} />,       label: 'Day Streak',    value: studentProfile?.streak ?? 0, color: 'secondary' as const },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.06 }}>
                <StatsCard icon={s.icon} label={s.label} value={s.value} color={s.color} />
              </motion.div>
            ))}
          </div>

          {/* ══ WEEKLY PLAN ═════════════════════════════════════════════════ */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: lc.color }} /> Weekly Learning Plan
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {WEEKLY_PLAN_TEMPLATE.map((day, i) => {
                const isToday = (new Date().getDay() || 7) === day.day;
                return (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      backgroundColor: isToday ? lc.colorLight : 'var(--bg-secondary)',
                      border: isToday ? `1.5px solid ${lc.color}` : '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{day.icon}</div>
                    <p style={{ fontSize: '9px', fontWeight: '700', color: isToday ? lc.color : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                      {day.label.slice(0, 3)}
                    </p>
                    <p style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{day.activity}</p>
                    {isToday && (
                      <span style={{ display: 'inline-block', marginTop: '4px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: lc.color }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ══ RECOMMENDED TESTS ══════════════════════════════════════════ */}
          <section style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <TrendingUp size={18} style={{ color: lc.color }} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Recommended for You
              </h2>
              <span style={{ padding: '3px 10px', backgroundColor: lc.colorLight, color: lc.color, borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                {bc.label} · Grade {studentProfile?.grade ?? '?'} · {lc.emoji} {lc.label}
              </span>
            </div>
            {recommendedAssignments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                {recommendedAssignments.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.07 }}>
                    <AssignmentCard assignment={a} result={RESULTS.find(r => r.assignmentId === a.id)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                No active tests at your level right now. Check back soon!
              </div>
            )}
          </section>

          {/* ══ RECENT RESULTS ══════════════════════════════════════════════ */}
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Recent Results
            </h2>
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)' }}>
                    {['Test', 'Level', 'Grade', 'Score', '%', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentResults.map((r, i) => {
                    const asgn = ASSIGNMENTS.find(a => a.id === r.assignmentId);
                    const rlc  = asgn ? LEVEL_CONFIG[asgn.level] : null;
                    return (
                      <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: i * 0.05 }} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}>{r.assignmentTitle}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {rlc ? <span style={{ padding: '2px 8px', backgroundColor: rlc.colorLight, color: rlc.color, borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>{rlc.emoji} {rlc.label}</span> : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {asgn?.grade ? `G${asgn.grade}` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{r.obtainedMarks}/{r.totalMarks}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: scoreColor(r.percentage) }}>{r.percentage.toFixed(0)}%</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 10px', backgroundColor: r.status === 'pass' ? '#E6FFFA' : '#FFE6E6', color: r.status === 'pass' ? '#00D084' : '#FF6B6B', borderRadius: '16px', fontSize: '11px', fontWeight: '600' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '12px' }}>{new Date(r.attemptDate).toLocaleDateString()}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </motion.div>
      </main>
    </div>
  );
};
