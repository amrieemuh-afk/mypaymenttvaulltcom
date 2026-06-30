import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle } from "lucide-react";

interface Message {
  id: number;
  from: "user" | "support";
  text: string;
  time: string;
}

const AUTO_REPLIES = [
  "Thank you for reaching out! A support agent will be with you shortly.",
  "I understand your concern. Let me look into that for you.",
  "Can you please provide more details so we can assist you better?",
  "We're here to help! Please hold on for a moment.",
  "Your request has been noted. Our team will follow up with you soon.",
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function notifyTelegram(userMessage: string, page: string) {
  try {
    await fetch("/api/support/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, page }),
    });
  } catch { /* best-effort */ }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: "support",
      text: "👋 Hi! Welcome to MyPaymentVault Support. How can we help you today?",
      time: now(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [replyIndex, setReplyIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), from: "user", text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const page = window.location.pathname || "/";
    void notifyTelegram(text, page);

    setTimeout(() => {
      const reply = AUTO_REPLIES[replyIndex % AUTO_REPLIES.length];
      setReplyIndex((i) => i + 1);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "support", text: reply, time: now() },
      ]);
      setTyping(false);
    }, 1200);
  };

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 20, zIndex: 1000,
          width: 320, borderRadius: 12,
          boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", background: "#fff",
          border: "1px solid #e5e5e5",
          maxHeight: 460,
        }}>
          <div style={{
            background: "#1a7a3c", padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>MyPaymentVault</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7fffb0", display: "inline-block" }} />
                  Live Support
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#fff" }}
            >
              <X size={18} color="rgba(255,255,255,0.9)" />
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 14px 10px",
            display: "flex", flexDirection: "column", gap: 10,
            background: "#f9f9f9", minHeight: 260, maxHeight: 300,
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex",
                flexDirection: msg.from === "user" ? "row-reverse" : "row",
                alignItems: "flex-end", gap: 8,
              }}>
                {msg.from === "support" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", background: "#1a7a3c",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <MessageCircle size={13} color="#fff" />
                  </div>
                )}
                <div style={{ maxWidth: "75%" }}>
                  <div style={{
                    background: msg.from === "user" ? "#1a7a3c" : "#fff",
                    color: msg.from === "user" ? "#fff" : "#222",
                    borderRadius: msg.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    padding: "9px 13px", fontSize: 12.5, lineHeight: 1.5,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    border: msg.from === "support" ? "1px solid #ebebeb" : "none",
                  }}>
                    {msg.text}
                  </div>
                  <div style={{
                    fontSize: 10, color: "#bbb", marginTop: 3,
                    textAlign: msg.from === "user" ? "right" : "left",
                  }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "#1a7a3c",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <MessageCircle size={13} color="#fff" />
                </div>
                <div style={{
                  background: "#fff", border: "1px solid #ebebeb",
                  borderRadius: "16px 16px 16px 4px", padding: "10px 14px",
                  display: "flex", gap: 4, alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#bbb",
                      display: "inline-block",
                      animation: `bounce 1.2s infinite ${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{
            padding: "10px 12px", borderTop: "1px solid #ebebeb",
            display: "flex", gap: 8, alignItems: "center", background: "#fff",
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Type your message..."
              style={{
                flex: 1, height: 36, padding: "0 12px", fontSize: 13,
                border: "1px solid #ddd", borderRadius: 20, outline: "none",
                background: "#f7f7f7", color: "#111",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: input.trim() ? "#1a7a3c" : "#ddd",
                border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}

      <div
        onClick={() => setOpen((v) => !v)}
        style={{ position: "fixed", bottom: 24, right: 20, zIndex: 1001, cursor: "pointer" }}
      >
        <img
          src="/chat-support.jpg"
          alt="Live Chat"
          style={{
            width: 56, height: 56, borderRadius: "50%",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            transition: "transform 0.2s",
          }}
        />
        {!open && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 16, height: 16, borderRadius: "50%",
            background: "#e53e3e", border: "2px solid #fff",
          }} />
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
