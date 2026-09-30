import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/store";
import { SLUG_TO_KEY } from "@/components/admin/config";
import { CollectionEditor } from "@/components/admin/CollectionEditor";

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  await requireAdmin();
  const { collection } = await params;
  const key = SLUG_TO_KEY[collection];
  if (!key) notFound();
  const content = await getContent();
  const contexts = content.contexts.map((c) => ({ id: c.id, label: c.label.pt || c.id }));
  return <CollectionEditor key={key} collection={key} initial={content[key] as never} contexts={contexts} />;
}
