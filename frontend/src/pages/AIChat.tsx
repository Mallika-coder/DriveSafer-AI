import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';
import axios from 'axios';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const LLM_API = "https://backend.buildpicoapps.com/aero/run/llm-api?pk=v1-Z0FBQUFBQm81Qnd5eHIwYkVfbkEwcGJOX21LYmpSU2tpWnlTYmlNYW9IWGluZE5TWEFKc2sxUTdQWFZrQldMVVVmSDJyQ3pWMEdFbFBxbkVleF9VMTR5ZDgzQVpTbmVrZ3c9PQ==";

function getFleetContext(): string {
  const vehicles = fleetManager.getVehicles();
  const summary = fleetManager.getFleetRiskSummary();
  const alerts = fleetManager.getAlerts();

  let context = `CURRENT FLEET STATE (live data):\n`;
  context += `- Total vehicles: ${summary.total}\n`;
  context += `- Active: ${summary.active}, Warning: ${summary.alert}, Critical: ${summary.critical}\n`;
  context += `- Average fleet risk: ${Math.round(summary.avgScore)}/100\n`;
  context += `- Total alerts this session: ${summary.totalAlerts}\n\n`;
  context += `DRIVERS:\n`;
  vehicles.forEach(v => {
    context += `- ${v.driverName} (${v.id}): risk=${Math.round(v.currentScore)}/100, status=${v.status}, session=${Math.round(v.sessionDuration / 60)}min${v.isLive ? ' [LIVE WEBCAM USER]' : ''}\n`;
  });
  if (alerts.length > 0) {
    context += `\nRECENT ALERTS:\n`;
    alerts.slice(0, 5).forEach(a => {
      context += `- ${a.alertType.replace(/_/g, ' ')} on ${a.vehicleId}, severity ${a.severity}, score ${Math.round(a.drowsinessScore)} at ${new Date(a.timestamp).toLocaleTimeString()}\n`;
    });
  }
  return context;
}

const SYSTEM_PROMPT = `You are FleetMind AI, an intelligent fleet safety assistant. You monitor driver drowsiness and fatigue in real-time.

Your capabilities:
1. Analyze live fleet data (provided as context) and answer questions about driver risk
2. Recommend actions: send alerts, suggest rest stops, schedule breaks
3. Predict fatigue patterns based on session duration and time of day
4. Explain ML decisions: which signals (PERCLOS, EAR, head pose, gaze, blink rate) are causing high risk
5. Provide fleet management insights

Rules:
- Always reference the ACTUAL fleet data provided in context
- Be specific: use driver names, exact scores, vehicle IDs
- If asked to take action (send alert, etc.), confirm you've done it
- Keep responses concise (3-5 sentences max) unless asked for detail
- Use numbers and data points, not vague statements
- If a driver is critical (>60 risk), urgently recommend intervention`;

async function callLLM(userMessage: string): Promise<string> {
  const fleetContext = getFleetContext();
  const prompt = `${SYSTEM_PROMPT}\n\n${fleetContext}\n\nUser: ${userMessage}\n\nRespond based on the live fleet data above:`;

  try {
    const res = await axios.post(LLM_API, { prompt }, { headers: { "Content-Type": "application/json" } });
    return res.data?.text || generateFallbackResponse(userMessage);
  } catch {
    return generateFallbackResponse(userMessage);
  }
}

function generateFallbackResponse(query: string): string {
  const lower = query.toLowerCase();
  const vehicles = fleetManager.getVehicles();
  const summary = fleetManager.getFleetRiskSummary();
  const alerts = fleetManager.getAlerts();

  if (/risk|danger|at risk|unsafe|who.*(need|attention)/.test(lower)) {
    const atRisk = vehicles.filter(v => v.currentScore > 30);
    if (atRisk.length === 0) return `All ${summary.total} drivers are in the safe zone. Fleet risk: ${Math.round(summary.avgScore)}/100.`;
    return atRisk.map(v => `${v.driverName} (${v.id}): ${Math.round(v.currentScore)}/100 — ${v.status}`).join('\n') + `\n\nRecommendation: ${atRisk[0].currentScore > 60 ? 'Dispatch rest alert immediately.' : 'Monitor closely.'}`;
  }

  if (/status|overview|fleet|how/.test(lower)) {
    return `Fleet: ${summary.total} vehicles | Active: ${summary.active} | Warning: ${summary.alert} | Critical: ${summary.critical} | Avg Risk: ${Math.round(summary.avgScore)}/100 | Alerts: ${summary.totalAlerts}`;
  }

  if (/alert|incident/.test(lower)) {
    if (alerts.length === 0) return "No alerts this session.";
    return alerts.slice(0, 3).map(a => `${a.alertType.replace(/_/g, ' ')} — ${a.vehicleId} — Score: ${Math.round(a.drowsinessScore)}`).join('\n');
  }

  return `Fleet is at ${Math.round(summary.avgScore)}/100 risk with ${summary.total} active vehicles. Ask me about specific drivers, predictions, or alerts.`;
}

const QUICK_PROMPTS = [
  "Which drivers are at risk right now?",
  "Give me a fleet status report",
  "Predict fatigue for tonight's shift",
  "What caused the last alert?",
];

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', content: "I'm FleetMind AI — your fleet intelligence assistant powered by a real language model. I have access to live fleet data and can analyze driver risk, predict fatigue, and recommend actions. What would you like to know?", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await callLLM(userText);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Connection issue. Please try again.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: '#3b82f6' }} /> AI Fleet Manager
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>LLM-powered • Answers based on real-time fleet data</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '400px' }}>
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              style={{ padding: '5px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #2d3748', color: '#94a3b8', fontSize: '10px', cursor: 'pointer', fontWeight: 500 }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'user' ? <User size={13} style={{ color: '#60a5fa' }} /> : <Bot size={13} style={{ color: '#a78bfa' }} />}
                </div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                  background: msg.role === 'user' ? '#1e3a5f' : '#1e293b',
                  color: msg.role === 'user' ? '#93c5fd' : '#e2e8f0',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: msg.role === 'ai' ? '36px' : '0', paddingRight: msg.role === 'user' ? '36px' : '0' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={13} style={{ color: '#a78bfa' }} />
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#1e293b' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b', animation: 'pulse 1s infinite' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b', animation: 'pulse 1s infinite 0.2s' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b', animation: 'pulse 1s infinite 0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything about your fleet..."
            disabled={isLoading}
            style={{ flex: 1, background: '#0f1117', border: '1px solid #2d3748', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', opacity: isLoading ? 0.6 : 1 }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            style={{ background: '#3b82f6', border: 'none', borderRadius: '8px', padding: '10px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, opacity: (!input.trim() || isLoading) ? 0.5 : 1 }}
          >
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
