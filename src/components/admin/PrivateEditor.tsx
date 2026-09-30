"use client";

import type { PrivateData } from "@/lib/schema";
import { savePrivateData } from "@/app/admin/actions";
import { PRIVATE_FIELDS } from "./config";
import { ObjectForm } from "./Fields";
import { SaveBar, useEditable } from "./SaveBar";

export function PrivateEditor({ initial }: { initial: PrivateData }) {
  const { value, setValue, dirty, markSaved, reset } = useEditable<PrivateData>(initial);
  return (
    <div className="editor">
      <SaveBar
        title="Dados privados"
        dirty={dirty}
        onReset={reset}
        onSave={async () => {
          const r = await savePrivateData(value);
          if (r.ok) markSaved();
          return r;
        }}
      />
      <p className="intro">
        Estes dados <strong>nunca</strong> são enviados para o site público — ficam guardados à parte e só entram nos PDFs que geras
        aqui. Em cada contexto de PDF escolhes quais incluir.
      </p>
      <section className="panel">
        <ObjectForm fields={PRIVATE_FIELDS} value={value} onChange={(v) => setValue(v as PrivateData)} />
      </section>
    </div>
  );
}
