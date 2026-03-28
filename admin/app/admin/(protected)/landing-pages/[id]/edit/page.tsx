import { notFound } from "next/navigation";
import { getLandingPageById } from "@/lib/db/landing-pages";
import { LandingPageForm } from "@/components/admin/LandingPageForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditLandingPagePage({ params }: Props) {
  const { id } = await params;
  const page = await getLandingPageById(id);
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        編輯：{page.name}
      </h1>
      <LandingPageForm page={page} />
    </div>
  );
}
