export type Board = 'CBSE' | 'ICSE' | 'State Board' | 'General';
export type LearningStyle = 'Visual' | 'Practice-based' | 'Reading' | 'Mixed';
export type PerformanceLevel = 'Low' | 'Medium' | 'High';

export interface Student {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  enrollmentDate: string;
  // ── ALOS fields ──
  grade: number;          // 1–10
  board: Board;
  school: string;
  language: string;
  performanceLevel: PerformanceLevel;
  learningStyle: LearningStyle;
  xp: number;             // gamification XP points
  streak: number;         // daily learning streak
  badges: string[];       // earned badge names
}

// ── Auto-profile generation (ALOS requirement: no manual input needed) ────────
const NAMES   = ['Arjun Kumar','Priya Singh','Rahul Sharma','Ananya Patel','Vikram Nair','Sneha Reddy','Rohan Joshi','Kavya Menon'];
const AVATARS = ['🧑‍💻','👩‍💻','🧑‍🎓','👩‍🎓','🧑‍💼','👩‍🔬','🧑‍🎨','👩‍🏫'];
const BOARDS: Board[]  = ['CBSE','ICSE','State Board','General'];
const STYLES: LearningStyle[] = ['Visual','Practice-based','Reading','Mixed'];
const SCHOOLS = ['Delhi Public School','Kendriya Vidyalaya','St. Xavier\'s School','DAV School','Ryan International'];

/**
 * Auto-generates a dummy student profile.
 * Called when a new user registers without providing explicit details.
 * Fulfills the ALOS requirement: "system MUST NOT ask for student details."
 */
export function generateDummyProfile(id: string, name: string, email: string): Student {
  const seed   = id.charCodeAt(0) + (id.charCodeAt(1) || 0);
  const grade  = (seed % 10) + 1;   // 1–10
  const board  = BOARDS[seed % BOARDS.length];
  const style  = STYLES[seed % STYLES.length];
  const school = SCHOOLS[seed % SCHOOLS.length];
  const perf: PerformanceLevel = grade <= 4 ? 'Low' : grade <= 7 ? 'Medium' : 'High';
  const avatar = AVATARS[seed % AVATARS.length];

  return {
    id,
    name,
    email,
    password: '',           // not stored on auto-generated profiles
    avatar,
    enrollmentDate: new Date().toISOString().split('T')[0],
    grade,
    board,
    school,
    language: 'English',
    performanceLevel: perf,
    learningStyle: style,
    xp: 0,
    streak: 0,
    badges: [],
  };
}

export const STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Akash Kumar',
    email: 'akash@gmail.com',
    password: '123456',
    avatar: '🧑‍💻',
    enrollmentDate: '2024-01-15',
    grade: 8,
    board: 'CBSE',
    school: 'Delhi Public School',
    language: 'English',
    performanceLevel: 'Medium',
    learningStyle: 'Visual',
    xp: 1240,
    streak: 7,
    badges: ['🔥 7-Day Streak', '⚡ Quick Learner'],
  },
  {
    id: '2',
    name: 'Priya Singh',
    email: 'priya@gmail.com',
    password: '123456',
    avatar: '👩‍💻',
    enrollmentDate: '2024-02-10',
    grade: 9,
    board: 'ICSE',
    school: 'St. Xavier\'s School',
    language: 'English',
    performanceLevel: 'High',
    learningStyle: 'Practice-based',
    xp: 2870,
    streak: 14,
    badges: ['🏆 Top Scorer', '🔥 14-Day Streak', '📚 Bookworm'],
  },
  {
    id: '3',
    name: 'Raj Patel',
    email: 'raj@gmail.com',
    password: '123456',
    avatar: '🧑‍🎓',
    enrollmentDate: '2024-01-20',
    grade: 6,
    board: 'State Board',
    school: 'Kendriya Vidyalaya',
    language: 'English',
    performanceLevel: 'Low',
    learningStyle: 'Reading',
    xp: 320,
    streak: 2,
    badges: ['🌱 First Step'],
  },
  {
    id: '4',
    name: 'Neha Gupta',
    email: 'neha@gmail.com',
    password: '123456',
    avatar: '👩‍🎓',
    enrollmentDate: '2024-02-01',
    grade: 7,
    board: 'CBSE',
    school: 'Ryan International',
    language: 'English',
    performanceLevel: 'Medium',
    learningStyle: 'Mixed',
    xp: 980,
    streak: 5,
    badges: ['⚡ Quick Learner', '🎯 Consistent'],
  },
  {
    id: '5',
    name: 'Arjun Nair',
    email: 'arjun@gmail.com',
    password: '123456',
    avatar: '🧑‍💼',
    enrollmentDate: '2024-01-25',
    grade: 10,
    board: 'CBSE',
    school: 'DAV School',
    language: 'English',
    performanceLevel: 'High',
    learningStyle: 'Practice-based',
    xp: 3450,
    streak: 21,
    badges: ['🏆 Top Scorer', '🔥 21-Day Streak', '🌟 Star Student', '📐 Math Master'],
  },
];
