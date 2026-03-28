import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLandingPageBySlug } from "@/lib/db/landing-pages";

type Section = { title: string; items: string[] };
type ScoreRange = { range: string; description: string };
type Reflection = { question: string; hints: string };
type GuideContent = {
  title?: string;
  subtitle?: string;
  instructions?: string;
  sections?: Section[];
  scoring?: ScoreRange[];
  reflections?: Reflection[];
  practice?: string[];
  closing?: string;
};

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.name,
    description: page.seo_description ?? undefined,
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);

  if (!page || page.status !== "published") notFound();

  if (!page.body_json) notFound();

  const content = page.body_json as GuideContent;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-stone-800 leading-snug mb-3">
            {content.title ?? page.name}
          </h1>
          {content.subtitle && (
            <p className="text-stone-500 text-sm leading-relaxed">
              {content.subtitle}
            </p>
          )}
        </div>

        {/* Instructions */}
        {content.instructions && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8 text-sm text-amber-800">
            {content.instructions}
          </div>
        )}

        {/* Sections */}
        {content.sections?.map((section, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-base font-semibold text-stone-700 mb-3 flex items-center gap-2">
              <span className="text-stone-400 text-xs font-normal">▋</span>
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item, j) => (
                <label
                  key={j}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500 flex-shrink-0"
                  />
                  <span className="text-sm text-stone-600 group-hover:text-stone-800 leading-relaxed">
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Scoring */}
        {content.scoring && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
            <h2 className="text-base font-semibold text-stone-700 mb-4">
              ▋ 計分說明
            </h2>
            <div className="space-y-4">
              {content.scoring.map((s, i) => (
                <div key={i} className="border-l-2 border-teal-300 pl-4">
                  <div className="text-sm font-medium text-teal-700 mb-1">
                    {s.range}
                  </div>
                  <div className="text-sm text-stone-600 leading-relaxed">
                    {s.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflection questions */}
        {content.reflections && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
            <h2 className="text-base font-semibold text-stone-700 mb-4">
              ▋ 三個最重要的覺察題
            </h2>
            <div className="space-y-5">
              {content.reflections.map((r, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-stone-700 mb-1">
                    {r.question}
                  </p>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {r.hints}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice */}
        {content.practice && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 mb-8">
            <h2 className="text-base font-semibold text-teal-700 mb-3">
              ▋ 今天的小練習
            </h2>
            <div className="space-y-2">
              {content.practice.map((p, i) => (
                <div key={i} className="flex gap-2 text-sm text-teal-800">
                  <span className="font-medium">
                    第{["一", "二", "三"][i]}件
                  </span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing */}
        {content.closing && (
          <p className="text-center text-xs text-stone-400 leading-relaxed">
            {content.closing}
          </p>
        )}
      </div>
    </div>
  );
}
