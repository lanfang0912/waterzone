"use client";

import type { Theme } from "@/lib/themes";

type Props = {
  title: string;
  subtitle?: string;
  slug: string;
  theme: Theme;
};

export function HeroSection({ title, subtitle, theme }: Props) {
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
    </section>
  );
}
