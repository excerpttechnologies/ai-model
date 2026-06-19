import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ChevronDown, ChevronRight, Brain, Zap, BookOpen, Lightbulb, FlaskConical, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { RESULTS } from '../data/results';
import { levelFromScore, LEVEL_CONFIG } from '../lib/levelUtils';
import { useAuthContext } from '../context/AuthContext';

const RAG_API_BASE: string = (import.meta as any).env?.VITE_RAG_API_URL ?? '/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Source { source_file: string; class_name: string; subject: string; }

interface TutorResponse {
  student_level?: string;
  topic?: string;
  subtopic?: string;
  explanation?: string;
  formula?: string;
  example?: string;
  worked_example?: string;
  real_life_application?: string;
  practice_question?: string;
  hint?: string;
  next_step?: string;
  next_learning_step?: string;
  difficulty?: string;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  rawContent: string;        // full streamed text (may be JSON)
  reasoning?: string;
  level?: string;
  sources?: Source[];
  streaming?: boolean;
  reasoningOpen?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLatestScore(): number | null {
  if (!RESULTS.length) return null;
  return RESULTS[RESULTS.length - 1].percentage ?? null;
}

function inferWeakTopics(): string[] {
  return [...new Set(RESULTS.filter(r => r.percentage < 50).map(r => r.assignmentTitle))].slice(0, 4);
}

/** Try to parse streamed text as TutorResponse JSON. Returns null while streaming or if plain text. */
function parseTutor(raw: string, streaming: boolean): TutorResponse | null {
  if (streaming || !raw.trim()) return null;
  try {
    let clean = raw.trim();
    if (clean.startsWith('```')) {
      const lines = clean.split('\n');
      clean = lines.slice(1, lines.at(-1)?.trim() === '```' ? -1 : undefined).join('\n');
    }
    const data = JSON.parse(clean);
    // Must have at least one teaching field to be considered a tutor response
    if (data.explanation || data.topic || data.example || data.practice_question) return data;
    return null;
  } catch { return null; }
}

// ─── TutorCard ────────────────────────────────────────────────────────────────
const TutorCard: React.FC<{ data: TutorResponse; lc: (typeof LEVEL_CONFIG)[keyof typeof LEVEL_CONFIG] }> = ({ data, lc }) => {
  const rows: { icon: React.ReactNode; label: string; value: string; accent: string; bg: string }[] = [];
  if (data.explanation)           rows.push({ icon: <BookOpen size={14}/>,      label: 'Explanation',         value: data.explanation,           accent: lc.color,    bg: lc.colorLight });
  if (data.formula)               rows.push({ icon: <Zap size={14}/>,           label: 'Formula',             value: data.formula,               accent: '#6C63FF',   bg: 'rgba(108,99,255,0.08)' });
  if (data.example || data.worked_example)
                                  rows.push({ icon: <Lightbulb size={14}/>,    label: 'Worked Example',      value: (data.example || data.worked_example)!, accent: '#FFB84D', bg: 'rgba(255,184,77,0.08)' });
  if (data.real_life_application) rows.push({ icon: <span style={{fontSize:'14px'}}>🌍</span>, label: 'Real Life',  value: data.real_life_application, accent: '#00D084',   bg: 'rgba(0,208,132,0.08)' });
  if (data.practice_question)     rows.push({ icon: <FlaskConical size={14}/>, label: 'Practice',            value: data.practice_question,     accent: '#FF6B6B',   bg: 'rgba(255,107,107,0.08)' });
  if (data.hint)                  rows.push({ icon: <HelpCircle size={14}/>,   label: 'Hint',                value: data.hint,                  accent: '#9B59B6',   bg: 'rgba(155,89,182,0.08)' });
  if (data.next_step || data.next_learning_step)
                                  rows.push({ icon: <ArrowRight size={14}/>,   label: 'Next Step',           value: (data.next_step || data.next_learning_step)!, accent: lc.color, bg: lc.colorLight });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Topic header */}
      {data.topic && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{data.topic}</span>
          {data.subtopic && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>— {data.subtopic}</span>}
          {data.student_level && (
            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: lc.colorLight, color: lc.color }}>
              {lc.emoji} {data.student_level}
            </span>
          )}
        </div>
      )}
      {/* Content rows */}
      {rows.map((row, i) => (
        <div key={i} style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: row.bg, border: `1px solid ${row.accent}22` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ color: row.accent }}>{row.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: row.accent, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{row.value}</p>
        </div>
      ))}
    </div>
  );
};

