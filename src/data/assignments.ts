import type { StudentLevel } from '../lib/levelUtils';
import type { Board } from './students';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  totalQuestions: number;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  dueDate: string;
  status: 'active' | 'upcoming' | 'completed';
  level: StudentLevel;
  bloomFocus: string;
  // ── ALOS fields ──
  grade: number;          // target grade (1–10)
  boards: Board[];        // which boards this applies to
  chapter?: string;       // curriculum chapter name
  weekDay?: number;       // 1–7 for weekly plan alignment
}

export const ASSIGNMENTS: Assignment[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // GRADE 6 — BEGINNER
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '1',
    title: 'Class 6: Number Systems Basics',
    subject: 'Mathematics',
    description: 'Recall natural numbers, whole numbers, integers and their properties.',
    totalQuestions: 10, duration: 20, totalMarks: 50, passingMarks: 25,
    dueDate: '2025-12-31', status: 'active', level: 'beginner',
    bloomFocus: 'Remember & Understand',
    grade: 6, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'Knowing Our Numbers', weekDay: 1,
  },
  {
    id: '2',
    title: 'Class 6: Living & Non-Living Things',
    subject: 'Science',
    description: 'Identify characteristics of living organisms and differences from non-living things.',
    totalQuestions: 10, duration: 20, totalMarks: 50, passingMarks: 25,
    dueDate: '2025-12-31', status: 'active', level: 'beginner',
    bloomFocus: 'Remember & Understand',
    grade: 6, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'The Living World', weekDay: 2,
  },
  {
    id: '3',
    title: 'Class 6: Our Environment',
    subject: 'Social Science',
    description: 'Understand what our environment is, its components and importance.',
    totalQuestions: 8, duration: 20, totalMarks: 40, passingMarks: 20,
    dueDate: '2025-12-31', status: 'upcoming', level: 'beginner',
    bloomFocus: 'Remember & Understand',
    grade: 6, boards: ['CBSE', 'State Board', 'General'],
    chapter: 'The Earth Our Habitat', weekDay: 3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GRADE 7–8 — INTERMEDIATE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '4',
    title: 'Class 7: Fractions & Decimals — Apply',
    subject: 'Mathematics',
    description: 'Apply operations on fractions and decimals to solve word problems.',
    totalQuestions: 15, duration: 40, totalMarks: 100, passingMarks: 60,
    dueDate: '2025-12-31', status: 'active', level: 'intermediate',
    bloomFocus: 'Apply & Analyze',
    grade: 7, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'Fractions and Decimals', weekDay: 1,
  },
  {
    id: '5',
    title: 'Class 8: Cell Biology — Structure & Function',
    subject: 'Science',
    description: 'Analyze cell structure, organelle functions and compare plant vs animal cells.',
    totalQuestions: 15, duration: 45, totalMarks: 100, passingMarks: 60,
    dueDate: '2025-12-31', status: 'active', level: 'intermediate',
    bloomFocus: 'Understand & Apply',
    grade: 8, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'Cell — Structure and Functions', weekDay: 2,
  },
  {
    id: '6',
    title: 'Class 8: Rational Numbers — Analysis',
    subject: 'Mathematics',
    description: 'Analyze properties of rational numbers and apply them to solve equations.',
    totalQuestions: 18, duration: 50, totalMarks: 120, passingMarks: 72,
    dueDate: '2025-12-31', status: 'upcoming', level: 'intermediate',
    bloomFocus: 'Apply & Analyze',
    grade: 8, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'Rational Numbers', weekDay: 4,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GRADE 9–10 — ADVANCED
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '7',
    title: 'Class 10: Quadratic Equations — Evaluate & Create',
    subject: 'Mathematics',
    description: 'Evaluate discriminant, create word problems and derive solutions using multiple methods.',
    totalQuestions: 20, duration: 60, totalMarks: 150, passingMarks: 112,
    dueDate: '2025-12-31', status: 'active', level: 'advanced',
    bloomFocus: 'Analyze, Evaluate & Create',
    grade: 10, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'Quadratic Equations', weekDay: 1,
  },
  {
    id: '8',
    title: 'Class 10: Chemical Reactions — Evaluate',
    subject: 'Science',
    description: 'Evaluate types of chemical reactions, balance equations and predict products.',
    totalQuestions: 20, duration: 60, totalMarks: 150, passingMarks: 112,
    dueDate: '2025-12-31', status: 'active', level: 'advanced',
    bloomFocus: 'Analyze, Evaluate & Create',
    grade: 10, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'Chemical Reactions and Equations', weekDay: 3,
  },
  {
    id: '9',
    title: 'Class 9: Democratic Politics — Create',
    subject: 'Social Science',
    description: 'Synthesize concepts of democracy, elections and constitutional rights to form arguments.',
    totalQuestions: 25, duration: 75, totalMarks: 200, passingMarks: 150,
    dueDate: '2025-12-31', status: 'upcoming', level: 'advanced',
    bloomFocus: 'Evaluate & Create',
    grade: 9, boards: ['CBSE', 'ICSE', 'State Board', 'General'],
    chapter: 'Democratic Politics', weekDay: 5,
  },
];

// ── Weekly plan generator (ALOS requirement) ──────────────────────────────────
export const WEEKLY_PLAN_TEMPLATE = [
  { day: 1, label: 'Monday',    activity: 'Concept Introduction',  icon: '📖' },
  { day: 2, label: 'Tuesday',   activity: 'Examples & Explanation', icon: '💡' },
  { day: 3, label: 'Wednesday', activity: 'Practice Questions',     icon: '✏️' },
  { day: 4, label: 'Thursday',  activity: 'Advanced Problems',      icon: '🚀' },
  { day: 5, label: 'Friday',    activity: 'Revision',               icon: '🔄' },
  { day: 6, label: 'Saturday',  activity: 'Full Test',              icon: '📝' },
  { day: 7, label: 'Sunday',    activity: 'Analysis + Parent Report', icon: '📊' },
];
