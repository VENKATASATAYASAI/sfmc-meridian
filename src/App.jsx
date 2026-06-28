import React, { useState, useRef, useEffect } from "react";
import { Send, Cpu, Code2, Copy, Check, Sparkles, Database, Mail, Layers, Zap } from "lucide-react";

// ============================================================================
//  ARGUS — Autonomous SFMC Architect & AMPscript Specialist
//  An AI conversational agent with deep Marketing Cloud domain expertise.
// ============================================================================

const SYSTEM_PROMPT = `You are ARGUS, an elite, autonomous Salesforce Marketing Cloud (SFMC) Solution Architect and Email Specialist with 10+ years of hands-on platform mastery. You think like a senior architect: you read the situation, infer intent, and proactively recommend the most maintainable, scalable, and deliverability-safe approach.

DOMAIN EXPERTISE:
- AMPscript (server-side personalization, dynamic content, lookups, data manipulation, content blocks)
- SSJS (Server-Side JavaScript) when AMPscript is insufficient (WSProxy, Platform.Function, complex loops)
- GTL (Guide Template Language) for content blocks
- SQL Query Activities, Data Extensions (sendable, shared, filtered), Data Views (_Open, _Click, _Sent, _Bounce, _Subscribers)
- Journey Builder, Automation Studio, Email Studio, Content Builder, Mobile Connect, CloudPages
- Contact model, Subscriber keys, Sender Authentication Package (SAP), deliverability, throttling, send classifications
- REST & SOAP APIs, packages, Einstein, Distributed Marketing

BEHAVIOR:
- Be decisive and architectural. State the recommended approach, then explain WHY.
- When writing AMPscript, write production-grade, defensive code: always handle empty/null values, use AttributeValue() with fallbacks, wrap lookups, and comment complex logic.
- Default to best practices: avoid Lookup() in loops, prefer LookupRows()/LookupOrderedRows(), use SET over inline, escape user data.
- When personalization is requested, build complete, drop-in-ready blocks with sample DE schemas.
- For dynamic content, show conditional logic, fallbacks, and the "if no data" path.
- Flag deliverability, performance, or governance risks unprompted.
- Use clear markdown. Put all code in fenced \`\`\`ampscript, \`\`\`sql, or \`\`\`javascript blocks.
- Be concise but complete. No filler. Architect-to-architect tone.`;

