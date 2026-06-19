import React from 'react';
import { Question } from '../data/questions';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  onAnswer: (answer: string | number) => void;
  selectedAnswer?: string | number;
  isReview?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  onAnswer,
  selectedAnswer,
  isReview = false
}) => {
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px'
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700' }}>
            Question {questionNumber}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px' }}>
            {question.marks} marks
          </span>
        </div>
        <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6' }}>
          {question.text}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options?.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === question.correctAnswer;
          let backgroundColor = 'var(--bg-secondary)';
          let borderColor = 'var(--border)';
          let textColor = 'var(--text-primary)';

          if (isReview) {
            if (isCorrectOption) {
              backgroundColor = '#E6FFFA';
              borderColor = '#00D084';
              textColor = '#00D084';
            } else if (isSelected && !isCorrect) {
              backgroundColor = '#FFE6E6';
              borderColor = '#FF6B6B';
              textColor = '#FF6B6B';
            }
          } else if (isSelected) {
            backgroundColor = 'rgba(255, 107, 53, 0.1)';
            borderColor = 'var(--primary)';
          }

          return (
            <button
              key={index}
              onClick={() => !isReview && onAnswer(index)}
              disabled={isReview}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                textAlign: 'left',
                cursor: isReview ? 'default' : 'pointer',
                color: textColor,
                fontSize: '14px',
                transition: 'all 0.3s ease',
                fontWeight: isSelected ? '600' : '500'
              }}
              onMouseEnter={(e) => {
                if (!isReview && !isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isReview && !isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: `2px solid ${isSelected ? textColor : borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? textColor : 'transparent',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  {isSelected && '✓'}
                </span>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {isReview && selectedAnswer !== undefined && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: isCorrect ? '#E6FFFA' : '#FFE6E6',
            borderRadius: '8px',
            fontSize: '13px',
            color: isCorrect ? '#00D084' : '#FF6B6B',
            fontWeight: '600'
          }}
        >
          {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
        </div>
      )}
    </div>
  );
};
