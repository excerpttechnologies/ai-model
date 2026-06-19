export interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  status: 'pass' | 'fail';
  attemptDate: string;
  answers: { questionId: string; answer: string | number }[];
}

export const RESULTS: StudentResult[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Akash Kumar',
    assignmentId: '1',
    assignmentTitle: 'JavaScript Basics Recall',
    obtainedMarks: 35,
    totalMarks: 50,
    percentage: 70,
    status: 'pass',
    attemptDate: '2024-12-20',
    answers: [
      { questionId: 'q1-1', answer: 0 },
      { questionId: 'q1-2', answer: 1 },
      { questionId: 'q1-3', answer: 0 },
      { questionId: 'q1-4', answer: 1 },
      { questionId: 'q1-5', answer: 2 },
      { questionId: 'q1-6', answer: 0 },
      { questionId: 'q1-7', answer: 0 },
      { questionId: 'q1-8', answer: 2 },
      { questionId: 'q1-9', answer: 1 },
      { questionId: 'q1-10', answer: 1 },
    ],
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'Priya Singh',
    assignmentId: '4',
    assignmentTitle: 'JavaScript Functions & Scope',
    obtainedMarks: 78,
    totalMarks: 100,
    percentage: 78,
    status: 'pass',
    attemptDate: '2024-12-19',
    answers: [],
  },
  {
    id: '3',
    studentId: '3',
    studentName: 'Raj Patel',
    assignmentId: '1',
    assignmentTitle: 'JavaScript Basics Recall',
    obtainedMarks: 20,
    totalMarks: 50,
    percentage: 40,
    status: 'fail',
    attemptDate: '2024-12-21',
    answers: [],
  },
  {
    id: '4',
    studentId: '1',
    studentName: 'Akash Kumar',
    assignmentId: '7',
    assignmentTitle: 'React Architecture & Patterns',
    obtainedMarks: 128,
    totalMarks: 150,
    percentage: 85,
    status: 'pass',
    attemptDate: '2024-12-15',
    answers: [],
  },
  {
    id: '5',
    studentId: '4',
    studentName: 'Neha Gupta',
    assignmentId: '5',
    assignmentTitle: 'React Hooks & State',
    obtainedMarks: 62,
    totalMarks: 100,
    percentage: 62,
    status: 'pass',
    attemptDate: '2024-12-22',
    answers: [],
  },
];
