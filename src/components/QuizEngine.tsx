/**
 * QuizEngine.tsx
 * Dynamic AI-powered quiz component — calls /api/quiz (FastAPI backend).
 * Adapts question difficulty based on student level (beginner / intermediate / advanced).
 * Triggers FoundationMode automatically when score < 50%.
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Loader2, RefreshCw, Send, Trophy, Zap } from 'lucide-react';
import { Button } from './Button';
import { FoundationMode } from './FoundationMode';
import { LEVEL_CONFIG, levelFromScore, scoreColor } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Config ───────────────────────────────────────────────────────────────────
const RAG_API_BASE: string = (import.meta as any).env?.VITE_RAG_API_URL ?? '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AIQuestion {
  bloom: string;
  question: string;
}

type QuizPhase = 'idle' | 'loading' | 'active' | 'submitted' | 'error';

interface QuizEngineProps {
  topic?: string;           // default: student's current subject
  subject?: string;
  embedded?: boolean;       // if true, no card wrapper
}

// Bloom → simple colour
const BLOOM_COLOR: Record<string, string> = {
  Remember:    '#FF6B35',
  Understand:  '#00B4D8',
  Apply:       '#00D084',
  Analyze:     '#FFB84D',
  Evaluate:    '#FF8C42',
  Create:      '#FF6B6B',
};

// ─── QuizEngine ───────────────────────────────────────────────────────────────
export const QuizEngine: React.FC<QuizEngineProps> = ({
  topic,
  subject,
  embedded = false,
}) => {
  const { studentProfile } = useAuthContext();
  const navigate = useNavigate();

  const board    = studentProfile?.board ?? 'CBSE';
  const grade    = studentProfile?.grade ?? 7;
  const avgScore = studentProfile?.xp
    ? Math.min(100, Math.round(studentProfile.xp / 15))
    : null;
  const level    = levelFromScore(avgScore);
  const lc       = LEVEL_CONFIG[level];

  const activeTopic = topic ?? subject ?? `Grade ${grade} ${board} concepts`;

  const [phase,      setPhase]      = useState<QuizPhase>('idle');
  const [questions,  setQuestions]  = useState<AIQuestion[]>([]);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState<Record<number, string>>({});
  const [score,      setScore]      = useState<number | null>(null);
  const [errorMsg,   setErrorMsg]   = useState('');

  // ── Generate quiz from backend ────────────────────────────────────────────
  const generateQuiz = useCallback(async () => {
    setPhase('loading');
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setScore(null);
    setErrorMsg('');

    try {
      const resp = await fetch(`${RAG_API_BASE}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:      activeTopic,
          class_name: String(grade),
          subject:    subject ?? null,
          score:      avgScore,
          board,
          grade,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(err.detail ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions returned. Check that your curriculum DB has content for this topic.');
      }
      setQuestions(data.questions);
      setPhase('active');
    } catch (e: any) {
      setErrorMsg(e.message);
      setPhase('error');
    }
  }, [activeTopic, grade, subject, avgScore, board]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    // Simple scoring: give full credit if any text was written (open questions)
    const answered = Object.keys(answers).length;
    const pct = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;
    setScore(pct);
    setPhase('submitted');
  }, [answers, questions]);

  // ─────────────────────────────────────────────────────────────────────────
  const wrapper = (children: React.ReactNode) =>
    embedded ? <>{children}</> : (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '24px',
        marginTop: '20px',
      }}>
        {children}
      </div>
    );

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === 'idle' || phase === 'error') return wrapper(
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧪</div>
      <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
        AI Quiz Engine
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
        Topic: <strong style={{ color: 'var(--text-primary)' }}>{activeTopic}</strong>
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: lc.colorLight, color: lc.color, fontWeight: '700' }}>
          {lc.emoji} {lc.label}
        </span>
        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(21,101,192,0.1)', color: '#1565C0', fontWeight: '700' }}>
          {board} · Grade {grade}
        </span>
      </div>
      {phase === 'error' && (
        <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#FFE6E6', color: '#FF6B6B', fontSize: '13px', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
          ⚠️ {errorMsg}
        </div>
      )}
      <Button variant="primary" onClick={generateQuiz} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={16} />
        {phase === 'error' ? 'Retry' : 'Generate AI Quiz'}
      </Button>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === 'loading') return wrapper(
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <Loader2 size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Generating AI Questions…</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
        NVIDIA Nemotron is crafting {lc.label}-level questions
      </p>
    </div>
  );

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  if (phase === 'active') {
    const q = questions[current];
    const bloomColor = BLOOM_COLOR[q.bloom] ?? '#FF6B35';
    const answered = Object.keys(answers).length;

    return wrapper(
      <>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>AI Quiz</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{activeTopic}</p>
          </div>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: lc.colorLight, color: lc.color, fontWeight: '700' }}>
            {answered}/{questions.length} answered
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '5px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
          <motion.div
            animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
            style={{ height: '100%', backgroundColor: lc.color, borderRadius: '3px' }}
          />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-primary)',
              border: `1px solid ${bloomColor}33`,
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Q{current + 1} / {questions.length}
              </span>
              <span style={{
                fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: '700',
                backgroundColor: `${bloomColor}18`, color: bloomColor, border: `1px solid ${bloomColor}33`,
              }}>
                {q.bloom}
              </span>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '14px' }}>
              {q.question}
            </p>
            <textarea
              placeholder="Type your answer here…"
              value={answers[current] ?? ''}
              onChange={e => setAnswers(prev => ({ ...prev, [current]: e.target.value }))}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px',
                border: `1.5px solid ${answers[current] ? lc.color : 'var(--border)'}`,
                borderRadius: '8px', resize: 'vertical',
                fontSize: '14px', fontFamily: 'inherit',
                backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
          >
            ← Previous
          </Button>
          {current < questions.length - 1 ? (
            <Button variant="primary" onClick={() => setCurrent(c => c + 1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#00D084', borderColor: '#00D084' }}
            >
              <Send size={14} /> Submit Quiz
            </Button>
          )}
        </div>
      </>
    );
  }

  // ── SUBMITTED ─────────────────────────────────────────────────────────────
  if (phase === 'submitted' && score !== null) {
    const finalScore = score;
    const passedPct  = Math.round((Object.keys(answers).length / questions.length) * 100);
    const showFoundation = passedPct < 70;

    return wrapper(
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '16px 0 24px' }}
        >
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>
            {passedPct >= 70 ? '🏆' : passedPct >= 50 ? '⚡' : '📚'}
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Quiz Complete!
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            You answered {Object.keys(answers).length} of {questions.length} questions
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '20px',
            backgroundColor: `${scoreColor(passedPct)}18`,
            border: `1.5px solid ${scoreColor(passedPct)}44`,
          }}>
            <Trophy size={18} style={{ color: scoreColor(passedPct) }} />
            <span style={{ fontSize: '24px', fontWeight: '800', color: scoreColor(passedPct) }}>
              {passedPct}%
            </span>
          </div>
        </motion.div>

        {/* Reviewed questions */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
          {questions.map((q, i) => {
            const bc = BLOOM_COLOR[q.bloom] ?? '#FF6B35';
            return (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: '8px', marginBottom: '8px',
                backgroundColor: 'var(--bg-primary)', border: `1px solid ${bc}22`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '10px', backgroundColor: `${bc}18`, color: bc, fontWeight: '700' }}>
                    {q.bloom}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Q{i + 1}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.5 }}>
                  {q.question}
                </p>
                {answers[i] ? (
                  <p style={{ fontSize: '12px', color: '#00D084', padding: '5px 10px', backgroundColor: 'rgba(0,208,132,0.07)', borderRadius: '6px' }}>
                    ✍️ Your answer: {answers[i]}
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: '#FF6B6B', fontStyle: 'italic' }}>Not answered</p>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            onClick={generateQuiz}
            style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <RefreshCw size={15} /> New Quiz
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/chatbot')}
            style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <Brain size={15} /> Ask AI Tutor
          </Button>
        </div>

        {/* Foundation mode panel — auto-shown if score low */}
        {showFoundation && (
          <FoundationMode
            score={passedPct}
            subjectTitle={activeTopic}
            weakTopics={questions.filter((_, i) => !answers[i]).map(q => q.question.slice(0, 50) + '…')}
            mistakePatterns={['Unanswered questions', 'Incomplete responses']}
            missingFundamentals={['Review notes for this topic', 'Read textbook chapter again']}
            onStartRecovery={() => navigate('/assignments')}
            onOpenChatbot={() => navigate('/chatbot')}
          />
        )}
      </>
    );
  }

  return null;
};
