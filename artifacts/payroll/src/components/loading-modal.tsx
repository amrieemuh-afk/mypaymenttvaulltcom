export function LoadingModal({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <style>{`
        @keyframes _mpv_lm_spin { to { transform: rotate(360deg); } }
        ._mpv_lm_spinner {
          display: block;
          width: 52px; height: 52px;
          border: 4px solid #e0e0e0;
          border-top-color: #555;
          border-radius: 50%;
          animation: _mpv_lm_spin 0.85s linear infinite;
          margin: 0 auto 20px;
        }
      `}</style>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: "40px 36px 36px",
        width: "88%", maxWidth: 360,
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
      }}>
        <span className="_mpv_lm_spinner" />
        <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>
          Please wait...
        </p>
        <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.55 }}>
          We are verifying your credentials. This may take a moment.
        </p>
      </div>
    </div>
  );
}
