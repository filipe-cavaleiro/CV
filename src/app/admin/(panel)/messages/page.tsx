import { requireAdmin } from "@/lib/auth";
import { messages } from "@/lib/store";
import { MessageList } from "@/components/admin/MessageList";

export default async function MessagesPage() {
  await requireAdmin();
  const items = await messages.list();
  return (
    <div className="editor">
      <div className="savebar">
        <div className="savebar-row">
          <h1>Mensagens</h1>
        </div>
      </div>
      <p className="intro">
        Mensagens recebidas pelo formulário de contacto. Também chegam ao teu email (se o Resend estiver configurado) — responder ao email
        responde diretamente à pessoa.
      </p>
      <MessageList items={items} />
    </div>
  );
}