// ─── ReasoningPanel ──────────────────────────────────────────────────────────
const ReasoningPanel: React.FC<{ text: string; open: boolean; onToggle: () => void; streaming: boolean }> = ({ text, open, onToggle, streaming }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [text, open]);
  if (!text) return null;
  return (
    <div style={{ marginBottom: '8px', borderRadius: '10px', border: '1px solid rgba(108,99,255,0.25)', overflow: 'hidden', backgroundColor: 'rgba(108,99,255,0.04)' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}>
        <Brain size={13} />
        {streaming ? <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Thinking<span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span></span>
                   : `Reasoning trace (${text.split(' ').length} words)`}
        {open ? <ChevronDown size={13} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="rb" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div ref={scrollRef} style={{ maxHeight: '200px', overflowY: 'auto', padding: '10px 14px 12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', borderTop: '1px solid rgba(108,99,255,0.15)' }}>
              {text}
              {streaming && <span style={{ display: 'inline-block', width: '2px', height: '13px', backgroundColor: 'var(--primary)', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: Message; onToggleReasoning: (id: string) => void }> = ({ msg, onToggleReasoning }) => {
  const lc     = LEVEL_CONFIG[(msg.level as keyof typeof LEVEL_CONFIG) ?? 'intermediate'];
  const isUser = msg.type === 'user';
  const tutor  = parseTutor(msg.rawContent, !!msg.streaming);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-start' }}>
      {!isUser && <span style={{ fontSize: '26px', flexShrink: 0, marginTop: '4px' }}>🤖</span>}

      <div style={{ maxWidth: '78%' }}>
        {!isUser && msg.reasoning !== undefined && (
          <ReasoningPanel text={msg.reasoning} open={!!msg.reasoningOpen} onToggle={() => onToggleReasoning(msg.id)} streaming={!!msg.streaming} />
        )}

        <div style={{ padding: '14px 16px', borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px', backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-primary)', color: isUser ? 'white' : 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', border: isUser ? 'none' : '1px solid var(--border)', wordBreak: 'break-word' }}>
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.rawContent}</span>
          ) : tutor ? (
            <TutorCard data={tutor} lc={lc} />
          ) : (
            <>
              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.rawContent || (msg.streaming ? '' : '…')}</span>
              {msg.streaming && msg.rawContent && <span style={{ display: 'inline-block', width: '2px', height: '14px', backgroundColor: 'var(--primary)', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />}
            </>
          )}
        </div>

        {!isUser && !msg.streaming && lc && !tutor && (
          <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '12px', backgroundColor: lc.colorLight, color: lc.color, fontWeight: '700' }}>{lc.emoji} {lc.label}</span>
            {msg.sources && msg.sources.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📚 {[...new Set(msg.sources.map(s => [s.class_name, s.subject].filter(Boolean).join(' ')))].join(', ')}</span>
            )}
          </div>
        )}
        {!isUser && !msg.streaming && tutor && (
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '12px', backgroundColor: lc.colorLight, color: lc.color, fontWeight: '700' }}>{lc.emoji} {lc.label}</span>
            {tutor.difficulty && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Difficulty: {tutor.difficulty}</span>}
            {msg.sources && msg.sources.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📚 {[...new Set(msg.sources.map(s => s.subject).filter(Boolean))].join(', ')}</span>
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
  const board        = studentProfile?.board || 'CBSE';
  const grade        = studentProfile?.grade || 7;
  const weakTopics   = inferWeakTopics();

  const [messages, setMessages] = useState<Message[]>([{
    id: '0', type: 'bot',
    rawContent:
      `Hello! 👋 I'm your AI Teacher powered by NVIDIA Nemotron.\n` +
      `Profile: Grade ${grade} · ${board} Board · ${lc.label} Level ${lc.emoji}\n\n` +
      `Ask me any concept, topic, or problem from your curriculum!\n` +
      `Example: "Explain linear equations" or "Solve x + 5 = 12"`,
    level: studentLevel,
  }]);

  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const toggleReasoning = useCallback((id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reasoningOpen: !m.reasoningOpen } : m));
  }, []);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    const userId = String(Date.now());
    setMessages(prev => [...prev, { id: userId, type: 'user', rawContent: text }]);
    setInputValue('');
    setIsStreaming(true);

    const botId = String(Date.now() + 1);
    setMessages(prev => [...prev, { id: botId, type: 'bot', rawContent: '', reasoning: '', level: studentLevel, sources: [], streaming: true, reasoningOpen: true }]);

    try {
      const resp = await fetch(`${RAG_API_BASE}/ask/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, class_name: null, subject: null, score, board, grade, topic: text, weak_topics: weakTopics.length ? weakTopics : null }),
      });

      if (!resp.ok) {
        let detail = resp.statusText;
        try { const e = await resp.json(); detail = e.detail ?? detail; } catch {}
        const guide: Record<number, string> = {
          502: '502 Bad Gateway — uvicorn is not running.\nRun: uvicorn app:app --host 0.0.0.0 --port 8090\n(Set OPENAI_API_KEY in .env first)',
          503: '503 Service Unavailable — Chroma DB failed to load.\nRun: python ingest.py --source ./books --db ./curriculum_db',
          504: '504 Gateway Timeout — check Ollama is running: ollama serve',
        };
        throw new Error(guide[resp.status] ?? `HTTP ${resp.status}: ${detail}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let event: any;
          try { event = JSON.parse(raw); } catch { continue; }

          setMessages(prev => prev.map(m => {
            if (m.id !== botId) return m;
            switch (event.type) {
              case 'meta':      return { ...m, level: event.level ?? m.level, sources: event.sources ?? m.sources };
              case 'reasoning': return { ...m, reasoning: (m.reasoning ?? '') + event.text };
              case 'content':   return { ...m, rawContent: m.rawContent + event.text };
              case 'done':      return { ...m, streaming: false, reasoningOpen: false };
              case 'error':     return { ...m, rawContent: `⚠️ ${event.text}`, streaming: false, reasoningOpen: false };
              default:          return m;
            }
          }));
        }
      }

      setMessages(prev => prev.map(m => m.id === botId ? { ...m, streaming: false, reasoningOpen: false } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === botId ? {
        ...m,
        rawContent: `⚠️ Could not reach the AI backend.\n\n${err.message}\n\nExpected at: ${RAG_API_BASE}`,
        streaming: false, reasoningOpen: false,
      } : m));
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .thinking-dots span { animation: blink 1.4s infinite; }
        .thinking-dots span:nth-child(2) { animation-delay:0.2s; }
        .thinking-dots span:nth-child(3) { animation-delay:0.4s; }
      `}</style>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px 30px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexShrink: 0 }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Sparkles size={28} style={{ color: 'var(--primary)' }} /> AI Teacher
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: '#76b900', backgroundColor: 'rgba(118,185,0,0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(118,185,0,0.3)' }}>
              <Zap size={12} /> Nemotron-3-Ultra
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: lc.color, backgroundColor: lc.colorLight, padding: '4px 12px', borderRadius: '20px', border: `1px solid ${lc.colorBorder}` }}>
              {lc.emoji} {lc.label}
            </span>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} onToggleReasoning={toggleReasoning} />)}
          {isStreaming && messages[messages.length - 1]?.rawContent === '' && (
            <div style={{ paddingLeft: '38px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <Brain size={14} style={{ color: 'var(--primary)', opacity: 0.7 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thinking<span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span></span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
          {['Explain linear equations', 'What is photosynthesis?', 'Solve x + 5 = 12', 'Define aperture in photography'].map(q => (
            <button key={q} onClick={() => { setInputValue(q); inputRef.current?.focus(); }}
              style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <input ref={inputRef} type="text" placeholder="Ask any topic, concept, or problem…"
            value={inputValue} onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isStreaming) handleSend(); }}
            disabled={isStreaming}
            style={{ flex: 1, padding: '13px 18px', border: `1.5px solid ${isStreaming ? 'var(--border)' : 'var(--primary)'}`, borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', opacity: isStreaming ? 0.6 : 1 }} />
          <Button onClick={handleSend} disabled={!inputValue.trim() || isStreaming}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 22px', backgroundColor: isStreaming ? 'var(--border)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', height: '48px', cursor: isStreaming ? 'not-allowed' : 'pointer' }}>
            <Send size={17} /> {isStreaming ? 'Thinking…' : 'Ask'}
          </Button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
          Powered by NVIDIA Nemotron · {board} Board · Grade {grade} · <span style={{ color: lc.color, fontWeight: '600' }}>{lc.label} mode</span>
        </p>
      </main>
    </div>
  );
};
