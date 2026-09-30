"use client";

import { useTransition } from "react";
import type { Message } from "@/lib/store";
import { deleteMessage, markMessage } from "@/app/admin/actions";

const fmt = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" });

export function MessageList({ items }: { items: Message[] }) {
  const [pending, start] = useTransition();
  if (!items.length) return <p className="empty">Ainda não há mensagens.</p>;
  return (
    <ol className="messages">
      {items.map((m) => (
        <li key={m.id} className={`message${m.read ? "" : " unread"}`}>
          <div className="message-head">
            <div>
              <strong>{m.name}</strong>{" "}
              <a href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: contacto via CV")}`}>{m.email}</a>
            </div>
            <time dateTime={m.createdAt}>{fmt.format(new Date(m.createdAt))}</time>
          </div>
          <p className="message-body">{m.body}</p>
          <div className="message-foot">
            {!m.delivered && <span className="badge warn">email não enviado</span>}
            <button type="button" className="btn-ghost sm" disabled={pending} onClick={() => start(() => markMessage(m.id, !m.read))}>
              {m.read ? "Marcar como não lida" : "Marcar como lida"}
            </button>
            <button
              type="button"
              className="btn-danger sm"
              disabled={pending}
              onClick={() => confirm("Apagar esta mensagem?") && start(() => deleteMessage(m.id))}
            >
              Apagar
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
