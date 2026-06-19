/**
 * FoundationMode.tsx
 * Shown when student score < 50%. Activates the full remediation flow:
 *  - Diagnosis output (weak topics, mistake patterns)
 *  - Prerequisite learning panel
 *  - 7-day recovery plan
 *  - Guided micro-practice
 *  - Bridge mode when score 50-70%
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ChevronDown, ChevronRight, ArrowRight,
  BookOpen, Brain, CheckCircle2, Flame, Target, TrendingUp, Zap,
} from 'lucide-react';
import { Button } from './Button';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FoundationModeProps {
  score: number;                    // 0-100 actual score
  subjectTitle: string;             // e.g. "Fractions"
  weakTopics?: string[];
  mistakePatterns?: string[];
  missingFundamentals?: string[];
  onStartRecovery?: () => void;
  onOpenChatbot?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function modeFromScore(score: number) {
  if (score < 50) return 'foundation';
  if (score <= 70) return 'bridge';
  return 'standard';
}

const RECOVERY_PLAN = [
  { day: 'Day 1', icon: '📖', label: 'Basics Revision',       color: '#FF6B6B' },
  { day: 'Day 2', icon: '🧱', label: 'Concept Rebuilding',    color: '#FF8C42' },
  { day: 'Day 3', icon: '✏️',  label: 'Easy Practice',         color: '#FFB84D' },
  { day: 'Day 4', icon: '🔀', label: 'Mixed Questions',        color: '#FF6B35' },
  { day: 'Day 5', icon: '🧪', label: 'Mini Test',              color: '#00B4D8' },
  { day: 'Day 6', icon: '🔧', label: 'Weak Area Correction',   color: '#9B59B6' },
  { day: 'Day 7', icon: '🏁', label: 'Re-Evaluation Test',     color: '#00D084' },
];

const MICRO_STEPS = [
  { icon: '💡', title: 'Understand the concept first',  desc: 'Read the simplest explanation carefully, one idea at a time.' },
  { icon: '📝', title: 'Try 2 easy examples',            desc: 'Apply what you just learned on very simple problems.' },
  { icon: '✅', title: 'Check and self-correct',         desc: 'Review each answer immediately — identify what went wrong.' },
  { icon: '🔁', title: 'Repeat until confident',         desc: 'Keep practising the same concept until you score ≥ 3/3 in a row.' },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, accent, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderRadius: '12px',
      border: `1px solid ${accent}44`,
      overflow: 'hidden',
      marginBottom: '12px',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: '10px', padding: '14px 18px',
          background: `${accent}0d`, border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
          {title}
        </span>
        {open
          ? <ChevronDown size={16} style={{ color: accent }} />
          : <ChevronRight size={16} style={{ color: accent }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 18px', borderTop: `1px solid ${accent}22` }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const FoundationMode: React.FC<FoundationModeProps> = ({
  score,
  subjectTitle,
  weakTopics = ['Core concepts', 'Basic terminology', 'Foundational formulas'],
  mistakePatterns = ['Skipped prerequisite steps', 'Calculation errors', 'Misread questions'],
  missingFundamentals = ['Basic number operations', 'Key definitions', 'Prerequisite chapter revision'],
  onStartRecovery,
  onOpenChatbot,
}) => {
  const mode = modeFromScore(score);
  const isFoundation = mode === 'foundation';
  const isBridge = mode === 'bridge';

  // colours per mode
  const accent = isFoundation ? '#FF6B6B' : isBridge ? '#FFB84D' : '#00D084';
  const modeLabel = isFoundation ? '📉 Foundation Mode' : isBridge ? '🌉 Bridge Mode' : '🚀 Standard Mode';
  const modeDesc = isFoundation
    ? 'We detected weak understanding. Rebuilding basics step-by-step.'
    : "You're in the intermediate zone. Mixing basics + regular content.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: `2px solid ${accent}`,
        overflow: 'hidden',
        marginTop: '20px',
      }}
    >
      {/* ── Alert header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
        padding: '22px 24px',
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        borderBottom: `1px solid ${accent}33`,
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          backgroundColor: `${accent}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AlertTriangle size={24} style={{ color: accent }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              {modeLabel}
            </h2>
            <span style={{
              fontSize: '12px', fontWeight: '700',
              padding: '3px 12px', borderRadius: '20px',
              backgroundColor: `${accent}22`, color: accent,
              border: `1px solid ${accent}44`,
            }}>
              Score: {score}%
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {modeDesc}
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* ── Mode progress bar ── */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>0% — Foundation</span>
            <span style={{ color: '#FFB84D' }}>50% — Bridge</span>
            <span style={{ color: '#00D084' }}>70%+ — Standard</span>
          </div>
          <div style={{ position: 'relative', height: '10px', backgroundColor: 'var(--border)', borderRadius: '5px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(score, 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: '5px', background: `linear-gradient(90deg, #FF6B6B, ${accent})` }}
            />
            {/* Threshold markers */}
            {[50, 70].map(t => (
              <div key={t} style={{
                position: 'absolute', top: 0, left: `${t}%`,
                width: '2px', height: '100%', backgroundColor: 'var(--bg-secondary)',
              }} />
            ))}
          </div>
        </div>

        {/* ── Diagnosis ── */}
        <CollapsibleSection
          title="📊 Diagnosis — Weak Areas Detected"
          icon={<Brain size={18} />}
          accent={accent}
          defaultOpen={isFoundation}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>

            {/* Weak topics */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: accent, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={13} /> Weak Topics
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {weakTopics.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', borderRadius: '8px',
                    backgroundColor: `${accent}0d`,
                    fontSize: '13px', color: 'var(--text-primary)',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Mistake patterns */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#FFB84D', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={13} /> Mistake Patterns
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {mistakePatterns.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', borderRadius: '8px',
                    backgroundColor: 'rgba(255,184,77,0.08)',
                    fontSize: '13px', color: 'var(--text-primary)',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFB84D', flexShrink: 0 }} />
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing fundamentals */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#9B59B6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BookOpen size={13} /> Missing Fundamentals
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {missingFundamentals.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', borderRadius: '8px',
                    backgroundColor: 'rgba(155,89,182,0.08)',
                    fontSize: '13px', color: 'var(--text-primary)',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9B59B6', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Micro-learning steps ── */}
        <CollapsibleSection
          title="🧱 Micro-Learning: How We'll Rebuild"
          icon={<Zap size={18} />}
          accent="#FF6B35"
          defaultOpen={isFoundation}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {MICRO_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  padding: '14px', borderRadius: '10px',
                  backgroundColor: 'rgba(255,107,53,0.06)',
                  border: '1px solid rgba(255,107,53,0.18)',
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{step.icon}</div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {step.title}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── 7-day recovery plan ── */}
        <CollapsibleSection
          title="📈 7-Day Recovery Learning Path"
          icon={<TrendingUp size={18} />}
          accent="#00D084"
          defaultOpen
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {RECOVERY_PLAN.map((day, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  padding: '10px 6px', borderRadius: '10px', textAlign: 'center',
                  backgroundColor: `${day.color}11`,
                  border: `1px solid ${day.color}33`,
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{day.icon}</div>
                <p style={{ fontSize: '9px', fontWeight: '700', color: day.color, marginBottom: '2px' }}>
                  {day.day}
                </p>
                <p style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {day.label}
                </p>
              </motion.div>
            ))}
          </div>
          <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Follow this plan daily — you'll be back to standard mode in 7 days. 💪
          </p>
        </CollapsibleSection>

        {/* ── Teaching style notice ── */}
        {isFoundation && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '14px 16px', borderRadius: '10px', marginBottom: '16px',
            backgroundColor: 'rgba(0,212,132,0.07)', border: '1px solid rgba(0,212,132,0.25)',
          }}>
            <CheckCircle2 size={20} style={{ color: '#00D084', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#00D084', marginBottom: '3px' }}>
                You CAN improve — here's your guarantee:
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                In Foundation Mode, there are no advanced questions, no exam pressure, and no complex theory.
                Every answer you attempt gets immediate feedback with a step-by-step solution.
                The AI will repeat your weak topics until your score crosses <strong style={{ color: '#00D084' }}>60%</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── CTA buttons ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
          <Button
            variant="primary"
            onClick={onStartRecovery}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: accent, borderColor: accent,
            }}
          >
            <Flame size={16} />
            Start {isFoundation ? 'Foundation' : 'Bridge'} Learning
            <ArrowRight size={16} />
          </Button>
          <Button
            variant="outline"
            onClick={onOpenChatbot}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Brain size={16} />
            Ask AI Tutor
          </Button>
        </div>

      </div>
    </motion.div>
  );
};
