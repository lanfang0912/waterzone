"use client";

import type { Theme } from "@/lib/themes";

type Props = {
  title: string;
  subtitle?: string;
  slug: string;
  theme: Theme;
  subscriberCount?: number;
};

export function HeroSection({ title, subtitle, theme, subscriberCount }: Props) {
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
      {subscriberCount != null && subscriberCount > 0 && (
        <div
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-8"
          style={{ background: `${theme.tagBorder}33`, color: theme.tagColor, fontSize: 13 }}
        >
          <span>👥</span>
          <span>已有 <strong>{subscriberCount.toLocaleString()}</strong> 人訂閱</span>
        </div>
      )}
    </section>
  );
}
