import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Award, Layers } from 'lucide-react';
import { Assignment } from '../data/assignments';
import { LEVEL_CONFIG, scoreColor } from '../lib/levelUtils';

interface AssignmentCardProps {
  assignment: Assignment;
  result?: { obtainedMarks: number; percentage: number };
  /** When true the card is visually dimmed (out of student's tier) */
  locked?: boolean;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  result,
  locked = false,
}) => {
  const navigate = useNavigate();
  const lc = LEVEL_CONFIG[assignment.level];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':    return '#00D084';
      case 'upcoming':  return '#FFB84D';
      case 'completed': return '#6C63FF';
      default:          return '#A0AEC0';
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '14px',
        padding: '20px',
        border: `1.5px solid ${locked ? 'var(--border)' : lc.colorBorder}`,
        cursor: locked ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        opacity: locked ? 0.55 : 1,
        background: locked ? undefined : lc.gradient,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!locked) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 10px 30px ${lc.colorLight}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Level badge — top-left stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: lc.color,
          borderRadius: '14px 14px 0 0',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
        <div style={{ flex: 1, marginRight: '12px' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '700', marginBottom: '4px', lineHeight: 1.3 }}>
            {assignment.title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{assignment.subject}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          {/* Level pill */}
          <span
            style={{
              padding: '3px 10px',
              backgroundColor: lc.colorLight,
              color: lc.color,
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
            }}
          >
            {lc.emoji} {lc.label}
          </span>
          {/* Status pill */}
          <span
            style={{
              padding: '3px 10px',
              backgroundColor: `${getStatusColor(assignment.status)}18`,
              color: getStatusColor(assignment.status),
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'capitalize',
            }}
          >
            {assignment.status}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.45' }}>
        {assignment.description}
      </p>

      {/* Bloom focus tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Layers size={13} style={{ color: lc.color, flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: lc.color, fontWeight: '600' }}>
          {assignment.bloomFocus}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { icon: <Clock size={14} />, val: `${assignment.duration}m` },
          { icon: <BookOpen size={14} />, val: `${assignment.totalQuestions}Q` },
          { icon: <Award size={14} />, val: `${assignment.totalMarks}pts` },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'var(--bg-primary)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ color: lc.color }}>{stat.icon}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              {stat.val}
            </span>
          </div>
        ))}
      </div>

      {/* Score bar if attempted */}
      {result && (
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Your Score</span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: scoreColor(result.percentage),
              }}
            >
              {result.percentage.toFixed(0)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '5px',
              backgroundColor: 'var(--border)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${result.percentage}%`,
                backgroundColor: scoreColor(result.percentage),
                borderRadius: '3px',
                transition: 'width 0.8s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px' }}>
            {result.obtainedMarks} / {assignment.totalMarks} marks
          </p>
        </div>
      )}

      {/* CTA button */}
      {!locked && (
        <button
          onClick={() => navigate(`/assignment/${assignment.id}`)}
          style={{
            width: '100%',
            padding: '11px',
            backgroundColor: lc.color,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          {result ? '🔁 Retake Test' : assignment.status === 'upcoming' ? '🔒 Coming Soon' : '▶ Start Test'}
        </button>
      )}

      {locked && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            padding: '10px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px dashed var(--border)',
          }}
        >
          🔒 Complete your current level to unlock
        </div>
      )}
    </div>
  );
};
