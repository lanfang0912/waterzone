import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLandingPageBySlug } from "@/lib/db/landing-pages";
import { getSubscriberCount } from "@/lib/db/subscribers";
import { LandingPageView } from "@/components/public/LandingPageView";
import { getTheme } from "@/lib/themes";
import { QuizView } from "@/components/public/QuizView";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.seo_title ?? page.name,
    description: page.seo_description ?? undefined,
  };
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);

  if (!page || page.status !== "published") notFound();

  if (page.page_type === "external" && page.external_url) redirect(page.external_url);

  if (page.page_type === "quiz") {
    const theme = getTheme(page.theme);
    return <QuizView page={page} theme={theme} />;
  }

  const subscriberCount = await getSubscriberCount(slug);
  return <LandingPageView page={page} subscriberCount={subscriberCount} />;
}
