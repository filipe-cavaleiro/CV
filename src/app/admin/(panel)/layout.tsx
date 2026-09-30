import { requireAdmin } from "@/lib/auth";
import { messages } from "@/lib/store";
import { COLLECTIONS } from "@/components/admin/config";
import { Sidebar } from "./Sidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const unread = (await messages.list()).filter((m) => !m.read).length;

  const c = COLLECTIONS;
  const groups = [
    {
      title: "Conteúdo",
      links: [
        { href: "/admin/profile", label: "Perfil" },
        { href: `/admin/${c.experience.slug}`, label: c.experience.title },
        { href: `/admin/${c.education.slug}`, label: c.education.title },
        { href: `/admin/${c.proCertifications.slug}`, label: c.proCertifications.title },
        { href: `/admin/${c.certifications.slug}`, label: c.certifications.title },
        { href: `/admin/${c.projects.slug}`, label: c.projects.title },
        { href: `/admin/${c.awards.slug}`, label: c.awards.title },
        { href: `/admin/${c.skills.slug}`, label: c.skills.title },
        { href: `/admin/${c.languages.slug}`, label: c.languages.title },
      ],
    },
    {
      title: "PDF",
      links: [
        { href: "/admin/pdf", label: "Gerar PDF" },
        { href: `/admin/${c.contexts.slug}`, label: c.contexts.title },
        { href: "/admin/private", label: "Dados privados" },
      ],
    },
    {
      title: "Contacto",
      links: [{ href: "/admin/messages", label: "Mensagens", badge: unread || undefined }],
    },
  ];

  return (
    <div className="shell">
      <Sidebar groups={groups} />
      <main className="main">{children}</main>
    </div>
  );
}
