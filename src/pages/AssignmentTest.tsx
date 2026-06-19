import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QuestionCard } from '../components/QuestionCard';
import { Button } from '../components/Button';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { ASSIGNMENTS } from '../data/assignments';
import { QUESTIONS } from '../data/questions';
import { RESULTS } from '../data/results';
import { LEVEL_CONFIG } from '../lib/levelUtils';

export const AssignmentTest: React.FC = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testStarted, setTestStarted] = useState(false);
  const [isReview, setIsReview] = useState(false);

  const assignment = ASSIGNMENTS.find(a => a.id === assignmentId);
  
  // Map assignment subject to question subject slug
  const subjectToSlug: Record<string, string> = {
    'Mathematics': 'math',
    'Math': 'math',
    'Science': 'science',
    'Social Science': 'social-science',
    'English': 'english',
    'Hindi': 'hindi',
    'EVS': 'evs',
  };
  
  // Filter questions by subject slug matching assignment's subject
  const subjectSlug = assignment ? subjectToSlug[assignment.subject] : undefined;
  const questions = subjectSlug 
    ? QUESTIONS.filter(q => q.assignmentId === subjectSlug)
    : [];
  
  const result = RESULTS.find(r => r.assignmentId === assignmentId);

  useEffect(() => {
    if (assignment && testStarted && !isReview) {
      setTimeLeft(assignment.duration * 60);
    }
  }, [testStarted, assignment, isReview]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (testStarted && timeLeft > 0 && !isReview) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, timeLeft, isReview]);

  if (!assignment) {
    return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Assignment not found</div>;
  }

  if (!testStarted && !isReview) {
    const lc = LEVEL_CONFIG[assignment.level];
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '18px',
            padding: '40px',
            border: `1.5px solid ${lc.colorBorder}`,
            textAlign: 'center',
            background: lc.gradient,
          }}
        >
          {/* Level badge */}
          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                backgroundColor: lc.color,
                color: 'white',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              {lc.emoji} {lc.label} Level
            </span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px' }}>
            {assignment.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
            {assignment.description}
          </p>

          {/* Bloom focus */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', padding: '5px 14px', backgroundColor: lc.colorLight, borderRadius: '20px', border: `1px solid ${lc.colorBorder}` }}>
            <Layers size={13} style={{ color: lc.color }} />
            <span style={{ fontSize: '12px', color: lc.color, fontWeight: '600' }}>{assignment.bloomFocus}</span>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            {[
              { label: 'Duration', value: `${assignment.duration} min` },
              { label: 'Questions', value: assignment.totalQuestions },
              { label: 'Total Marks', value: assignment.totalMarks },
              { label: 'Passing Marks', value: assignment.passingMarks },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>{stat.label}</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #FF6B6B', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertCircle size={18} style={{ color: '#FF6B6B', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: '600', color: '#FF6B6B', fontSize: '13px', marginBottom: '4px' }}>Before you begin</p>
              <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                <li>Do not refresh the page during the test</li>
                <li>Answer all questions before submitting</li>
                <li>Timer starts once you click Start Test</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" size="lg" fullWidth onClick={() => navigate('/assignments')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => { setTestStarted(true); toast.success('Test started! Good luck!'); }}
              style={{ backgroundColor: lc.color, borderColor: lc.color }}
            >
              Start Test
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleAnswer = (answer: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));
  };

  const handleSubmit = () => {
    const correctCount = questions.filter((q, idx) => answers[idx] === q.correctAnswer).length;
    const obtainedMarks = (correctCount / questions.length) * assignment.totalMarks;
    const percentage = (obtainedMarks / assignment.totalMarks) * 100;

    toast.success('Test submitted! Check your results.');
    navigate(`/result/${assignmentId}`, { state: { obtainedMarks, percentage } });
  };

  const question = questions[currentQuestion];
  const answered = Object.keys(answers).length;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Left Panel - Questions */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {assignment.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: timeLeft < 300 ? 'rgba(255, 107, 107, 0.1)' : 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '8px', border: `1px solid ${timeLeft < 300 ? '#FF6B6B' : 'var(--border)'}` }}>
            <Clock size={20} style={{ color: timeLeft < 300 ? '#FF6B6B' : 'var(--primary)' }} />
            <span style={{ fontWeight: '700', fontSize: '16px', color: timeLeft < 300 ? '#FF6B6B' : 'var(--text-primary)' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Question */}
        {question && (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <QuestionCard
              question={question}
              questionNumber={currentQuestion + 1}
              onAnswer={handleAnswer}
              selectedAnswer={answers[currentQuestion]}
              isReview={isReview}
            />
          </motion.div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '30px' }}>
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft size={20} /> Previous
          </Button>
          <Button
            variant={currentQuestion === questions.length - 1 ? 'primary' : 'outline'}
            onClick={() => {
              if (currentQuestion === questions.length - 1) {
                handleSubmit();
              } else {
                setCurrentQuestion(currentQuestion + 1);
              }
            }}
          >
            {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'} <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Right Panel - Question Navigator */}
      <aside style={{ width: '250px', backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', padding: '20px', overflowY: 'auto', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px' }}>Progress</p>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--primary)', width: `${(answered / questions.length) * 100}%`, transition: 'width 0.3s ease' }}></div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {answered} of {questions.length} answered
          </p>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '12px' }}>Questions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '6px',
                border: currentQuestion === idx ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: answers[idx] !== undefined ? 'var(--primary)' : 'var(--bg-primary)',
                color: answers[idx] !== undefined ? 'white' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
};
