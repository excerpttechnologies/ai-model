/**
 * subjectQuestions.ts
 * Frontend-generated questions for different subjects
 * Used as fallback when backend doesn't have curriculum content
 */

export interface SubjectQuestion {
  bloom: string;
  question: string;
  subject: string;
  topic: string;
  grade: number;
}

// ─── Mathematics Questions ────────────────────────────────────────────────────
export const MATH_QUESTIONS: SubjectQuestion[] = [
  // Grade 7-8 Easy
  {
    bloom: 'Remember',
    question: 'What is 15% of 200?',
    subject: 'Mathematics',
    topic: 'Percentages',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'If a rectangle has a length of 8 cm and width of 5 cm, what is its area?',
    subject: 'Mathematics',
    topic: 'Area and Perimeter',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'Solve for x: 3x + 7 = 22',
    subject: 'Mathematics',
    topic: 'Linear Equations',
    grade: 7,
  },
  {
    bloom: 'Remember',
    question: 'What is the value of 2³ + 3²?',
    subject: 'Mathematics',
    topic: 'Exponents',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'Convert 3/4 into a decimal.',
    subject: 'Mathematics',
    topic: 'Fractions and Decimals',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'A car travels 240 km in 4 hours. What is its average speed in km/h?',
    subject: 'Mathematics',
    topic: 'Speed, Distance, Time',
    grade: 7,
  },
  {
    bloom: 'Analyze',
    question: 'If the sum of two consecutive integers is 47, what are the integers?',
    subject: 'Mathematics',
    topic: 'Number Patterns',
    grade: 8,
  },
  {
    bloom: 'Remember',
    question: 'What is the formula for the circumference of a circle?',
    subject: 'Mathematics',
    topic: 'Circles',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'A shirt costs ₹800 and is on sale for 25% off. What is the sale price?',
    subject: 'Mathematics',
    topic: 'Discount and Profit',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'Find the perimeter of a square with side length 12 cm.',
    subject: 'Mathematics',
    topic: 'Perimeter',
    grade: 7,
  },
  {
    bloom: 'Analyze',
    question: 'If 5x - 3 = 2x + 9, what is the value of x?',
    subject: 'Mathematics',
    topic: 'Algebraic Equations',
    grade: 8,
  },
  {
    bloom: 'Remember',
    question: 'What is the sum of angles in a triangle?',
    subject: 'Mathematics',
    topic: 'Geometry - Triangles',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'Express 0.45 as a fraction in simplest form.',
    subject: 'Mathematics',
    topic: 'Fractions',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'A rectangular garden is 15m long and 10m wide. If you want to fence it, how many meters of fencing do you need?',
    subject: 'Mathematics',
    topic: 'Perimeter Application',
    grade: 7,
  },
  {
    bloom: 'Evaluate',
    question: 'Compare and order these fractions from smallest to largest: 2/3, 3/4, 5/6',
    subject: 'Mathematics',
    topic: 'Comparing Fractions',
    grade: 8,
  },
];

// ─── Science Questions ────────────────────────────────────────────────────────
export const SCIENCE_QUESTIONS: SubjectQuestion[] = [
  {
    bloom: 'Remember',
    question: 'What is the process by which plants make their own food called?',
    subject: 'Science',
    topic: 'Photosynthesis',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'Explain why we see lightning before we hear thunder during a storm.',
    subject: 'Science',
    topic: 'Light and Sound',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'If a substance has a pH of 3, is it an acid, base, or neutral?',
    subject: 'Science',
    topic: 'Acids and Bases',
    grade: 7,
  },
  {
    bloom: 'Remember',
    question: 'What are the three states of matter?',
    subject: 'Science',
    topic: 'States of Matter',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'What happens to water molecules when water boils?',
    subject: 'Science',
    topic: 'Heat and Temperature',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'A ball is dropped from a height. What type of energy does it have at the top and at the bottom?',
    subject: 'Science',
    topic: 'Energy Conversion',
    grade: 8,
  },
  {
    bloom: 'Analyze',
    question: 'Why do metals conduct electricity better than non-metals?',
    subject: 'Science',
    topic: 'Conductors and Insulators',
    grade: 8,
  },
  {
    bloom: 'Remember',
    question: 'What is the basic unit of life?',
    subject: 'Science',
    topic: 'Cell Biology',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'How does a seed germinate? Describe the process briefly.',
    subject: 'Science',
    topic: 'Plant Reproduction',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'If you rub a plastic comb on your hair, it can pick up small pieces of paper. What phenomenon is this?',
    subject: 'Science',
    topic: 'Static Electricity',
    grade: 7,
  },
  {
    bloom: 'Analyze',
    question: 'Compare the properties of acids and bases. Give two differences.',
    subject: 'Science',
    topic: 'Chemical Properties',
    grade: 8,
  },
  {
    bloom: 'Remember',
    question: 'What is the chemical formula for water?',
    subject: 'Science',
    topic: 'Chemical Formulas',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'Why do we need to breathe oxygen?',
    subject: 'Science',
    topic: 'Respiration',
    grade: 7,
  },
  {
    bloom: 'Evaluate',
    question: 'Which is a better conductor of heat: copper or plastic? Explain why.',
    subject: 'Science',
    topic: 'Heat Transfer',
    grade: 8,
  },
  {
    bloom: 'Apply',
    question: 'A mirror reflects light. If light hits a mirror at 30 degrees, at what angle will it reflect?',
    subject: 'Science',
    topic: 'Reflection of Light',
    grade: 7,
  },
];

