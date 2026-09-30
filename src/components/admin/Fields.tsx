"use client";

import { useEffect, useId, useState } from "react";
import { PRIVATE_FIELD_KEYS, SECTION_KEYS } from "@/lib/schema";
import { PRIVATE_LABELS, SECTION_LABELS, type Field } from "./config";

export type ContextOption = { id: string; label: string };
type Obj = Record<string, any>;

function TagsInput({ value, onChange, id }: { value: string[]; onChange: (v: string[]) => void; id: string }) {
  const [text, setText] = useState(value.join(", "));
  const parse = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  // Ressincroniza se o valor mudar por fora (ex.: descartar alterações).
  useEffect(() => {
    if (parse(text).join("\u0000") !== value.join("\u0000")) setText(value.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      id={id}
      type="text"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parse(e.target.value));
      }}
    />
  );
}

function CheckGroup<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: K; label: string }[];
  value: K[];
  onChange: (v: K[]) => void;
}) {
  return (
    <div className="checks">
      {options.map((o) => (
        <label key={o.id} className="check">
          <input
            type="checkbox"
            checked={value.includes(o.id)}
            onChange={(e) =>
              onChange(e.target.checked ? [...value, o.id] : value.filter((x) => x !== o.id))
            }
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
  contexts,
}: {
  field: Field;
  value: any;
  onChange: (v: any) => void;
  contexts: ContextOption[];
}) {
  const id = useId();
  const f = field;

  if (f.type === "checkbox") {
    return (
      <div className="f f-full">
        <label className="check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{f.label}</span>
        </label>
        {f.hint && <p className="hint">{f.hint}</p>}
      </div>
    );
  }

  let control: React.ReactNode;
  switch (f.type) {
    case "l10n":
    case "l10nArea": {
      const v = value ?? { pt: "", en: "" };
      const Tag = f.type === "l10n" ? "input" : "textarea";
      control = (
        <div className="l10n">
          {(["pt", "en"] as const).map((lang) => (
            <div key={lang} className="l10n-col">
              <span className="l10n-tag">{lang.toUpperCase()}</span>
              <Tag
                id={lang === "pt" ? id : undefined}
                aria-label={`${f.label} (${lang.toUpperCase()})`}
                value={v[lang] ?? ""}
                placeholder={f.placeholder}
                rows={f.type === "l10nArea" ? (f.rows ?? 4) : undefined}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  onChange({ ...v, [lang]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      );
      break;
    }
    case "tags":
      control = <TagsInput id={id} value={value ?? []} onChange={onChange} />;
      break;
    case "contexts":
      control = contexts.length ? (
        <>
          <CheckGroup options={contexts} value={value ?? []} onChange={onChange} />
          <p className="hint">Nenhum marcado = entra em todos os PDFs.</p>
        </>
      ) : (
        <p className="hint">Ainda não há contextos.</p>
      );
      break;
    case "sections":
      control = (
        <CheckGroup options={SECTION_KEYS.map((k) => ({ id: k, label: SECTION_LABELS[k] }))} value={value ?? []} onChange={onChange} />
      );
      break;
    case "privateFields":
      control = (
        <CheckGroup
          options={PRIVATE_FIELD_KEYS.map((k) => ({ id: k, label: PRIVATE_LABELS[k] }))}
          value={value ?? []}
          onChange={onChange}
        />
      );
      break;
    case "month":
      control = (
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="AAAA-MM"
          pattern="\d{4}(-\d{2})?"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim())}
        />
      );
      break;
    case "url":
      control = (
        <input id={id} type="url" placeholder={f.placeholder ?? "https://"} value={value ?? ""} onChange={(e) => onChange(e.target.value.trim())} />
      );
      break;
    case "slug":
      control = (
        <input
          id={id}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
        />
      );
      break;
    default:
      control = <input id={id} type="text" placeholder={f.placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }

  const wide = f.type === "l10n" || f.type === "l10nArea" || !f.half;
  return (
    <div className={`f ${wide ? "f-full" : "f-half"}`}>
      <label htmlFor={id} className="f-label">
        {f.label}
      </label>
      {control}
      {f.hint && <p className="hint">{f.hint}</p>}
    </div>
  );
}

export function ObjectForm({
  fields,
  value,
  onChange,
  contexts = [],
}: {
  fields: Field[];
  value: Obj;
  onChange: (v: Obj) => void;
  contexts?: ContextOption[];
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => (
        <FieldInput
          key={f.name}
          field={f}
          value={value[f.name]}
          contexts={contexts}
          onChange={(v) => onChange({ ...value, [f.name]: v })}
        />
      ))}
    </div>
  );
}
