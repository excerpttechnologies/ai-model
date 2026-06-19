import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ChevronDown, ChevronRight, Brain, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { RESULTS } from '../data/results';
import { levelFromScore, LEVEL_CONFIG } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';

// ─── Config ──────────────────────────────────────────────────────────────────
// Both dev and prod use /api — Vite proxy forwards to :8090 in dev,
// Nginx proxy forwards to :8090 in production.
// Override with VITE_RAG_API_URL in .env.local if needed.
const RAG_API_BASE: string =
  (import.meta as any).env?.VITE_RAG_API_URL ?? '/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Source {
  source_file: string;
  class_name: string;
  subject: string;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;            // streamed answer text (grows in real-time)
  reasoning?: string;         // Nemotron thinking text (grows in real-time)
  level?: string;
  sources?: Source[];
  streaming?: boolean;        // true while tokens are still arriving
  reasoningOpen?: boolean;    // whether the thinking panel is expanded
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLatestScore(): number | null {
  if (!RESULTS.length) return null;
  return RESULTS[RESULTS.length - 1].percentage ?? null;
}

// ─── ReasoningPanel ──────────────────────────────────────────────────────────
const ReasoningPanel: React.FC<{
  text: string;
  open: boolean;
  onToggle: () => void;
  streaming: boolean;
}> = ({ text, open, onToggle, streaming }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text, open]);

  if (!text) return null;

  return (
    <div
      style={{
        marginBottom: '8px',
        borderRadius: '10px',
        border: '1px solid rgba(108, 99, 255, 0.25)',
        overflow: 'hidden',
        backgroundColor: 'rgba(108, 99, 255, 0.04)',
      }}
    >
      {/* Toggle header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        <Brain size={13} />
        {streaming ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Thinking
            <span className="thinking-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </span>
        ) : (
          `Reasoning trace (${text.split(' ').length} words)`
        )}
        {open ? <ChevronDown size={13} style={{ marginLeft: 'auto' }} />
               : <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
      </button>

      {/* Collapsed / expanded body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="reasoning-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              ref={scrollRef}
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '10px 14px 12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                borderTop: '1px solid rgba(108, 99, 255, 0.15)',
              }}
            >
              {text}
              {streaming && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '13px',
                    backgroundColor: 'var(--primary)',
                    marginLeft: '2px',
                    verticalAlign: 'middle',
                    animation: 'blink 1s step-end infinite',
                  }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  msg: Message;
  onToggleReasoning: (id: string) => void;
}> = ({ msg, onToggleReasoning }) => {
  const lc = msg.level ? LEVEL_CONFIG[msg.level as keyof typeof LEVEL_CONFIG] : null;
  const isUser = msg.type === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: '10px',
        alignItems: 'flex-start',
      }}
    >
      {!isUser && <span style={{ fontSize: '26px', flexShrink: 0, marginTop: '4px' }}>🤖</span>}

      <div style={{ maxWidth: '72%' }}>
        {/* Reasoning panel */}
        {!isUser && msg.reasoning !== undefined && (
          <ReasoningPanel
            text={msg.reasoning}
            open={!!msg.reasoningOpen}
            onToggle={() => onToggleReasoning(msg.id)}
            streaming={!!msg.streaming}
          />
        )}

        {/* Main bubble */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
            backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-primary)',
            color: isUser ? 'white' : 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.6',
            border: isUser ? 'none' : '1px solid var(--border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content || (msg.streaming ? '' : '…')}
          {/* Streaming cursor */}
          {msg.streaming && msg.content && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '14px',
                backgroundColor: isUser ? 'white' : 'var(--primary)',
                marginLeft: '2px',
                verticalAlign: 'middle',
                animation: 'blink 1s step-end infinite',
              }}
            />
          )}
        </div>

        {/* Level + sources meta row */}
        {!isUser && !msg.streaming && lc && (
          <div
            style={{
              marginTop: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                padding: '2px 9px',
                borderRadius: '12px',
                backgroundColor: lc.colorLight,
                color: lc.color,
                fontWeight: '700',
              }}
            >
              {lc.emoji} {lc.label}
            </span>
            {msg.sources && msg.sources.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                📚{' '}
                {[...new Set(msg.sources.map(s =>
                  [s.class_name, s.subject].filter(Boolean).join(' ')
                ))].join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && <span style={{ fontSize: '26px', flexShrink: 0, marginTop: '4px' }}>👤</span>}
    </motion.div>
  );
};

// ─── ChatBot page ─────────────────────────────────────────────────────────────
export const ChatBot: React.FC = () => {
  const { studentProfile } = useAuthContext();
  const score        = getLatestScore();
  const studentLevel = levelFromScore(score);
  const lc           = LEVEL_CONFIG[studentLevel];
  
  // Get board and grade from student profile, with fallback defaults
  const board = studentProfile?.board || "CBSE";
  const grade = studentProfile?.grade || 7;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      type: 'bot',
      content:
        `Hello! 👋 I'm your AI Learning Assistant powered by NVIDIA Nemotron.\n` +
        `Student Profile: Grade ${grade} | ${board} Board\n` +
        `Current Level: ${lc.label} ${lc.emoji} — I'll tailor answers to suit your board and level.\n\n` +
        `Ask me anything from your ${board} curriculum for Grade ${grade}!`,
      level: studentLevel,
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleReasoning = useCallback((id: string) => {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, reasoningOpen: !m.reasoningOpen } : m)
    );
  }, []);

  // ── Stream handler ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    // Add user message
    const userId = String(Date.now());
    setMessages(prev => [...prev, { id: userId, type: 'user', content: text }]);
    setInputValue('');
    setIsStreaming(true);

    // Placeholder bot message that will be updated as tokens arrive
    const botId = String(Date.now() + 1);
    setMessages(prev => [
      ...prev,
      {
        id: botId,
        type: 'bot',
        content: '',
        reasoning: '',        // non-undefined → show reasoning panel
        level: studentLevel,
        sources: [],
        streaming: true,
        reasoningOpen: true,  // auto-open while streaming
      },
    ]);

    try {
      const resp = await fetch(`${RAG_API_BASE}/ask/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:   text,
          class_name: null,
          subject:    null,
          score,
          board:      studentProfile?.board || 'CBSE',
          grade:      studentProfile?.grade || 7,
        }),
      });

      if (!resp.ok) {
        // Try to get a JSON detail, fall back to status text
        let detail = resp.statusText;
        try {
          const errJson = await resp.json();
          detail = errJson.detail ?? detail;
        } catch { /* ignore */ }

        const statusGuide: Record<number, string> = {
          502: '502 Bad Gateway — uvicorn is not running on port 8090.\nOn server: pm2 restart rag-backend  OR  check: pm2 logs rag-backend',
          503: '503 Service Unavailable — backend started but Chroma DB failed to load.\nCheck: pm2 logs rag-backend  and verify CURRICULUM_DB path.',
          504: '504 Gateway Timeout — backend took too long to respond.\nCheck Ollama is running: systemctl status ollama',
        };
        const guide = statusGuide[resp.status] ?? `HTTP ${resp.status}: ${detail}`;
        throw new Error(guide);
      }

      // Read SSE stream line by line
      const reader  = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';   // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: any;
          try { event = JSON.parse(raw); } catch { continue; }

          setMessages(prev =>
            prev.map(m => {
              if (m.id !== botId) return m;
              switch (event.type) {
                case 'meta':
                  return {
                    ...m,
                    level:   event.level   ?? m.level,
                    sources: event.sources ?? m.sources,
                  };
                case 'reasoning':
                  return { ...m, reasoning: (m.reasoning ?? '') + event.text };
                case 'content':
                  return { ...m, content: m.content + event.text };
                case 'done':
                  return { ...m, streaming: false, reasoningOpen: false };
                case 'error':
                  return {
                    ...m,
                    content: `⚠️ ${event.text}`,
                    streaming: false,
                    reasoningOpen: false,
                  };
                default:
                  return m;
              }
            })
          );
        }
      }

      // Ensure streaming flag is cleared even if "done" event was missed
      setMessages(prev =>
        prev.map(m => m.id === botId ? { ...m, streaming: false, reasoningOpen: false } : m)
      );

    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === botId
            ? {
                ...m,
                content: `⚠️ Could not reach the AI backend. (${err.message})\n\nMake sure the server is running:\n  NVIDIA_API_KEY=nvapi-... venv/bin/uvicorn rag_api:app --port 8090\n\nExpected at: ${RAG_API_BASE}`,
                streaming: false,
                reasoningOpen: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .thinking-dots span { animation: blink 1.4s infinite; }
        .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: '24px 30px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              fontSize: '26px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: 0,
            }}
          >
            <Sparkles size={28} style={{ color: 'var(--primary)' }} />
            AI Learning Assistant
          </h1>

          {/* Model + Level badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#76b900',              // NVIDIA green
                backgroundColor: 'rgba(118,185,0,0.1)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(118,185,0,0.3)',
              }}
            >
              <Zap size={12} />
              Nemotron-3-Ultra
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: lc.color,
                backgroundColor: lc.colorLight,
                padding: '4px 12px',
                borderRadius: '20px',
                border: `1px solid ${lc.colorBorder}`,
              }}
            >
              {lc.emoji} {lc.label}
            </span>
          </div>
        </div>

        {/* ── Chat Area ──────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onToggleReasoning={toggleReasoning}
            />
          ))}

          {/* "Thinking" shimmer before first token arrives */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div style={{ paddingLeft: '38px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <Brain size={14} style={{ color: 'var(--primary)', opacity: 0.7 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Thinking
                <span className="thinking-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input Row ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask anything from your curriculum…"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isStreaming) handleSend(); }}
            disabled={isStreaming}
            style={{
              flex: 1,
              padding: '13px 18px',
              border: `1.5px solid ${isStreaming ? 'var(--border)' : 'var(--primary)'}`,
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'inherit',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s',
              opacity: isStreaming ? 0.6 : 1,
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '0 22px',
              backgroundColor: isStreaming ? 'var(--border)' : 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              height: '48px',
              flexShrink: 0,
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <Send size={17} />
            {isStreaming ? 'Thinking…' : 'Send'}
          </Button>
        </div>

        {/* Hint bar */}
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            marginTop: '8px',
            textAlign: 'center',
          }}
        >
          Powered by NVIDIA Nemotron-3-Ultra · answers grounded in your curriculum · {' '}
          <span style={{ color: lc.color, fontWeight: '600' }}>{lc.label} mode</span>
        </p>
      </main>
    </div>
  );
};
