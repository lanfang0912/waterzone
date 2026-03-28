import type { PageTheme } from "@/types";

export type Theme = {
  label: string;
  swatch: string;
  bg: string;
  bgGradient: string;
  glow1: string;
  glow2: string;
  text: string;
  muted: string;
  accent: string;
  accentMid: string;
  border: string;
  btnGradient: string;
  btnShadow: string;
  tagColor: string;
  tagBorder: string;
  font: string;
  headingFont: string;
};

export const THEMES: Record<PageTheme, Theme> = {
  rose: {
    label: "玫瑰",
    swatch: "#c9856e",
    bg: "#fdf8f3",
    bgGradient: "linear-gradient(160deg,#fdf8f3 0%,#faeee6 50%,#fdf4ef 100%)",
    glow1: "rgba(201,133,110,.18)",
    glow2: "rgba(201,133,110,.12)",
    text: "#3d2b1f",
    muted: "#9a8070",
    accent: "#c9856e",
    accentMid: "#b07060",
    border: "rgba(176,112,96,.15)",
    btnGradient: "linear-gradient(135deg,#b07060,#c9856e)",
    btnShadow: "rgba(176,112,96,.3)",
    tagColor: "#a07850",
    tagBorder: "rgba(201,169,110,.35)",
    font: "'Noto Sans TC', sans-serif",
    headingFont: "'Noto Serif TC', serif",
  },
  terracotta: {
    label: "赭土",
    swatch: "#B85C38",
    bg: "#FBF7F2",
    bgGradient: "linear-gradient(160deg,#FBF7F2 0%,#F4EDE0 60%,#FBF7F2 100%)",
    glow1: "rgba(184,92,56,.12)",
    glow2: "rgba(184,92,56,.08)",
    text: "#2A1A0A",
    muted: "#9C7A55",
    accent: "#B85C38",
    accentMid: "#9a4a28",
    border: "rgba(226,212,192,.6)",
    btnGradient: "linear-gradient(135deg,#2A1A0A,#B85C38)",
    btnShadow: "rgba(184,92,56,.25)",
    tagColor: "#B8873A",
    tagBorder: "rgba(184,135,58,.35)",
    font: "'Noto Serif TC', serif",
    headingFont: "'Cormorant Garamond', serif",
  },
  teal: {
    label: "靛青",
    swatch: "#12c4b0",
    bg: "#0a1628",
    bgGradient: "linear-gradient(160deg,#0a1628 0%,#0d1f38 50%,#0a1628 100%)",
    glow1: "rgba(18,196,176,.15)",
    glow2: "rgba(18,196,176,.08)",
    text: "#e8f4f2",
    muted: "#7ab8b0",
    accent: "#12c4b0",
    accentMid: "#0ea898",
    border: "rgba(18,196,176,.15)",
    btnGradient: "linear-gradient(135deg,#0ea898,#12c4b0)",
    btnShadow: "rgba(18,196,176,.35)",
    tagColor: "#12c4b0",
    tagBorder: "rgba(18,196,176,.3)",
    font: "'Noto Sans TC', sans-serif",
    headingFont: "'Noto Serif TC', serif",
  },
  sage: {
    label: "鼠尾草",
    swatch: "#7a9e7e",
    bg: "#f5f8f4",
    bgGradient: "linear-gradient(160deg,#f5f8f4 0%,#eaf0e8 50%,#f5f8f4 100%)",
    glow1: "rgba(122,158,126,.18)",
    glow2: "rgba(122,158,126,.10)",
    text: "#2a3a2c",
    muted: "#7a9e7e",
    accent: "#7a9e7e",
    accentMid: "#5d8462",
    border: "rgba(122,158,126,.2)",
    btnGradient: "linear-gradient(135deg,#5d8462,#7a9e7e)",
    btnShadow: "rgba(122,158,126,.3)",
    tagColor: "#5d8462",
    tagBorder: "rgba(122,158,126,.35)",
    font: "'Noto Sans TC', sans-serif",
    headingFont: "'Noto Serif TC', serif",
  },
  ink: {
    label: "墨黑",
    swatch: "#1a1a2e",
    bg: "#f8f8f6",
    bgGradient: "linear-gradient(160deg,#f8f8f6 0%,#f0f0ec 50%,#f8f8f6 100%)",
    glow1: "rgba(26,26,46,.08)",
    glow2: "rgba(26,26,46,.05)",
    text: "#1a1a2e",
    muted: "#6b6b80",
    accent: "#1a1a2e",
    accentMid: "#2d2d4a",
    border: "rgba(26,26,46,.12)",
    btnGradient: "linear-gradient(135deg,#1a1a2e,#2d2d4a)",
    btnShadow: "rgba(26,26,46,.25)",
    tagColor: "#6b6b80",
    tagBorder: "rgba(26,26,46,.2)",
    font: "'Noto Sans TC', sans-serif",
    headingFont: "'Noto Serif TC', serif",
  },
};

export function getTheme(theme?: string | null): Theme {
  return THEMES[(theme as PageTheme) ?? "rose"] ?? THEMES.rose;
}
