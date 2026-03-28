import type { LandingPage } from "@/types";
import { getTheme } from "@/lib/themes";
import { HeroSection } from "./HeroSection";
import { FaqSection } from "./FaqSection";
import { SubscribeForm } from "./SubscribeForm";
import { ConsultSection } from "./ConsultSection";

export function LandingPageView({ page }: { page: LandingPage }) {
  const theme = getTheme(page.theme);

  const faqs = [
    page.faq_1_q && page.faq_1_a ? { q: page.faq_1_q, a: page.faq_1_a } : null,
    page.faq_2_q && page.faq_2_a ? { q: page.faq_2_q, a: page.faq_2_a } : null,
    page.faq_3_q && page.faq_3_a ? { q: page.faq_3_q, a: page.faq_3_a } : null,
  ].filter(Boolean) as { q: string; a: string }[];

  const consults = [page.consult_1, page.consult_2, page.consult_3].filter(Boolean) as string[];

  const needGoogleFonts =
    theme.headingFont.includes("Noto Serif") ||
    theme.headingFont.includes("Cormorant");

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

        <div className="relative" style={{ zIndex: 1 }}>
          <div className="max-w-xl mx-auto px-5 pb-20">
            <HeroSection
              title={page.hero_title ?? page.name}
              subtitle={page.hero_subtitle ?? undefined}
              btn={page.btn ?? undefined}
              slug={page.slug}
              theme={theme}
            />

            {page.cta && (
              <p className="text-center leading-relaxed mb-8 whitespace-pre-line" style={{ fontSize: 15, color: theme.muted, lineHeight: 1.9 }}>
                {page.cta}
              </p>
            )}

            <SubscribeForm slug={page.slug} btnLabel={page.btn ?? "立即領取"} theme={theme} />

            {consults.length > 0 && (
              <section className="mt-10">
                <ConsultSection scripts={consults} />
              </section>
            )}

            {faqs.length > 0 && (
              <section className="mt-10">
                <FaqSection faqs={faqs} />
              </section>
            )}

            <p className="text-center mt-12" style={{ fontSize: 12, color: theme.muted, lineHeight: 1.7, opacity: 0.6 }}>
              🔒 你的資訊不會分享給任何第三方
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
