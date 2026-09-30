"use client";

import { useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@/app/admin/actions";

/** Estado de edição com deteção de alterações e aviso ao sair da página. */
export function useEditable<T>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  const dirty = JSON.stringify(saved) !== JSON.stringify(value);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  return { value, setValue, dirty, markSaved: () => setSaved(value), reset: () => setValue(saved) };
}

export function SaveBar({
  dirty,
  onSave,
  onReset,
  title,
  children,
}: {
  dirty: boolean;
  onSave: () => Promise<ActionResult>;
  onReset: () => void;
  title: string;
  children?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!msg?.ok) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  return (
    <div className="savebar">
      <div className="savebar-row">
        <h1>{title}</h1>
        <div className="savebar-actions">
          {children}
          {dirty && <span className="dirty">Alterações por guardar</span>}
          <button type="button" className="btn-ghost" disabled={!dirty || pending} onClick={onReset}>
            Descartar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!dirty || pending}
            onClick={() =>
              start(async () => {
                try {
                  const r = await onSave();
                  setMsg(r.ok ? { ok: true, text: r.message ?? "Guardado." } : { ok: false, text: r.error });
                } catch {
                  setMsg({ ok: false, text: "Erro inesperado. A sessão pode ter expirado — recarrega a página." });
                }
              })
            }
          >
            {pending ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </div>
      {msg && (
        <p className={msg.ok ? "toast ok" : "toast err"} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
