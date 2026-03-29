"use client";

import { useState } from "react";
import type { LandingPage } from "@/types";
import type { Theme } from "@/lib/themes";

type QuizSection = { title: string; items: string[] };
type ScoreRange = { min: number; max: number; label: string; description: string };
type QuizContent = {
  intro?: string;
  sections: QuizSection[];
  scoring: ScoreRange[];
  practice?: string[];
  closing?: string;
};

type Props = { page: LandingPage; theme: Theme };

const CHINESE_NUMS = ["一", "二", "三", "四", "五"];

export function QuizView({ page, theme }: Props) {
  const content = page.body_json as QuizContent;

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");

  const score = checked.size;
  const total = content.sections.reduce((acc, s) => acc + s.items.length, 0);

  function getResult(): ScoreRange {
    return (
      content.scoring.find((s) => score >= s.min && score <= s.max) ??
      content.scoring[content.scoring.length - 1]
    );
  }

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }


  const result = getResult();
  const needGoogleFonts =
    theme.headingFont.includes("Noto Serif") || theme.headingFont.includes("Cormorant");

  return (
    <>
      {needGoogleFonts && (
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;900&family=Noto+Sans+TC:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      )}
      <div
        className="min-h-screen relative overflow-x-hidden"
        style={{ background: theme.bgGradient, color: theme.text, fontFamily: theme.font }}
      >
        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute rounded-full" style={{ width: 400, height: 400, top: -100, left: -100, background: `radial-gradient(circle,${theme.glow1},transparent)`, filter: "blur(80px)" }} />
          <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: "10%", right: -80, background: `radial-gradient(circle,${theme.glow2},transparent)`, filter: "blur(80px)" }} />
        </div>

        <div className="relative max-w-xl mx-auto px-5 py-14" style={{ zIndex: 1 }}>
          {/* Author tag */}
          {page.author_tag && (
            <div className="text-center mb-2" style={{ fontSize: 12, color: theme.muted, letterSpacing: "0.08em", fontFamily: theme.headingFont, fontStyle: "italic" }}>
              {page.author_tag}
            </div>
          )}

          {/* Title */}
          <h1
            className="text-center mb-3 leading-snug"
            style={{ fontFamily: theme.headingFont, fontWeight: 900, fontSize: "clamp(22px, 5vw, 32px)", color: theme.text, lineHeight: 1.4 }}
          >
            {page.hero_title ?? page.name}
          </h1>

          {/* Intro */}
          {content.intro && (
            <p className="text-center mb-8" style={{ fontSize: 14, color: theme.muted, lineHeight: 1.8 }}>
              {content.intro}
            </p>
          )}

          {/* ── QUIZ PHASE ── */}
          {phase === "quiz" && (
            <>
              {content.sections.map((section, si) => (
                <div key={si} className="mb-8">
                  <div
                    className="mb-4 pb-2 font-semibold"
                    style={{ fontSize: 13, color: theme.accent, borderBottom: `1px solid ${theme.border}`, letterSpacing: "0.05em" }}
                  >
                    {section.title}
                  </div>
                  <div className="space-y-3">
                    {section.items.map((item, ii) => {
                      const key = `${si}-${ii}`;
                      const isChecked = checked.has(key);
                      return (
                        <label
                          key={ii}
                          className="flex items-start gap-3 cursor-pointer group"
                          onClick={() => toggle(key)}
                        >
                          <span
                            className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all"
                            style={{
                              borderColor: isChecked ? theme.accent : theme.border,
                              background: isChecked ? theme.accent : "transparent",
                            }}
                          >
                            {isChecked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span
                            className="text-sm leading-relaxed transition-colors"
                            style={{ color: isChecked ? theme.text : theme.muted }}
                          >
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Score counter + CTA */}
              <div
                className="sticky bottom-6 rounded-2xl p-5 text-center mt-4"
                style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
              >
                <p style={{ fontSize: 13, color: theme.muted, marginBottom: 4 }}>
                  已勾選 <span style={{ fontWeight: 700, color: theme.accent, fontSize: 18 }}>{score}</span> / {total} 題
                </p>
                <button
                  onClick={() => setPhase("result")}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: theme.btnGradient, boxShadow: theme.btnShadow, fontSize: 15 }}
                >
                  查看我的結果 →
                </button>
              </div>
            </>
          )}

          {/* ── RESULT PHASE ── */}
          {phase === "result" && (
            <div className="space-y-6">
              {/* Score result */}
              <div
                className="rounded-2xl p-7 text-center"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", border: `1px solid ${theme.border}` }}
              >
                <div style={{ fontSize: 13, color: theme.muted, marginBottom: 8 }}>你的分數</div>
                <div style={{ fontFamily: theme.headingFont, fontWeight: 900, fontSize: 48, color: theme.accent, lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>/ {total} 題</div>
                <div style={{ fontFamily: theme.headingFont, fontWeight: 700, fontSize: 18, color: theme.text, marginBottom: 8 }}>
                  {result.label}
                </div>
                <p style={{ fontSize: 14, color: theme.muted, lineHeight: 1.8 }}>
                  {result.description}
                </p>
              </div>

              {/* Practice */}
              {content.practice && content.practice.length > 0 && (
                <div
                  className="rounded-2xl p-6"
                  style={{ background: "rgba(255,255,255,0.5)", border: `1px solid ${theme.border}` }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: theme.accent, marginBottom: 14, letterSpacing: "0.05em" }}>
                    今天的小練習
                  </div>
                  <div className="space-y-3">
                    {content.practice.map((p, i) => (
                      <div key={i} className="flex gap-3 items-start" style={{ fontSize: 14, color: theme.text, lineHeight: 1.7 }}>
                        <span style={{ flexShrink: 0, fontWeight: 700, color: theme.accent }}>第{CHINESE_NUMS[i]}件：</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Closing */}
              {content.closing && (
                <p className="text-center" style={{ fontSize: 13, color: theme.muted, lineHeight: 1.9, fontStyle: "italic" }}>
                  {content.closing}
                  {page.author_tag && (
                    <><br /><span style={{ fontFamily: theme.headingFont }}>— {page.author_tag.split("・")[0]}</span></>
                  )}
                </p>
              )}

              <button
                onClick={() => setPhase("quiz")}
                className="w-full text-center"
                style={{ fontSize: 12, color: theme.muted, opacity: 0.6 }}
              >
                ← 回去修改答案
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
