"use client";

import type { Theme } from "@/lib/themes";

type Props = {
  title: string;
  subtitle?: string;
  btn?: string;
  slug: string;
  theme: Theme;
};

export function HeroSection({ title, subtitle, btn, slug, theme }: Props) {
  function scrollToForm() {
    document.getElementById(`subscribe-form-${slug}`)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="text-center pt-16 pb-10">
      <div
        className="inline-block mb-8 px-4 py-1.5 rounded-full"
        style={{ color: theme.tagColor, border: `1px solid ${theme.tagBorder}`, letterSpacing: "0.2em", fontSize: 11 }}
      >
        免費領取
      </div>
      <h1
        className="mb-4 leading-snug"
        style={{ fontFamily: theme.headingFont, fontWeight: 900, fontSize: "clamp(26px, 6vw, 40px)", color: theme.text, lineHeight: 1.4 }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="mx-auto mb-10 whitespace-pre-line"
          style={{ fontSize: 15, lineHeight: 1.9, color: theme.muted, maxWidth: 420 }}
        >
          {subtitle}
        </p>
      )}
      {btn && (
        <button
          onClick={scrollToForm}
          className="inline-block rounded-xl px-8 py-3 text-white font-medium transition-all hover:-translate-y-0.5"
          style={{ background: theme.btnGradient, fontSize: 15, letterSpacing: "0.05em", boxShadow: `0 8px 32px ${theme.btnShadow}`, border: "none", cursor: "pointer" }}
        >
          {btn}
        </button>
      )}
    </section>
  );
}
