import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/store";
import { filterForContext } from "@/pdf/select";
import { PdfPanel } from "@/components/admin/PdfPanel";

export default async function PdfPage() {
  await requireAdmin();
  const content = await getContent();
  const contexts = content.contexts.map((c) => {
    const f = filterForContext(content, c);
    const count =
      f.experience.length + f.education.length + f.projects.length + f.proCertifications.length + f.certifications.length + f.awards.length;
    return { id: c.id, label: c.label.pt || c.id, count };
  });
  return <PdfPanel contexts={contexts} />;
}
