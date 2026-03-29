"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Theme } from "@/lib/themes";

type Props = {
  slug: string;
  btnLabel?: string;
  theme: Theme;
  redirectToCheck?: boolean;
};

type State = "idle" | "loading" | "success" | "error";

export function SubscribeForm({ slug, btnLabel = "立即領取", theme, redirectToCheck }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.82)",
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    backdropFilter: "blur(12px)",
    boxShadow: `0 4px 24px ${theme.btnShadow}`,
    padding: "32px 28px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#fff",
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    padding: "14px 16px",
    color: theme.text,
    fontSize: 15,
    fontFamily: theme.font,
    outline: "none",
    transition: "border-color .2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    color: theme.muted,
    marginBottom: 8,
    letterSpacing: ".5px",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "訂閱失敗");
      if (redirectToCheck) {
        router.push(`/${slug}/check`);
        return;
      }
      setState("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "發生錯誤，請稍後再試");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div id={`subscribe-form-${slug}`} style={{ ...cardStyle, textAlign: "center", padding: "40px 28px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h3 style={{ fontFamily: theme.headingFont, fontSize: 22, fontWeight: 600, color: theme.text, marginBottom: 12 }}>
          謝謝你！
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: theme.muted }}>
          清單已經在路上了<br />
          請去信箱（包括垃圾郵件夾）找找看
        </p>
      </div>
    );
  }

  return (
    <form id={`subscribe-form-${slug}`} onSubmit={handleSubmit} style={cardStyle}>
      <h2 style={{ fontFamily: theme.headingFont, fontSize: 20, fontWeight: 600, textAlign: "center", color: theme.text, marginBottom: 8 }}>
        免費領取清單
      </h2>
      <p style={{ fontSize: 13, textAlign: "center", color: theme.muted, marginBottom: 28, lineHeight: 1.7 }}>
        填入資料，清單會寄到你的信箱
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>你的名字</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="請輸入名字" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = theme.accent)}
          onBlur={(e) => (e.target.style.borderColor = theme.border)} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Email 信箱</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="請輸入有效的 Email" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = theme.accent)}
          onBlur={(e) => (e.target.style.borderColor = theme.border)} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>電話 <span style={{ color: theme.muted, fontWeight: 300, opacity: 0.6 }}>（選填）</span></label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx-xxx-xxx" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = theme.accent)}
          onBlur={(e) => (e.target.style.borderColor = theme.border)} />
      </div>

      {state === "error" && (
        <p style={{ fontSize: 12, color: "#c0503a", marginBottom: 12 }}>{errorMsg}</p>
      )}

      <button type="submit" disabled={state === "loading"}
        style={{
          width: "100%", background: state === "loading" ? theme.muted : theme.btnGradient,
          border: "none", borderRadius: 12, padding: 16, color: "#fff", fontSize: 16, fontWeight: 500,
          fontFamily: theme.font, cursor: state === "loading" ? "not-allowed" : "pointer",
          letterSpacing: "0.05em", boxShadow: `0 8px 32px ${theme.btnShadow}`, transition: "transform .2s",
        }}>
        {state === "loading" ? "送出中⋯" : btnLabel}
      </button>
    </form>
  );
}
