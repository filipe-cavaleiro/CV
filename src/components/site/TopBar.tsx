"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

export function TopBar({
  name,
  items,
  lang,
  switchLabel,
  switchTitle,
}: {
  name: string;
  items: Item[];
  lang: "pt" | "en";
  switchLabel: string;
  switchTitle: string;
}) {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const targets = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [items]);

  const other = lang === "pt" ? "en" : "pt";

  return (
    <header className={`topbar${scrolled ? " is-scrolled" : ""}`}>
      <div className="topbar-inner">
        <a href="#top" className="topbar-name">
          {name}
        </a>
        <nav aria-label="Secções" className="topbar-nav">
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} className={active === i.id ? "is-active" : undefined}>
              {i.label}
            </a>
          ))}
        </nav>
        <a
          className="lang-switch"
          href={`/${other}`}
          hrefLang={other}
          lang={other}
          title={switchTitle}
          onClick={() => {
            document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`;
          }}
        >
          <span className={lang === "pt" ? "on" : undefined}>PT</span>
          <span aria-hidden="true">/</span>
          <span className={lang === "en" ? "on" : undefined}>EN</span>
          <span className="sr-only">{switchLabel}</span>
        </a>
      </div>
    </header>
  );
}
