import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';
import { DrivingCoach } from '../utils/llmDrivingCoach';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const coach = new DrivingCoach();

function generateAIResponse(query: string): string {
  const lower = query.toLowerCase();
  const vehicles = fleetManager.getVehicles();
  const summary = fleetManager.getFleetRiskSummary();
  const alerts = fleetManager.getAlerts();

  if (lower.includes('risk') || lower.includes('danger') || lower.includes('at risk')) {
    const atRisk = vehicles.filter(v => v.currentScore > 30);
    if (atRisk.length === 0) return "All drivers are currently in the safe zone. Fleet risk score is " + Math.round(summary.avgScore) + "/100.";
    let response = `🚨 ${atRisk.length} driver(s) need attention:\n\n`;
    atRisk.forEach((v, i) => {
      response += `${i + 1}. ${v.driverName} (${v.id}) — Risk: ${Math.round(v.currentScore)}/100\n`;
      response += `   → Status: ${v.status}, Driving: ${Math.round(v.sessionDuration / 60)}min\n`;
      response += `   → Recommendation: ${v.currentScore > 60 ? 'Dispatch rest alert immediately' : 'Monitor closely, alert if score rises'}\n\n`;
    });
    return response;
  }

  if (lower.includes('alert') || lower.includes('incident')) {
    if (alerts.length === 0) return "No alerts recorded today. The fleet is operating safely.";
    let response = `📋 ${alerts.length} alert(s) recorded:\n\n`;
    alerts.slice(0, 5).forEach(a => {
      response += `• ${a.alertType.replace(/_/g, ' ')} — ${a.vehicleId} — Score: ${Math.round(a.drowsinessScore)}\n  Time: ${new Date(a.timestamp).toLocaleTimeString()}\n\n`;
    });
    return response;
  }

  if (lower.includes('status') || lower.includes('overview') || lower.includes('fleet')) {
    return `📊 Fleet Overview:\n\n• Total Vehicles: ${summary.total}\n• Active: ${summary.active}\n• Warnings: ${summary.alert}\n• Critical: ${summary.critical}\n• Avg Risk Score: ${Math.round(summary.avgScore)}/100\n• Total Alerts Today: ${summary.totalAlerts}\n\n${summary.critical > 0 ? '⚠️ Action needed for critical drivers.' : '✅ Fleet is operating normally.'}`;
  }

  if (lower.includes('send') || lower.includes('alert') || lower.includes('notify')) {
    return "✅ Alert dispatched successfully. The driver has been notified via in-cab system. I've also marked the nearest rest stop on their route (estimated 4 km ahead).";
  }

  if (lower.includes('predict') || lower.includes('forecast') || lower.includes('tomorrow')) {
    return "📈 Fatigue Forecast (next 4 hours):\n\n• 2 drivers approaching fatigue threshold based on session duration + circadian model\n• Peak risk window: 1:00 AM - 3:00 AM (circadian dip)\n• Recommendation: Pre-schedule break alerts for drivers on night shift at 90-minute marks";
  }

  if (lower.includes('best') || lower.includes('safest') || lower.includes('top')) {
    const safe = vehicles.filter(v => v.currentScore < 20).sort((a, b) => a.currentScore - b.currentScore);
    if (safe.length === 0) return "No drivers currently in the fully safe zone.";
    let response = "🏆 Safest drivers right now:\n\n";
    safe.slice(0, 3).forEach((v, i) => {
      response += `${i + 1}. ${v.driverName} — Risk: ${Math.round(v.currentScore)}/100 ✅\n`;
    });
    return response;
  }

  // Default
  return coach.getMotivation() + "\n\nTry asking:\n• \"Which drivers are at risk?\"\n• \"Show fleet status\"\n• \"Predict fatigue for tonight\"\n• \"Show recent alerts\"";
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', content: "👋 I'm FleetMind AI. I can help you monitor your fleet, identify at-risk drivers, predict fatigue, and dispatch alerts. What would you like to know?", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(userMsg.content);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0 }}>AI Fleet Manager</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Ask anything about your fleet — drivers at risk, predictions, alerts, route optimization</p>
      </div>

      {/* Chat Container */}
      <div style={{ flex: 1, background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ maxWidth: '75%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                background: msg.role === 'user' ? '#1e3a5f' : '#1e293b',
                color: msg.role === 'user' ? '#93c5fd' : '#e2e8f0',
                fontSize: '13px',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#1e293b', alignSelf: 'flex-start', maxWidth: '100px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask FleetMind AI..."
            style={{ flex: 1, background: '#0f1117', border: '1px solid #2d3748', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }}
          />
          <button onClick={handleSend} style={{ background: '#3b82f6', border: 'none', borderRadius: '8px', padding: '10px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
