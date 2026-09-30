"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { exportAll, logout } from "../actions";

type Group = { title: string; links: { href: string; label: string; badge?: number }[] };

export function Sidebar({ groups }: { groups: Group[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  async function downloadBackup() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cv-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <aside className={`sidebar${open ? " is-open" : ""}`}>
      <div className="sidebar-top">
        <Link href="/admin/profile" className="brand">
          CV <span>backoffice</span>
        </Link>
        <button type="button" className="menu-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
          Menu
        </button>
      </div>
      <nav className="sidebar-nav" onClick={() => setOpen(false)}>
        {groups.map((g) => (
          <div key={g.title} className="nav-group">
            <p className="nav-title">{g.title}</p>
            {g.links.map((l) => (
              <Link key={l.href} href={l.href} className={path === l.href ? "is-active" : undefined}>
                {l.label}
                {l.badge ? <span className="count">{l.badge}</span> : null}
              </Link>
            ))}
          </div>
        ))}
        <div className="nav-group nav-bottom">
          <a href="/pt" target="_blank" rel="noopener">
            Ver site ↗
          </a>
          <button type="button" onClick={downloadBackup}>
            Exportar backup (JSON)
          </button>
          <form action={logout}>
            <button type="submit">Terminar sessão</button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
