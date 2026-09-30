"use client";

import { useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";

type Status = "idle" | "sending" | "sent" | "error" | "invalid" | "tooMany";

export function ContactForm({ t, lang }: { t: Dict["contact"]; lang: "pt" | "en" }) {
  const [status, setStatus] = useState<Status>("idle");
  const renderedAt = useRef(Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website") ?? "",
          t: renderedAt.current,
          lang,
        }),
      });
      if (res.ok) {
        form.reset();
        setStatus("sent");
      } else if (res.status === 429) setStatus("tooMany");
      else if (res.status === 400) setStatus("invalid");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="form-done" role="status">
        {t.sent}
      </p>
    );
  }

  const msg = status === "error" ? t.error : status === "invalid" ? t.invalid : status === "tooMany" ? t.tooMany : "";

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate={false}>
      <div className="field-row">
        <label className="field">
          <span>{t.name}</span>
          <input name="name" type="text" autoComplete="name" required minLength={2} maxLength={100} />
        </label>
        <label className="field">
          <span>{t.email}</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} />
        </label>
      </div>
      <label className="field">
        <span>{t.message}</span>
        <textarea name="message" rows={6} required minLength={10} maxLength={5000} />
      </label>
      {/* honeypot — invisível para pessoas */}
      <label className="hp" aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form-foot">
        <button type="submit" className="btn" disabled={status === "sending"}>
          {status === "sending" ? t.sending : t.send}
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <p className="form-note">{t.privacy}</p>
      </div>
      {msg && (
        <p className="form-error" role="alert">
          {msg}
        </p>
      )}
    </form>
  );
}
