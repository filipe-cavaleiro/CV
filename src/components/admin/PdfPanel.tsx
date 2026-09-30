"use client";

import { useState } from "react";

export function PdfPanel({ contexts }: { contexts: { id: string; label: string; count: number }[] }) {
  const [ctx, setCtx] = useState(contexts[0]?.id ?? "");
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [preview, setPreview] = useState<string | null>(null);
  const qs = `context=${encodeURIComponent(ctx)}&lang=${lang}`;

  return (
    <div className="editor">
      <div className="savebar">
        <div className="savebar-row">
          <h1>Gerar PDF</h1>
        </div>
      </div>
      <p className="intro">
        Escolhe o contexto e a língua. O PDF inclui os dados privados definidos no contexto — é para enviar diretamente (LinkedIn,
        candidaturas), nunca fica público.
      </p>

      <section className="panel pdf-controls">
        <div className="f f-full">
          <span className="f-label">Contexto</span>
          <div className="seg">
            {contexts.map((c) => (
              <button key={c.id} type="button" className={ctx === c.id ? "on" : undefined} onClick={() => setCtx(c.id)}>
                {c.label}
                <small>{c.count} itens</small>
              </button>
            ))}
          </div>
        </div>
        <div className="f f-full">
          <span className="f-label">Língua</span>
          <div className="seg">
            <button type="button" className={lang === "pt" ? "on" : undefined} onClick={() => setLang("pt")}>
              Português
            </button>
            <button type="button" className={lang === "en" ? "on" : undefined} onClick={() => setLang("en")}>
              English
            </button>
          </div>
        </div>
        <div className="row-btns">
          <button type="button" className="btn-ghost" onClick={() => setPreview(`/api/admin/pdf?${qs}&t=${Date.now()}`)}>
            Pré-visualizar
          </button>
          <a className="btn-primary" href={`/api/admin/pdf?${qs}&download=1`}>
            Descarregar PDF
          </a>
        </div>
      </section>

      {preview && (
        <section className="panel pdf-preview">
          <iframe src={preview} title="Pré-visualização do PDF" />
        </section>
      )}
    </div>
  );
}
