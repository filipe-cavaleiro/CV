"use client";

import { useRef, useState, useTransition } from "react";
import type { Profile } from "@/lib/schema";
import { removePhoto, saveProfile, uploadPhoto } from "@/app/admin/actions";
import { PROFILE_FIELDS } from "./config";
import { ObjectForm } from "./Fields";
import { SaveBar, useEditable } from "./SaveBar";

/**
 * Reduz e converte a imagem para JPEG no browser antes do upload:
 * fotos de telemóvel têm muitas vezes 5–15 MB e a Vercel só aceita pedidos até 4,5 MB.
 * Também aceita formatos que o browser abre (WebP, etc.) mas que o PDF não suporta.
 */
async function toJpeg(file: File, maxSide = 1200, quality = 0.86): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  let objectUrl = "";
  try {
    source = await createImageBitmap(file); // respeita a orientação EXIF
  } catch {
    objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    source = img;
  }
  try {
    const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(source.width * scale);
    canvas.height = Math.round(source.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#fff"; // PNG transparente → fundo branco
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob) throw new Error("toBlob");
    return blob;
  } finally {
    if ("close" in source) source.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function PhotoPanel({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  return (
    <section className="panel photo-panel">
      <div className="photo-frame">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Fotografia de perfil" />
        ) : (
          <span>Sem foto</span>
        )}
      </div>
      <div className="photo-side">
        <h2>Fotografia</h2>
        <p className="hint">Qualquer imagem que o browser abra (JPG, PNG, WebP…). É reduzida automaticamente. Idealmente retrato 4:5.</p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setErr("");
            start(async () => {
              try {
                let jpeg: Blob;
                try {
                  jpeg = await toJpeg(file);
                } catch {
                  setErr("Não foi possível ler esta imagem neste browser. Experimenta exportá-la como JPG.");
                  return;
                }
                const fd = new FormData();
                fd.append("photo", jpeg, "photo.jpg");
                const r = await uploadPhoto(fd);
                if (r.ok && r.url) setUrl(r.url);
                else if (!r.ok) setErr(r.error);
              } catch {
                setErr("Falha no envio. A sessão pode ter expirado — recarrega a página e tenta de novo.");
              } finally {
                if (input.current) input.current.value = "";
              }
            });
          }}
        />
        <div className="row-btns">
          <button type="button" className="btn-primary" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? "A carregar…" : url ? "Substituir foto" : "Carregar foto"}
          </button>
          {url && (
            <button
              type="button"
              className="btn-ghost"
              disabled={pending}
              onClick={() => {
                if (!confirm("Remover a fotografia?")) return;
                start(async () => {
                  const r = await removePhoto();
                  if (r.ok) setUrl("");
                });
              }}
            >
              Remover
            </button>
          )}
        </div>
        {err && <p className="toast err">{err}</p>}
      </div>
    </section>
  );
}

type Link = Profile["links"][number];

function LinksEditor({ links, onChange }: { links: Link[]; onChange: (l: Link[]) => void }) {
  return (
    <div className="f f-full">
      <span className="f-label">Links públicos</span>
      <p className="hint">LinkedIn, GitHub, portefólio… Aparecem no topo do site e, opcionalmente, no PDF.</p>
      <div className="links">
        {links.map((l, i) => (
          <div key={l.id} className="link-row">
            <input
              aria-label="Nome do link"
              placeholder="LinkedIn"
              value={l.label}
              onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
            <input
              aria-label="URL"
              type="url"
              placeholder="https://www.linkedin.com/in/…"
              value={l.url}
              onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, url: e.target.value.trim() } : x)))}
            />
            <button type="button" className="icon" aria-label="Remover link" onClick={() => onChange(links.filter((_, j) => j !== i))}>
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-ghost sm"
        onClick={() => onChange([...links, { id: Math.random().toString(36).slice(2, 10), label: "", url: "" }])}
      >
        + Adicionar link
      </button>
    </div>
  );
}

export function ProfileEditor({ initial }: { initial: Profile }) {
  const { value, setValue, dirty, markSaved, reset } = useEditable<Profile>(initial);
  return (
    <div className="editor">
      <SaveBar
        title="Perfil"
        dirty={dirty}
        onReset={reset}
        onSave={async () => {
          const r = await saveProfile(value);
          if (r.ok) markSaved();
          return r;
        }}
      />
      <p className="intro">Informação base que aparece no topo do site e do PDF.</p>
      <PhotoPanel initialUrl={initial.photoUrl} />
      <section className="panel">
        <ObjectForm fields={PROFILE_FIELDS} value={value} onChange={(v) => setValue(v as Profile)} />
        <div className="form-grid">
          <LinksEditor links={value.links} onChange={(links) => setValue({ ...value, links })} />
        </div>
      </section>
    </div>
  );
}
