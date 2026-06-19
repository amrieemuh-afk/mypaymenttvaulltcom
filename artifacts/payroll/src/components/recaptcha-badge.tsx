import { useState } from "react";

export function RecaptchaBadge() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      title="reCAPTCHA"
      style={{
        position: "fixed", bottom: 24, left: 20, zIndex: 1001,
        display: "inline-flex", alignItems: "stretch",
        border: "1px solid #d3d3d3", borderRadius: 4,
        overflow: "hidden", background: "transparent",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: 60, cursor: "pointer",
        transition: "width 0.3s ease",
      }}
    >
      {/* Logo — selalu tampil */}
      <div style={{
        background: "transparent",
        width: 56, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <img
          src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
          alt="reCAPTCHA"
          style={{ width: 32, height: 32 }}
        />
      </div>

      {/* Teks — hanya muncul saat di-klik */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: expanded ? "0 10px" : "0",
        width: expanded ? 100 : 0,
        overflow: "hidden",
        transition: "width 0.3s ease, padding 0.3s ease",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: "#555",
          fontFamily: "'Roboto', sans-serif", letterSpacing: "0.03em",
        }}>
          reCAPTCHA
        </div>
        <div style={{ fontSize: 9, color: "#aaa", fontFamily: "'Roboto', sans-serif", marginTop: 3 }}>
          <span
            style={{ textDecoration: "underline", cursor: "pointer", color: "#999" }}
            onClick={(e) => { e.stopPropagation(); window.open("https://policies.google.com/privacy", "_blank"); }}
          >Privacy</span>
          {" - "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer", color: "#999" }}
            onClick={(e) => { e.stopPropagation(); window.open("https://policies.google.com/terms", "_blank"); }}
          >Terms</span>
        </div>
      </div>
    </div>
  );
}
