import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Cpu, Code2, Copy, Check, Sparkles, Database, Mail, Layers, Zap, 
  Plus, Trash2, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, 
  Layers as LayersIcon, List, Eye, Settings, FileCode, CheckSquare
} from "lucide-react";

// ============================================================================
//  ARGUS — Autonomous SFMC Architect & AMPscript Specialist
//  An AI conversational agent with deep Marketing Cloud domain expertise.
// ============================================================================

const SYSTEM_PROMPT = `You are ARGUS, an elite, autonomous Salesforce Marketing Cloud (SFMC) Solution Architect and Email Specialist with 10+ years of platform mastery. You think like a senior architect: you read the situation, infer intent, and recommend the most maintainable, scalable, and deliverability-safe approach.

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

function highlightKeywords(code, lang) {
  if (!lang) return code;
  const lowerLang = lang.toLowerCase();
  
  let keywords = [];
  if (lowerLang === 'sql') {
    keywords = ['select', 'from', 'where', 'join', 'on', 'and', 'or', 'as', 'insert', 'into', 'values', 'update', 'set', 'delete', 'group', 'by', 'order', 'having', 'inner', 'left', 'right', 'outer', 'union', 'all', 'not', 'null', 'in', 'like', 'top', 'distinct'];
  } else if (lowerLang === 'ampscript' || lowerLang === 'amp') {
    keywords = ['set', 'var', 'if', 'then', 'else', 'elseif', 'endif', 'for', 'to', 'next', 'do', 'lookuprows', 'lookuporderedrows', 'attributevalue', 'v', 'redirectto', 'concat', 'empty', 'not', 'lookup', 'claimrow', 'insertde', 'updatede', 'upsertde', 'row', 'field', 'rowcount'];
  } else if (lowerLang === 'javascript' || lowerLang === 'js' || lowerLang === 'ssjs') {
    keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'try', 'catch', 'new', 'await', 'async', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'class', 'import', 'export', 'from', 'default', 'null', 'undefined', 'true', 'false'];
  }
  
  if (keywords.length === 0) return code;
  
  const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  const parts = code.split(pattern);
  if (parts.length === 1) return code;
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      const lowerPart = part.toLowerCase();
      const isAmpFunc = lowerLang === 'ampscript' && (lowerPart.includes('lookup') || lowerPart.includes('attribute') || lowerPart.includes('concat') || lowerPart.includes('row') || lowerPart.includes('field'));
      let color = '#c084fc'; // default keyword color (purple)
      
      if (isAmpFunc) color = '#2dd4bf'; // custom AMPscript functions (teal)
      else if (lowerLang === 'sql') color = '#fb7185'; // SQL keywords (rose)
      else if (lowerLang === 'ampscript') color = '#fb923c'; // AMPscript keywords (orange)
      else if (lowerLang === 'javascript' || lowerLang === 'js') color = '#60a5fa'; // JS keywords (blue)
      
      return <span key={index} style={{ color, fontWeight: '600' }}>{part}</span>;
    }
    return part;
  });
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const lines = code.split('\n');

  return (
    <div style={{ margin: "16px 0", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,13,24,0.85)", backdropFilter: "blur(10px)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "rgba(16,25,41,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#eab308" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#2dd4bf", marginLeft: 8 }}>{language || "code"}</span>
        </div>
        <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: copied ? "#2dd4bf" : "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "var(--sans)", transition: "color 0.2s" }}
          onMouseEnter={(e) => { if(!copied) e.currentTarget.style.color = "#94a3b8"; }}
          onMouseLeave={(e) => { if(!copied) e.currentTarget.style.color = "#64748b"; }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy Code"}
        </button>
      </div>
      <div style={{ display: "flex", overflowX: "auto" }}>
        {/* Line Numbers */}
        <div style={{ padding: "16px 10px 16px 14px", textRendering: "optimizeLegibility", userSelect: "none", textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.04)", color: "#334155", fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.7, background: "rgba(8,13,24,0.3)" }}>
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        {/* Code Content */}
        <pre style={{ margin: 0, padding: "16px 18px", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.7, color: "#cbd5e1", flex: 1, whiteSpace: "pre", overflowX: "auto" }}>
          <code>{highlightKeywords(code, language)}</code>
        </pre>
      </div>
    </div>
  );
}

function renderContent(text) {
  const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g);
  const out = [];
  for (let i = 0; i < parts.length; i += 3) {
    const prose = parts[i];
    if (prose && prose.trim()) {
      out.push(
        <div key={`p${i}`} style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: "14.5px" }}>
          {prose.split(/(\*\*[^*]+\*\*)|(`[^`]+`)/g).filter(Boolean).map((seg, j) => {
            if (/^\*\*[^*]+\*\*$/.test(seg)) return <strong key={j} style={{ color: "#f8fafc", fontWeight: "600" }}>{seg.slice(2, -2)}</strong>;
            if (/^`[^`]+`$/.test(seg)) return <code key={j} style={{ background: "rgba(22,38,62,0.6)", padding: "2px 6px", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 12.5, color: "#2dd4bf", border: "1px solid rgba(255,255,255,0.04)" }}>{seg.slice(1, -1)}</code>;
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
  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("sessions"); // sessions, de-builder

  // Session History Management
  const [sessions, setSessions] = useState(() => {
    const localData = localStorage.getItem("argus_sessions");
    return localData ? JSON.parse(localData) : [
      { id: "default", title: "Greeting Architect", messages: [] }
    ];
  });
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return sessions[0]?.id || "default";
  });

  // Active messages based on current session
  const activeSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // DE Builder State
  const [deName, setDeName] = useState("SubscriberPreferences");
  const [deFields, setDeFields] = useState([
    { name: "SubscriberKey", type: "Text", length: "254", nullable: false, pk: true },
    { name: "EmailAddress", type: "EmailAddress", length: "254", nullable: false, pk: false },
    { name: "FirstName", type: "Text", length: "100", nullable: true, pk: false },
    { name: "OptInStatus", type: "Boolean", length: "", nullable: true, pk: false },
    { name: "LastModified", type: "Date", length: "", nullable: true, pk: false },
  ]);
  const [deTab, setDeTab] = useState("ampscript"); // ampscript, sql, ssjs

  useEffect(() => {
    localStorage.setItem("argus_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const startNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Architect Request ${sessions.length + 1}`,
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      // Clear messages of the only session
      setSessions([{ id: "default", title: "Greeting Architect", messages: [] }]);
      setCurrentSessionId("default");
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0].id);
    }
  };

  const updateSessionMessages = (newMessages) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        // Automatically determine title from the first query if it's currently default
        let newTitle = s.title;
        if (s.messages.length === 0 && newMessages.length > 0) {
          const userQuery = newMessages[0].content;
          newTitle = userQuery.length > 25 ? userQuery.slice(0, 25) + "..." : userQuery;
        }
        return { ...s, title: newTitle, messages: newMessages };
      }
      return s;
    }));
  };

  const send = async (override) => {
    const content = (override ?? input).trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: "user", content }];
    updateSessionMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.filter((b) => b.type === "text").map((b) => b.text).join("\n") || "No response.";
      updateSessionMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      updateSessionMessages([...nextMessages, { role: "assistant", content: "**Connection error.** Could not connect to API. Please make sure your endpoint or API token proxy is configured." }]);
    } finally {
      setLoading(false);
    }
  };

  // Data Extension Field Operations
  const addDeField = () => {
    setDeFields(prev => [...prev, { name: `Field_${prev.length + 1}`, type: "Text", length: "100", nullable: true, pk: false }]);
  };

  const removeDeField = (index) => {
    setDeFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateDeField = (index, property, value) => {
    setDeFields(prev => prev.map((f, i) => {
      if (i === index) {
        return { ...f, [property]: value };
      }
      return f;
    }));
  };

  // Code Generation Snippets
  const getAmpscriptSnippet = () => {
    const pkField = deFields.find(f => f.pk) || deFields[0];
    const otherFields = deFields.filter(f => f !== pkField);
    
    let code = `%%[\n`;
    code += `/* ==========================================\n`;
    code += `   Defensive Lookup block for "${deName}"\n`;
    code += `   ========================================== */\n`;
    code += `VAR @lookupKey, @rows, @rowCount, @row\n`;
    code += `SET @lookupKey = AttributeValue("${pkField.name}")\n\n`;
    code += `IF NOT Empty(@lookupKey) THEN\n`;
    code += `  /* Retrieve the rowset */\n`;
    code += `  SET @rows = LookupRows("${deName}", "${pkField.name}", @lookupKey)\n`;
    code += `  SET @rowCount = RowCount(@rows)\n\n`;
    code += `  IF @rowCount > 0 THEN\n`;
    code += `    SET @row = Row(@rows, 1)\n`;
    otherFields.forEach(f => {
      code += `    VAR @${f.name}\n`;
      code += `    SET @${f.name} = Field(@row, "${f.name}")\n`;
    });
    code += `  ELSE\n`;
    code += `    /* Fallback values for empty results */\n`;
    otherFields.forEach(f => {
      code += `    SET @${f.name} = ""\n`;
    });
    code += `  ENDIF\n`;
    code += `ELSE\n`;
    code += `  /* Fallback values for missing keys */\n`;
    otherFields.forEach(f => {
      code += `  SET @${f.name} = ""\n`;
    });
    code += `ENDIF\n`;
    code += `]%%`;
    return code;
  };

  const getSqlSnippet = () => {
    const fieldsStr = deFields.map(f => `  [${f.name}]`).join(",\n");
    const pkField = deFields.find(f => f.pk) || deFields[0];
    return `SELECT\n${fieldsStr}\nFROM\n  [${deName}]\nWHERE\n  [${pkField.name}] IS NOT NULL\n  /* Add segmentation parameters here */`;
  };

  const getSsjsSnippet = () => {
    const fieldsArr = deFields.map(f => `"${f.name}"`).join(", ");
    const pkField = deFields.find(f => f.pk) || deFields[0];
    return `<script runat="server">\nPlatform.Load("Core", "1");\ntry {\n  var deName = "${deName}";\n  var retrieveFields = [${fieldsArr}];\n  \n  /* Initialize WSProxy */\n  var api = new Script.Util.WSProxy();\n  \n  var filter = {\n    Property: "${pkField.name}",\n    SimpleOperator: "isNotNull",\n    Value: ""\n  };\n  \n  var result = api.retrieve("DataExtensionObject[" + deName + "]", retrieveFields, filter);\n  Write(Platform.Function.Stringify(result));\n} catch(e) {\n  Write("Error retrieving DE: " + e);\n}\n</script>`;
  };

  const getActiveSnippet = () => {
    if (deTab === "ampscript") return getAmpscriptSnippet();
    if (deTab === "sql") return getSqlSnippet();
    return getSsjsSnippet();
  };

  const insertSnippetToInput = () => {
    const snippet = getActiveSnippet();
    setInput(prev => prev + (prev ? "\n\n" : "") + `I am working with this schema/code block:\n\`\`\`${deTab === "ampscript" ? "ampscript" : deTab === "sql" ? "sql" : "javascript"}\n${snippet}\n\`\`\`\n`);
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden", background: "radial-gradient(circle at 50% 0%, #0e1b30 0%, #05080e 100%)" }}>
      {/* Sidebar Panel */}
      <div style={{ 
        width: sidebarOpen ? "320px" : "0px", 
        borderRight: "1px solid rgba(255,255,255,0.06)", 
        background: "rgba(8,12,23,0.75)", 
        backdropFilter: "blur(16px)", 
        display: "flex", 
        flexDirection: "column", 
        transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
        flexShrink: 0
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Cpu size={18} color="#2dd4bf" />
            <span style={{ fontWeight: "700", fontSize: "14px", letterSpacing: "1px", textTransform: "uppercase", color: "#f8fafc" }}>ARGUS Suite</span>
          </div>
          <button onClick={startNewChat} style={{ border: "1px solid rgba(45,212,191,0.2)", background: "rgba(45,212,191,0.08)", color: "#2dd4bf", borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(45,212,191,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(45,212,191,0.08)"; }}>
            <Plus size={13} /> New Chat
          </button>
        </div>

        {/* Tabs selector */}
        <div style={{ display: "flex", padding: "8px 12px", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <button onClick={() => setActiveTab("sessions")} style={{ flex: 1, padding: "8px 4px", fontSize: "12px", fontWeight: "600", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s", background: activeTab === "sessions" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "sessions" ? "#f8fafc" : "#64748b" }}>
            <List size={14} /> Conversations
          </button>
          <button onClick={() => setActiveTab("de-builder")} style={{ flex: 1, padding: "8px 4px", fontSize: "12px", fontWeight: "600", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s", background: activeTab === "de-builder" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "de-builder" ? "#f8fafc" : "#64748b" }}>
            <Database size={14} /> DE Builder
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {activeTab === "sessions" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.map((s) => {
                const isActive = s.id === currentSessionId;
                return (
                  <div key={s.id} onClick={() => setCurrentSessionId(s.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 10, cursor: "pointer", border: isActive ? "1px solid rgba(45,212,191,0.25)" : "1px solid transparent", background: isActive ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.02)", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", flex: 1 }}>
                      <FileCode size={15} color={isActive ? "#2dd4bf" : "#64748b"} />
                      <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? "#f8fafc" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                    </div>
                    <button onClick={(e) => deleteSession(s.id, e)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#f43f5e"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            // DE Builder Tab Content
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "600", marginBottom: 6 }}>Data Extension Name</label>
                <input value={deName} onChange={(e) => setDeName(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#f8fafc", fontSize: "13px" }} />
              </div>

              {/* Fields List */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "600" }}>Schema Fields ({deFields.length})</span>
                  <button onClick={addDeField} style={{ border: "none", background: "none", color: "#2dd4bf", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={13} /> Add
                  </button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                  {deFields.map((f, i) => (
                    <div key={i} style={{ padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input value={f.name} onChange={(e) => updateDeField(i, "name", e.target.value)} placeholder="Field Name" style={{ flex: 1, padding: "5px 8px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6, color: "#cbd5e1", fontSize: "12px" }} />
                        <button onClick={() => removeDeField(i)} style={{ border: "none", background: "none", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#f43f5e"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <select value={f.type} onChange={(e) => updateDeField(i, "type", e.target.value)} style={{ flex: 1, padding: "4px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6, color: "#94a3b8", fontSize: "11px" }}>
                          <option value="Text">Text</option>
                          <option value="Number">Number</option>
                          <option value="Date">Date</option>
                          <option value="Boolean">Boolean</option>
                          <option value="EmailAddress">EmailAddress</option>
                          <option value="Phone">Phone</option>
                        </select>
                        {["Text", "Phone"].includes(f.type) && (
                          <input value={f.length} onChange={(e) => updateDeField(i, "length", e.target.value)} placeholder="Len" style={{ width: "40px", padding: "4px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6, color: "#cbd5e1", fontSize: "11px", textAlign: "center" }} />
                        )}
                        <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", fontSize: "10px", color: "#64748b" }}>
                          <input type="checkbox" checked={f.pk} onChange={(e) => updateDeField(i, "pk", e.target.checked)} />
                          PK
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Generator Output */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "600", marginBottom: 8 }}>Generated Snippet</span>
                <div style={{ display: "flex", gap: 4, background: "rgba(15,23,42,0.5)", padding: "3px", borderRadius: 8, marginBottom: 8 }}>
                  {["ampscript", "sql", "ssjs"].map(tab => (
                    <button key={tab} onClick={() => setDeTab(tab)} style={{ flex: 1, padding: "5px 0", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", borderRadius: 6, border: "none", cursor: "pointer", transition: "all 0.15s", background: deTab === tab ? "rgba(255,255,255,0.08)" : "transparent", color: deTab === tab ? "#2dd4bf" : "#475569" }}>
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{ position: "relative", background: "rgba(8,13,24,0.6)", borderRadius: 8, padding: "10px", border: "1px solid rgba(255,255,255,0.04)", maxHeight: "120px", overflow: "auto" }}>
                  <pre style={{ margin: 0, fontSize: "11px", fontFamily: "var(--mono)", color: "#94a3b8", whiteSpace: "pre-wrap" }}>
                    {getActiveSnippet()}
                  </pre>
                </div>
                
                <button onClick={insertSnippetToInput} style={{ marginTop: 8, width: "100%", border: "none", background: "linear-gradient(135deg,#2dd4bf,#0f766e)", color: "#041311", fontWeight: "600", borderRadius: 8, padding: "8px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Plus size={13} /> Insert Code to Prompt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8, fontSize: "11px", color: "#475569" }}>
          <span>Repo:</span>
          <a href="https://github.com/VENKATASATAYASAI/sfmc-meridian.git" target="_blank" rel="noopener noreferrer" style={{ color: "#2dd4bf", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
            sfmc-meridian <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
        
        {/* Toggle Panel Button */}
        <button onClick={() => setSidebarOpen(p => !p)} style={{ position: "absolute", left: 16, top: 18, zIndex: 10, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#f8fafc"; e.currentTarget.style.borderColor = "rgba(45,212,191,0.3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Header */}
        <header style={{ padding: "14px 24px 14px 64px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 14, background: "rgba(8,13,22,0.4)", backdropFilter: "blur(12px)", zIndex: 5 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#2dd4bf,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(45,212,191,0.25)" }}>
            <Cpu size={18} color="#041311" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", letterSpacing: "0.2px", color: "#f8fafc" }}>ARGUS</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "10px", color: "#2dd4bf", fontFamily: "var(--mono)", background: "rgba(45,212,191,0.08)", padding: "2px 6px", borderRadius: 6, fontWeight: "600" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2dd4bf" }} className="animate-pulse-neon" /> ARCHITECT ACTIVE
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "#475569", marginTop: 2 }}>Salesforce Marketing Cloud Solution Architect & AMPscript Compiler</p>
          </div>
        </header>

        {/* Conversations Box */}
        <main ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 40, animation: "fadeIn 0.5s ease-out" }}>
                <div style={{ display: "inline-flex", width: 56, height: 56, borderRadius: 16, background: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Sparkles size={24} color="#2dd4bf" />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: "600", color: "#f8fafc", margin: "0 0 8px" }}>Marketing Cloud, architected.</h2>
                <p style={{ color: "#64748b", maxWidth: "480px", margin: "0 auto 32px", lineHeight: 1.6, fontSize: "14px" }}>
                  Request high-grade defensive AMPscript, SSJS workflows, SQL data definitions, or complete personalization schemas.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
                  {QUICK_PROMPTS.map((q, i) => {
                    const Icon = q.icon;
                    return (
                      <button key={i} onClick={() => send(q.text)} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", color: "#94a3b8", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(45,212,191,0.25)"; e.currentTarget.style.background = "rgba(45,212,191,0.03)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.background = "rgba(255,255,255,0.01)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                        <div style={{ background: "rgba(45,212,191,0.06)", padding: 6, borderRadius: 8, display: "flex", alignItems: "center" }}>
                          <Icon size={15} color="#2dd4bf" style={{ flexShrink: 0 }} />
                        </div>
                        <span style={{ fontSize: "13px", lineHeight: 1.4, marginTop: 4 }}>{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 24, display: "flex", gap: 16, flexDirection: m.role === "user" ? "row-reverse" : "row" }} className="animate-slideup">
                <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: m.role === "user" ? "#1e293b" : "linear-gradient(135deg,#2dd4bf,#0d9488)", border: m.role === "user" ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  {m.role === "user" ? <span style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8" }}>U</span> : <Code2 size={15} color="#041311" />}
                </div>
                <div style={{ 
                  maxWidth: m.role === "user" ? "80%" : "100%", 
                  padding: m.role === "user" ? "12px 18px" : "4px 4px", 
                  borderRadius: 14, 
                  background: m.role === "user" ? "rgba(30,41,59,0.5)" : "transparent", 
                  border: m.role === "user" ? "1px solid rgba(255,255,255,0.04)" : "none",
                  color: m.role === "user" ? "#f1f5f9" : "#cbd5e1"
                }}>
                  {m.role === "user" ? <span style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "14px" }}>{m.content}</span> : renderContent(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 16, marginBottom: 24 }} className="animate-slideup">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#2dd4bf,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Code2 size={15} color="#041311" />
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 4px" }}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#2dd4bf", animation: `pulse 1.2s ${d * 0.18}s infinite ease-in-out` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Input Box Footer */}
        <footer style={{ padding: "16px 24px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,13,22,0.4)", backdropFilter: "blur(12px)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 11, alignItems: "flex-end", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "8px 8px 8px 16px", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }} className="animate-pulse-glow">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Describe the dynamic blocks, loops, lookups, or automation scripts you need..."
                rows={1}
                style={{ flex: 1, resize: "none", background: "none", border: "none", outline: "none", color: "#f1f5f9", fontFamily: "var(--sans)", fontSize: "14px", lineHeight: 1.5, maxHeight: 160, padding: "8px 0" }}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0, cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "linear-gradient(135deg,#2dd4bf,#0d9488)" : "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", boxShadow: input.trim() && !loading ? "0 0 12px rgba(45,212,191,0.25)" : "none" }}>
                <Send size={15} color={input.trim() && !loading ? "#041311" : "#475569"} />
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: "11px", color: "#475569", margin: "12px 0 0", fontFamily: "var(--mono)" }}>ARGUS compiles raw AMPscript & SSJS structures • double-check target variables before running</p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.1)} }
      `}</style>
    </div>
  );
}
