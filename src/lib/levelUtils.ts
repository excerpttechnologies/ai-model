/**
 * levelUtils.ts
 * Single source of truth for student level tiering across the entire app.
 * Mirrors the backend logic in rag_query.py → level_from_score()
 */

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

/** Map a 0-100 score → level. null/undefined defaults to beginner. */
export function levelFromScore(score: number | null | undefined): StudentLevel {
  if (score == null) return 'beginner';
  if (score < 50) return 'beginner';
  if (score <= 80) return 'intermediate';
  return 'advanced';
}

// ─── Visual palette per level ────────────────────────────────────────────────

export const LEVEL_CONFIG: Record<
  StudentLevel,
  {
    label: string;
    emoji: string;
    color: string;        // main accent
    colorLight: string;   // translucent bg
    colorBorder: string;  // border tint
    gradient: string;     // card gradient
    description: string;
    nextStepHint: string;
  }
> = {
  beginner: {
    label: 'Beginner',
    emoji: '🌱',
    color: '#FF6B6B',
    colorLight: 'rgba(255, 107, 107, 0.12)',
    colorBorder: 'rgba(255, 107, 107, 0.35)',
    gradient: 'linear-gradient(135deg, #FF6B6B22 0%, #FFB84D22 100%)',
    description: 'Keep going — every expert was once a beginner.',
    nextStepHint: 'Score above 50% to unlock Intermediate tests.',
  },
  intermediate: {
    label: 'Intermediate',
    emoji: '⚡',
    color: '#6C63FF',
    colorLight: 'rgba(108, 99, 255, 0.12)',
    colorBorder: 'rgba(108, 99, 255, 0.35)',
    gradient: 'linear-gradient(135deg, #6C63FF22 0%, #00D08422 100%)',
    description: "You're building solid skills — keep pushing forward.",
    nextStepHint: 'Score above 80% to unlock Advanced tests.',
  },
  advanced: {
    label: 'Advanced',
    emoji: '🏆',
    color: '#00D084',
    colorLight: 'rgba(0, 208, 132, 0.12)',
    colorBorder: 'rgba(0, 208, 132, 0.35)',
    gradient: 'linear-gradient(135deg, #00D08422 0%, #6C63FF22 100%)',
    description: 'Excellent work — you are among the top performers!',
    nextStepHint: 'Challenge yourself with creation and evaluation questions.',
  },
};

/** Returns the CSS hex color for a pass/fail percentage bar */
export function scoreColor(pct: number): string {
  if (pct >= 81) return '#00D084';
  if (pct >= 50) return '#6C63FF';
  return '#FF6B6B';
}
