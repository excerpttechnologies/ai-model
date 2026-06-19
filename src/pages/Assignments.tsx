import React, { useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion } from 'framer-motion';
import { AssignmentCard } from '../components/AssignmentCard';
import { ASSIGNMENTS } from '../data/assignments';
import { RESULTS } from '../data/results';
import { levelFromScore, LEVEL_CONFIG, StudentLevel } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';
import type { Board } from '../data/students';

type FilterTab = 'all' | StudentLevel;

const BOARD_COLORS: Record<Board, string> = {
  'CBSE':        '#1565C0',
  'ICSE':        '#F57F17',
  'State Board': '#2E7D32',
  'General':     '#6C63FF',
};

export const Assignments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { studentProfile } = useAuthContext();
  const studentBoard = studentProfile?.board ?? 'General';
  const boardColor = BOARD_COLORS[studentBoard];

  // Derive student's current level from avg score
  const avgScore = useMemo(() => {
    if (!RESULTS.length) return 0;
    return Math.round(RESULTS.reduce((s, r) => s + r.percentage, 0) / RESULTS.length);
  }, []);
  const studentLevel = levelFromScore(avgScore);

  const levelOrder: StudentLevel[] = ['beginner', 'intermediate', 'advanced'];

  const tabs: { key: FilterTab; label: string; emoji: string; count: number }[] = [
    { key: 'all', label: 'All Tests', emoji: '📚', count: ASSIGNMENTS.length },
    ...levelOrder.map(l => ({
      key: l as FilterTab,
      label: LEVEL_CONFIG[l].label,
      emoji: LEVEL_CONFIG[l].emoji,
      count: ASSIGNMENTS.filter(a => a.level === l).length,
    })),
  ];

  const filtered = useMemo(() =>
    ASSIGNMENTS.filter(a => activeTab === 'all' || a.level === activeTab),
  [activeTab]);

  // Group by level when showing 'all'
  const grouped = useMemo(() => {
    if (activeTab !== 'all') return null;
    return levelOrder.map(lvl => ({
      level: lvl,
      assignments: ASSIGNMENTS.filter(a => a.level === lvl),
    }));
  }, [activeTab]);

  // Is this level accessible to the student?
  const isLevelUnlocked = (lvl: StudentLevel) => {
    const order = levelOrder.indexOf(lvl);
    const studentOrder = levelOrder.indexOf(studentLevel);
    return order <= studentOrder;
  };

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '30px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Assignments & Tests
              </h1>
              {/* Board badge */}
              <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 14px', borderRadius: '16px', backgroundColor: `${boardColor}18`, color: boardColor, border: `1px solid ${boardColor}40` }}>
                📋 {studentBoard}
              </span>
              {studentProfile?.grade && (
                <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 14px', borderRadius: '16px', backgroundColor: LEVEL_CONFIG[studentLevel].colorLight, color: LEVEL_CONFIG[studentLevel].color }}>
                  Grade {studentProfile.grade}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Tests are tailored to your level and board. Your level:{' '}
              <strong style={{ color: LEVEL_CONFIG[studentLevel].color }}>
                {LEVEL_CONFIG[studentLevel].emoji} {LEVEL_CONFIG[studentLevel].label}
              </strong>
            </p>
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '32px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {tabs.map(t => {
              const lc = t.key !== 'all' ? LEVEL_CONFIG[t.key as StudentLevel] : null;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    padding: '9px 20px',
                    border: isActive
                      ? `2px solid ${lc ? lc.color : 'var(--primary)'}`
                      : '1.5px solid var(--border)',
                    backgroundColor: isActive
                      ? lc ? lc.colorLight : 'rgba(108,99,255,0.1)'
                      : 'transparent',
                    borderRadius: '10px',
                    color: isActive
                      ? lc ? lc.color : 'var(--primary)'
                      : 'var(--text-secondary)',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {t.emoji} {t.label}{' '}
                  <span
                    style={{
                      marginLeft: '4px',
                      fontSize: '11px',
                      opacity: 0.7,
                    }}
                  >
                    ({t.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {grouped ? (
            // ── ALL: render 3 tier sections ──────────────────────────────────
            levelOrder.map((lvl, sectionIdx) => {
              const lc = LEVEL_CONFIG[lvl];
              const sectionAssignments = grouped.find(g => g.level === lvl)?.assignments ?? [];
              const unlocked = isLevelUnlocked(lvl);

              return (
                <motion.section
                  key={lvl}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: sectionIdx * 0.1 }}
                  style={{ marginBottom: '48px' }}
                >
                  {/* Section header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '20px',
                      paddingBottom: '14px',
                      borderBottom: `2px solid ${lc.colorBorder}`,
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: lc.colorLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                      }}
                    >
                      {lc.emoji}
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: lc.color,
                          marginBottom: '2px',
                        }}
                      >
                        {lc.label} Tests
                      </h2>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {lvl === 'beginner' && 'Remember & Understand — Simple recall and comprehension'}
                        {lvl === 'intermediate' && 'Apply & Analyze — Apply concepts, spot patterns, reasoning'}
                        {lvl === 'advanced' && 'Analyze, Evaluate & Create — Critical thinking, synthesis'}
                      </p>
                    </div>
                    {!unlocked && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-tertiary)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        🔒 Unlock by scoring higher
                      </span>
                    )}
                    {unlocked && lvl === studentLevel && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '12px',
                          color: lc.color,
                          backgroundColor: lc.colorLight,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                        }}
                      >
                        ✦ Your Level
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {sectionAssignments.map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.07 }}
                      >
                        <AssignmentCard
                          assignment={a}
                          result={RESULTS.find(r => r.assignmentId === a.id)}
                          locked={!unlocked}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              );
            })
          ) : (
            // ── Single level filter ──────────────────────────────────────────
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '24px',
              }}
            >
              {filtered.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                >
                  <AssignmentCard
                    assignment={a}
                    result={RESULTS.find(r => r.assignmentId === a.id)}
                    locked={!isLevelUnlocked(a.level)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {!grouped && filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>📭</p>
              <p style={{ fontSize: '16px' }}>No tests found for this filter.</p>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
};
