"use client";

import { useState } from "react";
import { COLLECTION_SCHEMAS, type CollectionKey } from "@/lib/schema";
import { saveCollection } from "@/app/admin/actions";
import { COLLECTIONS } from "./config";
import { ObjectForm, type ContextOption } from "./Fields";
import { SaveBar, useEditable } from "./SaveBar";

type Item = Record<string, any> & { id: string };

function newId(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10);
}

export function CollectionEditor({
  collection,
  initial,
  contexts,
}: {
  collection: CollectionKey;
  initial: Item[];
  contexts: ContextOption[];
}) {
  const cfg = COLLECTIONS[collection];
  const { value: items, setValue: setItems, dirty, markSaved, reset } = useEditable<Item[]>(initial);
  const [open, setOpen] = useState<string | null>(null);

  const blank = (): Item =>
    COLLECTION_SCHEMAS[collection].parse({
      id: collection === "contexts" ? `ctx-${newId().slice(0, 4)}` : newId(),
      ...(collection === "contexts" ? { label: { pt: "Novo contexto", en: "New context" } } : {}),
    }) as Item;

  const update = (id: string, next: Item) => setItems(items.map((it) => (it.id === id ? next : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setItems(copy);
  };

  return (
    <div className="editor">
      <SaveBar
        title={cfg.title}
        dirty={dirty}
        onReset={reset}
        onSave={async () => {
          const r = await saveCollection(collection, items);
          if (r.ok) markSaved();
          return r;
        }}
      />
      <p className="intro">{cfg.intro}</p>
      <button
        type="button"
        className="btn-add"
        onClick={() => {
          const it = blank();
          setItems([it, ...items]);
          setOpen(it.id);
        }}
      >
        + Adicionar {cfg.singular}
      </button>

      <ol className="items">
        {items.map((it, i) => {
          const s = cfg.summary(it);
          const isOpen = open === it.id;
          return (
            <li key={it.id} className={`item${isOpen ? " is-open" : ""}${it.hidden ? " is-hidden" : ""}`}>
              <div className="item-head">
                <button type="button" className="item-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : it.id)}>
                  <span className="item-title">{s.title}</span>
                  {s.sub && <span className="item-sub">{s.sub}</span>}
                </button>
                <div className="item-tools">
                  {it.hidden && <span className="badge">oculto</span>}
                  {Array.isArray(it.contexts) && it.contexts.length > 0 && collection !== "contexts" && (
                    <span className="badge">{it.contexts.map((c: string) => contexts.find((x) => x.id === c)?.label ?? c).join(", ")}</span>
                  )}
                  {s.meta && <span className="item-meta">{s.meta}</span>}
                  <button type="button" className="icon" title="Subir" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="icon" title="Descer" aria-label="Descer" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="item-body">
                  <ObjectForm fields={cfg.fields} value={it} contexts={contexts} onChange={(v) => update(it.id, v as Item)} />
                  <div className="item-foot">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        const copy = { ...structuredClone(it), id: collection === "contexts" ? `${it.id}-copia` : newId() };
                        const next = [...items];
                        next.splice(i + 1, 0, copy);
                        setItems(next);
                        setOpen(copy.id);
                      }}
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => {
                        if (confirm(`Apagar “${s.title}”? (Só fica definitivo depois de guardares.)`)) {
                          setItems(items.filter((x) => x.id !== it.id));
                          setOpen(null);
                        }
                      }}
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

    </div>
  );
}
