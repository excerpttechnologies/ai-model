/**
 * FoundationPage.tsx
 * Dedicated full-page Foundation / Bridge mode learning hub.
 * Accessible from sidebar when a student is in remediation mode.
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { FoundationMode } from '../components/FoundationMode';
import { QuizEngine } from '../components/QuizEngine';
import { RESULTS } from '../data/results';
import { levelFromScore, LEVEL_CONFIG, scoreColor } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';
import { BookOpen, Brain, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';

// ─── Weak-topic inference from results ────────────────────────────────────────
function inferWeakTopics(results: typeof RESULTS) {
  const failed = results.filter(r => r.percentage < 50);
  if (failed.length === 0) return ['Core concept understanding', 'Prerequisite revision'];
  return [...new Set(failed.map(r => r.assignmentTitle))].slice(0, 4);
}

export const FoundationPage: React.FC = () => {
  const navigate = useNavigate();
  const { studentProfile } = useAuthContext();

  const avgScore = useMemo(() => {
    if (!RESULTS.length) return 0;
    return Math.round(RESULTS.reduce((s, r) => s + r.percentage, 0) / RESULTS.length);
  }, []);

  const level = levelFromScore(avgScore);
  const lc    = LEVEL_CONFIG[level];
  const weak  = useMemo(() => inferWeakTopics(RESULTS), []);

  const isFoundation = avgScore < 50;
  const isBridge     = avgScore >= 50 && avgScore < 70;

  const modeColor = isFoundation ? '#FF6B6B' : isBridge ? '#FFB84D' : '#00D084';
  const modeLabel = isFoundation ? 'Foundation Mode' : isBridge ? 'Bridge Mode' : 'Standard Mode';

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '28px 30px', maxWidth: 'calc(100vw - 250px)', overflowX: 'hidden' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

          {/* ── Page header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Learning Recovery Hub
                </h1>
                <span style={{
                  fontSize: '12px', fontWeight: '700', padding: '3px 12px', borderRadius: '20px',
                  backgroundColor: `${modeColor}18`, color: modeColor, border: `1px solid ${modeColor}44`,
                }}>
                  {modeLabel}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                {isFoundation
                  ? 'Rebuilding your foundations step-by-step. You CAN improve!'
                  : isBridge
                  ? "You're making progress. Blending basics with intermediate content."
                  : "You're doing great! Keep up the standard performance."}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="outline" onClick={() => navigate('/progress')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={15} /> Progress
              </Button>
              <Button variant="primary" onClick={() => navigate('/chatbot')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={15} /> AI Tutor
              </Button>
            </div>
          </div>

          {/* ── Score overview band ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '14px', marginBottom: '24px',
          }}>
            {[
              { label: 'Current Score',    value: `${avgScore}%`,           color: scoreColor(avgScore)   },
              { label: 'Your Level',       value: `${lc.emoji} ${lc.label}`,color: lc.color               },
              { label: 'Tests Attempted',  value: RESULTS.length,            color: '#FF6B35'              },
              { label: 'Tests Below 50%',  value: RESULTS.filter(r => r.percentage < 50).length, color: '#FF6B6B' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  padding: '18px 20px', borderRadius: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: '26px', fontWeight: '800', color: s.color }}>
                  {s.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ── Foundation mode component ── */}
          <FoundationMode
            score={avgScore}
            subjectTitle="Your Learning Journey"
            weakTopics={weak}
            mistakePatterns={isFoundation
              ? ['Skipped prerequisite steps', 'Calculation errors', 'Misread questions']
              : ['Partial understanding', 'Incomplete explanations']}
            missingFundamentals={isFoundation
              ? ['Prerequisite chapter revision', 'Key definitions', 'Basic operations']
              : ['Applied problem patterns', 'Exam question formats']}
            onStartRecovery={() => navigate('/assignments')}
            onOpenChatbot={() => navigate('/chatbot')}
          />

          {/* ── AI Quiz section ── */}
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <BookOpen size={20} style={{ color: lc.color }} />
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Practice Quiz — {isFoundation ? 'Easy Mode' : 'Bridge Mode'}
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0' }}>
              AI-generated {isFoundation ? 'very easy' : 'basic + intermediate'} questions tailored for your recovery path.
            </p>
            <QuizEngine
              topic={weak[0] ?? `Grade ${studentProfile?.grade ?? 7} basics`}
              subject={undefined}
            />
          </div>

        </motion.div>
      </main>
    </div>
  );
};
