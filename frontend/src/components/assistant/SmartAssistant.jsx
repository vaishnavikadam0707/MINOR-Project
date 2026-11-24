import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  X,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Minimize2,
  Maximize2,
  ChevronRight,
  Info,
  Layers,
  Wrench,
  Calendar,
  DollarSign,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatRupee } from '../../utils/formatters';
import { getEffectiveScheduleStatus } from '../../utils/dateHelpers';

export default function SmartAssistant() {
  const { assets, workOrders, schedules, repairCosts, users, serviceHistory } = useAppData();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your Smart AssetCare Assistant. I can inspect current telemetry, equipment statuses, pending work orders, and financial records in real time. How may I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'How many assets are currently operational?',
        'Which assets need maintenance?',
        'Show overdue maintenance tasks.',
        'What is the total maintenance expense?'
      ]
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Suggested Quick Chips (Section 4.2)
  const SUGGESTED_QUESTIONS = [
    'How many assets are currently operational?',
    'Which assets need maintenance?',
    'Show overdue maintenance tasks.',
    'How many work orders are pending?',
    'What is the total maintenance expense?',
    'Which asset has the highest repair cost?',
    'Which technician has the most assigned work orders?',
    'Show assets with low health scores.'
  ];

  // -------------------------------------------------------------
  // Deterministic Rule-Based JavaScript Engine (Section 4.3)
  // -------------------------------------------------------------
  const generateResponse = (rawQuestion) => {
    const q = rawQuestion.toLowerCase().trim();

    // 1. Operational Assets
    if (q.includes('operational') || q.includes('working assets') || q.includes('online assets')) {
      const total = assets.length;
      const opCount = assets.filter((a) => a.status === 'OPERATIONAL').length;
      const pct = total ? Math.round((opCount / total) * 100) : 100;
      const underMaint = assets.filter((a) => a.status === 'UNDER_MAINTENANCE').length;
      const outOfService = assets.filter((a) => a.status === 'OUT_OF_SERVICE').length;

      return {
        text: `Currently, **${opCount} out of ${total} registered assets (${pct}%)** are operational and actively in service.\n\n• **Operational:** ${opCount}\n• **Under Maintenance:** ${underMaint}\n• **Out of Service / Faulted:** ${outOfService}`,
        suggestions: [
          'Which assets need maintenance?',
          'Show assets with low health scores.',
          'How many work orders are pending?'
        ]
      };
    }

    // 2. Which assets need maintenance
    if (q.includes('need maintenance') || q.includes('needs maintenance') || q.includes('due for maintenance') || q.includes('require maintenance')) {
      const underMaint = assets.filter((a) => a.status === 'UNDER_MAINTENANCE');
      const dueSchedules = schedules.filter(
        (s) => getEffectiveScheduleStatus(s) === 'DUE' || getEffectiveScheduleStatus(s) === 'OVERDUE'
      );

      if (underMaint.length === 0 && dueSchedules.length === 0) {
        return {
          text: 'Good news! All capital assets are currently operational and there are no overdue maintenance schedules on file.',
          suggestions: ['How many assets are currently operational?', 'What is the total maintenance expense?']
        };
      }

      let text = `There are **${underMaint.length} asset(s)** currently in maintenance status, and **${dueSchedules.length} scheduled task(s)** due or overdue:\n\n`;
      if (underMaint.length > 0) {
        text += '**Assets In Active Service:**\n';
        underMaint.slice(0, 4).forEach((a) => {
          text += `• **${a.name}** (${a.assetId}) — ${a.location}\n`;
        });
      }
      if (dueSchedules.length > 0) {
        text += '\n**Maintenance Due/Overdue:**\n';
        dueSchedules.slice(0, 4).forEach((s) => {
          text += `• **${s.title}** on ${s.assetId} (Due: ${s.dueDate})\n`;
        });
      }

      return {
        text,
        suggestions: ['Show overdue maintenance tasks.', 'How many work orders are pending?']
      };
    }

    // 3. Overdue Maintenance Tasks
    if (q.includes('overdue')) {
      const overdue = schedules.filter((s) => getEffectiveScheduleStatus(s) === 'OVERDUE');
      if (overdue.length === 0) {
        return {
          text: 'There are currently **0 overdue maintenance tasks** in the system. All preventive schedules are up to date.',
          suggestions: ['Which assets need maintenance?', 'How many work orders are pending?']
        };
      }

      let text = `There are **${overdue.length} overdue maintenance task(s)** requiring urgent technical attention:\n\n`;
      overdue.forEach((s) => {
        text += `• **${s.title}** (${s.id})\n  - Asset: **${s.assetId}**\n  - Scheduled Date: **${s.dueDate}** (OVERDUE)\n  - Priority: **${s.priority}**\n\n`;
      });

      return {
        text,
        suggestions: ['How many work orders are pending?', 'Which technician has the most assigned work orders?']
      };
    }

    // 4. Pending Work Orders
    if (q.includes('work order') || q.includes('work orders') || q.includes('pending') || q.includes('open tickets')) {
      const pending = workOrders.filter(
        (w) => w.status !== 'COMPLETED' && w.status !== 'VERIFIED' && w.status !== 'CLOSED'
      );
      const critical = pending.filter((w) => w.priority === 'CRITICAL').length;
      const assigned = pending.filter((w) => w.status === 'ASSIGNED').length;
      const inProgress = pending.filter((w) => w.status === 'IN_PROGRESS').length;
      const created = pending.filter((w) => w.status === 'CREATED').length;

      return {
        text: `There are currently **${pending.length} pending work order(s)**:\n\n• **Created / Unassigned:** ${created}\n• **Assigned:** ${assigned}\n• **In Progress:** ${inProgress}\n• **Critical Priority:** ${critical} ticket(s)`,
        suggestions: [
          'Which technician has the most assigned work orders?',
          'What is the total maintenance expense?',
          'Which asset has the highest repair cost?'
        ]
      };
    }

    // 5. Total Maintenance Expense
    if (q.includes('expense') || q.includes('maintenance cost') || q.includes('total spend') || q.includes('repair cost') || q.includes('how much spent')) {
      const total = repairCosts.reduce((sum, c) => sum + (Number(c.totalCost) || 0), 0);
      const labour = repairCosts.reduce((sum, c) => sum + (Number(c.labourCost) || 0), 0);
      const parts = repairCosts.reduce((sum, c) => sum + (Number(c.partsCost) || 0), 0);
      const other = repairCosts.reduce((sum, c) => sum + (Number(c.otherCharges) || 0), 0);

      return {
        text: `The cumulative maintenance expenditure recorded in the system is **${formatRupee(total)}** across ${repairCosts.length} itemized repair records.\n\n• **Labour Charges:** ${formatRupee(labour)}\n• **Spare Parts Consumables:** ${formatRupee(parts)}\n• **Logistics & Other:** ${formatRupee(other)}`,
        suggestions: [
          'Which asset has the highest repair cost?',
          'How many work orders are pending?',
          'How many assets are currently operational?'
        ]
      };
    }

    // 6. Highest repair cost asset
    if (q.includes('highest repair') || q.includes('highest cost') || q.includes('most expensive')) {
      if (repairCosts.length === 0) {
        return {
          text: 'No repair expense records have been logged in the system yet.',
          suggestions: ['How many assets are currently operational?']
        };
      }

      const spendMap = {};
      repairCosts.forEach((c) => {
        spendMap[c.assetId] = (spendMap[c.assetId] || 0) + (Number(c.totalCost) || 0);
      });

      let topAssetId = null;
      let maxCost = -1;
      Object.entries(spendMap).forEach(([id, cost]) => {
        if (cost > maxCost) {
          maxCost = cost;
          topAssetId = id;
        }
      });

      const matchedAsset = assets.find((a) => a.id === topAssetId || a.assetId === topAssetId);

      return {
        text: `The asset with the highest recorded maintenance cost is **${matchedAsset?.name || topAssetId}** (${matchedAsset?.assetId || topAssetId}) with a cumulative spend of **${formatRupee(maxCost)}**.\n\n• **Category:** ${matchedAsset?.category || 'Equipment'}\n• **Location:** ${matchedAsset?.location || 'Campus'}\n• **Purchase Cost:** ${formatRupee(matchedAsset?.purchaseCost || 0)}`,
        suggestions: [
          'What is the total maintenance expense?',
          'Which technician has the most assigned work orders?',
          'Which assets need maintenance?'
        ]
      };
    }

    // 7. Technician with most assigned work orders
    if (q.includes('technician') || q.includes('most assigned') || q.includes('technician workload')) {
      const techs = users.filter((u) => u.role === 'TECHNICIAN');
      if (techs.length === 0) {
        return {
          text: 'No active technician accounts found in user administration.',
          suggestions: ['How many assets are currently operational?']
        };
      }

      const counts = techs.map((t) => {
        const assigned = workOrders.filter(
          (w) => w.assignedTechnicianId === t.id && w.status !== 'CLOSED' && w.status !== 'VERIFIED'
        );
        return { tech: t, count: assigned.length };
      });

      counts.sort((a, b) => b.count - a.count);
      const top = counts[0];

      let text = `Technician **${top.tech.name}** currently has the most active assignments with **${top.count} open work order(s)**.\n\n**Technician Workload Summary:**\n`;
      counts.forEach((c) => {
        text += `• **${c.tech.name}** (${c.tech.department}): ${c.count} active ticket(s)\n`;
      });

      return {
        text,
        suggestions: ['How many work orders are pending?', 'Show overdue maintenance tasks.']
      };
    }

    // 8. Low Health Scores
    if (q.includes('health') || q.includes('low health') || q.includes('score')) {
      const lowHealth = assets.filter((a) => typeof a.healthScore === 'number' && a.healthScore < 80);

      if (lowHealth.length === 0) {
        return {
          text: 'All assets have a simulated health score above 80%. Equipment operating telemetry is currently optimal.',
          suggestions: ['How many assets are currently operational?', 'Which assets need maintenance?']
        };
      }

      let text = `There are **${lowHealth.length} asset(s)** with health scores below 80% (simulated):\n\n`;
      lowHealth.forEach((a) => {
        text += `• **${a.name}** (${a.assetId})\n  - Health: **${a.healthScore}%**\n  - Status: **${a.status}**\n  - Location: ${a.location}\n\n`;
      });
      text += '*Note: Asset health scores in this demo are generated from simulated telemetry parameters.*';

      return {
        text,
        suggestions: ['Which assets need maintenance?', 'Show overdue maintenance tasks.']
      };
    }

    // 9. Help
    if (q.includes('help') || q.includes('what can you do') || q.includes('commands')) {
      return {
        text: 'I can assist you with real-time institutional metrics calculated directly from the application data:\n\n1. Asset availability & operational counts\n2. Due and overdue maintenance schedules\n3. Pending work orders and critical ticket counts\n4. Total repair expenditures & top cost equipment\n5. Field technician workload distribution\n6. Equipment health score telemetry (simulated)\n\nTry clicking any of the suggested questions below!',
        suggestions: SUGGESTED_QUESTIONS.slice(0, 4)
      };
    }

    // Default Fallback
    return {
      text: `I couldn't find a direct match in the current dataset for "${rawQuestion}".\n\nAs a local deterministic assistant, I can look up live asset counts, pending work orders, overdue preventive tasks, financial repair expenses, and technician loads. Try one of the suggested questions below:`,
      suggestions: [
        'How many assets are currently operational?',
        'Which assets need maintenance?',
        'What is the total maintenance expense?',
        'How many work orders are pending?'
      ]
    };
  };

  const handleSendMessage = (textToSend = null) => {
    const question = (textToSend || inputText).trim();
    if (!question) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const replyData = generateResponse(question);

    const assistantMessage = {
      id: `asst-${Date.now() + 1}`,
      sender: 'assistant',
      text: replyData.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: replyData.suggestions || []
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputText('');
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history cleared. How can I assist you with the campus asset dataset today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: SUGGESTED_QUESTIONS.slice(0, 4)
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-accent-primary text-bg-primary font-bold text-xs shadow-glow-md border border-accent-primary/60 hover:shadow-glow-lg transition-all"
            aria-label="Open Smart AssetCare Assistant"
          >
            <div className="relative">
              <Bot className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-bg-primary animate-ping" />
            </div>
            <span className="font-display tracking-tight font-extrabold hidden sm:inline">
              Smart Assistant
            </span>
          </motion.button>
        )}
      </div>

      {/* Floating Chat Drawer / Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-bg-card border border-industrial-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* 4.1 Assistant Header */}
            <div className="p-4 border-b border-industrial-border bg-bg-secondary flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary shadow-glow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-text-primary flex items-center gap-1.5">
                    Smart AssetCare Assistant
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                    <span>Live Local Context Connected</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-text-muted">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  title="Clear Conversation"
                  aria-label="Clear Conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  title="Minimize Assistant"
                  aria-label="Minimize Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Disclaimer Banner (Section 4.5) */}
            <div className="px-4 py-2 bg-accent-primary/5 border-b border-accent-primary/15 text-[10px] font-mono text-accent-primary/90 flex items-center gap-1.5">
              <Info className="w-3 h-3 shrink-0" />
              <span className="truncate">
                Demo Assistant – Responses are generated from current stored data.
              </span>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      m.sender === 'user'
                        ? 'bg-accent-primary text-bg-primary font-medium rounded-tr-sm shadow-glow-sm'
                        : 'bg-bg-secondary border border-industrial-border text-text-primary rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">
                      {m.text}
                    </div>

                    <span
                      className={`text-[9px] font-mono mt-1.5 block text-right ${
                        m.sender === 'user' ? 'text-bg-primary/70' : 'text-text-muted'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Suggestions Chips inside message if available */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                      {m.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="px-2.5 py-1 rounded-full bg-bg-card border border-accent-primary/30 text-[10px] text-accent-primary hover:bg-accent-primary/10 transition-colors text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions Carousel at bottom if input is empty */}
            {!inputText && (
              <div className="px-3 py-2 border-t border-industrial-border/60 bg-bg-secondary/40 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
                {SUGGESTED_QUESTIONS.slice(0, 5).map((q, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleSendMessage(q)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-bg-card border border-industrial-border text-text-secondary hover:text-text-primary hover:border-accent-primary/40 shrink-0 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-industrial-border bg-bg-secondary flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about assets, repairs, schedules..."
                className="flex-1 bg-bg-card border border-industrial-border rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-all"
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputText.trim()}
                className="p-2 shrink-0 rounded-xl"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