const QUICK_PROMPTS = [
  { icon: Mail, label: "First-name personalization with fallback", text: "Write defensive AMPscript for a greeting that personalizes by first name with a clean fallback to 'there', handling null and empty values." },
  { icon: Layers, label: "Dynamic product recommendation block", text: "Build a dynamic content block that pulls a subscriber's top 3 recommended products from a Data Extension and renders an HTML grid, with a fallback for subscribers with no recommendations." },
  { icon: Database, label: "LookupOrderedRows pattern", text: "Show me the correct LookupOrderedRows pattern to get a subscriber's last 5 orders sorted by date desc, looping safely with empty handling." },
  { icon: Zap, label: "Abandoned cart dynamic email", text: "Architect an abandoned cart email: the DE schema, the AMPscript to render line items in a loop, price formatting, and the journey entry logic." },
];

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div style={{ margin: "14px 0", borderRadius: 10, overflow: "hidden", border: "1px solid #1f2a3a", background: "#0b1220" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 14px", background: "#0e1726", borderBottom: "1px solid #1f2a3a" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#48d1a0" }}>{language || "code"}</span>
        <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: copied ? "#48d1a0" : "#6b7a90", cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "copied" : "copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", overflowX: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.65, color: "#cdd9e8" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderContent(text) {
  // Split into code fences and prose
  const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g);
  const out = [];
  for (let i = 0; i < parts.length; i += 3) {
    const prose = parts[i];
    if (prose && prose.trim()) {
      out.push(
        <div key={`p${i}`} style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
          {prose.split(/(\*\*[^*]+\*\*)|(`[^`]+`)/g).filter(Boolean).map((seg, j) => {
            if (/^\*\*[^*]+\*\*$/.test(seg)) return <strong key={j} style={{ color: "#e8eef7" }}>{seg.slice(2, -2)}</strong>;
            if (/^`[^`]+`$/.test(seg)) return <code key={j} style={{ background: "#16202e", padding: "1px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "#48d1a0" }}>{seg.slice(1, -1)}</code>;
            return <span key={j}>{seg}</span>;
          })}
        </div>
      );
    }
    const lang = parts[i + 1];
    const code = parts[i + 2];
    if (code !== undefined) out.push(<CodeBlock key={`c${i}`} language={lang} code={code.replace(/\n$/, "")} />);
  }
  return out;
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (override) => {
    const content = (override ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.filter((b) => b.type === "text").map((b) => b.text).join("\n") || "No response.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "**Connection error.** Could not reach the model. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at top, #0d1726 0%, #060a12 60%)", color: "#cdd9e8" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ padding: "16px 26px", borderBottom: "1px solid #15202f", display: "flex", alignItems: "center", gap: 14, background: "rgba(8,13,22,0.6)", backdropFilter: "blur(8px)" }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#48d1a0,#1a8f6a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(72,209,160,0.35)" }}>
          <Cpu size={22} color="#04130d" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: 0.3, color: "#eef4fb" }}>ARGUS</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#5d7088", letterSpacing: 0.4 }}>Autonomous SFMC Architect · AMPscript & Dynamic Content Specialist</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#48d1a0", fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#48d1a0", boxShadow: "0 0 8px #48d1a0" }} /> ONLINE
        </div>
      </header>

      {/* Conversation */}
      <main ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "28px 0" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <Sparkles size={30} color="#48d1a0" style={{ marginBottom: 14 }} />
              <h2 style={{ fontSize: 24, fontWeight: 600, color: "#eef4fb", margin: "0 0 8px" }}>Marketing Cloud, architected.</h2>
              <p style={{ color: "#5d7088", maxWidth: 520, margin: "0 auto 30px", lineHeight: 1.6, fontSize: 14.5 }}>
                Ask for AMPscript personalization, dynamic content blocks, Data Extension design, Journey logic, or full email architecture. I write production-grade, defensive code.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
                {QUICK_PROMPTS.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <button key={i} onClick={() => send(q.text)} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "15px 16px", borderRadius: 12, border: "1px solid #1a2738", background: "rgba(16,24,38,0.55)", color: "#bcc9da", cursor: "pointer", textAlign: "left", transition: "all .2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2b6f57"; e.currentTarget.style.background = "rgba(20,32,50,0.7)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a2738"; e.currentTarget.style.background = "rgba(16,24,38,0.55)"; }}>
                      <Icon size={17} color="#48d1a0" style={{ marginTop: 1, flexShrink: 0 }} />
                      <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 24, display: "flex", gap: 13, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: m.role === "user" ? "#1c2c42" : "linear-gradient(135deg,#48d1a0,#1a8f6a)" }}>
                {m.role === "user" ? <span style={{ fontSize: 13, fontWeight: 600, color: "#9db4d0" }}>You</span> : <Code2 size={17} color="#04130d" />}
              </div>
              <div style={{ maxWidth: m.role === "user" ? "78%" : "100%", padding: m.role === "user" ? "11px 16px" : "2px 2px", borderRadius: 13, background: m.role === "user" ? "#16243a" : "transparent", fontSize: 14.5, color: m.role === "user" ? "#dce6f3" : "#bcc9da" }}>
                {m.role === "user" ? <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span> : renderContent(m.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 13, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#48d1a0,#1a8f6a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Code2 size={17} color="#04130d" />
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 4px" }}>
                {[0, 1, 2].map((d) => (
                  <span key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "#48d1a0", animation: `pulse 1.2s ${d * 0.18}s infinite ease-in-out` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer style={{ padding: "16px 24px 22px", borderTop: "1px solid #15202f", background: "rgba(8,13,22,0.6)", backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: 11, alignItems: "flex-end", background: "#101a29", border: "1px solid #1f2c40", borderRadius: 14, padding: "8px 8px 8px 16px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Describe the personalization, dynamic content, or architecture you need…"
            rows={1}
            style={{ flex: 1, resize: "none", background: "none", border: "none", outline: "none", color: "#dce6f3", fontFamily: "'Outfit', sans-serif", fontSize: 14.5, lineHeight: 1.5, maxHeight: 140, padding: "7px 0" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 40, height: 40, borderRadius: 10, border: "none", flexShrink: 0, cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "linear-gradient(135deg,#48d1a0,#1a8f6a)" : "#1c2738", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
            <Send size={17} color={input.trim() && !loading ? "#04130d" : "#4a5a70"} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#3f4f64", margin: "10px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>ARGUS reasons over SFMC best practices · verify code against your org's data model before deploy</p>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.1)} }
        ::-webkit-scrollbar{width:9px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#1f2c40;border-radius:5px}
      `}</style>
    </div>
  );
}
