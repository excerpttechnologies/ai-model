import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { ArrowLeft, Share2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { ASSIGNMENTS } from '../data/assignments';
import { QUESTIONS } from '../data/questions';
import { QuestionCard } from '../components/QuestionCard';
import { levelFromScore, LEVEL_CONFIG, scoreColor } from '../lib/levelUtils';
import { FoundationMode } from '../components/FoundationMode';

export const Result: React.FC = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { obtainedMarks, percentage } = location.state || { obtainedMarks: 0, percentage: 0 };

  const assignment = ASSIGNMENTS.find(a => a.id === assignmentId);
  const questions = QUESTIONS.filter(q => q.assignmentId === assignmentId);
  const isPassed = percentage >= (assignment?.passingMarks ?? 0);

  // Determine what level the student achieved with this score
  const achievedLevel = levelFromScore(percentage);
  const lc = LEVEL_CONFIG[achievedLevel];

  const handleShare = () => {
    const text = `I scored ${percentage.toFixed(0)}% on ${assignment?.title} on edu ai! ${lc.emoji}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('Result copied to clipboard!'));
    }
  };

  if (!assignment) {
    return (
      <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>
        Result not found
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        padding: '30px',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: '900px', margin: '0 auto' }}
      >
        {/* ── Hero result card ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: lc.gradient,
            border: `1.5px solid ${lc.colorBorder}`,
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          {/* Big emoji */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            style={{ fontSize: '72px', marginBottom: '16px' }}
          >
            {isPassed ? lc.emoji : '📚'}
          </motion.div>

          <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {isPassed ? 'Well done!' : 'Keep Learning!'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
            {assignment.title}
          </p>

          {/* Score stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {[
              {
                label: 'Your Score',
                value: `${obtainedMarks.toFixed(0)} / ${assignment.totalMarks}`,
                color: lc.color,
              },
              {
                label: 'Percentage',
                value: `${percentage.toFixed(0)}%`,
                color: scoreColor(percentage),
              },
              {
                label: 'Status',
                value: isPassed ? 'Passed ✓' : 'Failed ✗',
                color: isPassed ? '#00D084' : '#FF6B6B',
              },
              {
                label: 'Level Achieved',
                value: `${lc.emoji} ${lc.label}`,
                color: lc.color,
              },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1px solid var(--border)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--border)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '10px',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{
                height: '100%',
                backgroundColor: scoreColor(percentage),
                borderRadius: '4px',
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Passing mark: {assignment.passingMarks} pts
          </p>
        </motion.div>

        {/* ── Adaptive next-step banner ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '18px 24px',
            borderRadius: '12px',
            backgroundColor: lc.colorLight,
            border: `1.5px solid ${lc.colorBorder}`,
            marginBottom: '28px',
          }}
        >
          <TrendingUp size={24} style={{ color: lc.color, flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: '700', fontSize: '14px', color: lc.color, marginBottom: '2px' }}>
              What's next for you?
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {lc.nextStepHint}
            </p>
          </div>
        </motion.div>

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '40px',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/assignments')}>
            Browse Tests
          </Button>
          <Button variant="primary" onClick={handleShare}>
            <Share2 size={18} /> Share Result
          </Button>
        </div>

        {/* ── Foundation / Bridge mode panel ──────────────────────────────────── */}
        {percentage < 70 && (
          <FoundationMode
            score={Math.round(percentage)}
            subjectTitle={assignment.title}
            weakTopics={
              percentage < 50
                ? ['Core concept understanding', 'Basic terminology', 'Foundational formulas']
                : ['Advanced application', 'Complex problem solving']
            }
            mistakePatterns={
              percentage < 50
                ? ['Missed prerequisite steps', 'Calculation errors', 'Misread questions']
                : ['Partial understanding', 'Incomplete explanations']
            }
            missingFundamentals={
              percentage < 50
                ? ['Prerequisite chapter revision', 'Key definitions', 'Basic operations']
                : ['Applied problem patterns', 'Exam question formats']
            }
            onStartRecovery={() => navigate('/assignments')}
            onOpenChatbot={() => navigate('/chatbot')}
          />
        )}

        {/* ── Answer review ─────────────────────────────────────────────────── */}
        {questions.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '20px',
              }}
            >
              Review Answers
            </h2>
            {questions.map((question, idx) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
              >
                <QuestionCard
                  question={question}
                  questionNumber={idx + 1}
                  onAnswer={() => {}}
                  selectedAnswer={question.correctAnswer}
                  isReview={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
