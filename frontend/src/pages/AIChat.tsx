import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { fleetManager } from '../utils/fleetManager';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

function generateAIResponse(query: string): string {
  const lower = query.toLowerCase().trim();
  const vehicles = fleetManager.getVehicles();
  const summary = fleetManager.getFleetRiskSummary();
  const alerts = fleetManager.getAlerts();

  // Greetings
  if (/^(hey|hi|hello|yo|sup|hii+|what'?s? up)/.test(lower)) {
    return `Hey! 👋 I'm your fleet intelligence assistant. Here's a quick snapshot:\n\n• ${summary.total} vehicles active\n• Fleet risk: ${Math.round(summary.avgScore)}/100\n• ${summary.critical} critical driver(s)\n\nWhat would you like to know more about?`;
  }

  // Thanks / acknowledgment
  if (/^(thanks|thank|ok|okay|cool|got it|nice|great|good|yup|yep|yes|sure)/.test(lower)) {
    const responses = [
      `You're welcome! Anything else I can help with? I can check driver status, predict fatigue patterns, or dispatch alerts.`,
      `No problem! Let me know if you need fleet status, risk analysis, or want to send alerts to any driver.`,
      `Got it! I'm here if you need anything — just ask about drivers, routes, predictions, or alerts.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Risk / danger / who's at risk
  if (/risk|danger|at risk|unsafe|who.*(need|attention)|concern/.test(lower)) {
    const atRisk = vehicles.filter(v => v.currentScore > 30);
    if (atRisk.length === 0) return `✅ All clear! No drivers currently at elevated risk.\n\nFleet risk score: ${Math.round(summary.avgScore)}/100\nAll ${summary.total} vehicles in safe zone.`;
    let response = `🚨 ${atRisk.length} driver(s) need attention:\n\n`;
    atRisk.forEach((v, i) => {
      response += `${i + 1}. **${v.driverName}** (${v.id})\n`;
      response += `   Risk: ${Math.round(v.currentScore)}/100 | Status: ${v.status}\n`;
      response += `   Driving: ${Math.round(v.sessionDuration / 60)} min\n`;
      response += `   Action: ${v.currentScore > 60 ? '⚠️ Dispatch rest alert immediately' : '👀 Monitor — alert if score rises'}\n\n`;
    });
    return response;
  }

  // Alerts / incidents
  if (/alert|incident|event|warning|what happened|recent/.test(lower)) {
    if (alerts.length === 0) return "📋 No alerts recorded in this session. Fleet is operating safely.\n\nAlerts trigger when:\n• Drowsiness score > 70\n• Phone detected\n• Cognitive distraction sustained > 30s";
    let response = `📋 ${alerts.length} alert(s) this session:\n\n`;
    alerts.slice(0, 5).forEach(a => {
      const severity = a.severity >= 3 ? '🔴' : a.severity >= 2 ? '🟡' : '🔵';
      response += `${severity} ${a.alertType.replace(/_/g, ' ')}\n   Vehicle: ${a.vehicleId} | Score: ${Math.round(a.drowsinessScore)} | ${new Date(a.timestamp).toLocaleTimeString()}\n\n`;
    });
    if (alerts.length > 5) response += `...and ${alerts.length - 5} more.`;
    return response;
  }

  // Status / overview / fleet / how's everything
  if (/status|overview|fleet|how.*(everything|fleet|doing|going)|summary|report/.test(lower)) {
    return `📊 **Fleet Status Report**\n\n` +
      `Vehicles: ${summary.total} total\n` +
      `├── ✅ Active: ${summary.active}\n` +
      `├── ⚠️ Warning: ${summary.alert}\n` +
      `├── 🔴 Critical: ${summary.critical}\n` +
      `└── Average Risk: ${Math.round(summary.avgScore)}/100\n\n` +
      `Alerts today: ${summary.totalAlerts}\n\n` +
      `${summary.critical > 0 ? '⚠️ Immediate action needed for critical drivers.' : '✅ Fleet operating normally. No intervention required.'}`;
  }

  // Send / dispatch / notify
  if (/send|dispatch|notify|tell|alert.*driver|message/.test(lower)) {
    return "✅ **Alert dispatched!**\n\nThe driver has been notified via:\n• In-cab audio alert\n• Dashboard notification\n• Route updated with nearest rest stop\n\nNearest rest stop: 3.8 km ahead (~4 min at current speed).\n\nI'll continue monitoring and escalate if needed.";
  }

  // Predict / forecast / tonight / tomorrow
  if (/predict|forecast|tonight|tomorrow|future|will.*happen|expect/.test(lower)) {
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour <= 5;
    return `📈 **Fatigue Forecast** (next 4 hours):\n\n` +
      `• ${isNight ? '3' : '1'} driver(s) approaching fatigue threshold\n` +
      `• ${isNight ? 'High' : 'Low'} risk window: ${isNight ? '1:00 AM - 4:00 AM (circadian dip)' : '1:00 PM - 3:00 PM (post-lunch dip)'}\n` +
      `• Predicted peak risk: ${isNight ? '78' : '45'}/100 at ${isNight ? '2:30 AM' : '2:15 PM'}\n\n` +
      `**Recommendation:**\n` +
      `• Pre-schedule break alerts at 90-minute marks\n` +
      `• Consider shift rotation for ${isNight ? 'night' : 'afternoon'} drivers\n` +
      `• Alert threshold lowered for high-risk window`;
  }

  // Best / safest / top performers
  if (/best|safest|top|performer|good driver|reliable/.test(lower)) {
    const safe = vehicles.filter(v => v.currentScore < 25).sort((a, b) => a.currentScore - b.currentScore);
    if (safe.length === 0) return "No drivers currently in the fully safe zone (<25 risk).";
    let response = "🏆 **Top Performing Drivers:**\n\n";
    safe.slice(0, 3).forEach((v, i) => {
      response += `${i + 1}. ${v.driverName} — Risk: ${Math.round(v.currentScore)}/100 ✅\n   Status: ${v.status} | Session: ${Math.round(v.sessionDuration / 60)} min\n\n`;
    });
    response += "These drivers maintain consistent alertness and low fatigue levels.";
    return response;
  }

  // Driver specific query
  if (/driver.*(#?\d+|alpha|beta|gamma|delta)/.test(lower)) {
    const match = lower.match(/(alpha|beta|gamma|delta|\d+)/);
    const searchTerm = match ? match[1] : '';
    const found = vehicles.find(v => v.driverName.toLowerCase().includes(searchTerm) || v.id.toLowerCase().includes(searchTerm));
    if (found) {
      return `📋 **${found.driverName}** (${found.id})\n\n` +
        `Status: ${found.status}\n` +
        `Risk Score: ${Math.round(found.currentScore)}/100\n` +
        `Session Duration: ${Math.round(found.sessionDuration / 60)} min\n` +
        `Alerts: ${found.alerts.length}\n\n` +
        `${found.currentScore > 50 ? '⚠️ This driver needs attention. Consider dispatching a break alert.' : '✅ Operating within safe parameters.'}`;
    }
    return "I couldn't find that driver. Try 'Show fleet status' to see all active drivers.";
  }

  // Help / what can you do
  if (/help|what can you|what do you|capabilities|feature/.test(lower)) {
    return "🤖 **I can help you with:**\n\n" +
      "• **Fleet Status** — \"How's the fleet doing?\"\n" +
      "• **Risk Assessment** — \"Who's at risk right now?\"\n" +
      "• **Alerts** — \"Show recent alerts\"\n" +
      "• **Predictions** — \"Predict fatigue for tonight\"\n" +
      "• **Driver Details** — \"Tell me about Driver Alpha\"\n" +
      "• **Actions** — \"Send rest alert to the critical driver\"\n" +
      "• **Rankings** — \"Who are the safest drivers?\"\n\n" +
      "Just ask in natural language — I understand context!";
  }

  // Route / navigation / rest stop
  if (/route|rest stop|break|where.*stop|navigation|nearest/.test(lower)) {
    return "🗺️ **Rest Stop Recommendations:**\n\n" +
      "Based on current driver locations:\n\n" +
      "• NH-48 km 142 — HP Petrol Pump & Dhaba (3.8 km ahead)\n" +
      "• NH-48 km 158 — Highway Rest Area (19 km ahead)\n" +
      "• NH-44 km 203 — Reliance Petrol + Food Court (12 km ahead)\n\n" +
      "Want me to send route updates to a specific driver?";
  }

  // Catch-all with context-aware response
  const contextResponses = [
    `I understand you're asking about "${query}". Here's what I can tell you:\n\nFleet is currently at ${Math.round(summary.avgScore)}/100 risk. ${summary.critical > 0 ? `${summary.critical} driver(s) need attention.` : 'All drivers safe.'}\n\nCan you be more specific? Try asking about risk, alerts, predictions, or driver status.`,
    `I'm not sure I fully understood "${query}". Let me give you the current state:\n\n• ${summary.total} vehicles tracked\n• ${summary.critical} critical, ${summary.alert} warnings\n• ${alerts.length} alerts today\n\nTry: "Who's at risk?" or "Show fleet status" for detailed info.`,
    `Regarding "${query}" — here's what I know:\n\nFleet health: ${summary.avgScore < 30 ? 'Good ✅' : 'Needs attention ⚠️'}\nActive drivers: ${summary.active}/${summary.total}\n\nI work best with questions about fleet safety, fatigue, alerts, and driver management. What would you like to know?`,
  ];
  return contextResponses[Math.floor(Math.random() * contextResponses.length)];
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', content: "👋 I'm FleetMind AI — your fleet intelligence assistant.\n\nI can monitor drivers in real-time, predict fatigue, dispatch alerts, and answer questions about your fleet.\n\nTry: \"How's the fleet?\" or \"Who's at risk?\"", timestamp: Date.now() },
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
    }, 600 + Math.random() * 800);
  };

  const quickActions = ['Fleet status', 'Who\'s at risk?', 'Predict tonight', 'Recent alerts'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: '#3b82f6' }} /> AI Fleet Manager
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Conversational fleet intelligence — ask anything in natural language</p>
        </div>
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {quickActions.map(action => (
            <button
              key={action}
              onClick={() => { setInput(action); }}
              style={{ padding: '6px 12px', borderRadius: '6px', background: '#1e293b', border: '1px solid #2d3748', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: '#161922', border: '1px solid #1e293b', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#1e293b', alignSelf: 'flex-start' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>● ● ●</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask FleetMind AI anything..."
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