// ─── English Questions ────────────────────────────────────────────────────────
export const ENGLISH_QUESTIONS: SubjectQuestion[] = [
  {
    bloom: 'Remember',
    question: 'What is a noun? Give two examples.',
    subject: 'English',
    topic: 'Parts of Speech',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'What is the difference between a simile and a metaphor?',
    subject: 'English',
    topic: 'Figurative Language',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'Correct this sentence: "She don\'t like pizza."',
    subject: 'English',
    topic: 'Grammar - Subject-Verb Agreement',
    grade: 7,
  },
  {
    bloom: 'Analyze',
    question: 'Read this sentence: "The brave knight fought the dragon." What is the adjective and what does it describe?',
    subject: 'English',
    topic: 'Adjectives',
    grade: 7,
  },
  {
    bloom: 'Remember',
    question: 'What are the three main types of sentences?',
    subject: 'English',
    topic: 'Sentence Types',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'What is the main idea of a paragraph?',
    subject: 'English',
    topic: 'Reading Comprehension',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'Write a sentence using the word "although" to show contrast.',
    subject: 'English',
    topic: 'Conjunctions',
    grade: 8,
  },
  {
    bloom: 'Analyze',
    question: 'Identify the subject and predicate in this sentence: "The tall tree swayed in the wind."',
    subject: 'English',
    topic: 'Sentence Structure',
    grade: 7,
  },
  {
    bloom: 'Evaluate',
    question: 'Which is better punctuation for this sentence and why? "What a beautiful day" or "What a beautiful day!"',
    subject: 'English',
    topic: 'Punctuation',
    grade: 7,
  },
  {
    bloom: 'Create',
    question: 'Write a short dialogue (4-6 lines) between two friends meeting after vacation.',
    subject: 'English',
    topic: 'Creative Writing',
    grade: 8,
  },
];

// ─── Social Studies Questions ─────────────────────────────────────────────────
export const SOCIAL_QUESTIONS: SubjectQuestion[] = [
  {
    bloom: 'Remember',
    question: 'Who is known as the Father of the Indian Nation?',
    subject: 'Social Studies',
    topic: 'Indian History',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'What is democracy? Explain in your own words.',
    subject: 'Social Studies',
    topic: 'Civics - Government',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'If you were a citizen, how would you exercise your right to vote responsibly?',
    subject: 'Social Studies',
    topic: 'Rights and Duties',
    grade: 8,
  },
  {
    bloom: 'Remember',
    question: 'Name the seven continents of the world.',
    subject: 'Social Studies',
    topic: 'Geography',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'Why is the equator an important line of latitude?',
    subject: 'Social Studies',
    topic: 'Geography - Latitude and Longitude',
    grade: 7,
  },
  {
    bloom: 'Analyze',
    question: 'Compare the climate of coastal areas and inland areas. What causes the difference?',
    subject: 'Social Studies',
    topic: 'Climate and Weather',
    grade: 8,
  },
  {
    bloom: 'Remember',
    question: 'What year did India gain independence?',
    subject: 'Social Studies',
    topic: 'Indian Independence',
    grade: 7,
  },
  {
    bloom: 'Understand',
    question: 'What is the Constitution? Why is it important for a country?',
    subject: 'Social Studies',
    topic: 'Indian Constitution',
    grade: 7,
  },
  {
    bloom: 'Apply',
    question: 'How can you contribute to keeping your local environment clean?',
    subject: 'Social Studies',
    topic: 'Environmental Studies',
    grade: 7,
  },
  {
    bloom: 'Evaluate',
    question: 'Why is it important for a country to have fundamental rights for its citizens?',
    subject: 'Social Studies',
    topic: 'Fundamental Rights',
    grade: 8,
  },
];

/**
 * Get questions for a specific subject
 */
export function getQuestionsBySubject(subject: string, count: number = 10): SubjectQuestion[] {
  let pool: SubjectQuestion[] = [];
  
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('math')) {
    pool = MATH_QUESTIONS;
  } else if (subjectLower.includes('science')) {
    pool = SCIENCE_QUESTIONS;
  } else if (subjectLower.includes('english')) {
    pool = ENGLISH_QUESTIONS;
  } else if (subjectLower.includes('social')) {
    pool = SOCIAL_QUESTIONS;
  } else {
    // Combine all for general quiz
    pool = [...MATH_QUESTIONS, ...SCIENCE_QUESTIONS, ...ENGLISH_QUESTIONS, ...SOCIAL_QUESTIONS];
  }

  // Shuffle and take 'count' questions
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
